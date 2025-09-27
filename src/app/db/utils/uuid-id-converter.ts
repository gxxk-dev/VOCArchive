import type { DrizzleDB } from '../client';
import { eq } from 'drizzle-orm';
import * as schema from '../schema';

/**
 * UUID到ID转换工具
 *
 * 这个模块提供从UUID到数字ID的转换功能，
 * 用于支持新的自增ID主键架构，同时保持UUID作为外部访问键
 */

// UUID到ID的转换函数接口
type UuidToIdConverter = (db: DrizzleDB, uuid: string) => Promise<number | null>;

/**
 * 具体表的UUID到ID转换函数
 */
export const workUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.work.id })
        .from(schema.work)
        .where(eq(schema.work.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const creatorUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.creator.id })
        .from(schema.creator)
        .where(eq(schema.creator.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const assetUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.asset.id })
        .from(schema.asset)
        .where(eq(schema.asset.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const mediaSourceUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.mediaSource.id })
        .from(schema.mediaSource)
        .where(eq(schema.mediaSource.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const tagUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.tag.id })
        .from(schema.tag)
        .where(eq(schema.tag.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const categoryUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.category.id })
        .from(schema.category)
        .where(eq(schema.category.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const externalSourceUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.externalSource.id })
        .from(schema.externalSource)
        .where(eq(schema.externalSource.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const externalObjectUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.externalObject.id })
        .from(schema.externalObject)
        .where(eq(schema.externalObject.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const workTitleUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.workTitle.id })
        .from(schema.workTitle)
        .where(eq(schema.workTitle.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const workRelationUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.workRelation.id })
        .from(schema.workRelation)
        .where(eq(schema.workRelation.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

export const footerSettingsUuidToId: UuidToIdConverter = async (db, uuid) => {
    const result = await db.select({ id: schema.footerSettings.id })
        .from(schema.footerSettings)
        .where(eq(schema.footerSettings.uuid, uuid))
        .limit(1);
    return result.length > 0 ? result[0].id : null;
};

/**
 * ID到UUID转换函数（反向查找）
 */
export const workIdToUuid = async (db: DrizzleDB, id: number): Promise<string | null> => {
    const result = await db.select({ uuid: schema.work.uuid })
        .from(schema.work)
        .where(eq(schema.work.id, id))
        .limit(1);
    return result.length > 0 ? result[0].uuid : null;
};

export const creatorIdToUuid = async (db: DrizzleDB, id: number): Promise<string | null> => {
    const result = await db.select({ uuid: schema.creator.uuid })
        .from(schema.creator)
        .where(eq(schema.creator.id, id))
        .limit(1);
    return result.length > 0 ? result[0].uuid : null;
};