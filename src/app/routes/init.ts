import { Hono } from 'hono'
import { createDrizzleClient } from '../db/client'
import { isDatabaseInitialized, initializeDatabaseWithConfig } from '../db/operations/admin'

export const initRoutes = new Hono<{ Bindings: CloudflareBindings }>()

// 检查初始化状态
initRoutes.get('/status', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        const isInitialized = await isDatabaseInitialized(db);
        
        return c.json({
            initialized: isInitialized,
            message: isInitialized ? 'Database is initialized' : 'Database needs initialization'
        });
    } catch (error) {
        return c.json({
            initialized: false,
            message: 'Error checking initialization status',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// 执行初始化
initRoutes.post('/setup', async (c) => {
    try {
        const db = createDrizzleClient(c.env.DB);
        
        // 检查是否已经初始化，防止重复初始化
        const isInitialized = await isDatabaseInitialized(db);
        if (isInitialized) {
            return c.json({
                success: false,
                message: 'Database is already initialized'
            }, 400);
        }
        
        // 获取初始化配置
        const body = await c.req.json();
        const { siteTitle, totpSecret, jwtSecret, assetUrl } = body;
        
        // 执行初始化
        const secrets = await initializeDatabaseWithConfig(db, {
            siteTitle,
            totpSecret,
            jwtSecret,
            assetUrl
        });
        
        return c.json({
            success: true,
            message: 'Database initialized successfully',
            secrets: {
                totpSecret: secrets.totpSecret,
                jwtSecret: secrets.jwtSecret
            }
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
        return c.json({
            success: false,
            message: 'Failed to initialize database',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});

// 生成随机密钥
initRoutes.get('/generate-secret', async (c) => {
    try {
        const { generateSecretKey } = await import('../db/operations/config');
        const secret = generateSecretKey();
        
        return c.json({
            secret: secret
        });
    } catch (error) {
        return c.json({
            error: 'Failed to generate secret key'
        }, 500);
    }
});