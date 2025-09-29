import { eq, like, inArray, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import {
    work,
    workTitle,
    workCreator,
    creator,
    asset
} from '../schema';
import { convertAssetData } from '../utils';
import { workUuidToId } from '../utils/uuid-id-converter';
import { WorkTitleApi, CreatorWithRole, AssetApi, Tag, CategoryApi, WorkListItem } from '../types';

/**
 * Get work titles for API layer (complete with all fields)
 */
async function getWorkTitlesApi(db: DrizzleDB, workUUID: string, includeForSearch: boolean = true): Promise<WorkTitleApi[]> {
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
 * Search works by title
 */
export async function searchWorksByTitle(db: DrizzleDB, query: string): Promise<WorkListItem[]> {
    // Get work UUIDs that match the title search (including ForSearch titles for search)
    const workUuids = await db
        .select({ work_uuid: work.uuid })
        .from(workTitle)
        .innerJoin(work, eq(workTitle.work_id, work.id))
        .where(like(workTitle.title, `%${query}%`));

    if (workUuids.length === 0) {
        return [];
    }

    const workUuidList = workUuids.map(w => w.work_uuid);

    // Get all creators for these works
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
        // Get titles (return all titles, frontend will filter for display)
        const titles = await getWorkTitlesApi(db, work_uuid, true);

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
 * Search works by creator name
 */
export async function searchWorksByCreator(db: DrizzleDB, query: string): Promise<WorkListItem[]> {
    // Get creator UUIDs that match the name search
    const creatorUuids = await db
        .select({ uuid: creator.uuid })
        .from(creator)
        .where(like(creator.name, `%${query}%`));

    if (creatorUuids.length === 0) {
        return [];
    }

    const creatorUuidList = creatorUuids.map(c => c.uuid);

    // Get work UUIDs for these creators
    const workUuids = await db
        .select({ work_uuid: work.uuid })
        .from(workCreator)
        .innerJoin(creator, eq(workCreator.creator_id, creator.id))
        .innerJoin(work, eq(workCreator.work_id, work.id))
        .where(inArray(creator.uuid, creatorUuidList));

    if (workUuids.length === 0) {
        return [];
    }

    const workUuidList = Array.from(new Set(workUuids.map(w => w.work_uuid)));

    // Get all creators for these works
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
        // Get titles (return all titles, frontend will filter for display)
        const titles = await getWorkTitlesApi(db, work_uuid, true);

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
 * Search works (combines title and creator search)
 */
export async function searchWorks(
    db: DrizzleDB,
    query: string,
    searchType: 'title' | 'creator' | 'all' = 'all'
): Promise<WorkListItem[]> {
    if (searchType === 'title') {
        return await searchWorksByTitle(db, query);
    } else if (searchType === 'creator') {
        return await searchWorksByCreator(db, query);
    } else {
        // Search both title and creator, merge results and deduplicate
        const [titleResults, creatorResults] = await Promise.all([
            searchWorksByTitle(db, query),
            searchWorksByCreator(db, query)
        ]);

        // Deduplicate by work_uuid
        const resultMap = new Map<string, WorkListItem>();
        titleResults.forEach(item => resultMap.set(item.work_uuid, item));
        creatorResults.forEach(item => resultMap.set(item.work_uuid, item));

        return Array.from(resultMap.values());
    }
}

/**
 * Get all available languages from work titles (excluding ForSearch titles)
 */
export async function getAvailableLanguages(db: DrizzleDB): Promise<string[]> {
    const languages = await db
        .select({ language: workTitle.language })
        .from(workTitle)
        .where(eq(workTitle.is_for_search, false))
        .groupBy(workTitle.language)
        .orderBy(workTitle.language);

    return languages.map(row => row.language);
}