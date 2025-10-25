import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { externalObject, externalSource } from '../schema';
import type { ExternalObject, NewExternalObject, ExternalSource as ExternalSourceType, ExternalObjectApiInput } from '../types';
import { buildStorageURL, buildStorageURLWithLoadBalancing } from '../utils/storage-handlers';
import { externalSourceIndexToId } from '../utils/index-id-converter';
import { validateIndex } from '../utils';

/**
 * Extended external object interface with source information
 */
export interface ExternalObjectWithSource extends ExternalObject {
    source: ExternalSourceType;
}

/**
 * Get external object by index with source information
 */
export async function getExternalObjectByIndex(
    db: DrizzleDB, 
    objectindex: string
): Promise<ExternalObjectWithSource | null> {
    if (!validateIndex(objectindex)) {
        return null;
    }

    const result = await db
        .select({
            // External object fields
            id: externalObject.id,
            index: externalObject.index,
            external_source_id: externalObject.external_source_id,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_id: externalSource.id,
            source_index: externalSource.index,
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
            source_isIPFS: externalSource.isIPFS,
        })
        .from(externalObject)
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .where(eq(externalObject.index, objectindex))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    const row = result[0];
    return {
        id: row.id,
        index: row.index,
        external_source_id: row.external_source_id,
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            id: row.source_id,
            index: row.source_index,
            type: row.source_type,
            name: row.source_name,
            endpoint: row.source_endpoint,
            isIPFS: row.source_isIPFS,
        }
    };
}

/**
 * Get paginated list of external objects with source details
 */
export async function listExternalObjects(
    db: DrizzleDB, 
    page: number, 
    pageSize: number
): Promise<ExternalObjectWithSource[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;
    
    const results = await db
        .select({
            // External object fields
            id: externalObject.id,
            index: externalObject.index,
            external_source_id: externalObject.external_source_id,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_id: externalSource.id,
            source_index: externalSource.index,
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
            source_isIPFS: externalSource.isIPFS,
        })
        .from(externalObject)
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .limit(pageSize)
        .offset(offset);

    return results.map(row => ({
        id: row.id,
        index: row.index,
        external_source_id: row.external_source_id,
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            id: row.source_id,
            index: row.source_index,
            type: row.source_type,
            name: row.source_name,
            endpoint: row.source_endpoint,
            isIPFS: row.source_isIPFS,
        }
    }));
}

/**
 * Get external objects by external source index 
 */
export async function getExternalObjectsBySource(
    db: DrizzleDB,
    sourceindex: string
): Promise<ExternalObject[]> {
    if (!validateIndex(sourceindex)) {
        return [];
    }

    // Convert source index to ID
    const sourceId = await externalSourceIndexToId(db, sourceindex);
    if (!sourceId) {
        return [];
    }

    const objects = await db
        .select({
            id: externalObject.id,
            index: externalObject.index,
            external_source_id: externalObject.external_source_id,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
        })
        .from(externalObject)
        .where(eq(externalObject.external_source_id, sourceId));

    return objects;
}

/**
 * Create a new external object
 */
export async function inputExternalObject(
    db: DrizzleDB,
    objectData: NewExternalObject
): Promise<void> {
    await db.insert(externalObject).values({
        index: objectData.index,
        external_source_id: objectData.external_source_id,
        mime_type: objectData.mime_type,
        file_id: objectData.file_id,
    });
}

/**
 * Update an existing external object
 */
export async function updateExternalObject(
    db: DrizzleDB,
    objectindex: string,
    objectData: ExternalObjectApiInput
): Promise<boolean> {
    if (!validateIndex(objectindex)) return false;

    try {
        // Convert external source index to ID
        const externalSourceId = await externalSourceIndexToId(db, objectData.external_source_index);
        if (!externalSourceId) {
            throw new Error(`External source not found: ${objectData.external_source_index}`);
        }

        // Check if index is being changed
        const newIndex = objectData.index;
        if (newIndex && newIndex !== objectindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingObject = await db
                .select({ id: externalObject.id })
                .from(externalObject)
                .where(eq(externalObject.index, newIndex))
                .limit(1);

            if (existingObject.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update external object with new index and other fields
            await db
                .update(externalObject)
                .set({
                    index: newIndex,
                    external_source_id: externalSourceId,
                    mime_type: objectData.mime_type,
                    file_id: objectData.file_id,
                })
                .where(eq(externalObject.index, objectindex));
        } else {
            // Update external object without changing index
            await db
                .update(externalObject)
                .set({
                    external_source_id: externalSourceId,
                    mime_type: objectData.mime_type,
                    file_id: objectData.file_id,
                })
                .where(eq(externalObject.index, objectindex));
        }

        return true;
    } catch (error) {
        console.error('Error updating external object:', error);
        return false;
    }
}

/**
 * Delete an external object
 */
export async function deleteExternalObject(db: DrizzleDB, objectindex: string): Promise<boolean> {
    if (!validateIndex(objectindex)) return false;

    try {
        await db.delete(externalObject).where(eq(externalObject.index, objectindex));
        
        return true;
    } catch (error) {
        console.error('Error deleting external object:', error);
        return false;
    }
}

/**
 * Get total count of external objects
 */
export async function getExternalObjectCount(db: DrizzleDB): Promise<number> {
    try {
        const result = await db.select().from(externalObject);
        return result.length;
    } catch (error) {
        console.error('Error getting external object count:', error);
        return 0;
    }
}

/**
 * Get external objects by asset index (for future junction table support)
 * Note: This will be fully implemented when junction tables are added in step 5
 */
export async function getExternalObjectsByAsset(
    db: DrizzleDB,
    assetIndex: string
): Promise<ExternalObjectWithSource[]> {
    // TODO: Implement when asset-external_object junction table is added
    // For now, return empty array as placeholder
    return [];
}

/**
 * Get external objects by media source index (for future junction table support)
 * Note: This will be fully implemented when junction tables are added in step 5
 */
export async function getExternalObjectsByMediaSource(
    db: DrizzleDB,
    mediaindex: string
): Promise<ExternalObjectWithSource[]> {
    // TODO: Implement when media_source-external_object junction table is added
    // For now, return empty array as placeholder
    return [];
}

/**
 * Build download URL from external object and source
 */
export function buildExternalObjectURL(externalObj: ExternalObjectWithSource): string {
    // Use storage handlers for more robust URL building
    const url = buildStorageURL(externalObj.source, externalObj.file_id);

    if (url) {
        return url;
    }

    // Fallback to simple replacement if storage handler fails
    console.warn(`Storage handler failed for type ${externalObj.source.type}, using fallback method`);
    return externalObj.source.endpoint.replace('{id}', externalObj.file_id);
}

/**
 * Async version: Build download URL with load balancing support
 */
export async function buildExternalObjectURLWithLoadBalancing(
    db: DrizzleDB,
    externalObj: ExternalObjectWithSource
): Promise<string | null> {
    // Use async storage handler with load balancing
    const url = await buildStorageURLWithLoadBalancing(db, externalObj.source, externalObj.file_id);

    if (url) {
        return url;
    }

    // Fallback to sync version
    console.warn(`Load balancing failed for ${externalObj.source.type}, falling back to basic URL building`);
    return buildExternalObjectURL(externalObj);
}