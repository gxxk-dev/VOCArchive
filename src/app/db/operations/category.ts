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
import { convertCategoryData, convertAssetData, convertCreatorData, validateIndex } from '../utils';
import { workIndexToId, categoryIndexToId, creatorIndexToId } from '../utils/index-id-converter';

import { Category, WorkTitle, CreatorWithRole, Asset, Tag, WorkListItem, CategoryWithCount, CategoryApi, WorkTitleApi } from '../types';

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workindex: string): Promise<WorkTitleApi[]> {
    // Convert work index to ID
    const workId = await workIndexToId(db, workindex);
    if (!workId) {
        return [];
    }

    const titles = await db
        .select({
            index: workTitle.index,
            work_index: workTitle.index, // We'll fix this below
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
 * Convert Category (DB layer) to CategoryApi (API layer)
 */
async function convertCategoryToApi(db: DrizzleDB, cat: Category): Promise<CategoryApi> {
    let parent_index: string | null = null;
    if (cat.parent_id !== null) {
        // Get parent index from parent ID
        const parentResult = await db.select({ index: category.index })
            .from(category)
            .where(eq(category.id, cat.parent_id))
            .limit(1);
        parent_index = parentResult[0]?.index || null;
    }

    return {
        index: cat.index,
        name: cat.name,
        parent_index: parent_index,
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
        categoryMap.set(cat.index, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach(cat => {
        if (cat.parent_index) {
            const parent = categoryMap.get(cat.parent_index);
            if (parent) {
                parent.children!.push(categoryMap.get(cat.index)!);
            }
        } else {
            rootCategories.push(categoryMap.get(cat.index)!);
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
            index: category.index,
            name: category.name,
            parent_id: category.parent_id,
        })
        .from(category)
        .orderBy(category.name);

    // Convert parent_id to parent_index for API compatibility
    const categoriesWithparentIndex = await Promise.all(
        categories.map(async (cat) => {
            let parent_index: string | null = null;
            if (cat.parent_id !== null) {
                // Get parent index from parent ID
                const parentResult = await db.select({ index: category.index })
                    .from(category)
                    .where(eq(category.id, cat.parent_id))
                    .limit(1);
                parent_index = parentResult[0]?.index || null;
            }
            return {
                index: cat.index,
                name: cat.name,
                parent_index: parent_index,
            };
        })
    );

    return buildCategoryTree(categoriesWithparentIndex);
}

/**
 * Get all categories with work counts
 */
export async function listCategoriesWithCounts(db: DrizzleDB): Promise<CategoryWithCount[]> {
    const categories = await db
        .select({
            index: category.index,
            name: category.name,
            parent_id: category.parent_id, // Get parent_id to convert to index later
            work_count: count(workCategory.work_id)
        })
        .from(category)
        .leftJoin(workCategory, eq(category.id, workCategory.category_id)) // Use ID fields for JOIN
        .groupBy(category.index, category.name, category.parent_id)
        .orderBy(category.name);

    // Convert parent_id to parent_index for API compatibility
    const categoriesWithparentIndex = await Promise.all(
        categories.map(async (cat) => {
            let parent_index: string | null = null;
            if (cat.parent_id !== null) {
                // Get parent index from parent ID
                const parentResult = await db.select({ index: category.index })
                    .from(category)
                    .where(eq(category.id, cat.parent_id))
                    .limit(1);
                parent_index = parentResult[0]?.index || null;
            }
            return {
                index: cat.index,
                name: cat.name,
                parent_index: parent_index,
                work_count: cat.work_count,
            };
        })
    );

    const categoriesWithCounts = categoriesWithparentIndex.map(cat => ({
        index: cat.index,
        name: cat.name,
        parent_index: cat.parent_index,
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
        categoryMap.set(cat.index, { ...cat, children: [] });
    });

    // Build the tree
    categories.forEach(cat => {
        if (cat.parent_index) {
            const parent = categoryMap.get(cat.parent_index);
            if (parent) {
                parent.children!.push(categoryMap.get(cat.index)!);
            }
        } else {
            rootCategories.push(categoryMap.get(cat.index)!);
        }
    });

    return rootCategories;
}

/**
 * Get category by index 
 */
export async function getCategoryByIndex(db: DrizzleDB, categoryIndex: string): Promise<CategoryApi | null> {
    if (!validateIndex(categoryIndex)) return null;

    const categoryResult = await db
        .select()
        .from(category)
        .where(eq(category.index, categoryIndex))
        .limit(1);

    if (!categoryResult[0]) return null;

    return convertCategoryToApi(db, categoryResult[0]);
}

/**
 * Get works by category with pagination
 */
export async function getWorksByCategory(
    db: DrizzleDB, 
    categoryIndex: string, 
    page: number, 
    pageSize: number = 20
): Promise<WorkListItem[]> {
    if (page < 1 || pageSize < 1) return [];
    if (!validateIndex(categoryIndex)) return [];

    const offset = (page - 1) * pageSize;

    // Convert category index to ID for database query
    const categoryId = await categoryIndexToId(db, categoryIndex);
    if (!categoryId) return [];

    // Get work UUIDs for this category
    const workIndexs = await db
        .select({
            work_id: work.id, // Select work ID for WorkListItem
            work_index: work.index // Select work index for API compatibility
        })
        .from(workCategory)
        .innerJoin(work, eq(workCategory.work_id, work.id)) // JOIN using ID fields
        .where(eq(workCategory.category_id, categoryId)) // Use category ID
        .limit(pageSize)
        .offset(offset);

    if (workIndexs.length === 0) return [];

    const workIndexList = workIndexs.map(w => w.work_index);
    const workIdMap = new Map(workIndexs.map(w => [w.work_index, w.work_id]));

    // Get creators for these works
    const creators = await db
        .select({
            work_index: work.index, // Get work index through JOIN
            creator_index: creator.index,
            creator_name: creator.name,
            creator_type: creator.type,
            role: workCreator.role,
        })
        .from(workCreator)
        .innerJoin(creator, eq(workCreator.creator_id, creator.id)) // Use ID fields for JOIN
        .innerJoin(work, eq(workCreator.work_id, work.id)) // JOIN with work to get index 
        .where(inArray(work.index, workIndexList)); // Filter by work UUIDs

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
                work_index: work.index, // Get work index through JOIN
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id)) // JOIN with work to get index 
            .where(
                and(
                    eq(work.index, work_index), // Use work index from JOIN
                    eq(asset.asset_type, 'picture'),
                    eq(asset.is_previewpic, true)
                )
            )
            .limit(1);

        const nonPreviewAssets = await db
            .select({
                index: asset.index,
                // file_id: asset.file_id, // Removed - use external objects for file info
                work_index: work.index, // Get work index through JOIN
                asset_type: asset.asset_type,
                file_name: asset.file_name,
                is_previewpic: asset.is_previewpic,
                language: asset.language,
            })
            .from(asset)
            .innerJoin(work, eq(asset.work_id, work.id)) // JOIN with work to get index 
            .where(
                and(
                    eq(work.index, work_index), // Use work index from JOIN
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
 * Get work count by category
 */
export async function getWorkCountByCategory(db: DrizzleDB, categoryIndex: string): Promise<number> {
    if (!validateIndex(categoryIndex)) return 0;

    // Convert category index to ID
    const categoryId = await categoryIndexToId(db, categoryIndex);
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
        // Convert parent index to ID if provided
        let parent_id: number | null = null;
        if (categoryData.parent_index) {
            if (!validateIndex(categoryData.parent_index)) return false;
            parent_id = await categoryIndexToId(db, categoryData.parent_index);
            if (!parent_id) return false; // Parent category not found
        }

        await db.insert(category).values({
            index: categoryData.index,
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
    categoryIndex: string,
    categoryData: CategoryApi
): Promise<boolean> {
    if (!validateIndex(categoryIndex)) return false;

    try {
        // Check if index is being changed
        const newIndex = categoryData.index;
        if (newIndex && newIndex !== categoryIndex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingCategory = await db
                .select({ id: category.id })
                .from(category)
                .where(eq(category.index, newIndex))
                .limit(1);

            if (existingCategory.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }
        }

        // Convert parent index to ID if provided
        let parent_id: number | null = null;
        if (categoryData.parent_index) {
            if (!validateIndex(categoryData.parent_index)) {
                throw new Error(`Invalid parent index: ${categoryData.parent_index}`);
            }
            parent_id = await categoryIndexToId(db, categoryData.parent_index);
            if (!parent_id) {
                throw new Error(`Parent category not found: ${categoryData.parent_index}`);
            }
        }

        // Update category with or without new index
        if (newIndex && newIndex !== categoryIndex) {
            await db
                .update(category)
                .set({
                    index: newIndex,
                    name: categoryData.name,
                    parent_id: parent_id
                })
                .where(eq(category.index, categoryIndex));
        } else {
            await db
                .update(category)
                .set({
                    name: categoryData.name,
                    parent_id: parent_id
                })
                .where(eq(category.index, categoryIndex));
        }

        return true;
    } catch (error) {
        console.error('Error updating category:', error);
        return false;
    }
}

/**
 * Delete a category
 */
export async function deleteCategory(db: DrizzleDB, categoryIndex: string): Promise<boolean> {
    if (!validateIndex(categoryIndex)) return false;

    try {
        await db.delete(category).where(eq(category.index, categoryIndex));
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
    workindex: string,
    categoryIndexs: string[]
): Promise<boolean> {
    if (!validateIndex(workindex) || categoryIndexs.length === 0) return false;

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        // Convert category UUIDs to IDs and prepare insert data
        const insertData: { work_id: number; category_id: number }[] = [];
        for (const categoryIndex of categoryIndexs) {
            if (!validateIndex(categoryIndex)) continue;
            const categoryId = await categoryIndexToId(db, categoryIndex);
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
    workindex: string,
    categoryIndexs: string[]
): Promise<boolean> {
    if (!validateIndex(workindex) || categoryIndexs.length === 0) return false;

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        // Convert category UUIDs to IDs
        const categoryIds: number[] = [];
        for (const categoryIndex of categoryIndexs) {
            if (!validateIndex(categoryIndex)) continue;
            const categoryId = await categoryIndexToId(db, categoryIndex);
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
export async function removeAllWorkCategories(db: DrizzleDB, workindex: string): Promise<boolean> {
    if (!validateIndex(workindex)) return false;

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return false;

        await db.delete(workCategory).where(eq(workCategory.work_id, workId));
        return true;
    } catch (error) {
        console.error('Error removing all work categories:', error);
        return false;
    }
}