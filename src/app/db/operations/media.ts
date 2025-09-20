import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { mediaSource, asset, mediaSourceExternalObject, assetExternalObject, externalObject, externalSource } from '../schema';
import type { MediaSource, MediaSourceForApplication, MediaSourceWithExternalObjects, ExternalObject, MediaSourceInput } from '../types';
import { getExternalObjectByUUID, buildExternalObjectURL } from './external_object';

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

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
            uuid: mediaSource.uuid,
            work_uuid: mediaSource.work_uuid,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            // url: mediaSource.url, // Removed - use external objects for file info
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .where(eq(mediaSource.uuid, mediaUuid))
        .limit(1);

    if (mediaResult.length === 0) {
        return null;
    }

    // Get external objects for this media source
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
        .from(mediaSourceExternalObject)
        .innerJoin(externalObject, eq(mediaSourceExternalObject.external_object_uuid, externalObject.uuid))
        .innerJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid))
        .where(eq(mediaSourceExternalObject.media_source_uuid, mediaUuid));

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
            uuid: mediaSource.uuid,
            work_uuid: mediaSource.work_uuid,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            // url: mediaSource.url, // Removed - use external objects for file info
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .limit(pageSize)
        .offset(offset);

    return mediaList;
}

/**
 * Create a new media source with optional external objects
 */
export async function inputMedia(
    db: DrizzleDB,
    mediaData: MediaSourceInput,
    externalObjectUuids?: string[]
): Promise<void> {
    await db.insert(mediaSource).values({
        uuid: mediaData.uuid,
        work_uuid: mediaData.work_uuid,
        is_music: mediaData.is_music,
        file_name: mediaData.file_name,
        url: mediaData.url || null, // Made optional - use external objects for file info
        mime_type: mediaData.mime_type,
        info: mediaData.info,
    });

    // Insert media_source-external_object associations
    if (externalObjectUuids && externalObjectUuids.length > 0) {
        await db.insert(mediaSourceExternalObject).values(
            externalObjectUuids.map(objectUuid => ({
                media_source_uuid: mediaData.uuid,
                external_object_uuid: objectUuid,
            }))
        );
    }
}

/**
 * Update an existing media source with optional external objects
 */
export async function updateMedia(
    db: DrizzleDB,
    mediaUuid: string,
    mediaData: MediaSourceInput,
    externalObjectUuids?: string[]
): Promise<boolean> {
    if (!validateUUID(mediaUuid)) return false;

    try {
        await db
            .update(mediaSource)
            .set({
                work_uuid: mediaData.work_uuid,
                is_music: mediaData.is_music,
                file_name: mediaData.file_name,
                url: mediaData.url || null, // Made optional - use external objects for file info
                mime_type: mediaData.mime_type,
                info: mediaData.info,
            })
            .where(eq(mediaSource.uuid, mediaUuid));

        // Update media_source-external_object associations
        if (externalObjectUuids !== undefined) {
            // Delete old external object associations
            await db
                .delete(mediaSourceExternalObject)
                .where(eq(mediaSourceExternalObject.media_source_uuid, mediaUuid));

            // Insert new external object associations
            if (externalObjectUuids.length > 0) {
                await db.insert(mediaSourceExternalObject).values(
                    externalObjectUuids.map(objectUuid => ({
                        media_source_uuid: mediaUuid,
                        external_object_uuid: objectUuid,
                    }))
                );
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
            const url = buildExternalObjectURL(externalObjectResult);
            if (url) {
                console.log(`File access via external object: ${fileUuid} -> ${url}`);
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
                .select({ external_object_uuid: mediaSourceExternalObject.external_object_uuid })
                .from(mediaSourceExternalObject)
                .where(eq(mediaSourceExternalObject.media_source_uuid, fileUuid))
                .limit(1);

            if (mediaMigrationCheck.length > 0) {
                // Media source is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByUUID(db, mediaMigrationCheck[0].external_object_uuid);
                if (migratedExternalObject) {
                    const migratedUrl = buildExternalObjectURL(migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated media source: ${fileUuid} -> ${migratedUrl}`);
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
                .select({ external_object_uuid: assetExternalObject.external_object_uuid })
                .from(assetExternalObject)
                .where(eq(assetExternalObject.asset_uuid, fileUuid))
                .limit(1);

            if (assetMigrationCheck.length > 0) {
                // Asset is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByUUID(db, assetMigrationCheck[0].external_object_uuid);
                if (migratedExternalObject) {
                    const migratedUrl = buildExternalObjectURL(migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated asset: ${fileUuid} -> ${migratedUrl}`);
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