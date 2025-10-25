import type { DrizzleDB } from '../client';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';

/**
 * Index到ID转换工具
 *
 * 这个模块提供从Index到数字ID的转换功能，
 * 用于支持新的自增ID主键架构，同时保持Index作为外部访问键
 */

// Index到ID的转换函数接口
type IndexToIdConverter = (db: DrizzleDB, index: string) => Promise<number | null>;

/**
 * 具体表的Index到ID转换函数
 */
export const workIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.work.id })
        .from(schema.work)
        .where(eq(schema.work.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const creatorIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.creator.id })
        .from(schema.creator)
        .where(eq(schema.creator.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const assetIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.asset.id })
        .from(schema.asset)
        .where(eq(schema.asset.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const mediaSourceIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.mediaSource.id })
        .from(schema.mediaSource)
        .where(eq(schema.mediaSource.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const tagIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.tag.id })
        .from(schema.tag)
        .where(eq(schema.tag.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const categoryIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.category.id })
        .from(schema.category)
        .where(eq(schema.category.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const externalSourceIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.externalSource.id })
        .from(schema.externalSource)
        .where(eq(schema.externalSource.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const externalObjectIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.externalObject.id })
        .from(schema.externalObject)
        .where(eq(schema.externalObject.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const workTitleIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.workTitle.id })
        .from(schema.workTitle)
        .where(eq(schema.workTitle.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const workRelationIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.workRelation.id })
        .from(schema.workRelation)
        .where(eq(schema.workRelation.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const footerSettingsIndexToId: IndexToIdConverter = async (db, index) => {
    const result = await db.select({ id: schema.footerSettings.id })
        .from(schema.footerSettings)
        .where(eq(schema.footerSettings.index, index))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

/**
 * ID到Index转换函数（反向查找）
 */
export const workIdToIndex = async (db: DrizzleDB, id: number): Promise<string | null> => {
    const result = await db.select({ index: schema.work.index })
        .from(schema.work)
        .where(eq(schema.work.id, id))
        .limit(1);
    return result.length > 0 ? result[0].index : null;
};

export const creatorIdToIndex = async (db: DrizzleDB, id: number): Promise<string | null> => {
    const result = await db.select({ index: schema.creator.index })
        .from(schema.creator)
        .where(eq(schema.creator.id, id))
        .limit(1);
    return result.length > 0 ? result[0].index : null;
};
