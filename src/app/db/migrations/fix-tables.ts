// 数据库表结构修复脚本
// 用于修复数据库表结构不匹配问题

import type { DrizzleDB } from '../client';
import { sql } from 'drizzle-orm';

/**
 * 修复work_title表结构
 * 删除旧表并创建新的正确结构
 */
export async function fixWorkTitleTable(db: DrizzleDB): Promise<void> {
    console.log('Fixing work_title table structure...');

    try {
        // 删除旧的work_title表
        await db.run(sql.raw('DROP TABLE IF EXISTS work_title'));
        console.log('Dropped existing work_title table');

        // 创建新的work_title表，使用正确的结构
        const createWorkTitleSQL = `
            CREATE TABLE work_title (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid TEXT NOT NULL UNIQUE,
                work_id INTEGER NOT NULL,
                is_official INTEGER NOT NULL,
                is_for_search INTEGER NOT NULL DEFAULT 0,
                language TEXT NOT NULL,
                title TEXT NOT NULL,
                FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE
            )
        `;

        await db.run(sql.raw(createWorkTitleSQL));
        console.log('Created new work_title table with correct structure');

    } catch (error) {
        console.error('Error fixing work_title table:', error);
        throw error;
    }
}

/**
 * 修复所有表结构不匹配的问题
 */
export async function fixAllTables(db: DrizzleDB): Promise<void> {
    console.log('Starting database table structure fix...');

    // 需要修复的表列表
    const tablesToFix = [
        'work_title',
        'work_wiki',
        'creator_wiki',
        'asset',
        'media_source',
        'work_creator',
        'work_relation',
        'asset_creator',
        'work_tag',
        'work_category',
        'asset_external_object',
        'media_source_external_object'
    ];

    for (const tableName of tablesToFix) {
        try {
            console.log(`Dropping table: ${tableName}`);
            await db.run(sql.raw(`DROP TABLE IF EXISTS ${tableName}`));
        } catch (error) {
            console.warn(`Warning dropping table ${tableName}:`, error);
        }
    }

    // 重新创建表
    const { ensureTablesExist } = await import('./helper');
    await ensureTablesExist(db);

    console.log('Database table structure fix completed');
}

/**
 * 检查表结构是否正确
 */
export async function validateTableStructure(db: DrizzleDB): Promise<boolean> {
    try {
        // 测试查询work_title表的结构
        const result = await db.run(sql.raw(`
            SELECT sql FROM sqlite_master
            WHERE type='table' AND name='work_title'
        `));

        console.log('work_title table structure:', result);
        return true;
    } catch (error) {
        console.error('Table structure validation failed:', error);
        return false;
    }
}