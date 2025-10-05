import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { mediaSource, asset, mediaSourceExternalObject, assetExternalObject, externalObject, externalSource, work } from '../schema';
import type { MediaSource, MediaSourceForApplication, MediaSourceWithExternalObjects, ExternalObject, MediaSourceApiInput } from '../types';
import { getExternalObjectByUUID, buildExternalObjectURL, buildExternalObjectURLWithLoadBalancing } from './external_object';
import {
    workUuidToId,
    mediaSourceUuidToId,
    assetUuidToId,
    externalObjectUuidToId
} from '../utils/uuid-id-converter';
import { validateUUID } from '../utils';

/**
 * Get media source by UUID with external objects
 */
export async function getMediaByUUID(
    db: DrizzleDB, 
    mediaUuid: string
): Promise<MediaSourceWithExternalObjects | null> {
    if (!validateUUID(mediaUuid)) {
        return null;
    }

    const mediaResult = await db
        .select({
            id: mediaSource.id,
            uuid: mediaSource.uuid,
            work_id: mediaSource.work_id,
            work_uuid: work.uuid,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .innerJoin(work, eq(mediaSource.work_id, work.id))
        .where(eq(mediaSource.uuid, mediaUuid))
        .limit(1);

    if (mediaResult.length === 0) {
        return null;
    }

    // Get external objects for this media source
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
        .from(mediaSourceExternalObject)
        .innerJoin(externalObject, eq(mediaSourceExternalObject.external_object_id, externalObject.id))
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .innerJoin(mediaSource, eq(mediaSourceExternalObject.media_source_id, mediaSource.id))
        .where(eq(mediaSource.uuid, mediaUuid));

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

    return {
        ...mediaResult[0],
        external_objects: externalObjectsWithSource,
    };
}

/**
 * Get paginated list of media sources
 */
export async function listMedia(
    db: DrizzleDB, 
    page: number, 
    pageSize: number
): Promise<MediaSourceForApplication[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;
    
    const mediaList = await db
        .select({
            id: mediaSource.id,
            uuid: mediaSource.uuid,
            work_id: mediaSource.work_id,
            work_uuid: work.uuid,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .innerJoin(work, eq(mediaSource.work_id, work.id))
        .limit(pageSize)
        .offset(offset);

    return mediaList;
}

/**
 * Create a new media source with optional external objects
 */
export async function inputMedia(
    db: DrizzleDB,
    mediaData: MediaSourceApiInput,
    externalObjectUuids?: string[]
): Promise<void> {
    // Convert work UUID to ID
    const workId = await workUuidToId(db, mediaData.work_uuid);
    if (!workId) {
        throw new Error(`Work not found: ${mediaData.work_uuid}`);
    }

    await db.insert(mediaSource).values({
        uuid: mediaData.uuid,
        work_id: workId,
        is_music: mediaData.is_music,
        file_name: mediaData.file_name,
        url: mediaData.url || null, // Made optional - use external objects for file info
        mime_type: mediaData.mime_type,
        info: mediaData.info,
    });

    // Insert media_source-external_object associations
    if (externalObjectUuids && externalObjectUuids.length > 0) {
        // Get media source ID for foreign key operations
        const mediaId = await mediaSourceUuidToId(db, mediaData.uuid);
        if (!mediaId) {
            throw new Error(`Media source not found after insert: ${mediaData.uuid}`);
        }

        const objectInserts = [];
        for (const objectUuid of externalObjectUuids) {
            const objectId = await externalObjectUuidToId(db, objectUuid);
            if (!objectId) {
                throw new Error(`External object not found: ${objectUuid}`);
            }
            objectInserts.push({
                media_source_id: mediaId,
                external_object_id: objectId,
            });
        }
        await db.insert(mediaSourceExternalObject).values(objectInserts);
    }
}

/**
 * Update an existing media source with optional external objects
 */
export async function updateMedia(
    db: DrizzleDB,
    mediaUuid: string,
    mediaData: MediaSourceApiInput,
    externalObjectUuids?: string[]
): Promise<boolean> {
    if (!validateUUID(mediaUuid)) return false;

    try {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, mediaData.work_uuid);
        if (!workId) {
            throw new Error(`Work not found: ${mediaData.work_uuid}`);
        }

        await db
            .update(mediaSource)
            .set({
                work_id: workId,
                is_music: mediaData.is_music,
                file_name: mediaData.file_name,
                url: mediaData.url || null, // Made optional - use external objects for file info
                mime_type: mediaData.mime_type,
                info: mediaData.info,
            })
            .where(eq(mediaSource.uuid, mediaUuid));

        // Update media_source-external_object associations
        if (externalObjectUuids !== undefined) {
            // Get media source ID for foreign key operations
            const mediaId = await mediaSourceUuidToId(db, mediaUuid);
            if (!mediaId) {
                throw new Error(`Media source not found: ${mediaUuid}`);
            }

            // Delete old external object associations
            await db
                .delete(mediaSourceExternalObject)
                .where(eq(mediaSourceExternalObject.media_source_id, mediaId));

            // Insert new external object associations
            if (externalObjectUuids.length > 0) {
                const objectInserts = [];
                for (const objectUuid of externalObjectUuids) {
                    const objectId = await externalObjectUuidToId(db, objectUuid);
                    if (!objectId) {
                        throw new Error(`External object not found: ${objectUuid}`);
                    }
                    objectInserts.push({
                        media_source_id: mediaId,
                        external_object_id: objectId,
                    });
                }
                await db.insert(mediaSourceExternalObject).values(objectInserts);
            }
        }

        return true;
    } catch (error) {
        console.error('Error updating media:', error);
        return false;
    }
}

/**
 * Delete a media source
 */
export async function deleteMedia(db: DrizzleDB, mediaUuid: string): Promise<boolean> {
    if (!validateUUID(mediaUuid)) return false;

    try {
        const result = await db
            .delete(mediaSource)
            .where(eq(mediaSource.uuid, mediaUuid));

        return true;
    } catch (error) {
        console.error('Error deleting media:', error);
        return false;
    }
}

/**
 * Get file URL by UUID using external storage architecture only
 * This function prioritizes the new external storage system and provides
 * graceful fallbacks without requiring ASSET_URL environment variable
 */
export async function getFileURLByUUIDWithExternalStorage(
    db: DrizzleDB,
    fileUuid: string
): Promise<string | null> {
    if (!validateUUID(fileUuid)) {
        return null;
    }

    try {
        // Priority 1: Check external_object table first (new system)
        const externalObjectResult = await getExternalObjectByUUID(db, fileUuid);
        if (externalObjectResult) {
            // Use load balancing version for better IPFS support
            const url = await buildExternalObjectURLWithLoadBalancing(db, externalObjectResult);
            if (url) {
                console.log(`File access via external object with load balancing: ${fileUuid} -> ${url}`);
                return url;
            }
        }

        // Priority 2: Check media_source table and prefer migrated versions
        const mediaResult = await db
            .select({ url: mediaSource.url })
            .from(mediaSource)
            .where(eq(mediaSource.uuid, fileUuid))
            .limit(1);

        if (mediaResult.length > 0) {
            // Check if this media source has been migrated to external objects
            const mediaMigrationCheck = await db
                .select({ external_object_uuid: externalObject.uuid })
                .from(mediaSourceExternalObject)
                .innerJoin(mediaSource, eq(mediaSourceExternalObject.media_source_id, mediaSource.id))
                .innerJoin(externalObject, eq(mediaSourceExternalObject.external_object_id, externalObject.id))
                .where(eq(mediaSource.uuid, fileUuid))
                .limit(1);

            if (mediaMigrationCheck.length > 0) {
                // Media source is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByUUID(db, mediaMigrationCheck[0].external_object_uuid);
                if (migratedExternalObject) {
                    // Use load balancing version for better IPFS support
                    const migratedUrl = await buildExternalObjectURLWithLoadBalancing(db, migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated media source with load balancing: ${fileUuid} -> ${migratedUrl}`);
                        return migratedUrl;
                    }
                }
            }

            // Fallback to direct URL if not migrated yet (media_source can work without ASSET_URL)
            console.log(`File access via legacy media source: ${fileUuid} -> ${mediaResult[0].url}`);
            return mediaResult[0].url;
        }

        // Priority 3: Check asset table and prefer migrated versions
        const assetResult = await db
            .select({ file_id: asset.file_id })
            .from(asset)
            .where(eq(asset.uuid, fileUuid))
            .limit(1);

        if (assetResult.length > 0) {
            // Check if this asset has been migrated to external objects
            const assetMigrationCheck = await db
                .select({ external_object_uuid: externalObject.uuid })
                .from(assetExternalObject)
                .innerJoin(asset, eq(assetExternalObject.asset_id, asset.id))
                .innerJoin(externalObject, eq(assetExternalObject.external_object_id, externalObject.id))
                .where(eq(asset.uuid, fileUuid))
                .limit(1);

            if (assetMigrationCheck.length > 0) {
                // Asset is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByUUID(db, assetMigrationCheck[0].external_object_uuid);
                if (migratedExternalObject) {
                    // Use load balancing version for better IPFS support
                    const migratedUrl = await buildExternalObjectURLWithLoadBalancing(db, migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated asset with load balancing: ${fileUuid} -> ${migratedUrl}`);
                        return migratedUrl;
                    }
                }
            }

            // For unmigrated assets, we cannot construct URL without ASSET_URL
            console.log(`Asset found but not migrated and no ASSET_URL available: ${fileUuid}`);
            return null;
        }

        console.log(`File not found: ${fileUuid}`);
        return null;
    } catch (error) {
        console.error(`Error getting file URL: ${error}`);
        return null;
    }
}