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

// Types matching current interfaces
export interface Tag {
  uuid: string;
  name: string;
}

export interface WorkTitle {
  is_official: boolean;
  language: string;
  title: string;
}

export interface CreatorWithRole {
  creator_uuid: string;
  creator_name?: string;
  creator_type: 'human' | 'virtual';
  role: string;
}

export interface Asset {
  uuid: string;
  file_id: string;
  work_uuid: string;
  asset_type: 'lyrics' | 'picture';
  file_name: string;
  is_previewpic?: boolean;
  language?: string;
}

export interface Category {
  uuid: string;
  name: string;
  parent_uuid?: string;
}

export interface WorkListItem {
  work_uuid: string;
  titles: WorkTitle[];
  preview_asset?: Asset;
  non_preview_asset?: Asset;
  creator: CreatorWithRole[];
  tags: Tag[];
  categories: Category[];
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
  return UUID_PATTERNS.test(uuid);
}

/**
 * Get work titles for a specific work UUID
 */
async function getWorkTitles(db: DrizzleDB, workUUID: string): Promise<WorkTitle[]> {
  const titles = await db
    .select({
      is_official: workTitle.isOfficial,
      language: workTitle.language,
      title: workTitle.title,
    })
    .from(workTitle)
    .where(eq(workTitle.workUuid, workUUID));

  return titles;
}

/**
 * Get all tags
 */
export async function listTags(db: DrizzleDB): Promise<Tag[]> {
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
 * Get tag by UUID
 */
export async function getTagByUUID(db: DrizzleDB, tagUuid: string): Promise<Tag | null> {
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

  // Get work UUIDs for this tag
  const workUuids = await db
    .select({ work_uuid: workTag.workUuid })
    .from(workTag)
    .where(eq(workTag.tagUuid, tagUuid))
    .limit(pageSize)
    .offset(offset);

  if (workUuids.length === 0) return [];

  const workUuidList = workUuids.map(w => w.work_uuid);

  // Get creators for these works
  const creators = await db
    .select({
      work_uuid: workCreator.workUuid,
      creator_uuid: creator.uuid,
      creator_name: creator.name,
      creator_type: creator.type,
      role: workCreator.role,
    })
    .from(workCreator)
    .innerJoin(creator, eq(workCreator.creatorUuid, creator.uuid))
    .where(inArray(workCreator.workUuid, workUuidList));

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
    const titles = await getWorkTitles(db, work_uuid);

    // Get assets
    const previewAssets = await db
      .select({
        uuid: asset.uuid,
        file_id: asset.fileId,
        work_uuid: asset.workUuid,
        asset_type: asset.assetType,
        file_name: asset.fileName,
        is_previewpic: asset.isPreviewpic,
        language: asset.language,
      })
      .from(asset)
      .where(
        and(
          eq(asset.workUuid, work_uuid),
          eq(asset.assetType, 'picture'),
          eq(asset.isPreviewpic, true)
        )
      )
      .limit(1);

    const nonPreviewAssets = await db
      .select({
        uuid: asset.uuid,
        file_id: asset.fileId,
        work_uuid: asset.workUuid,
        asset_type: asset.assetType,
        file_name: asset.fileName,
        is_previewpic: asset.isPreviewpic,
        language: asset.language,
      })
      .from(asset)
      .where(
        and(
          eq(asset.workUuid, work_uuid),
          eq(asset.assetType, 'picture')
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

  const result = await db
    .select({ count: count() })
    .from(workTag)
    .where(eq(workTag.tagUuid, tagUuid));

  return result[0]?.count || 0;
}

/**
 * Create a new tag
 */
export async function inputTag(db: DrizzleDB, tagData: Tag): Promise<boolean> {
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
    await db.insert(workTag).values(
      tagUuids.map(tagUuid => ({
        workUuid,
        tagUuid,
      }))
    ).onConflictDoNothing();
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
    await db
      .delete(workTag)
      .where(
        and(
          eq(workTag.workUuid, workUuid),
          inArray(workTag.tagUuid, tagUuids)
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
    await db.delete(workTag).where(eq(workTag.workUuid, workUuid));
    return true;
  } catch (error) {
    console.error('Error removing all work tags:', error);
    return false;
  }
}