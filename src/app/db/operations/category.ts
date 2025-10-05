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
import { convertCategoryData, convertAssetData, convertCreatorData, validateUUID } from '../utils';
import { workUuidToId, categoryUuidToId, creatorUuidToId } from '../utils/uuid-id-converter';

import { Category, WorkTitle, CreatorWithRole, Asset, Tag, WorkListItem, CategoryWithCount, CategoryApi, WorkTitleApi } from '../types';

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workUUID: string): Promise<WorkTitleApi[]> {
    // Convert work UUID to ID
    const workId = await workUuidToId(db, workUUID);
    if (!workId) {
        return [];
    }

    const titles = await db
        .select({
            uuid: workTitle.uuid,
            work_uuid: workTitle.uuid, // We'll fix this below
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
 * Convert Category (DB layer) to CategoryApi (API layer)
 */
async function convertCategoryToApi(db: DrizzleDB, cat: Category): Promise<CategoryApi> {
    let parent_uuid: string | null = null;
    if (cat.parent_id !== null) {
        // Get parent UUID from parent ID
        const parentResult = await db.select({ uuid: category.uuid })
            .from(category)
            .where(eq(category.id, cat.parent_id))
            .limit(1);
        parent_uuid = parentResult[0]?.uuid || null;
    }

    return {
        uuid: cat.uuid,
        name: cat.name,
        parent_uuid: parent_uuid,
    };
}

/**
 * Build category tree structure using API layer types
 */
function buildCategoryTree(categories: CategoryApi[]): CategoryApi[] {
    const categoryMap = new Map<string, CategoryApi>();
    const rootCategories: CategoryApi[] = [];

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
export async function listCategories(db: DrizzleDB): Promise<CategoryApi[]> {
    const categories = await db
        .select({
            uuid: category.uuid,
            name: category.name,
            parent_id: category.parent_id,
        })
        .from(category)
        .orderBy(category.name);

    // Convert parent_id to parent_uuid for API compatibility
    const categoriesWithParentUuid = await Promise.all(
        categories.map(async (cat) => {
            let parent_uuid: string | null = null;
            if (cat.parent_id !== null) {
                // Get parent UUID from parent ID
                const parentResult = await db.select({ uuid: category.uuid })
                    .from(category)
                    .where(eq(category.id, cat.parent_id))
                    .limit(1);
                parent_uuid = parentResult[0]?.uuid || null;
            }
            return {
                uuid: cat.uuid,
                name: cat.name,
                parent_uuid: parent_uuid,
            };
        })
    );

    return buildCategoryTree(categoriesWithParentUuid);
}

/**
 * Get all categories with work counts
 */
export async function listCategoriesWithCounts(db: DrizzleDB): Promise<CategoryWithCount[]> {
    const categories = await db
        .select({
            uuid: category.uuid,
            name: category.name,
            parent_id: category.parent_id, // Get parent_id to convert to UUID later
            work_count: count(workCategory.work_id)
        })
        .from(category)
        .leftJoin(workCategory, eq(category.id, workCategory.category_id)) // Use ID fields for JOIN
        .groupBy(category.uuid, category.name, category.parent_id)
        .orderBy(category.name);

    // Convert parent_id to parent_uuid for API compatibility
    const categoriesWithParentUuid = await Promise.all(
        categories.map(async (cat) => {
            let parent_uuid: string | null = null;
            if (cat.parent_id !== null) {
                // Get parent UUID from parent ID
                const parentResult = await db.select({ uuid: category.uuid })
                    .from(category)
                    .where(eq(category.id, cat.parent_id))
                    .limit(1);
                parent_uuid = parentResult[0]?.uuid || null;
            }
            return {
                uuid: cat.uuid,
                name: cat.name,
                parent_uuid: parent_uuid,
                work_count: cat.work_count,
            };
        })
    );

    const categoriesWithCounts = categoriesWithParentUuid.map(cat => ({
        uuid: cat.uuid,
        name: cat.name,
        parent_uuid: cat.parent_uuid,
        work_count: cat.work_count,
        children: [] as CategoryWithCount[]
    }));

    return buildCategoryTreeWithCounts(categoriesWithCounts);
}

/**
 * Build category tree structure with work counts
 */
function buildCategoryTreeWithCounts(categories: CategoryWithCount[]): CategoryWithCount[] {
    const categoryMap = new Map<string, CategoryWithCount>();
    const rootCategories: CategoryWithCount[] = [];

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
 * Get category by UUID
 */
export async function getCategoryByUUID(db: DrizzleDB, categoryUuid: string): Promise<CategoryApi | null> {
    if (!validateUUID(categoryUuid)) return null;

    const categoryResult = await db
        .select()
        .from(category)
        .where(eq(category.uuid, categoryUuid))
        .limit(1);

    if (!categoryResult[0]) return null;

    return convertCategoryToApi(db, categoryResult[0]);
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

    // Convert category UUID to ID for database query
    const categoryId = await categoryUuidToId(db, categoryUuid);
    if (!categoryId) return [];

    // Get work UUIDs for this category
    const workUuids = await db
        .select({
            work_uuid: work.uuid // Select work UUID for API compatibility
        })
        .from(workCategory)
        .innerJoin(work, eq(workCategory.work_id, work.id)) // JOIN using ID fields
        .where(eq(workCategory.category_id, categoryId)) // Use category ID
        .limit(pageSize)
        .offset(offset);

    if (workUuids.length === 0) return [];

    const workUuidList = workUuids.map(w => w.work_uuid);

    // Get creators for these works
    const creators = await db
        .select({
            work_uuid: work.uuid, // Get work UUID through JOIN
            creator_uuid: creator.uuid,
            creator_name: creator.name,
            creator_type: creator.type,
            role: workCreator.role,
        })
        .from(workCreator)
        .innerJoin(creator, eq(workCreator.creator_id, creator.id)) // Use ID fields for JOIN
        .innerJoin(work, eq(workCreator.work_id, work.id)) // JOIN with work to get UUID
        .where(inArray(work.uuid, workUuidList)); // Filter by work UUIDs

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
                work_uuid: work.uuid, // Get work UUID through JOIN
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id)) // JOIN with work to get UUID
            .where(
                and(
                    eq(work.uuid, work_uuid), // Use work UUID from JOIN
                    eq(asset.asset_type, 'picture'),
                    eq(asset.is_previewpic, true)
                )
            )
            .limit(1);

        const nonPreviewAssets = await db
            .select({
                uuid: asset.uuid,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_uuid: work.uuid, // Get work UUID through JOIN
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id)) // JOIN with work to get UUID
            .where(
                and(
                    eq(work.uuid, work_uuid), // Use work UUID from JOIN
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
 * Get work count by category
 */
export async function getWorkCountByCategory(db: DrizzleDB, categoryUuid: string): Promise<number> {
    if (!validateUUID(categoryUuid)) return 0;

    // Convert category UUID to ID
    const categoryId = await categoryUuidToId(db, categoryUuid);
    if (!categoryId) return 0;

    const result = await db
        .select({ count: count() })
        .from(workCategory)
        .where(eq(workCategory.category_id, categoryId));

    return result[0]?.count || 0;
}

/**
 * Create a new category
 */
export async function inputCategory(db: DrizzleDB, categoryData: CategoryApi): Promise<boolean> {
    try {
        // Convert parent UUID to ID if provided
        let parent_id: number | null = null;
        if (categoryData.parent_uuid) {
            if (!validateUUID(categoryData.parent_uuid)) return false;
            parent_id = await categoryUuidToId(db, categoryData.parent_uuid);
            if (!parent_id) return false; // Parent category not found
        }

        await db.insert(category).values({
            uuid: categoryData.uuid,
            name: categoryData.name,
            parent_id: parent_id,
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
        // Convert parent UUID to ID if provided
        let parent_id: number | null = null;
        if (parentUuid) {
            if (!validateUUID(parentUuid)) return false;
            parent_id = await categoryUuidToId(db, parentUuid);
            if (!parent_id) return false; // Parent category not found
        }

        await db
            .update(category)
            .set({
                name,
                parent_id: parent_id
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
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        // Convert category UUIDs to IDs and prepare insert data
        const insertData: { work_id: number; category_id: number }[] = [];
        for (const categoryUuid of categoryUuids) {
            if (!validateUUID(categoryUuid)) continue;
            const categoryId = await categoryUuidToId(db, categoryUuid);
            if (categoryId) {
                insertData.push({
                    work_id: workId,
                    category_id: categoryId,
                });
            }
        }

        if (insertData.length === 0) return false;

        await db.insert(workCategory).values(insertData).onConflictDoNothing();
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
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        // Convert category UUIDs to IDs
        const categoryIds: number[] = [];
        for (const categoryUuid of categoryUuids) {
            if (!validateUUID(categoryUuid)) continue;
            const categoryId = await categoryUuidToId(db, categoryUuid);
            if (categoryId) categoryIds.push(categoryId);
        }

        if (categoryIds.length === 0) return false;

        await db
            .delete(workCategory)
            .where(
                and(
                    eq(workCategory.work_id, workId),
                    inArray(workCategory.category_id, categoryIds)
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
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return false;

        await db.delete(workCategory).where(eq(workCategory.work_id, workId));
        return true;
    } catch (error) {
        console.error('Error removing all work categories:', error);
        return false;
    }
}