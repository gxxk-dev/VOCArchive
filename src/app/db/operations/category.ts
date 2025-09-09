import { eq, count, inArray, and, isNull } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { 
    category, 
    workCategory, 
    work, 
    workTitle, 
    workCreator, 
    creator, 
    asset 
} from '../schema';
import { convertCategoryData, convertAssetData, convertCreatorData } from '../utils';

// Types matching current interfaces
export interface Category {
    uuid: string;
    name: string;
    parent_uuid?: string;
    children?: Category[];
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

export interface Tag {
    uuid: string;
    name: string;
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
 * Build category tree structure
 */
function buildCategoryTree(categories: Category[]): Category[] {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Initialize all categories with empty children array
    categories.forEach(cat => {
        categoryMap.set(cat.uuid, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach(cat => {
        if (cat.parent_uuid) {
            const parent = categoryMap.get(cat.parent_uuid);
            if (parent) {
                parent.children!.push(categoryMap.get(cat.uuid)!);
            }
        } else {
            rootCategories.push(categoryMap.get(cat.uuid)!);
        }
    });

    return rootCategories;
}

/**
 * Get all categories in tree structure
 */
export async function listCategories(db: DrizzleDB): Promise<Category[]> {
    const categories = await db
        .select({
            uuid: category.uuid,
            name: category.name,
            parent_uuid: category.parentUuid,
        })
        .from(category)
        .orderBy(category.name);

    return buildCategoryTree(categories.map(convertCategoryData));
}

/**
 * Get category by UUID
 */
export async function getCategoryByUUID(db: DrizzleDB, categoryUuid: string): Promise<Category | null> {
    if (!validateUUID(categoryUuid)) return null;

    const categoryResult = await db
        .select({
            uuid: category.uuid,
            name: category.name,
            parent_uuid: category.parentUuid,
        })
        .from(category)
        .where(eq(category.uuid, categoryUuid))
        .limit(1);

    return categoryResult[0] ? convertCategoryData(categoryResult[0]) : null;
}

/**
 * Get works by category with pagination
 */
export async function getWorksByCategory(
    db: DrizzleDB, 
    categoryUuid: string, 
    page: number, 
    pageSize: number = 20
): Promise<WorkListItem[]> {
    if (page < 1 || pageSize < 1) return [];
    if (!validateUUID(categoryUuid)) return [];

    const offset = (page - 1) * pageSize;

    // Get work UUIDs for this category
    const workUuids = await db
        .select({ work_uuid: workCategory.workUuid })
        .from(workCategory)
        .where(eq(workCategory.categoryUuid, categoryUuid))
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
 * Get work count by category
 */
export async function getWorkCountByCategory(db: DrizzleDB, categoryUuid: string): Promise<number> {
    if (!validateUUID(categoryUuid)) return 0;

    const result = await db
        .select({ count: count() })
        .from(workCategory)
        .where(eq(workCategory.categoryUuid, categoryUuid));

    return result[0]?.count || 0;
}

/**
 * Create a new category
 */
export async function inputCategory(db: DrizzleDB, categoryData: Category): Promise<boolean> {
    try {
        await db.insert(category).values({
            uuid: categoryData.uuid,
            name: categoryData.name,
            parentUuid: categoryData.parent_uuid || null,
        });
        return true;
    } catch (error) {
        console.error('Error creating category:', error);
        return false;
    }
}

/**
 * Update a category
 */
export async function updateCategory(
    db: DrizzleDB, 
    categoryUuid: string, 
    name: string, 
    parentUuid?: string
): Promise<boolean> {
    if (!validateUUID(categoryUuid)) return false;

    try {
        await db
            .update(category)
            .set({ 
                name,
                parentUuid: parentUuid || null
            })
            .where(eq(category.uuid, categoryUuid));
        return true;
    } catch (error) {
        console.error('Error updating category:', error);
        return false;
    }
}

/**
 * Delete a category
 */
export async function deleteCategory(db: DrizzleDB, categoryUuid: string): Promise<boolean> {
    if (!validateUUID(categoryUuid)) return false;

    try {
        await db.delete(category).where(eq(category.uuid, categoryUuid));
        return true;
    } catch (error) {
        console.error('Error deleting category:', error);
        return false;
    }
}

/**
 * Add categories to a work
 */
export async function addWorkCategories(
    db: DrizzleDB, 
    workUuid: string, 
    categoryUuids: string[]
): Promise<boolean> {
    if (!validateUUID(workUuid) || categoryUuids.length === 0) return false;

    try {
        await db.insert(workCategory).values(
            categoryUuids.map(categoryUuid => ({
                workUuid,
                categoryUuid,
            }))
        ).onConflictDoNothing();
        return true;
    } catch (error) {
        console.error('Error adding work categories:', error);
        return false;
    }
}

/**
 * Remove categories from a work
 */
export async function removeWorkCategories(
    db: DrizzleDB, 
    workUuid: string, 
    categoryUuids: string[]
): Promise<boolean> {
    if (!validateUUID(workUuid) || categoryUuids.length === 0) return false;

    try {
        await db
            .delete(workCategory)
            .where(
                and(
                    eq(workCategory.workUuid, workUuid),
                    inArray(workCategory.categoryUuid, categoryUuids)
                )
            );
        return true;
    } catch (error) {
        console.error('Error removing work categories:', error);
        return false;
    }
}

/**
 * Remove all categories from a work
 */
export async function removeAllWorkCategories(db: DrizzleDB, workUuid: string): Promise<boolean> {
    if (!validateUUID(workUuid)) return false;

    try {
        await db.delete(workCategory).where(eq(workCategory.workUuid, workUuid));
        return true;
    } catch (error) {
        console.error('Error removing all work categories:', error);
        return false;
    }
}