import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { externalObject, externalSource } from '../schema';
import type { ExternalObject, NewExternalObject, ExternalSource as ExternalSourceType, ExternalObjectApiInput } from '../types';
import { buildStorageURL, buildStorageURLWithLoadBalancing } from '../utils/storage-handlers';
import { externalSourceUuidToId } from '../utils/uuid-id-converter';

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Extended external object interface with source information
 */
export interface ExternalObjectWithSource extends ExternalObject {
    source: ExternalSourceType;
}

/**
 * Get external object by UUID with source information
 */
export async function getExternalObjectByUUID(
    db: DrizzleDB, 
    objectUuid: string
): Promise<ExternalObjectWithSource | null> {
    if (!validateUUID(objectUuid)) {
        return null;
    }

    const result = await db
        .select({
            // External object fields
            id: externalObject.id,
            uuid: externalObject.uuid,
            external_source_id: externalObject.external_source_id,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_id: externalSource.id,
            source_uuid: externalSource.uuid,
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
            source_isIPFS: externalSource.isIPFS,
        })
        .from(externalObject)
        .innerJoin(externalSource, eq(externalObject.external_source_id, externalSource.id))
        .where(eq(externalObject.uuid, objectUuid))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    const row = result[0];
    return {
        id: row.id,
        uuid: row.uuid,
        external_source_id: row.external_source_id,
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            id: row.source_id,
            uuid: row.source_uuid,
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
            uuid: externalObject.uuid,
            external_source_id: externalObject.external_source_id,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_id: externalSource.id,
            source_uuid: externalSource.uuid,
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
        uuid: row.uuid,
        external_source_id: row.external_source_id,
        mime_type: row.mime_type,
        file_id: row.file_id,
        source: {
            id: row.source_id,
            uuid: row.source_uuid,
            type: row.source_type,
            name: row.source_name,
            endpoint: row.source_endpoint,
            isIPFS: row.source_isIPFS,
        }
    }));
}

/**
 * Get external objects by external source UUID
 */
export async function getExternalObjectsBySource(
    db: DrizzleDB,
    sourceUuid: string
): Promise<ExternalObject[]> {
    if (!validateUUID(sourceUuid)) {
        return [];
    }

    // Convert source UUID to ID
    const sourceId = await externalSourceUuidToId(db, sourceUuid);
    if (!sourceId) {
        return [];
    }

    const objects = await db
        .select({
            id: externalObject.id,
            uuid: externalObject.uuid,
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
        uuid: objectData.uuid,
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
    objectUuid: string,
    objectData: Omit<ExternalObjectApiInput, 'uuid'>
): Promise<boolean> {
    if (!validateUUID(objectUuid)) return false;

    try {
        // Convert external source UUID to ID
        const externalSourceId = await externalSourceUuidToId(db, objectData.external_source_uuid);
        if (!externalSourceId) {
            throw new Error(`External source not found: ${objectData.external_source_uuid}`);
        }

        await db
            .update(externalObject)
            .set({
                external_source_id: externalSourceId,
                mime_type: objectData.mime_type,
                file_id: objectData.file_id,
            })
            .where(eq(externalObject.uuid, objectUuid));

        return true;
    } catch (error) {
        console.error('Error updating external object:', error);
        return false;
    }
}

/**
 * Delete an external object
 */
export async function deleteExternalObject(db: DrizzleDB, objectUuid: string): Promise<boolean> {
    if (!validateUUID(objectUuid)) return false;

    try {
        await db.delete(externalObject).where(eq(externalObject.uuid, objectUuid));
        
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
 * Get external objects by asset UUID (for future junction table support)
 * Note: This will be fully implemented when junction tables are added in step 5
 */
export async function getExternalObjectsByAsset(
    db: DrizzleDB,
    assetUuid: string
): Promise<ExternalObjectWithSource[]> {
    // TODO: Implement when asset-external_object junction table is added
    // For now, return empty array as placeholder
    return [];
}

/**
 * Get external objects by media source UUID (for future junction table support)
 * Note: This will be fully implemented when junction tables are added in step 5
 */
export async function getExternalObjectsByMediaSource(
    db: DrizzleDB,
    mediaUuid: string
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