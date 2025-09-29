import { eq, count, inArray, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import {
    tag,
    workTag,
    work,
    workTitle,
    workCreator,
    creator,
    asset
} from '../schema';
import { convertAssetData, convertCreatorData } from '../utils';
import { workUuidToId, tagUuidToId } from '../utils/uuid-id-converter';

import { Tag, TagApi, WorkTitleApi, CreatorWithRole, AssetApi, CategoryApi, WorkListItem, TagWithCount, WorkTitle } from '../types';

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workUUID: string): Promise<WorkTitleApi[]> {
    // Convert work UUID to ID for database query
    const workId = await workUuidToId(db, workUUID);
    if (!workId) return [];

    const titles = await db
        .select({
            uuid: workTitle.uuid,
            is_official: workTitle.is_official,
            is_for_search: workTitle.is_for_search,
            language: workTitle.language,
            title: workTitle.title,
        })
        .from(workTitle)
        .where(eq(workTitle.work_id, workId));

    // Convert to API format with work_uuid
    return titles.map(title => ({
        uuid: title.uuid,
        work_uuid: workUUID, // Use the provided work UUID
        is_official: title.is_official,
        is_for_search: title.is_for_search,
        language: title.language,
        title: title.title,
    }));
}

/**
 * Get all tags
 */
export async function listTags(db: DrizzleDB): Promise<TagApi[]> {
    const tags = await db
        .select({
            uuid: tag.uuid,
            name: tag.name,
        })
        .from(tag)
        .orderBy(tag.name);

    return tags;
}

/**
 * Get all tags with work counts
 */
export async function listTagsWithCounts(db: DrizzleDB): Promise<TagWithCount[]> {
    const tags = await db
        .select({
            uuid: tag.uuid,
            name: tag.name,
            work_count: count(workTag.work_id)
        })
        .from(tag)
        .leftJoin(workTag, eq(tag.id, workTag.tag_id))
        .groupBy(tag.uuid, tag.name)
        .orderBy(tag.name);

    return tags;
}

/**
 * Get tag by UUID
 */
export async function getTagByUUID(db: DrizzleDB, tagUuid: string): Promise<TagApi | null> {
    if (!validateUUID(tagUuid)) return null;

    const tagResult = await db
        .select({
            uuid: tag.uuid,
            name: tag.name,
        })
        .from(tag)
        .where(eq(tag.uuid, tagUuid))
        .limit(1);

    return tagResult[0] || null;
}

/**
 * Get works by tag with pagination
 */
export async function getWorksByTag(
    db: DrizzleDB,
    tagUuid: string,
    page: number,
    pageSize: number = 20
): Promise<WorkListItem[]> {
    if (page < 1 || pageSize < 1) return [];
    if (!validateUUID(tagUuid)) return [];

    const offset = (page - 1) * pageSize;

    // Convert tag UUID to ID
    const tagId = await tagUuidToId(db, tagUuid);
    if (!tagId) return [];

    // Get work UUIDs for this tag
    const workUuids = await db
        .select({ work_uuid: work.uuid })
        .from(workTag)
        .innerJoin(work, eq(workTag.work_id, work.id))
        .where(eq(workTag.tag_id, tagId))
        .limit(pageSize)
        .offset(offset);

    if (workUuids.length === 0) return [];

    const workUuidList = workUuids.map(w => w.work_uuid);

    // Get creators for these works
    const creators = await db
        .select({
            work_uuid: work.uuid,
            creator_uuid: creator.uuid,
            creator_name: creator.name,
            creator_type: creator.type,
            role: workCreator.role,
        })
        .from(workCreator)
        .innerJoin(creator, eq(workCreator.creator_id, creator.id))
        .innerJoin(work, eq(workCreator.work_id, work.id))
        .where(inArray(work.uuid, workUuidList));

    // Group creators by work UUID
    const creatorMap = new Map<string, CreatorWithRole[]>();
    creators.forEach(row => {
        if (!creatorMap.has(row.work_uuid)) {
            creatorMap.set(row.work_uuid, []);
        }
        creatorMap.get(row.work_uuid)!.push({
            creator_uuid: row.creator_uuid,
            creator_name: row.creator_name,
            creator_type: row.creator_type,
            role: row.role
        });
    });

    // Get work details for each work
    const workListPromises = workUuidList.map(async (work_uuid) => {
        // Get titles
        const titles = await getWorkTitlesApi(db, work_uuid);

        // Get assets
        const previewAssets = await db
            .select({
                uuid: asset.uuid,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_uuid: work.uuid,
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id))
            .where(
                and(
                    eq(work.uuid, work_uuid),
                    eq(asset.asset_type, 'picture'),
                    eq(asset.is_previewpic, true)
                )
            )
            .limit(1);

        const nonPreviewAssets = await db
            .select({
                uuid: asset.uuid,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_uuid: work.uuid,
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id))
            .where(
                and(
                    eq(work.uuid, work_uuid),
                    eq(asset.asset_type, 'picture')
                )
            )
            .limit(1);

        return {
            work_uuid,
            titles,
            preview_asset: previewAssets[0] ? convertAssetData(previewAssets[0]) : undefined,
            non_preview_asset: nonPreviewAssets[0] ? convertAssetData(nonPreviewAssets[0]) : undefined,
            creator: creatorMap.get(work_uuid) || [],
            tags: [], // We'll populate this if needed
            categories: [], // We'll populate this if needed
        };
    });

    return await Promise.all(workListPromises);
}

/**
 * Get work count by tag
 */
export async function getWorkCountByTag(db: DrizzleDB, tagUuid: string): Promise<number> {
    if (!validateUUID(tagUuid)) return 0;

    // Convert tag UUID to ID
    const tagId = await tagUuidToId(db, tagUuid);
    if (!tagId) return 0;

    const result = await db
        .select({ count: count() })
        .from(workTag)
        .where(eq(workTag.tag_id, tagId));

    return result[0]?.count || 0;
}

/**
 * Create a new tag
 */
export async function inputTag(db: DrizzleDB, tagData: TagApi): Promise<boolean> {
    try {
        await db.insert(tag).values({
            uuid: tagData.uuid,
            name: tagData.name,
        });
        return true;
    } catch (error) {
        console.error('Error creating tag:', error);
        return false;
    }
}

/**
 * Update a tag
 */
export async function updateTag(
    db: DrizzleDB,
    tagUuid: string,
    name: string
): Promise<boolean> {
    if (!validateUUID(tagUuid)) return false;

    try {
        await db
            .update(tag)
            .set({ name })
            .where(eq(tag.uuid, tagUuid));
        return true;
    } catch (error) {
        console.error('Error updating tag:', error);
        return false;
    }
}

/**
 * Delete a tag
 */
export async function deleteTag(db: DrizzleDB, tagUuid: string): Promise<boolean> {
    if (!validateUUID(tagUuid)) return false;

    try {
        await db.delete(tag).where(eq(tag.uuid, tagUuid));
        return true;
    } catch (error) {
        console.error('Error deleting tag:', error);
        return false;
    }
}

/**
 * Add tags to a work
 */
export async function addWorkTags(
    db: DrizzleDB,
    workUuid: string,
    tagUuids: string[]
): Promise<boolean> {
    if (!validateUUID(workUuid) || tagUuids.length === 0) return false;

    try {
        // Convert UUIDs to IDs
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        const tagInserts = [];
        for (const tagUuid of tagUuids) {
            if (!validateUUID(tagUuid)) continue;
            const tagId = await tagUuidToId(db, tagUuid);
            if (tagId) {
                tagInserts.push({
                    work_id: workId,
                    tag_id: tagId,
                });
            }
        }

        if (tagInserts.length === 0) return false;

        await db.insert(workTag).values(tagInserts).onConflictDoNothing();
        return true;
    } catch (error) {
        console.error('Error adding work tags:', error);
        return false;
    }
}

/**
 * Remove tags from a work
 */
export async function removeWorkTags(
    db: DrizzleDB,
    workUuid: string,
    tagUuids: string[]
): Promise<boolean> {
    if (!validateUUID(workUuid) || tagUuids.length === 0) return false;

    try {
        // Convert UUIDs to IDs
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        const tagIds = [];
        for (const tagUuid of tagUuids) {
            if (!validateUUID(tagUuid)) continue;
            const tagId = await tagUuidToId(db, tagUuid);
            if (tagId) tagIds.push(tagId);
        }

        if (tagIds.length === 0) return false;

        await db
            .delete(workTag)
            .where(
                and(
                    eq(workTag.work_id, workId),
                    inArray(workTag.tag_id, tagIds)
                )
            );
        return true;
    } catch (error) {
        console.error('Error removing work tags:', error);
        return false;
    }
}

/**
 * Remove all tags from a work
 */
export async function removeAllWorkTags(db: DrizzleDB, workUuid: string): Promise<boolean> {
    if (!validateUUID(workUuid)) return false;

    try {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        await db.delete(workTag).where(eq(workTag.work_id, workId));
        return true;
    } catch (error) {
        console.error('Error removing all work tags:', error);
        return false;
    }
}