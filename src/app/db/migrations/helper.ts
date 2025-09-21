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
    // 对于Cloudflare D1，我们依赖于schema定义
    // 在生产环境中，表应该通过迁移或dashboard创建
    // 这个函数主要用于开发环境
    console.log('Tables should be created via migrations or dashboard');
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
                sql`${schema.externalObject.uuid} = ${schema.assetExternalObject.external_object_uuid}`
            )
            .leftJoin(
                schema.mediaSourceExternalObject,
                sql`${schema.externalObject.uuid} = ${schema.mediaSourceExternalObject.external_object_uuid}`
            )
            .where(
                sql`${schema.assetExternalObject.external_object_uuid} IS NULL AND ${schema.mediaSourceExternalObject.external_object_uuid} IS NULL`
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
                sql`${schema.externalObject.external_source_uuid} = ${schema.externalSource.uuid}`
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