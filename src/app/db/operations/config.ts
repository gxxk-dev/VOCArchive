import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { siteConfig } from '../schema';
import type { SiteConfig, NewSiteConfig, SiteConfigKey } from '../types';
import { authenticator } from 'otplib';
import { initializeDefaultWikiPlatforms } from './wiki-platforms';

/**
 * 获取所有站点配置
 */
export async function getAllSiteConfig(db: DrizzleDB): Promise<SiteConfig[]> {
    return await db.select().from(siteConfig);
}

/**
 * 获取单个配置项
 */
export async function getSiteConfig(db: DrizzleDB, key: string): Promise<SiteConfig | null> {
    const result = await db.select().from(siteConfig).where(eq(siteConfig.key, key)).limit(1);
    return result[0] || null;
}

/**
 * 更新或插入配置项（upsert）
 */
export async function upsertSiteConfig(
    db: DrizzleDB, 
    key: string, 
    value: string, 
    description?: string
): Promise<void> {
    const existing = await getSiteConfig(db, key);
    
    if (existing) {
        await db.update(siteConfig)
            .set({
                value,
                description: description || existing.description,
            })
            .where(eq(siteConfig.key, key));
    } else {
        await db.insert(siteConfig).values({
            key,
            value,
            description,
        });
    }
}

/**
 * 批量更新配置
 */
export async function updateMultipleSiteConfig(
    db: DrizzleDB, 
    configs: Array<{key: string, value: string, description?: string}>
): Promise<void> {
    for (const config of configs) {
        await upsertSiteConfig(db, config.key, config.value, config.description);
    }
}

/**
 * 删除配置项
 */
export async function deleteSiteConfig(db: DrizzleDB, key: string): Promise<void> {
    await db.delete(siteConfig).where(eq(siteConfig.key, key));
}

/**
 * 初始化默认配置（使用事务支持）
 */
export async function initializeDefaultConfig(db: DrizzleDB): Promise<void> {
    // Note: site_config table should already exist via migrations or schema
    
    const defaultConfigs = [
        {
            key: 'site_title',
            value: 'VOCArchive',
            description: '网站标题（浏览器标签页显示）'
        },
        {
            key: 'home_title',
            value: 'VOCArchive - 作品选择{TAG_NAME? - 标签: {TAG_NAME}}{CATEGORY_NAME? - 分类: {CATEGORY_NAME}}{SEARCH_QUERY? - 搜索: {SEARCH_QUERY}}',
            description: '主页标题，支持占位符：{TAG_NAME}, {CATEGORY_NAME}, {SEARCH_QUERY}, {PAGE_NUMBER}, {TOTAL_COUNT}'
        },
        {
            key: 'player_title',
            value: 'VOCArchive - {WORK_TITLE}',
            description: '播放器页标题，支持占位符：{WORK_TITLE}'
        },
        {
            key: 'admin_title',
            value: 'VOCArchive 管理后台 - {TAB_NAME}',
            description: '管理后台标题，支持占位符：{TAB_NAME}, {TAB_ID}'
        },
        {
            key: 'tags_categories_title',
            value: 'VOCArchive - 标签与分类',
            description: '标签分类页标题'
        },
        {
            key: 'migration_title',
            value: 'VOCArchive 管理后台 - 数据库迁移',
            description: '迁移页面标题'
        },
        {
            key: 'db_version',
            value: '0',
            description: '数据库版本号'
        }
    ];

    for (const config of defaultConfigs) {
        const existing = await getSiteConfig(db, config.key);
        if (!existing) {
            await upsertSiteConfig(db, config.key, config.value, config.description);
        }
    }

    // 初始化默认Wiki平台配置
    await initializeDefaultWikiPlatforms(db);
}

/**
 * 生成随机密钥（用于 TOTP 和 JWT）
 */
export function generateSecretKey(): string {
    return authenticator.generateSecret();
}

/**
 * 初始化安全密钥（如果不存在）
 */
export async function initializeSecrets(db: DrizzleDB, envTotpSecret?: string, envJwtSecret?: string): Promise<void> {
    // Note: site_config table should already exist via migrations or schema
    
    // 初始化 TOTP 密钥
    const totpConfig = await getSiteConfig(db, 'totp_secret');
    if (!totpConfig) {
        const totpSecret = envTotpSecret || generateSecretKey();
        await upsertSiteConfig(db, 'totp_secret', totpSecret, 'TOTP 认证密钥');
    }

    // 初始化 JWT 密钥
    const jwtConfig = await getSiteConfig(db, 'jwt_secret');
    if (!jwtConfig) {
        const jwtSecret = envJwtSecret || generateSecretKey();
        await upsertSiteConfig(db, 'jwt_secret', jwtSecret, 'JWT 签名密钥');
    }
}

/**
 * 重置密钥
 */
export async function resetSecrets(db: DrizzleDB): Promise<{totpSecret: string, jwtSecret: string}> {
    const newTotpSecret = generateSecretKey();
    const newJwtSecret = generateSecretKey();
    
    await upsertSiteConfig(db, 'totp_secret', newTotpSecret, 'TOTP 认证密钥');
    await upsertSiteConfig(db, 'jwt_secret', newJwtSecret, 'JWT 签名密钥');
    
    return {
        totpSecret: newTotpSecret,
        jwtSecret: newJwtSecret
    };
}

/**
 * 获取公开的配置（不包含敏感信息）
 */
export async function getPublicSiteConfig(db: DrizzleDB): Promise<Record<string, string>> {
    const publicKeys = ['site_title', 'home_title', 'player_title', 'admin_title', 'tags_categories_title', 'migration_title'];
    const configs = await db.select()
        .from(siteConfig)
        .where(eq(siteConfig.key, publicKeys[0]));

    const result: Record<string, string> = {};
    for (const publicKey of publicKeys) {
        const config = await getSiteConfig(db, publicKey);
        if (config) {
            result[publicKey] = config.value;
        }
    }

    return result;
}

/**
 * 验证配置键是否有效
 */
export function isValidConfigKey(key: string): key is SiteConfigKey {
    const validKeys: SiteConfigKey[] = [
        'site_title', 'home_title', 'player_title', 'admin_title', 'tags_categories_title', 'migration_title',
        'totp_secret', 'jwt_secret', 'db_version'
    ];
    return validKeys.includes(key as SiteConfigKey);
}

/**
 * 检查配置键是否敏感（需要认证才能访问）
 */
export function isSensitiveConfigKey(key: string): boolean {
    const sensitiveKeys = ['totp_secret', 'jwt_secret'];
    return sensitiveKeys.includes(key);
}

/**
 * 获取当前数据库版本号
 */
export async function getCurrentDbVersion(db: DrizzleDB): Promise<number> {
    const config = await getSiteConfig(db, 'db_version');
    if (!config) {
        // 如果没有配置，返回0作为初始版本
        return 0;
    }
    const version = parseInt(config.value, 10);
    return isNaN(version) ? 0 : version;
}

/**
 * 更新数据库版本号
 */
export async function updateDbVersion(db: DrizzleDB, newVersion: number): Promise<void> {
    await upsertSiteConfig(db, 'db_version', newVersion.toString(), '数据库版本号');
}

/**
 * 获取数据库版本配置信息
 */
export async function getDbVersionConfig(db: DrizzleDB): Promise<SiteConfig | null> {
    return await getSiteConfig(db, 'db_version');
}