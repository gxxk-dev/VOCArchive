/**
 * 添加IPFS负载均衡和网关管理功能
 *
 * 此迁移添加：
 * 1. external_source表添加isIPFS字段，支持IPFS CID分类
 * 2. 添加ipfs_gateways系统配置，管理网关列表
 * 3. 初始化默认IPFS网关配置，提供故障转移支持
 */

import type { DrizzleDB } from '../app/db/client';
import type { MigrationParameters, MigrationParameterDefinition } from '../app/db/types';
import { upsertSiteConfig } from '../app/db/operations/config';

export const version = 3;
export const description = '添加IPFS负载均衡和网关管理功能';

// 此迁移不需要用户参数
export const parameters: MigrationParameterDefinition[] = [];

/**
 * 正向迁移：添加isIPFS字段和IPFS网关配置
 */
export const up = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始执行IPFS负载均衡功能迁移...');

    // 1. 添加isIPFS字段到external_source表
    console.log('添加 isIPFS 字段到 external_source 表...');
    try {
        await db.run('ALTER TABLE external_source ADD COLUMN isIPFS INTEGER NOT NULL DEFAULT 0');
        console.log('✅ isIPFS 字段添加成功');
    } catch (error: any) {
        // 如果字段已存在，忽略错误
        if (error.message && error.message.includes('duplicate column name')) {
            console.log('⚠️  isIPFS 字段已存在，跳过添加');
        } else {
            console.error('❌ 添加 isIPFS 字段失败:', error);
            throw error;
        }
    }

    // 2. 初始化默认IPFS网关配置
    console.log('初始化默认IPFS网关配置...');
    const defaultGateways = [
        'https://ipfs.io/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
        'https://cf-ipfs.com/ipfs/',
    ];

    await upsertSiteConfig(
        db,
        'ipfs_gateways',
        JSON.stringify(defaultGateways),
        'IPFS网关列表，支持负载均衡和故障转移'
    );
    console.log('✅ 默认IPFS网关配置完成');

    console.log(`Migration ${version}: ${description} - UP completed`);
};

/**
 * 回滚函数：移除isIPFS字段和IPFS网关配置
 */
export const down = async (db: DrizzleDB, params?: MigrationParameters): Promise<void> => {
    console.log('开始回滚IPFS负载均衡功能迁移...');

    // 1. 删除IPFS网关配置
    console.log('删除IPFS网关配置...');
    await db.run("DELETE FROM site_config WHERE key = 'ipfs_gateways'");
    console.log('✅ IPFS网关配置已删除');

    // 2. 移除isIPFS字段
    // 注意：SQLite不支持直接删除列，所以我们创建一个新表，复制数据，然后替换
    console.log('移除 isIPFS 字段...');
    try {
        // 创建临时表（不包含isIPFS字段）
        await db.run(`
            CREATE TABLE external_source_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT NOT NULL UNIQUE,
                type TEXT NOT NULL CHECK (type IN ('raw_url', 'ipfs')),
                name TEXT NOT NULL,
                endpoint TEXT NOT NULL
            )
        `);

        // 复制数据（除isIPFS字段外）
        await db.run(`
            INSERT INTO external_source_temp (id, uuid, type, name, endpoint)
            SELECT id, uuid, type, name, endpoint
            FROM external_source
        `);

        // 删除原表
        await db.run('DROP TABLE external_source');

        // 重命名临时表
        await db.run('ALTER TABLE external_source_temp RENAME TO external_source');

        console.log('✅ isIPFS 字段已移除');
    } catch (error) {
        console.error('❌ 移除 isIPFS 字段失败:', error);
        throw error;
    }

    console.log(`Migration ${version}: ${description} - DOWN completed`);
};