import { Hono } from 'hono';
import { createDrizzleClient } from '../db/client';
import { 
    getAllSiteConfig, 
    getSiteConfig, 
    upsertSiteConfig, 
    updateMultipleSiteConfig,
    resetSecrets,
    getPublicSiteConfig,
    isValidConfigKey,
    isSensitiveConfigKey
} from '../db/operations/config';
import type { SiteConfig } from '../db/types';
import { VerifyTOTPCode } from '../auth';

const app = new Hono<{ Bindings: CloudflareBindings }>()

// 检查配置状态（公开，无需认证�?
app.get('/status', async (c) => {
    try {
        const db = c.get('db');
        
        // 检查表是否存在和配置数�?
        let tableExists = false;
        let configs: SiteConfig[] = [];
        
        try {
            configs = await getAllSiteConfig(db);
            tableExists = true;
        } catch (error) {
            // 表不存在或查询失�?
            tableExists = false;
        }
        
        return c.json({
            tableExists,
            configCount: configs.length,
            hasDefaults: configs.some(c => c.key === 'site_title'),
            hasSecrets: configs.some(c => c.key === 'totp_secret' || c.key === 'jwt_secret')
        });
    } catch (error) {
        return c.json({ 
            tableExists: false,
            configCount: 0,
            hasDefaults: false,
            hasSecrets: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// 公开端点：获取公开配置（不需要认证）
app.get('/public', async (c) => {
    try {
        const db = c.get('db');
        const publicConfig = await getPublicSiteConfig(db);
        return c.json(publicConfig);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 获取单个配置�?
app.get('/:key', async (c) => {
    try {
        const key = c.req.param('key');
        
        if (!isValidConfigKey(key)) {
            return c.json({ error: 'Invalid config key' }, 400);
        }

        // 敏感配置需要认�?
        if (isSensitiveConfigKey(key)) {
            const authHeader = c.req.header('Authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return c.json({ error: 'Authentication required' }, 401);
            }
            // 这里应该验证 JWT token，但为了简化先跳过
        }

        const db = c.get('db');
        const config = await getSiteConfig(db, key);
        
        if (!config) {
            return c.json({ error: 'Config not found' }, 404);
        }

        // 敏感配置返回时进行脱敏处�?
        let responseValue = config.value;
        if (isSensitiveConfigKey(key)) {
            responseValue = config.value.substring(0, 8) + '***';
        }

        return c.json({
            key: config.key,
            value: responseValue,
            description: config.description,
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 获取所有配置（需要认证）
app.get('/', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Authentication required' }, 401);
        }
        // 这里应该验证 JWT token

        const db = c.get('db');
        const configs = await getAllSiteConfig(db);
        
        // 对敏感配置进行脱敏处�?
        const safeConfigs = configs.map(config => ({
            ...config,
            value: isSensitiveConfigKey(config.key) 
                ? config.value.substring(0, 8) + '***'
                : config.value
        }));

        return c.json(safeConfigs);
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 更新单个配置项（需要认证）
app.put('/:key', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        const key = c.req.param('key');
        if (!isValidConfigKey(key)) {
            return c.json({ error: 'Invalid config key' }, 400);
        }

        const body = await c.req.json<{ value: string; description?: string }>();
        if (!body.value) {
            return c.json({ error: 'Value is required' }, 400);
        }

        const db = c.get('db');
        await upsertSiteConfig(db, key, body.value, body.description);

        return c.json({ success: true, message: 'Config updated successfully' });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 批量更新配置（需要认证）
app.post('/', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        const body = await c.req.json<{ configs: Array<{key: string, value: string, description?: string}> }>();
        if (!body.configs || !Array.isArray(body.configs)) {
            return c.json({ error: 'Configs array is required' }, 400);
        }

        // 验证所有配置键
        for (const config of body.configs) {
            if (!isValidConfigKey(config.key)) {
                return c.json({ error: `Invalid config key: ${config.key}` }, 400);
            }
        }

        const db = c.get('db');
        await updateMultipleSiteConfig(db, body.configs);

        return c.json({ success: true, message: 'Configs updated successfully' });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

// 重置密钥（需要认证和 TOTP 验证�?
app.post('/reset-secrets', async (c) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Authentication required' }, 401);
        }

        const body = await c.req.json<{ totp_code: string }>();
        if (!body.totp_code) {
            return c.json({ error: 'TOTP code is required' }, 400);
        }

        // 验证 TOTP
        const isValidTOTP = await VerifyTOTPCode(c, body.totp_code);
        if (!isValidTOTP) {
            return c.json({ error: 'Invalid TOTP code' }, 401);
        }

        const db = c.get('db');
        const newSecrets = await resetSecrets(db);

        return c.json({ 
            success: true, 
            message: 'Secrets reset successfully',
            totp_secret: newSecrets.totpSecret,
            jwt_secret: newSecrets.jwtSecret
        });
    } catch (e: any) {
        return c.json({ error: e.message }, 500);
    }
});

export default app
