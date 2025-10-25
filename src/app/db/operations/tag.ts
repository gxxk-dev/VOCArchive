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
import { convertAssetData, convertCreatorData, validateIndex } from '../utils';
import { workIndexToId, tagIndexToId } from '../utils/index-id-converter';

import { Tag, TagApi, WorkTitleApi, CreatorWithRole, AssetApi, CategoryApi, WorkListItem, TagWithCount, WorkTitle } from '../types';

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workindex: string): Promise<WorkTitleApi[]> {
    // Convert work index to ID for database query
    const workId = await workIndexToId(db, workindex);
    if (!workId) return [];

    const titles = await db
        .select({
            index: workTitle.index,
            is_official: workTitle.is_official,
            is_for_search: workTitle.is_for_search,
            language: workTitle.language,
            title: workTitle.title,
        })
        .from(workTitle)
        .where(eq(workTitle.work_id, workId));

    // Convert to API format with work_index 
    return titles.map(title => ({
        index: title.index,
        work_index: workindex, // Use the provided work index 
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
            index: tag.index,
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
            index: tag.index,
            name: tag.name,
            work_count: count(workTag.work_id)
        })
        .from(tag)
        .leftJoin(workTag, eq(tag.id, workTag.tag_id))
        .groupBy(tag.index, tag.name)
        .orderBy(tag.name);

    return tags;
}

/**
 * Get tag by index
 */
export async function getTagByIndex(db: DrizzleDB, tagindex: string): Promise<TagApi | null> {
    if (!validateIndex(tagindex)) return null;

    const tagResult = await db
        .select({
            index: tag.index,
            name: tag.name,
        })
        .from(tag)
        .where(eq(tag.index, tagindex))
        .limit(1);

    return tagResult[0] || null;
}

/**
 * Get works by tag with pagination
 */
export async function getWorksByTag(
    db: DrizzleDB,
    tagindex: string,
    page: number,
    pageSize: number = 20
): Promise<WorkListItem[]> {
    if (page < 1 || pageSize < 1) return [];
    if (!validateIndex(tagindex)) return [];

    const offset = (page - 1) * pageSize;

    // Convert tag index to ID
    const tagId = await tagIndexToId(db, tagindex);
    if (!tagId) return [];

    // Get work UUIDs for this tag
    const workIndexs = await db
        .select({
            work_id: work.id, // Select work ID for WorkListItem
            work_index: work.index
        })
        .from(workTag)
        .innerJoin(work, eq(workTag.work_id, work.id))
        .where(eq(workTag.tag_id, tagId))
        .limit(pageSize)
        .offset(offset);

    if (workIndexs.length === 0) return [];

    const workIndexList = workIndexs.map(w => w.work_index);
    const workIdMap = new Map(workIndexs.map(w => [w.work_index, w.work_id]));

    // Get creators for these works
    const creators = await db
        .select({
            work_index: work.index,
            creator_index: creator.index,
            creator_name: creator.name,
            creator_type: creator.type,
            role: workCreator.role,
        })
        .from(workCreator)
        .innerJoin(creator, eq(workCreator.creator_id, creator.id))
        .innerJoin(work, eq(workCreator.work_id, work.id))
        .where(inArray(work.index, workIndexList));

    // Group creators by work index 
    const creatorMap = new Map<string, CreatorWithRole[]>();
    creators.forEach(row => {
        if (!creatorMap.has(row.work_index)) {
            creatorMap.set(row.work_index, []);
        }
        creatorMap.get(row.work_index)!.push({
            creator_index: row.creator_index,
            creator_name: row.creator_name,
            creator_type: row.creator_type,
            role: row.role
        });
    });

    // Get work details for each work
    const workListPromises = workIndexList.map(async (work_index) => {
        // Get titles
        const titles = await getWorkTitlesApi(db, work_index);

        // Get assets
        const previewAssets = await db
            .select({
                index: asset.index,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_index: work.index,
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id))
            .where(
                and(
                    eq(work.index, work_index),
                    eq(asset.asset_type, 'picture'),
                    eq(asset.is_previewpic, true)
                )
            )
            .limit(1);

        const nonPreviewAssets = await db
            .select({
                index: asset.index,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_index: work.index,
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id))
            .where(
                and(
                    eq(work.index, work_index),
                    eq(asset.asset_type, 'picture')
                )
            )
            .limit(1);

        return {
            work_id: workIdMap.get(work_index)!,
            work_index,
            titles,
            preview_asset: previewAssets[0] ? convertAssetData(previewAssets[0]) : undefined,
            non_preview_asset: nonPreviewAssets[0] ? convertAssetData(nonPreviewAssets[0]) : undefined,
            creator: creatorMap.get(work_index) || [],
            tags: [], // We'll populate this if needed
            categories: [], // We'll populate this if needed
        };
    });

    return await Promise.all(workListPromises);
}

/**
 * Get work count by tag
 */
export async function getWorkCountByTag(db: DrizzleDB, tagindex: string): Promise<number> {
    if (!validateIndex(tagindex)) return 0;

    // Convert tag index to ID
    const tagId = await tagIndexToId(db, tagindex);
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
            index: tagData.index,
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
    tagindex: string,
    tagData: TagApi
): Promise<boolean> {
    if (!validateIndex(tagindex)) return false;

    try {
        // Check if index is being changed
        const newIndex = tagData.index;
        if (newIndex && newIndex !== tagindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingTag = await db
                .select({ id: tag.id })
                .from(tag)
                .where(eq(tag.index, newIndex))
                .limit(1);

            if (existingTag.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update tag with new index and name
            await db
                .update(tag)
                .set({
                    index: newIndex,
                    name: tagData.name,
                })
                .where(eq(tag.index, tagindex));
        } else {
            // Update tag without changing index
            await db
                .update(tag)
                .set({ name: tagData.name })
                .where(eq(tag.index, tagindex));
        }

        return true;
    } catch (error) {
        console.error('Error updating tag:', error);
        return false;
    }
}

/**
 * Delete a tag
 */
export async function deleteTag(db: DrizzleDB, tagindex: string): Promise<boolean> {
    if (!validateIndex(tagindex)) return false;

    try {
        await db.delete(tag).where(eq(tag.index, tagindex));
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
    workindex: string,
    tagIndexs: string[]
): Promise<boolean> {
    if (!validateIndex(workindex) || tagIndexs.length === 0) return false;

    try {
        // Convert indexes to IDs
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        const tagInserts = [];
        for (const tagindex of tagIndexs) {
            if (!validateIndex(tagindex)) continue;
            const tagId = await tagIndexToId(db, tagindex);
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
    workindex: string,
    tagIndexs: string[]
): Promise<boolean> {
    if (!validateIndex(workindex) || tagIndexs.length === 0) return false;

    try {
        // Convert indexes to IDs
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        const tagIds = [];
        for (const tagindex of tagIndexs) {
            if (!validateIndex(tagindex)) continue;
            const tagId = await tagIndexToId(db, tagindex);
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
export async function removeAllWorkTags(db: DrizzleDB, workindex: string): Promise<boolean> {
    if (!validateIndex(workindex)) return false;

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        await db.delete(workTag).where(eq(workTag.work_id, workId));
        return true;
    } catch (error) {
        console.error('Error removing all work tags:', error);
        return false;
    }
}