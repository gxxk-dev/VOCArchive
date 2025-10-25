import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { asset, assetCreator, creator, assetExternalObject, externalObject, externalSource, work } from '../schema';
import { convertAssetData, validateIndex } from '../utils';
import { assetIndexToId, workIndexToId, creatorIndexToId, externalObjectIndexToId, externalSourceIndexToId } from '../utils/index-id-converter';
import type { Asset, AssetForApplication, CreatorWithRole, AssetWithCreators, ExternalObject, AssetApiInput } from '../types';

/**
 * Get asset by index with creator information and external objects
 */
export async function getAssetByIndex(
    db: DrizzleDB, 
    assetIndex: string
): Promise<AssetWithCreators | null> {
    if (!validateIndex(assetIndex)) {
        return null;
    }

    // Get asset with work information
    const assetResult = await db
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
        .where(eq(asset.index, assetIndex))
        .limit(1);

    if (assetResult.length === 0) {
        return null;
    }

    // Get asset creators
    const assetCreators = await db
        .select({
            creator_index: creator.index,
            creator_name: creator.name,
            creator_type: creator.type,
            role: assetCreator.role,
        })
        .from(assetCreator)
        .innerJoin(creator, eq(assetCreator.creator_id, creator.id))
        .innerJoin(asset, eq(assetCreator.asset_id, asset.id))
        .where(eq(asset.index, assetIndex));

    // Get external objects for this asset
    const externalObjects = await db
        .select({
            index: externalObject.index,
            external_source_index: externalSource.index,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
        })
        .from(assetExternalObject)
        .innerJoin(externalObject, eq(assetExternalObject.external_object_id, externalObject.id))
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .innerJoin(asset, eq(assetExternalObject.asset_id, asset.id))
        .where(eq(asset.index, assetIndex));

    const externalObjectsWithSource: ExternalObject[] = externalObjects.map(row => ({
        id: 0, // Will be filled with actual ID if needed
        index: row.index,
        external_source_id: 0, // Will be filled with actual ID if needed
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            index: row.external_source_index,
            type: row.source_type,
            name: row.source_name,
            endpoint: row.source_endpoint,
        }
    }));

    const convertedAsset = convertAssetData(assetResult[0]);
    return {
        ...convertedAsset,
        creator: assetCreators,
        external_objects: externalObjectsWithSource,
    };
}

/**
 * Get paginated list of assets
 */
export async function listAssets(
    db: DrizzleDB,
    page: number,
    pageSize: number
): Promise<AssetForApplication[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;

    const assets = await db
        .select({
            id: asset.id,
            index: asset.index,
            work_id: work.id,
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

    return assets.map(asset => {
        const converted = convertAssetData(asset);
        return {
            id: asset.id,
            work_id: asset.work_id,
            work_index: converted.work_index,
            index: converted.index,
            asset_type: converted.asset_type,
            file_name: converted.file_name,
            is_previewpic: converted.is_previewpic,
            language: converted.language,
        };
    });
}

/**
 * Create a new asset with creator relationships and optional external objects
 */
export async function inputAsset(
    db: DrizzleDB,
    assetData: AssetApiInput,
    creators?: CreatorWithRole[],
    externalObjectIndexs?: string[]
): Promise<void> {
    // For D1 compatibility, execute operations sequentially without transactions

    // Convert work index to ID
    const workId = await workIndexToId(db, assetData.work_index);
    if (!workId) {
        throw new Error(`Work not found: ${assetData.work_index}`);
    }

    // Insert asset
    await db.insert(asset).values({
        index: assetData.index,
        file_id: assetData.file_id || null, // Made optional - use external objects for file info
        work_id: workId,
        asset_type: assetData.asset_type,
        file_name: assetData.file_name,
        is_previewpic: assetData.is_previewpic || null,
        language: assetData.language || null,
    });

    // Insert asset creators
    if (creators && creators.length > 0) {
        // Convert UUIDs to IDs
        const assetId = await assetIndexToId(db, assetData.index);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetData.index}`);
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

    // Insert asset-external_object associations
    if (externalObjectIndexs && externalObjectIndexs.length > 0) {
        // Convert UUIDs to IDs
        const assetId = await assetIndexToId(db, assetData.index);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetData.index}`);
        }

        const objectInserts = [];
        for (const objectindex of externalObjectIndexs) {
            const objectId = await externalObjectIndexToId(db, objectindex);
            if (!objectId) {
                throw new Error(`External object not found: ${objectindex}`);
            }
            objectInserts.push({
                asset_id: assetId,
                external_object_id: objectId,
            });
        }

        await db.insert(assetExternalObject).values(objectInserts);
    }
}

/**
 * Update an existing asset and creator relationships with optional external objects
 */
export async function updateAsset(
    db: DrizzleDB,
    assetIndex: string,
    assetData: AssetApiInput,
    creators?: CreatorWithRole[],
    externalObjectIndexs?: string[]
): Promise<boolean> {
    if (!validateIndex(assetIndex)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Convert work index to ID
        const workId = await workIndexToId(db, assetData.work_index);
        if (!workId) {
            throw new Error(`Work not found: ${assetData.work_index}`);
        }

        // Check if index is being changed
        const newIndex = assetData.index;
        if (newIndex && newIndex !== assetIndex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingAsset = await db
                .select({ id: asset.id })
                .from(asset)
                .where(eq(asset.index, newIndex))
                .limit(1);

            if (existingAsset.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update asset with new index and other fields
            await db
                .update(asset)
                .set({
                    index: newIndex,
                    file_id: assetData.file_id || null,
                    work_id: workId,
                    asset_type: assetData.asset_type,
                    file_name: assetData.file_name,
                    is_previewpic: assetData.is_previewpic || null,
                    language: assetData.language || null,
                })
                .where(eq(asset.index, assetIndex));
        } else {
            // Update asset without changing index
            await db
                .update(asset)
                .set({
                    file_id: assetData.file_id || null,
                    work_id: workId,
                    asset_type: assetData.asset_type,
                    file_name: assetData.file_name,
                    is_previewpic: assetData.is_previewpic || null,
                    language: assetData.language || null,
                })
                .where(eq(asset.index, assetIndex));
        }

        // Get asset ID for foreign key operations (use newIndex if changed, otherwise assetIndex)
        const currentIndex = (newIndex && newIndex !== assetIndex) ? newIndex : assetIndex;
        const assetId = await assetIndexToId(db, currentIndex);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetIndex}`);
        }

        // Update asset creators (only if creators parameter is provided)
        if (creators !== undefined) {
            // Delete old asset creators
            await db
                .delete(assetCreator)
                .where(eq(assetCreator.asset_id, assetId));

            // Insert new asset creators
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

        // Update asset-external_object associations (only if externalObjectIndexs parameter is provided)
        if (externalObjectIndexs !== undefined) {
            // Delete old external object associations
            await db
                .delete(assetExternalObject)
                .where(eq(assetExternalObject.asset_id, assetId));

            // Insert new external object associations
            if (externalObjectIndexs.length > 0) {
                const objectInserts = [];
                for (const objectindex of externalObjectIndexs) {
                    const objectId = await externalObjectIndexToId(db, objectindex);
                    if (!objectId) {
                        throw new Error(`External object not found: ${objectindex}`);
                    }
                    objectInserts.push({
                        asset_id: assetId,
                        external_object_id: objectId,
                    });
                }
                await db.insert(assetExternalObject).values(objectInserts);
            }
        }

        return true;
    } catch (error) {
        console.error('Error updating asset:', error);
        return false;
    }
}

/**
 * Delete an asset and all related data
 */
export async function deleteAsset(db: DrizzleDB, assetIndex: string): Promise<boolean> {
    if (!validateIndex(assetIndex)) return false;

    try {
        // Delete asset (cascade will handle related tables)
        await db.delete(asset).where(eq(asset.index, assetIndex));
        
        return true;
    } catch (error) {
        console.error('Error deleting asset:', error);
        return false;
    }
}