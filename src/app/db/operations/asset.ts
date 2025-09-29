import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { asset, assetCreator, creator, assetExternalObject, externalObject, externalSource, work } from '../schema';
import { convertAssetData } from '../utils';
import { assetUuidToId, workUuidToId, creatorUuidToId, externalObjectUuidToId, externalSourceUuidToId } from '../utils/uuid-id-converter';
import type { Asset, AssetForApplication, CreatorWithRole, AssetWithCreators, ExternalObject, AssetApiInput } from '../types';

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get asset by UUID with creator information and external objects
 */
export async function getAssetByUUID(
    db: DrizzleDB, 
    assetUuid: string
): Promise<AssetWithCreators | null> {
    if (!validateUUID(assetUuid)) {
        return null;
    }

    // Get asset with work information
    const assetResult = await db
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
        .where(eq(asset.uuid, assetUuid))
        .limit(1);

    if (assetResult.length === 0) {
        return null;
    }

    // Get asset creators
    const assetCreators = await db
        .select({
            creator_uuid: creator.uuid,
            creator_name: creator.name,
            creator_type: creator.type,
            role: assetCreator.role,
        })
        .from(assetCreator)
        .innerJoin(creator, eq(assetCreator.creator_id, creator.id))
        .innerJoin(asset, eq(assetCreator.asset_id, asset.id))
        .where(eq(asset.uuid, assetUuid));

    // Get external objects for this asset
    const externalObjects = await db
        .select({
            uuid: externalObject.uuid,
            external_source_uuid: externalSource.uuid,
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
        .where(eq(asset.uuid, assetUuid));

    const externalObjectsWithSource: ExternalObject[] = externalObjects.map(row => ({
        id: 0, // Will be filled with actual ID if needed
        uuid: row.uuid,
        external_source_id: 0, // Will be filled with actual ID if needed
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            uuid: row.external_source_uuid,
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
            uuid: asset.uuid,
            work_id: work.id,
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

    return assets.map(asset => {
        const converted = convertAssetData(asset);
        return {
            id: asset.id,
            work_id: asset.work_id,
            work_uuid: converted.work_uuid,
            uuid: converted.uuid,
            asset_type: converted.asset_type,
            file_name: converted.file_name,
            language: converted.language,
            is_previewpic: converted.is_previewpic,
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
    externalObjectUuids?: string[]
): Promise<void> {
    // For D1 compatibility, execute operations sequentially without transactions

    // Convert work UUID to ID
    const workId = await workUuidToId(db, assetData.work_uuid);
    if (!workId) {
        throw new Error(`Work not found: ${assetData.work_uuid}`);
    }

    // Insert asset
    await db.insert(asset).values({
        uuid: assetData.uuid,
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
        const assetId = await assetUuidToId(db, assetData.uuid);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetData.uuid}`);
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

    // Insert asset-external_object associations
    if (externalObjectUuids && externalObjectUuids.length > 0) {
        // Convert UUIDs to IDs
        const assetId = await assetUuidToId(db, assetData.uuid);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetData.uuid}`);
        }

        const objectInserts = [];
        for (const objectUuid of externalObjectUuids) {
            const objectId = await externalObjectUuidToId(db, objectUuid);
            if (!objectId) {
                throw new Error(`External object not found: ${objectUuid}`);
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
    assetUuid: string,
    assetData: AssetApiInput,
    creators?: CreatorWithRole[],
    externalObjectUuids?: string[]
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
                file_id: assetData.file_id || null, // Made optional - use external objects for file info
                work_id: workId,
                asset_type: assetData.asset_type,
                file_name: assetData.file_name,
                is_previewpic: assetData.is_previewpic || null,
                language: assetData.language || null,
            })
            .where(eq(asset.uuid, assetUuid));

        // Get asset ID for foreign key operations
        const assetId = await assetUuidToId(db, assetUuid);
        if (!assetId) {
            throw new Error(`Asset not found: ${assetUuid}`);
        }

        // Delete old asset creators
        await db
            .delete(assetCreator)
            .where(eq(assetCreator.asset_id, assetId));

        // Insert new asset creators
        if (creators && creators.length > 0) {
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

        // Update asset-external_object associations
        if (externalObjectUuids !== undefined) {
            // Delete old external object associations
            await db
                .delete(assetExternalObject)
                .where(eq(assetExternalObject.asset_id, assetId));

            // Insert new external object associations
            if (externalObjectUuids.length > 0) {
                const objectInserts = [];
                for (const objectUuid of externalObjectUuids) {
                    const objectId = await externalObjectUuidToId(db, objectUuid);
                    if (!objectId) {
                        throw new Error(`External object not found: ${objectUuid}`);
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
export async function deleteAsset(db: DrizzleDB, assetUuid: string): Promise<boolean> {
    if (!validateUUID(assetUuid)) return false;

    try {
        // Delete asset (cascade will handle related tables)
        await db.delete(asset).where(eq(asset.uuid, assetUuid));
        
        return true;
    } catch (error) {
        console.error('Error deleting asset:', error);
        return false;
    }
}