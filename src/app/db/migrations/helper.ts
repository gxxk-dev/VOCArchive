import type { DrizzleDB } from '../client';
import { sql } from 'drizzle-orm';
import * as schema from '../schema';

/**
 * 迁移辅助函数
 * 提供类型安全的数据库操作替代硬编码SQL
 */

/**
 * 确保所有表都存在（使用 drizzle-kit push 的替代方案）
 */
export async function ensureTablesExist(db: DrizzleDB): Promise<void> {
    console.log('Creating database tables...');

    // 基础表创建语句（按依赖顺序）
    const createTableStatements = [
        // 1. 独立表（无外键依赖）
        `CREATE TABLE IF NOT EXISTS site_config (
            key TEXT PRIMARY KEY NOT NULL,
            value TEXT NOT NULL,
            description TEXT
        )`,

        `CREATE TABLE IF NOT EXISTS footer_settings (
            uuid TEXT PRIMARY KEY NOT NULL,
            item_type TEXT NOT NULL,
            text TEXT NOT NULL,
            url TEXT,
            icon_class TEXT
        )`,

        `CREATE TABLE IF NOT EXISTS creator (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            type TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS work (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            copyright_basis TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS tag (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL UNIQUE
        )`,

        `CREATE TABLE IF NOT EXISTS category (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            parent_id INTEGER,
            FOREIGN KEY (parent_id) REFERENCES category(id)
        )`,

        `CREATE TABLE IF NOT EXISTS external_source (
            uuid TEXT PRIMARY KEY NOT NULL,
            type TEXT NOT NULL,
            name TEXT NOT NULL,
            endpoint TEXT NOT NULL
        )`,

        `CREATE TABLE IF NOT EXISTS wiki_platform (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            platform_key TEXT NOT NULL UNIQUE,
            platform_name TEXT NOT NULL,
            url_template TEXT NOT NULL,
            icon_class TEXT
        )`,

        // 2. 依赖表
        `CREATE TABLE IF NOT EXISTS external_object (
            uuid TEXT PRIMARY KEY NOT NULL,
            external_source_uuid TEXT NOT NULL,
            mime_type TEXT NOT NULL,
            file_id TEXT NOT NULL,
            FOREIGN KEY (external_source_uuid) REFERENCES external_source(uuid)
        )`,

        `CREATE TABLE IF NOT EXISTS work_title (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            work_id INTEGER NOT NULL,
            is_official INTEGER NOT NULL,
            is_for_search INTEGER NOT NULL DEFAULT 0,
            language TEXT NOT NULL,
            title TEXT NOT NULL,
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS work_wiki (
            work_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            identifier TEXT NOT NULL,
            PRIMARY KEY (work_id, platform),
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS creator_wiki (
            creator_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            identifier TEXT NOT NULL,
            PRIMARY KEY (creator_id, platform),
            FOREIGN KEY (creator_id) REFERENCES creator(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS asset (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            work_id INTEGER NOT NULL,
            asset_type TEXT NOT NULL,
            file_name TEXT,
            file_id TEXT,
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS media_source (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            uuid TEXT NOT NULL UNIQUE,
            work_id INTEGER NOT NULL,
            media_type TEXT NOT NULL,
            platform TEXT NOT NULL,
            url TEXT,
            file_name TEXT,
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE
        )`,

        // 3. 关联表
        `CREATE TABLE IF NOT EXISTS work_creator (
            work_id INTEGER NOT NULL,
            creator_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            PRIMARY KEY (work_id, creator_id, role),
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE,
            FOREIGN KEY (creator_id) REFERENCES creator(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS work_relation (
            source_work_id INTEGER NOT NULL,
            target_work_id INTEGER NOT NULL,
            relation_type TEXT NOT NULL,
            PRIMARY KEY (source_work_id, target_work_id, relation_type),
            FOREIGN KEY (source_work_id) REFERENCES work(id) ON DELETE CASCADE,
            FOREIGN KEY (target_work_id) REFERENCES work(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS asset_creator (
            asset_id INTEGER NOT NULL,
            creator_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            PRIMARY KEY (asset_id, creator_id, role),
            FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE,
            FOREIGN KEY (creator_id) REFERENCES creator(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS work_tag (
            work_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY (work_id, tag_id),
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS work_category (
            work_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            PRIMARY KEY (work_id, category_id),
            FOREIGN KEY (work_id) REFERENCES work(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES category(id) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS asset_external_object (
            asset_id INTEGER NOT NULL,
            external_object_id TEXT NOT NULL,
            PRIMARY KEY (asset_id, external_object_id),
            FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE,
            FOREIGN KEY (external_object_id) REFERENCES external_object(uuid) ON DELETE CASCADE
        )`,

        `CREATE TABLE IF NOT EXISTS media_source_external_object (
            media_source_id INTEGER NOT NULL,
            external_object_id TEXT NOT NULL,
            PRIMARY KEY (media_source_id, external_object_id),
            FOREIGN KEY (media_source_id) REFERENCES media_source(id) ON DELETE CASCADE,
            FOREIGN KEY (external_object_id) REFERENCES external_object(uuid) ON DELETE CASCADE
        )`
    ];

    // 执行创建表语句
    for (const statement of createTableStatements) {
        try {
            await db.run(sql.raw(statement));
        } catch (error) {
            console.warn(`Warning creating table:`, error);
            // 继续执行，某些表可能已经存在
        }
    }

    console.log('Database tables created successfully');
}

/**
 * 清空所有用户数据表（保留表结构）
 * 使用Drizzle delete替代DROP TABLE
 */
export async function truncateAllTables(db: DrizzleDB): Promise<void> {
    // 按依赖顺序删除数据，从依赖表开始
    const tablesToTruncate = [
        // Junction tables first (no dependencies)
        schema.workCategory,
        schema.workTag,
        schema.assetExternalObject,
        schema.mediaSourceExternalObject,
        
        // Tables with foreign keys
        schema.workWiki,
        schema.workRelation,
        schema.assetCreator,
        schema.asset,
        schema.mediaSource,
        schema.workLicense,
        schema.workTitle,
        schema.workCreator,
        schema.creatorWiki,
        schema.externalObject,
        
        // Referenced tables
        schema.externalSource,
        schema.creator,
        schema.work,
        schema.category,
        schema.tag,
        schema.footerSettings,
        schema.siteConfig
    ];

    for (const table of tablesToTruncate) {
        try {
            await db.delete(table);
            console.log(`Truncated table: ${(table as any)._.name}`);
        } catch (error) {
            console.warn(`Warning truncating table ${(table as any)._.name}:`, error);
        }
    }
}

/**
 * 高效计数查询（替代 select().length）
 */
export async function getTableCount(db: DrizzleDB, table: any): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(table);
    return result[0]?.count || 0;
}

/**
 * 检查表是否为空
 */
export async function isTableEmpty(db: DrizzleDB, table: any): Promise<boolean> {
    const count = await getTableCount(db, table);
    return count === 0;
}

/**
 * 批量执行操作（事务支持）
 */
export async function executeBatch<T>(
    db: DrizzleDB,
    operations: Array<() => Promise<T>>,
    batchSize: number = 50
): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(op => op()));
        results.push(...batchResults);
    }
    
    return results;
}

/**
 * 安全的UUID验证
 */
export function validateUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * 获取关联对象统计（优化的连接查询）
 */
export async function getAssociationCounts(db: DrizzleDB) {
    const [
        assetCount,
        mediaCount,
        assetAssociationCount,
        mediaAssociationCount
    ] = await Promise.all([
        getTableCount(db, schema.asset),
        getTableCount(db, schema.mediaSource),
        getTableCount(db, schema.assetExternalObject),
        getTableCount(db, schema.mediaSourceExternalObject)
    ]);

    return {
        totalAssets: assetCount,
        totalMediaSources: mediaCount,
        migratedAssets: assetAssociationCount,
        migratedMediaSources: mediaAssociationCount
    };
}

/**
 * 检查外部存储默认源
 */
export async function getDefaultExternalSource(db: DrizzleDB) {
    const sources = await db
        .select()
        .from(schema.externalSource)
        .where(sql`name = ${'Default Asset Storage'}`)
        .limit(1);
    
    return sources[0] || null;
}

/**
 * 验证数据库完整性
 */
export async function validateDatabaseIntegrity(db: DrizzleDB): Promise<{
    isValid: boolean;
    errors: string[];
}> {
    const errors: string[] = [];

    try {
        // 检查孤立的外部对象
        const orphanedObjects = await db
            .select({ uuid: schema.externalObject.uuid })
            .from(schema.externalObject)
            .leftJoin(
                schema.assetExternalObject,
                sql`${schema.externalObject.uuid} = ${schema.assetExternalObject.external_object_id}`
            )
            .leftJoin(
                schema.mediaSourceExternalObject,
                sql`${schema.externalObject.uuid} = ${schema.mediaSourceExternalObject.external_object_id}`
            )
            .where(
                sql`${schema.assetExternalObject.external_object_id} IS NULL AND ${schema.mediaSourceExternalObject.external_object_id} IS NULL`
            );

        if (orphanedObjects.length > 0) {
            errors.push(`Found ${orphanedObjects.length} orphaned external objects`);
        }

        // 检查损坏的外部源引用
        const brokenReferences = await db
            .select({ uuid: schema.externalObject.uuid })
            .from(schema.externalObject)
            .leftJoin(
                schema.externalSource,
                sql`${schema.externalObject.external_source_id} = ${schema.externalSource.uuid}`
            )
            .where(sql`${schema.externalSource.uuid} IS NULL`);

        if (brokenReferences.length > 0) {
            errors.push(`Found ${brokenReferences.length} external objects with missing source references`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    } catch (error) {
        errors.push(`Validation error: ${error}`);
        return { isValid: false, errors };
    }
}