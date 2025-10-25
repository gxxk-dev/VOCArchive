import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { mediaSource, asset, mediaSourceExternalObject, assetExternalObject, externalObject, externalSource, work } from '../schema';
import type { MediaSource, MediaSourceForApplication, MediaSourceWithExternalObjects, ExternalObject, MediaSourceApiInput } from '../types';
import { getExternalObjectByIndex, buildExternalObjectURL, buildExternalObjectURLWithLoadBalancing } from './external_object';
import {
    workIndexToId,
    mediaSourceIndexToId,
    assetIndexToId,
    externalObjectIndexToId
} from '../utils/index-id-converter';
import { validateIndex } from '../utils';

/**
 * Get media source by index with external objects
 */
export async function getMediaByIndex(
    db: DrizzleDB, 
    mediaindex: string
): Promise<MediaSourceWithExternalObjects | null> {
    if (!validateIndex(mediaindex)) {
        return null;
    }

    const mediaResult = await db
        .select({
            id: mediaSource.id,
            index: mediaSource.index,
            work_id: mediaSource.work_id,
            work_index: work.index,
            is_music: mediaSource.is_music,
            file_name: mediaSource.file_name,
            mime_type: mediaSource.mime_type,
            info: mediaSource.info,
        })
        .from(mediaSource)
        .innerJoin(work, eq(mediaSource.work_id, work.id))
        .where(eq(mediaSource.index, mediaindex))
        .limit(1);

    if (mediaResult.length === 0) {
        return null;
    }

    // Get external objects for this media source
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
        .from(mediaSourceExternalObject)
        .innerJoin(externalObject, eq(mediaSourceExternalObject.external_object_id, externalObject.id))
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .innerJoin(mediaSource, eq(mediaSourceExternalObject.media_source_id, mediaSource.id))
        .where(eq(mediaSource.index, mediaindex));

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
            index: mediaSource.index,
            work_id: mediaSource.work_id,
            work_index: work.index,
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
    externalObjectIndexs?: string[]
): Promise<void> {
    // Convert work index to ID
    const workId = await workIndexToId(db, mediaData.work_index);
    if (!workId) {
        throw new Error(`Work not found: ${mediaData.work_index}`);
    }

    await db.insert(mediaSource).values({
        index: mediaData.index,
        work_id: workId,
        is_music: mediaData.is_music,
        file_name: mediaData.file_name,
        url: mediaData.url || null, // Made optional - use external objects for file info
        mime_type: mediaData.mime_type,
        info: mediaData.info,
    });

    // Insert media_source-external_object associations
    if (externalObjectIndexs && externalObjectIndexs.length > 0) {
        // Get media source ID for foreign key operations
        const mediaId = await mediaSourceIndexToId(db, mediaData.index);
        if (!mediaId) {
            throw new Error(`Media source not found after insert: ${mediaData.index}`);
        }

        const objectInserts = [];
        for (const objectindex of externalObjectIndexs) {
            const objectId = await externalObjectIndexToId(db, objectindex);
            if (!objectId) {
                throw new Error(`External object not found: ${objectindex}`);
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
    mediaindex: string,
    mediaData: MediaSourceApiInput,
    externalObjectIndexs?: string[]
): Promise<boolean> {
    if (!validateIndex(mediaindex)) return false;

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, mediaData.work_index);
        if (!workId) {
            throw new Error(`Work not found: ${mediaData.work_index}`);
        }

        // Check if index is being changed
        const newIndex = mediaData.index;
        if (newIndex && newIndex !== mediaindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingMedia = await db
                .select({ id: mediaSource.id })
                .from(mediaSource)
                .where(eq(mediaSource.index, newIndex))
                .limit(1);

            if (existingMedia.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update media source with new index and other fields
            await db
                .update(mediaSource)
                .set({
                    index: newIndex,
                    work_id: workId,
                    is_music: mediaData.is_music,
                    file_name: mediaData.file_name,
                    url: mediaData.url || null,
                    mime_type: mediaData.mime_type,
                    info: mediaData.info,
                })
                .where(eq(mediaSource.index, mediaindex));
        } else {
            // Update media source without changing index
            await db
                .update(mediaSource)
                .set({
                    work_id: workId,
                    is_music: mediaData.is_music,
                    file_name: mediaData.file_name,
                    url: mediaData.url || null,
                    mime_type: mediaData.mime_type,
                    info: mediaData.info,
                })
                .where(eq(mediaSource.index, mediaindex));
        }

        // Update media_source-external_object associations
        if (externalObjectIndexs !== undefined) {
            // Get media source ID for foreign key operations (use newIndex if changed, otherwise mediaindex)
            const currentIndex = (newIndex && newIndex !== mediaindex) ? newIndex : mediaindex;
            const mediaId = await mediaSourceIndexToId(db, currentIndex);
            if (!mediaId) {
                throw new Error(`Media source not found: ${mediaindex}`);
            }

            // Delete old external object associations
            await db
                .delete(mediaSourceExternalObject)
                .where(eq(mediaSourceExternalObject.media_source_id, mediaId));

            // Insert new external object associations
            if (externalObjectIndexs.length > 0) {
                const objectInserts = [];
                for (const objectindex of externalObjectIndexs) {
                    const objectId = await externalObjectIndexToId(db, objectindex);
                    if (!objectId) {
                        throw new Error(`External object not found: ${objectindex}`);
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
export async function deleteMedia(db: DrizzleDB, mediaindex: string): Promise<boolean> {
    if (!validateIndex(mediaindex)) return false;

    try {
        const result = await db
            .delete(mediaSource)
            .where(eq(mediaSource.index, mediaindex));

        return true;
    } catch (error) {
        console.error('Error deleting media:', error);
        return false;
    }
}

/**
 * Get file URL by index using external storage architecture only
 * This function prioritizes the new external storage system and provides
 * graceful fallbacks without requiring ASSET_URL environment variable
 */
export async function getFileURLByIndexWithExternalStorage(
    db: DrizzleDB,
    fileindex: string
): Promise<string | null> {
    if (!validateIndex(fileindex)) {
        return null;
    }

    try {
        // Priority 1: Check external_object table first (new system)
        const externalObjectResult = await getExternalObjectByIndex(db, fileindex);
        if (externalObjectResult) {
            // Use load balancing version for better IPFS support
            const url = await buildExternalObjectURLWithLoadBalancing(db, externalObjectResult);
            if (url) {
                console.log(`File access via external object with load balancing: ${fileindex} -> ${url}`);
                return url;
            }
        }

        // Priority 2: Check media_source table and prefer migrated versions
        const mediaResult = await db
            .select({ url: mediaSource.url })
            .from(mediaSource)
            .where(eq(mediaSource.index, fileindex))
            .limit(1);

        if (mediaResult.length > 0) {
            // Check if this media source has been migrated to external objects
            const mediaMigrationCheck = await db
                .select({ external_object_index: externalObject.index })
                .from(mediaSourceExternalObject)
                .innerJoin(mediaSource, eq(mediaSourceExternalObject.media_source_id, mediaSource.id))
                .innerJoin(externalObject, eq(mediaSourceExternalObject.external_object_id, externalObject.id))
                .where(eq(mediaSource.index, fileindex))
                .limit(1);

            if (mediaMigrationCheck.length > 0) {
                // Media source is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByIndex(db, mediaMigrationCheck[0].external_object_index);
                if (migratedExternalObject) {
                    // Use load balancing version for better IPFS support
                    const migratedUrl = await buildExternalObjectURLWithLoadBalancing(db, migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated media source with load balancing: ${fileindex} -> ${migratedUrl}`);
                        return migratedUrl;
                    }
                }
            }

            // Fallback to direct URL if not migrated yet (media_source can work without ASSET_URL)
            console.log(`File access via legacy media source: ${fileindex} -> ${mediaResult[0].url}`);
            return mediaResult[0].url;
        }

        // Priority 3: Check asset table and prefer migrated versions
        const assetResult = await db
            .select({ file_id: asset.file_id })
            .from(asset)
            .where(eq(asset.index, fileindex))
            .limit(1);

        if (assetResult.length > 0) {
            // Check if this asset has been migrated to external objects
            const assetMigrationCheck = await db
                .select({ external_object_index: externalObject.index })
                .from(assetExternalObject)
                .innerJoin(asset, eq(assetExternalObject.asset_id, asset.id))
                .innerJoin(externalObject, eq(assetExternalObject.external_object_id, externalObject.id))
                .where(eq(asset.index, fileindex))
                .limit(1);

            if (assetMigrationCheck.length > 0) {
                // Asset is migrated, try to use external object instead
                const migratedExternalObject = await getExternalObjectByIndex(db, assetMigrationCheck[0].external_object_index);
                if (migratedExternalObject) {
                    // Use load balancing version for better IPFS support
                    const migratedUrl = await buildExternalObjectURLWithLoadBalancing(db, migratedExternalObject);
                    if (migratedUrl) {
                        console.log(`File access via migrated asset with load balancing: ${fileindex} -> ${migratedUrl}`);
                        return migratedUrl;
                    }
                }
            }

            // For unmigrated assets, we cannot construct URL without ASSET_URL
            console.log(`Asset found but not migrated and no ASSET_URL available: ${fileindex}`);
            return null;
        }

        console.log(`File not found: ${fileindex}`);
        return null;
    } catch (error) {
        console.error(`Error getting file URL: ${error}`);
        return null;
    }
}