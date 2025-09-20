import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { asset, assetCreator, creator, assetExternalObject, externalObject, externalSource } from '../schema';
import { convertAssetData } from '../utils';
import type { Asset, AssetForApplication, CreatorWithRole, AssetWithCreators, ExternalObject, AssetInput } from '../types';

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

    // Get asset
    const assetResult = await db
        .select({
            uuid: asset.uuid,
            // file_id: asset.file_id, // Removed - use external objects for file info
            work_uuid: asset.work_uuid,
            asset_type: asset.asset_type,
            file_name: asset.file_name,
            is_previewpic: asset.is_previewpic,
            language: asset.language,
        })
        .from(asset)
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
        .innerJoin(creator, eq(assetCreator.creator_uuid, creator.uuid))
        .where(eq(assetCreator.asset_uuid, assetUuid));

    // Get external objects for this asset
    const externalObjects = await db
        .select({
            uuid: externalObject.uuid,
            external_source_uuid: externalObject.external_source_uuid,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
        })
        .from(assetExternalObject)
        .innerJoin(externalObject, eq(assetExternalObject.external_object_uuid, externalObject.uuid))
        .innerJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid))
        .where(eq(assetExternalObject.asset_uuid, assetUuid));

    const externalObjectsWithSource: ExternalObject[] = externalObjects.map(row => ({
        uuid: row.uuid,
        external_source_uuid: row.external_source_uuid,
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
        language: convertedAsset.language || null, // Convert undefined to null for consistency
        is_previewpic: convertedAsset.is_previewpic ?? null, // Convert undefined to null for consistency
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
            uuid: asset.uuid,
            // file_id: asset.file_id, // Removed - use external objects for file info
            work_uuid: asset.work_uuid,
            asset_type: asset.asset_type,
            file_name: asset.file_name,
            is_previewpic: asset.is_previewpic,
            language: asset.language,
        })
        .from(asset)
        .limit(pageSize)
        .offset(offset);

    return assets.map(asset => {
        const converted = convertAssetData(asset);
        return {
            ...converted,
            language: converted.language || null, // Convert undefined to null for consistency
            is_previewpic: converted.is_previewpic ?? null, // Convert undefined to null for consistency
        };
    });
}

/**
 * Create a new asset with creator relationships and optional external objects
 */
export async function inputAsset(
    db: DrizzleDB,
    assetData: AssetInput,
    creators?: CreatorWithRole[],
    externalObjectUuids?: string[]
): Promise<void> {
    // For D1 compatibility, execute operations sequentially without transactions
    // Insert asset
    await db.insert(asset).values({
        uuid: assetData.uuid,
        file_id: assetData.file_id || null, // Made optional - use external objects for file info
        work_uuid: assetData.work_uuid,
        asset_type: assetData.asset_type,
        file_name: assetData.file_name,
        is_previewpic: assetData.is_previewpic || null,
        language: assetData.language || null,
    });

    // Insert asset creators
    if (creators && creators.length > 0) {
        await db.insert(assetCreator).values(
            creators.map(creator => ({
                asset_uuid: assetData.uuid,
                creator_uuid: creator.creator_uuid,
                role: creator.role,
            }))
        );
    }

    // Insert asset-external_object associations
    if (externalObjectUuids && externalObjectUuids.length > 0) {
        await db.insert(assetExternalObject).values(
            externalObjectUuids.map(objectUuid => ({
                asset_uuid: assetData.uuid,
                external_object_uuid: objectUuid,
            }))
        );
    }
}

/**
 * Update an existing asset and creator relationships with optional external objects
 */
export async function updateAsset(
    db: DrizzleDB,
    assetUuid: string,
    assetData: AssetInput,
    creators?: CreatorWithRole[],
    externalObjectUuids?: string[]
): Promise<boolean> {
    if (!validateUUID(assetUuid)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Update asset
        await db
            .update(asset)
            .set({
                file_id: assetData.file_id || null, // Made optional - use external objects for file info
                work_uuid: assetData.work_uuid,
                asset_type: assetData.asset_type,
                file_name: assetData.file_name,
                is_previewpic: assetData.is_previewpic || null,
                language: assetData.language || null,
            })
            .where(eq(asset.uuid, assetUuid));

        // Delete old asset creators
        await db
            .delete(assetCreator)
            .where(eq(assetCreator.asset_uuid, assetUuid));

        // Insert new asset creators
        if (creators && creators.length > 0) {
            await db.insert(assetCreator).values(
                creators.map(creator => ({
                    asset_uuid: assetUuid,
                    creator_uuid: creator.creator_uuid,
                    role: creator.role,
                }))
            );
        }

        // Update asset-external_object associations
        if (externalObjectUuids !== undefined) {
            // Delete old external object associations
            await db
                .delete(assetExternalObject)
                .where(eq(assetExternalObject.asset_uuid, assetUuid));

            // Insert new external object associations
            if (externalObjectUuids.length > 0) {
                await db.insert(assetExternalObject).values(
                    externalObjectUuids.map(objectUuid => ({
                        asset_uuid: assetUuid,
                        external_object_uuid: objectUuid,
                    }))
                );
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