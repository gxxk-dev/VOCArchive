import { eq, inArray, count, and, or } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import {
    work,
    workTitle,
    workLicense,
    workCreator,
    workWiki,
    workTag,
    workCategory,
    creator,
    creatorWiki,
    asset,
    assetCreator,
    mediaSource,
    workRelation,
    tag,
    category
} from '../schema';
import { convertAssetData, convertCategoryData, validateIndex } from '../utils';
import { generateIndex } from '../utils/index-utils';
import {
    workIndexToId,
    creatorIndexToId,
    assetIndexToId,
    workIdToIndex,
    creatorIdToIndex 
} from '../utils/index-id-converter';
import {
    Work,
    WorkTitle,
    WorkTitleApi,
    CreatorWithRole,
    WikiRef,
    Tag,
    Category,
    CategoryApi,
    Asset,
    AssetApi,
    AssetWithCreators,
    MediaSource,
    MediaSourceApi,
    WorkRelation,
    WorkRelationApi,
    WorkInfo,
    WorkListItem
} from '../types';
import { enrichWikiReferences, WikiReferenceWithUrl } from './wiki-platforms';

// 临时接口用于构建作者数据
interface CreatorWithRoleBuilder {
    creator_index: string;
    creator_name?: string;
    creator_type: 'human' | 'virtual';
    role: string;
    wikis?: WikiRef[];
}

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workindex: string, includeForSearch: boolean = true): Promise<WorkTitleApi[]> {
    // Convert work index to ID
    const workId = await workIndexToId(db, workindex);
    if (!workId) {
        return [];
    }

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
 * Get paginated list of works with all related information
 */
export async function getWorkListWithPagination(
    db: DrizzleDB, 
    page: number, 
    pageSize: number
): Promise<WorkListItem[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }
    
    const offset = (page - 1) * pageSize;
    
    // Get paginated work IDs and Indexes
    const works = await db
        .select({ id: work.id, index: work.index })
        .from(work)
        .limit(pageSize)
        .offset(offset);
    
    if (works.length === 0) {
        return [];
    }
    
    const workIndexs = works.map(w => w.index);
    
    // Get all creators for these works in a single query
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
        .where(inArray(work.index, workIndexs));
    
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
    
    // Get all titles, assets, tags, and categories for each work
    const workListPromises = works.map(async (workItem) => {
        const { id: work_id, index: work_index } = workItem;

        // Get titles
        const titles = await getWorkTitlesApi(db, work_index);
        
        // Get preview assets
        const previewAssets = await db
            .select({
                index: asset.index,
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
                    // For non-preview, we'll need to handle null/false separately
                )
            )
            .limit(1);
        
        // Get tags
        const workTags = await db
            .select({
                index: tag.index,
                name: tag.name,
            })
            .from(tag)
            .innerJoin(workTag, eq(tag.id, workTag.tag_id))
            .innerJoin(work, eq(workTag.work_id, work.id))
            .where(eq(work.index, work_index));
        
        // Get categories
        const workCategories = await db
            .select({
                index: category.index,
                name: category.name,
                parent_id: category.parent_id,
            })
            .from(category)
            .innerJoin(workCategory, eq(category.id, workCategory.category_id))
            .innerJoin(work, eq(workCategory.work_id, work.id))
            .where(eq(work.index, work_index));

        // Convert to CategoryApi format
        const categoriesApi = await Promise.all(
            workCategories.map(async (cat) => {
                let parent_index: string | null = null;
                if (cat.parent_id !== null) {
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
        
        return {
            work_id,
            work_index,
            titles,
            preview_asset: previewAssets[0] ? convertAssetData(previewAssets[0]) : undefined,
            non_preview_asset: nonPreviewAssets[0] ? convertAssetData(nonPreviewAssets[0]) : undefined,
            creator: creatorMap.get(work_index) || [],
            tags: workTags,
            categories: categoriesApi,
        };
    });
    
    return await Promise.all(workListPromises);
}

/**
 * Get total count of works
 */
export async function getTotalWorkCount(db: DrizzleDB): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(work);
    
    return result[0]?.count || 0;
}

/**
 * Get detailed information for a single work by index 
 */
export async function getWorkByIndex(db: DrizzleDB, workindex: string): Promise<WorkInfo | null> {
    if (!validateIndex(workindex)) {
        return null;
    }

    // 1. Get work basic information
    const works = await db
        .select({
            index: work.index,
            copyright_basis: work.copyright_basis,
        })
        .from(work)
        .where(eq(work.index, workindex))
        .limit(1);

    if (works.length === 0) {
        return null;
    }

    const workData = works[0];

    // 2. Get work titles (use the actual index from database, not the parameter)
    const titles = await getWorkTitlesApi(db, workData.index, true);
    // 3. Get license information if needed
    let license: string | undefined;
    if (workData.copyright_basis === 'license') {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (workId) {
            const licenseData = await db
                .select({ license_type: workLicense.license_type })
                .from(workLicense)
                .where(eq(workLicense.work_id, workId))
                .limit(1);

            license = licenseData[0]?.license_type;
        }
    }

    // 4. Get media sources
    const mediaSources = await db
        .select({
            index: mediaSource.index,
            work_index: work.index,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .innerJoin(work, eq(mediaSource.work_id, work.id))
        .where(eq(work.index, workindex));

    // 5. Get assets with their creators
    const assets = await db
        .select({
            index: asset.index,
            file_id: asset.file_id,
            work_index: work.index,
            asset_type: asset.asset_type,
            file_name: asset.file_name,
            is_previewpic: asset.is_previewpic,
            language: asset.language,
            creator_index: creator.index,
            creator_name: creator.name,
            creator_type: creator.type,
            creator_role: assetCreator.role,
        })
        .from(asset)
        .innerJoin(work, eq(asset.work_id, work.id))
        .leftJoin(assetCreator, eq(asset.id, assetCreator.asset_id))
        .leftJoin(creator, eq(assetCreator.creator_id, creator.id))
        .where(eq(work.index, workindex));

    // Group assets with their creators
    const assetMap = new Map<string, AssetWithCreators>();
    assets.forEach(row => {
        if (!assetMap.has(row.index)) {
            assetMap.set(row.index, {
                index: row.index,
                work_index: row.work_index,
                asset_type: row.asset_type,
                file_name: row.file_name,
                is_previewpic: row.is_previewpic || undefined,
                language: row.language || undefined,
                creator: []
            });
        }

        if (row.creator_index) {
            assetMap.get(row.index)!.creator.push({
                creator_index: row.creator_index,
                creator_name: row.creator_name ?? undefined,
                creator_type: row.creator_type!,
                role: row.creator_role!
            });
        }
    });

    const assetList = Array.from(assetMap.values());

    // 6. Get work creators with their wiki information
    const creators = await db
        .select({
            creator_index: creator.index,
            creator_name: creator.name,
            creator_type: creator.type,
            role: workCreator.role,
            wiki_platform: creatorWiki.platform,
            wiki_identifier: creatorWiki.identifier,
        })
        .from(workCreator)
        .innerJoin(work, eq(workCreator.work_id, work.id))
        .innerJoin(creator, eq(workCreator.creator_id, creator.id))
        .leftJoin(creatorWiki, eq(creator.id, creatorWiki.creator_id))
        .where(eq(work.index, workindex));

    // Group creators with their wikis
    const creatorBuilderMap = new Map<string, CreatorWithRoleBuilder>();
    creators.forEach(row => {
        const key = `${row.creator_index}-${row.role}`;
        if (!creatorBuilderMap.has(key)) {
            creatorBuilderMap.set(key, {
                creator_index: row.creator_index,
                creator_name: row.creator_name,
                creator_type: row.creator_type,
                role: row.role,
                wikis: []
            });
        }

        if (row.wiki_platform && row.wiki_identifier) {
            creatorBuilderMap.get(key)!.wikis!.push({
                platform: row.wiki_platform,
                identifier: row.wiki_identifier
            });
        }
    });

    // Convert to final CreatorWithRole list and enrich wiki references
    const creatorList: CreatorWithRole[] = [];
    for (const builderCreator of creatorBuilderMap.values()) {
        const creator: CreatorWithRole = {
            creator_index: builderCreator.creator_index,
            creator_name: builderCreator.creator_name,
            creator_type: builderCreator.creator_type,
            role: builderCreator.role,
            wikis: []
        };

        if (builderCreator.wikis && builderCreator.wikis.length > 0) {
            creator.wikis = await enrichWikiReferences(db, builderCreator.wikis);
        }

        creatorList.push(creator);
    }

    // 7. Get work relations with related work titles
    // Convert work index to ID for database queries
    const currentWorkId = await workIndexToId(db, workindex);
    if (!currentWorkId) {
        return null; // Work not found
    }

    const relations = await db
        .select({
            index: workRelation.index,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .where(or(
            eq(workRelation.from_work_id, currentWorkId),
            eq(workRelation.to_work_id, currentWorkId)
        ));

    // Get titles for related works
    const relationList: WorkRelationApi[] = [];
    for (const relation of relations) {
        // Convert work IDs to UUIDs for getWorkTitles calls
        const fromWorkindex = await workIdToIndex(db, relation.from_work_id);
        const toWorkindex = await workIdToIndex(db, relation.to_work_id);

        if (!fromWorkindex || !toWorkindex) continue; // Skip if conversion fails

        const fromTitles = await getWorkTitlesApi(db, fromWorkindex);
        const toTitles = await getWorkTitlesApi(db, toWorkindex);

        relationList.push({
            index: relation.index,
            from_work_index: fromWorkindex,
            to_work_index: toWorkindex,
            relation_type: relation.relation_type,
            related_work_titles: {
                from_work_titles: fromTitles,
                to_work_titles: toTitles
            }
        });
    }

    // Also get works that reference this work as original
    const originalRelations = await db
        .select({
            index: workRelation.index,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .where(and(
            eq(workRelation.to_work_id, currentWorkId),
            eq(workRelation.relation_type, 'original')
        ));

    for (const relation of originalRelations) {
        // Convert work IDs to UUIDs for getWorkTitles calls
        const fromWorkindex = await workIdToIndex(db, relation.from_work_id);
        const toWorkindex = await workIdToIndex(db, relation.to_work_id);

        if (!fromWorkindex || !toWorkindex) continue; // Skip if conversion fails

        const fromTitles = await getWorkTitlesApi(db, fromWorkindex);
        const toTitles = await getWorkTitlesApi(db, toWorkindex);

        // Avoid duplicates
        if (!relationList.find(r => r.index === relation.index)) {
            relationList.push({
                index: relation.index,
                from_work_index: fromWorkindex,
                to_work_index: toWorkindex,
                relation_type: relation.relation_type,
                related_work_titles: {
                    from_work_titles: fromTitles,
                    to_work_titles: toTitles
                }
            });
        }
    }

    // 8. Get work wiki references
    const wikiRefs = await db
        .select({
            platform: workWiki.platform,
            identifier: workWiki.identifier,
        })
        .from(workWiki)
        .innerJoin(work, eq(workWiki.work_id, work.id))
        .where(eq(work.index, workindex));

    // Enrich wiki references with complete URL information
    const wikis = await enrichWikiReferences(db, wikiRefs);

    // 9. Get work tags
    const workTags = await db
        .select({
            index: tag.index,
            name: tag.name,
        })
        .from(tag)
        .innerJoin(workTag, eq(tag.id, workTag.tag_id))
        .innerJoin(work, eq(workTag.work_id, work.id))
        .where(eq(work.index, workindex));

    // 10. Get work categories
    const workCategories = await db
        .select({
            index: category.index,
            name: category.name,
            parent_id: category.parent_id,
        })
        .from(category)
        .innerJoin(workCategory, eq(category.id, workCategory.category_id))
        .innerJoin(work, eq(workCategory.work_id, work.id))
        .where(eq(work.index, workindex));

    // Convert to CategoryApi format
    const categoriesApi = await Promise.all(
        workCategories.map(async (cat) => {
            let parent_index: string | null = null;
            if (cat.parent_id !== null) {
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

    // 11. Assemble complete information
    return {
        work: {
            index: workData.index,
            copyright_basis: workData.copyright_basis
        } as Work,
        titles,
        license,
        media_sources: mediaSources,
        asset: assetList,
        creator: creatorList,
        relation: relationList,
        wikis,
        tags: workTags,
        categories: categoriesApi
    };
}

/**
 * Create a new work with all related data
 */
export async function inputWork(
    db: DrizzleDB,
    workData: Work,
    titles: WorkTitle[],
    license: string | null,
    creators: CreatorWithRole[],
    wikis?: WikiRef[]
): Promise<void> {
    // For D1 compatibility, execute operations sequentially without transactions
    // Insert work
    await db.insert(work).values({
        index: workData.index,
        copyright_basis: workData.copyright_basis,
    });

    // Get work ID for foreign key operations
    const workId = await workIndexToId(db, workData.index);
    if (!workId) {
        throw new Error(`Failed to find work after insert: ${workData.index}`);
    }

    // Insert titles
    if (titles.length > 0) {
        await db.insert(workTitle).values(
            titles.map(title => ({
                index: generateIndex(),
                work_id: workId,
                is_official: title.is_official,
                is_for_search: title.is_for_search || false,
                language: title.language,
                title: title.title,
            }))
        );
    }
    
    // Insert license if needed
    if (license && workData.copyright_basis === 'license') {
        await db.insert(workLicense).values({
            work_id: workId,
            license_type: license,
        });
    }

    // Insert work-creator relationships
    if (creators.length > 0) {
        const creatorInserts = [];
        for (const creator of creators) {
            const creatorId = await creatorIndexToId(db, creator.creator_index);
            if (!creatorId) {
                throw new Error(`Creator not found: ${creator.creator_index}`);
            }
            creatorInserts.push({
                work_id: workId,
                creator_id: creatorId,
                role: creator.role,
            });
        }
        await db.insert(workCreator).values(creatorInserts);
    }
    
    // Insert wiki references
    if (wikis && wikis.length > 0) {
        await db.insert(workWiki).values(
            wikis.map(wiki => ({
                work_id: workId,
                platform: wiki.platform,
                identifier: wiki.identifier,
            }))
        );
    }
}

/**
 * Update an existing work and all its related data
 *
 * 部分更新语义：
 * - titles 为 undefined：不修改现有标题
 * - titles 为空数组：清空所有标题
 * - titles 为非空数组：替换为新标题
 *
 * creators 和 wikis 同理
 */
export async function updateWork(
    db: DrizzleDB,
    workindex: string,
    workData: Work,
    titles?: WorkTitle[],
    license?: string | null,
    creators?: CreatorWithRole[],
    wikis?: WikiRef[]
): Promise<boolean> {
    if (!validateIndex(workindex)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Get work ID for foreign key operations
        const workId = await workIndexToId(db, workindex);
        if (!workId) {
            throw new Error(`Work not found: ${workindex}`);
        }

        // Check if index is being changed
        const newIndex = workData.index;
        if (newIndex && newIndex !== workindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingWork = await db
                .select({ id: work.id })
                .from(work)
                .where(eq(work.index, newIndex))
                .limit(1);

            if (existingWork.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update work with new index and copyright_basis
            await db
                .update(work)
                .set({
                    index: newIndex,
                    copyright_basis: workData.copyright_basis
                })
                .where(eq(work.index, workindex));
        } else {
            // Update work without changing index
            await db
                .update(work)
                .set({ copyright_basis: workData.copyright_basis })
                .where(eq(work.index, workindex));
        }

        // Delete and re-insert titles (only if titles parameter is provided)
        if (titles !== undefined) {
            await db.delete(workTitle).where(eq(workTitle.work_id, workId));
            if (titles.length > 0) {
                await db.insert(workTitle).values(
                    titles.map(title => ({
                        index: generateIndex(),
                        work_id: workId,
                        is_official: title.is_official,
                        is_for_search: title.is_for_search || false,
                        language: title.language,
                        title: title.title,
                    }))
                );
            }
        }

        // Handle license (only if license parameter is provided)
        if (license !== undefined) {
            await db.delete(workLicense).where(eq(workLicense.work_id, workId));
            if (license && workData.copyright_basis === 'license') {
                await db.insert(workLicense).values({
                    work_id: workId,
                    license_type: license,
                });
            }
        }

        // Handle creators (only if creators parameter is provided)
        if (creators !== undefined) {
            await db.delete(workCreator).where(eq(workCreator.work_id, workId));
            if (creators.length > 0) {
                const creatorInserts = [];
                for (const creator of creators) {
                    const creatorId = await creatorIndexToId(db, creator.creator_index);
                    if (!creatorId) {
                        throw new Error(`Creator not found: ${creator.creator_index}`);
                    }
                    creatorInserts.push({
                        work_id: workId,
                        creator_id: creatorId,
                        role: creator.role,
                    });
                }
                await db.insert(workCreator).values(creatorInserts);
            }
        }

        // Handle wikis (only if wikis parameter is provided)
        if (wikis !== undefined) {
            await db.delete(workWiki).where(eq(workWiki.work_id, workId));
            if (wikis.length > 0) {
                await db.insert(workWiki).values(
                    wikis.map(wiki => ({
                        work_id: workId,
                        platform: wiki.platform,
                        identifier: wiki.identifier,
                    }))
                );
            }
        }

        return true;
    } catch (error) {
        console.error('Error updating work:', error);
        return false;
    }
}

/**
 * Delete a work and all its related data
 */
export async function deleteWork(db: DrizzleDB, workindex: string): Promise<boolean> {
    if (!validateIndex(workindex)) return false;
    
    try {
        // Check if work exists
        const existingWork = await db
            .select({ index: work.index })
            .from(work)
            .where(eq(work.index, workindex))
            .limit(1);
        
        if (existingWork.length === 0) return false;
        
        // Delete work (cascade will handle related tables)
        const result = await db.delete(work).where(eq(work.index, workindex));
        return true;
    } catch (error) {
        console.error('Error deleting work:', error);
        return false;
    }
}

/**
 * List assets with pagination
 */
export async function listAssets(db: DrizzleDB, page: number, pageSize: number): Promise<AssetApi[]> {
    if (page < 1 || pageSize < 1) return [];

    const offset = (page - 1) * pageSize;

    const assets = await db
        .select({
            index: asset.index,
            work_index: work.index,
            asset_type: asset.asset_type,
            file_name: asset.file_name,
            is_previewpic: asset.is_previewpic,
            language: asset.language,
        })
        .from(asset)
        .innerJoin(work, eq(asset.work_id, work.id))
        .limit(pageSize)
        .offset(offset);

    return assets.map(convertAssetData);
}

/**
 * Create a new asset with creators
 */
export async function inputAsset(
    db: DrizzleDB,
    assetData: AssetApi,
    creators: CreatorWithRole[]
): Promise<boolean> {
    if (!validateIndex(assetData.index) || !validateIndex(assetData.work_index)) {
        return false;
    }

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Convert work index to ID
        const workId = await workIndexToId(db, assetData.work_index);
        if (!workId) {
            throw new Error(`Work not found: ${assetData.work_index}`);
        }

        // Insert asset
        await db.insert(asset).values({
            index: assetData.index,
            work_id: workId,
            asset_type: assetData.asset_type,
            file_name: assetData.file_name,
            is_previewpic: assetData.is_previewpic || null,
            language: assetData.language || null,
        });

        // Insert asset creators
        if (creators.length > 0) {
            // Get asset ID for foreign key operations
            const assetId = await assetIndexToId(db, assetData.index);
            if (!assetId) {
                throw new Error(`Asset not found after insert: ${assetData.index}`);
            }

            const creatorInserts = [];
            for (const creator of creators) {
                const creatorId = await creatorIndexToId(db, creator.creator_index);
                if (!creatorId) {
                    throw new Error(`Creator not found: ${creator.creator_index}`);
                }
                creatorInserts.push({
                    asset_id: assetId,
                    creator_id: creatorId,
                    role: creator.role,
                });
            }
            await db.insert(assetCreator).values(creatorInserts);
        }
        return true;
    } catch (error) {
        console.error('Error creating asset:', error);
        return false;
    }
}

/**
 * Update an existing asset
 */
export async function updateAsset(
    db: DrizzleDB,
    assetIndex: string,
    assetData: AssetApi,
    creators?: CreatorWithRole[]
): Promise<boolean> {
    if (!validateIndex(assetIndex)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Convert work index to ID
        const workId = await workIndexToId(db, assetData.work_index);
        if (!workId) {
            throw new Error(`Work not found: ${assetData.work_index}`);
        }

        // Update asset
        await db
            .update(asset)
            .set({
                work_id: workId,
                asset_type: assetData.asset_type,
                file_name: assetData.file_name,
                is_previewpic: assetData.is_previewpic || null,
                language: assetData.language || null,
            })
            .where(eq(asset.index, assetIndex));

        // Handle creators
        if (creators) {
            // Get asset ID for foreign key operations
            const assetId = await assetIndexToId(db, assetIndex);
            if (!assetId) {
                throw new Error(`Asset not found: ${assetIndex}`);
            }

            await db.delete(assetCreator).where(eq(assetCreator.asset_id, assetId));
            if (creators.length > 0) {
                const creatorInserts = [];
                for (const creator of creators) {
                    const creatorId = await creatorIndexToId(db, creator.creator_index);
                    if (!creatorId) {
                        throw new Error(`Creator not found: ${creator.creator_index}`);
                    }
                    creatorInserts.push({
                        asset_id: assetId,
                        creator_id: creatorId,
                        role: creator.role,
                    });
                }
                await db.insert(assetCreator).values(creatorInserts);
            }
        }
        return true;
    } catch (error) {
        console.error('Error updating asset:', error);
        return false;
    }
}

/**
 * Delete an asset
 */
export async function deleteAsset(db: DrizzleDB, assetIndex: string): Promise<boolean> {
    if (!validateIndex(assetIndex)) return false;

    try {
        await db.delete(asset).where(eq(asset.index, assetIndex));
        return true;
    } catch (error) {
        console.error('Error deleting asset:', error);
        return false;
    }
}

/**
 * List work relations with pagination
 */
export async function listRelations(db: DrizzleDB, page: number, pageSize: number): Promise<WorkRelationApi[]> {
    if (page < 1 || pageSize < 1) return [];

    const offset = (page - 1) * pageSize;

    const relations = await db
        .select({
            index: workRelation.index,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .limit(pageSize)
        .offset(offset);

    // Convert work IDs to UUIDs for API compatibility
    const relationList: WorkRelationApi[] = [];
    for (const relation of relations) {
        const fromWorkindex = await workIdToIndex(db, relation.from_work_id);
        const toWorkindex = await workIdToIndex(db, relation.to_work_id);

        if (fromWorkindex && toWorkindex) {
            relationList.push({
                index: relation.index,
                from_work_index: fromWorkindex,
                to_work_index: toWorkindex,
                relation_type: relation.relation_type,
            });
        }
    }

    return relationList;
}