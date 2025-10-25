/**
 * 迁移脚本：将所有表的 uuid 列重命名为 index
 *
 * 此迁移将数据库中所有表的 uuid 字段重命名为 index 字段，
 * 以支持管理员自定义 index 值，同时保留原有的 UUID 值作为 index 值。
 *
 * 影响的表：
 * - creator
 * - work
 * - tag
 * - category
 * - footer_settings
 * - external_source
 * - work_title
 * - media_source
 * - asset
 * - work_relation
 * - external_object
 */

import type { DrizzleDB } from '../app/db/client';

// 版本号 - 必须与文件名序号一致
export const version = 4;

// 迁移描述
export const description = '将所有表的 uuid 列重命名为 index';

/**
 * 正向迁移：将 uuid 列重命名为 index
 */
export const up = async (db: DrizzleDB): Promise<void> => {
    console.log('开始执行迁移：uuid → index');

    // 定义需要修改的表名
    const tables = [
        'creator',
        'work',
        'tag',
        'category',
        'footer_settings',
        'external_source',
        'work_title',
        'media_source',
        'asset',
        'work_relation',
        'external_object'
    ];

    // 对每个表执行列重命名操作
    for (const tableName of tables) {
        const sql = `ALTER TABLE ${tableName} RENAME COLUMN uuid TO "index"`;

        try {
            await db.run(sql);
            console.log(`✓ 表 ${tableName}: uuid → index 完成`);
        } catch (error) {
            console.error(`✗ 表 ${tableName} 迁移失败:`, error);
            throw new Error(`Failed to rename uuid to index in table ${tableName}: ${error}`);
        }
    }

    console.log(`Migration ${version}: ${description} - UP completed`);
};

/**
 * 回滚函数：将 index 列重命名回 uuid
 */
export const down = async (db: DrizzleDB): Promise<void> => {
    console.log('开始回滚迁移：index → uuid');

    // 定义需要修改的表名
    const tables = [
        'creator',
        'work',
        'tag',
        'category',
        'footer_settings',
        'external_source',
        'work_title',
        'media_source',
        'asset',
        'work_relation',
        'external_object'
    ];

    // 对每个表执行列重命名操作（反向）
    for (const tableName of tables) {
        const sql = `ALTER TABLE ${tableName} RENAME COLUMN "index" TO uuid`;

        try {
            await db.run(sql);
            console.log(`✓ 表 ${tableName}: index → uuid 完成`);
        } catch (error) {
            console.error(`✗ 表 ${tableName} 回滚失败:`, error);
            throw new Error(`Failed to rename index to uuid in table ${tableName}: ${error}`);
        }
    }

    console.log(`Migration ${version}: ${description} - DOWN completed`);
};
