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
import { convertAssetData, convertCategoryData, validateUUID } from '../utils';
import {
    workUuidToId,
    creatorUuidToId,
    assetUuidToId,
    workIdToUuid,
    creatorIdToUuid
} from '../utils/uuid-id-converter';
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
    creator_uuid: string;
    creator_name?: string;
    creator_type: 'human' | 'virtual';
    role: string;
    wikis?: WikiRef[];
}

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workUUID: string, includeForSearch: boolean = true): Promise<WorkTitleApi[]> {
    // Convert work UUID to ID
    const workId = await workUuidToId(db, workUUID);
    if (!workId) {
        return [];
    }

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
    
    // Get paginated work UUIDs
    const works = await db
        .select({ uuid: work.uuid })
        .from(work)
        .limit(pageSize)
        .offset(offset);
    
    if (works.length === 0) {
        return [];
    }
    
    const workUUIDs = works.map(w => w.uuid);
    
    // Get all creators for these works in a single query
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
        .where(inArray(work.uuid, workUUIDs));
    
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
    
    // Get all titles, assets, tags, and categories for each work
    const workListPromises = works.map(async (workItem) => {
        const { uuid: work_uuid } = workItem;
        
        // Get titles
        const titles = await getWorkTitlesApi(db, work_uuid);
        
        // Get preview assets
        const previewAssets = await db
            .select({
                uuid: asset.uuid,
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
                    // For non-preview, we'll need to handle null/false separately
                )
            )
            .limit(1);
        
        // Get tags
        const workTags = await db
            .select({
                uuid: tag.uuid,
                name: tag.name,
            })
            .from(tag)
            .innerJoin(workTag, eq(tag.id, workTag.tag_id))
            .innerJoin(work, eq(workTag.work_id, work.id))
            .where(eq(work.uuid, work_uuid));
        
        // Get categories
        const workCategories = await db
            .select({
                uuid: category.uuid,
                name: category.name,
                parent_id: category.parent_id,
            })
            .from(category)
            .innerJoin(workCategory, eq(category.id, workCategory.category_id))
            .innerJoin(work, eq(workCategory.work_id, work.id))
            .where(eq(work.uuid, work_uuid));

        // Convert to CategoryApi format
        const categoriesApi = await Promise.all(
            workCategories.map(async (cat) => {
                let parent_uuid: string | null = null;
                if (cat.parent_id !== null) {
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
        
        return {
            work_uuid,
            titles,
            preview_asset: previewAssets[0] ? convertAssetData(previewAssets[0]) : undefined,
            non_preview_asset: nonPreviewAssets[0] ? convertAssetData(nonPreviewAssets[0]) : undefined,
            creator: creatorMap.get(work_uuid) || [],
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
 * Get detailed information for a single work by UUID
 */
export async function getWorkByUUID(db: DrizzleDB, workUUID: string): Promise<WorkInfo | null> {
    if (!validateUUID(workUUID)) {
        return null;
    }

    // 1. Get work basic information
    const works = await db
        .select({
            uuid: work.uuid,
            copyright_basis: work.copyright_basis,
        })
        .from(work)
        .where(eq(work.uuid, workUUID))
        .limit(1);

    if (works.length === 0) {
        return null;
    }

    const workData = works[0];

    // 2. Get work titles
    const titles = await getWorkTitlesApi(db, workUUID, true);
    // 3. Get license information if needed
    let license: string | undefined;
    if (workData.copyright_basis === 'license') {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUUID);
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
            uuid: mediaSource.uuid,
            work_uuid: work.uuid,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .innerJoin(work, eq(mediaSource.work_id, work.id))
        .where(eq(work.uuid, workUUID));

    // 5. Get assets with their creators
    const assets = await db
        .select({
            uuid: asset.uuid,
            file_id: asset.file_id,
            work_uuid: work.uuid,
            asset_type: asset.asset_type,
            file_name: asset.file_name,
            is_previewpic: asset.is_previewpic,
            language: asset.language,
            creator_uuid: creator.uuid,
            creator_name: creator.name,
            creator_type: creator.type,
            creator_role: assetCreator.role,
        })
        .from(asset)
        .innerJoin(work, eq(asset.work_id, work.id))
        .leftJoin(assetCreator, eq(asset.id, assetCreator.asset_id))
        .leftJoin(creator, eq(assetCreator.creator_id, creator.id))
        .where(eq(work.uuid, workUUID));

    // Group assets with their creators
    const assetMap = new Map<string, AssetWithCreators>();
    assets.forEach(row => {
        if (!assetMap.has(row.uuid)) {
            assetMap.set(row.uuid, {
                uuid: row.uuid,
                work_uuid: row.work_uuid,
                asset_type: row.asset_type,
                file_name: row.file_name,
                is_previewpic: row.is_previewpic || undefined,
                language: row.language || undefined,
                creator: []
            });
        }

        if (row.creator_uuid) {
            assetMap.get(row.uuid)!.creator.push({
                creator_uuid: row.creator_uuid,
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
            creator_uuid: creator.uuid,
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
        .where(eq(work.uuid, workUUID));

    // Group creators with their wikis
    const creatorBuilderMap = new Map<string, CreatorWithRoleBuilder>();
    creators.forEach(row => {
        const key = `${row.creator_uuid}-${row.role}`;
        if (!creatorBuilderMap.has(key)) {
            creatorBuilderMap.set(key, {
                creator_uuid: row.creator_uuid,
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
            creator_uuid: builderCreator.creator_uuid,
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
    // Convert work UUID to ID for database queries
    const currentWorkId = await workUuidToId(db, workUUID);
    if (!currentWorkId) {
        return null; // Work not found
    }

    const relations = await db
        .select({
            uuid: workRelation.uuid,
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
        const fromWorkUuid = await workIdToUuid(db, relation.from_work_id);
        const toWorkUuid = await workIdToUuid(db, relation.to_work_id);

        if (!fromWorkUuid || !toWorkUuid) continue; // Skip if conversion fails

        const fromTitles = await getWorkTitlesApi(db, fromWorkUuid);
        const toTitles = await getWorkTitlesApi(db, toWorkUuid);

        relationList.push({
            uuid: relation.uuid,
            from_work_uuid: fromWorkUuid,
            to_work_uuid: toWorkUuid,
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
            uuid: workRelation.uuid,
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
        const fromWorkUuid = await workIdToUuid(db, relation.from_work_id);
        const toWorkUuid = await workIdToUuid(db, relation.to_work_id);

        if (!fromWorkUuid || !toWorkUuid) continue; // Skip if conversion fails

        const fromTitles = await getWorkTitlesApi(db, fromWorkUuid);
        const toTitles = await getWorkTitlesApi(db, toWorkUuid);

        // Avoid duplicates
        if (!relationList.find(r => r.uuid === relation.uuid)) {
            relationList.push({
                uuid: relation.uuid,
                from_work_uuid: fromWorkUuid,
                to_work_uuid: toWorkUuid,
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
        .where(eq(work.uuid, workUUID));

    // Enrich wiki references with complete URL information
    const wikis = await enrichWikiReferences(db, wikiRefs);

    // 9. Get work tags
    const workTags = await db
        .select({
            uuid: tag.uuid,
            name: tag.name,
        })
        .from(tag)
        .innerJoin(workTag, eq(tag.id, workTag.tag_id))
        .innerJoin(work, eq(workTag.work_id, work.id))
        .where(eq(work.uuid, workUUID));

    // 10. Get work categories
    const workCategories = await db
        .select({
            uuid: category.uuid,
            name: category.name,
            parent_id: category.parent_id,
        })
        .from(category)
        .innerJoin(workCategory, eq(category.id, workCategory.category_id))
        .innerJoin(work, eq(workCategory.work_id, work.id))
        .where(eq(work.uuid, workUUID));

    // Convert to CategoryApi format
    const categoriesApi = await Promise.all(
        workCategories.map(async (cat) => {
            let parent_uuid: string | null = null;
            if (cat.parent_id !== null) {
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

    // 11. Assemble complete information
    return {
        work: {
            uuid: workData.uuid,
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
        uuid: workData.uuid,
        copyright_basis: workData.copyright_basis,
    });

    // Get work ID for foreign key operations
    const workId = await workUuidToId(db, workData.uuid);
    if (!workId) {
        throw new Error(`Failed to find work after insert: ${workData.uuid}`);
    }

    // Insert titles
    if (titles.length > 0) {
        await db.insert(workTitle).values(
            titles.map(title => ({
                uuid: crypto.randomUUID(),
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
            const creatorId = await creatorUuidToId(db, creator.creator_uuid);
            if (!creatorId) {
                throw new Error(`Creator not found: ${creator.creator_uuid}`);
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
 */
export async function updateWork(
    db: DrizzleDB,
    workUuid: string,
    workData: Work,
    titles?: WorkTitle[],
    license?: string | null | undefined,
    creators?: CreatorWithRole[],
    wikis?: WikiRef[]
): Promise<boolean> {
    if (!validateUUID(workUuid)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Get work ID for foreign key operations
        const workId = await workUuidToId(db, workUuid);
        if (!workId) {
            throw new Error(`Work not found: ${workUuid}`);
        }

        // Update work
        await db
            .update(work)
            .set({ copyright_basis: workData.copyright_basis })
            .where(eq(work.uuid, workUuid));

        // Handle titles - only modify if provided
        if (titles !== undefined) {
            await db.delete(workTitle).where(eq(workTitle.work_id, workId));
            if (titles.length > 0) {
                await db.insert(workTitle).values(
                    titles.map(title => ({
                        uuid: crypto.randomUUID(),
                        work_id: workId,
                        is_official: title.is_official,
                        is_for_search: title.is_for_search || false,
                        language: title.language,
                        title: title.title,
                    }))
                );
            }
        }
        
        // Handle license
        await db.delete(workLicense).where(eq(workLicense.work_id, workId));
        if (license && workData.copyright_basis === 'license') {
            await db.insert(workLicense).values({
                work_id: workId,
                license_type: license,
            });
        }

        // Handle creators
        if (creators) {
            await db.delete(workCreator).where(eq(workCreator.work_id, workId));
            if (creators.length > 0) {
                const creatorInserts = [];
                for (const creator of creators) {
                    const creatorId = await creatorUuidToId(db, creator.creator_uuid);
                    if (!creatorId) {
                        throw new Error(`Creator not found: ${creator.creator_uuid}`);
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
        
        // Handle wikis
        await db.delete(workWiki).where(eq(workWiki.work_id, workId));
        if (wikis && wikis.length > 0) {
            await db.insert(workWiki).values(
                wikis.map(wiki => ({
                    work_id: workId,
                    platform: wiki.platform,
                    identifier: wiki.identifier,
                }))
            );
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
export async function deleteWork(db: DrizzleDB, workUuid: string): Promise<boolean> {
    if (!validateUUID(workUuid)) return false;
    
    try {
        // Check if work exists
        const existingWork = await db
            .select({ uuid: work.uuid })
            .from(work)
            .where(eq(work.uuid, workUuid))
            .limit(1);
        
        if (existingWork.length === 0) return false;
        
        // Delete work (cascade will handle related tables)
        const result = await db.delete(work).where(eq(work.uuid, workUuid));
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
            uuid: asset.uuid,
            work_uuid: work.uuid,
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
    if (!validateUUID(assetData.uuid) || !validateUUID(assetData.work_uuid)) {
        return false;
    }

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Convert work UUID to ID
        const workId = await workUuidToId(db, assetData.work_uuid);
        if (!workId) {
            throw new Error(`Work not found: ${assetData.work_uuid}`);
        }

        // Insert asset
        await db.insert(asset).values({
            uuid: assetData.uuid,
            work_id: workId,
            asset_type: assetData.asset_type,
            file_name: assetData.file_name,
            is_previewpic: assetData.is_previewpic || null,
            language: assetData.language || null,
        });

        // Insert asset creators
        if (creators.length > 0) {
            // Get asset ID for foreign key operations
            const assetId = await assetUuidToId(db, assetData.uuid);
            if (!assetId) {
                throw new Error(`Asset not found after insert: ${assetData.uuid}`);
            }

            const creatorInserts = [];
            for (const creator of creators) {
                const creatorId = await creatorUuidToId(db, creator.creator_uuid);
                if (!creatorId) {
                    throw new Error(`Creator not found: ${creator.creator_uuid}`);
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
    assetUuid: string,
    assetData: AssetApi,
    creators?: CreatorWithRole[]
): Promise<boolean> {
    if (!validateUUID(assetUuid)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Convert work UUID to ID
        const workId = await workUuidToId(db, assetData.work_uuid);
        if (!workId) {
            throw new Error(`Work not found: ${assetData.work_uuid}`);
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
            .where(eq(asset.uuid, assetUuid));

        // Handle creators
        if (creators) {
            // Get asset ID for foreign key operations
            const assetId = await assetUuidToId(db, assetUuid);
            if (!assetId) {
                throw new Error(`Asset not found: ${assetUuid}`);
            }

            await db.delete(assetCreator).where(eq(assetCreator.asset_id, assetId));
            if (creators.length > 0) {
                const creatorInserts = [];
                for (const creator of creators) {
                    const creatorId = await creatorUuidToId(db, creator.creator_uuid);
                    if (!creatorId) {
                        throw new Error(`Creator not found: ${creator.creator_uuid}`);
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
export async function deleteAsset(db: DrizzleDB, assetUuid: string): Promise<boolean> {
    if (!validateUUID(assetUuid)) return false;

    try {
        await db.delete(asset).where(eq(asset.uuid, assetUuid));
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
            uuid: workRelation.uuid,
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
        const fromWorkUuid = await workIdToUuid(db, relation.from_work_id);
        const toWorkUuid = await workIdToUuid(db, relation.to_work_id);

        if (fromWorkUuid && toWorkUuid) {
            relationList.push({
                uuid: relation.uuid,
                from_work_uuid: fromWorkUuid,
                to_work_uuid: toWorkUuid,
                relation_type: relation.relation_type,
            });
        }
    }

    return relationList;
}