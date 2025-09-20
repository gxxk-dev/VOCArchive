import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { externalObject, externalSource } from '../schema';
import type { ExternalObject, NewExternalObject, ExternalSource as ExternalSourceType } from '../types';
import { buildStorageURL } from '../utils/storage-handlers';

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
            uuid: externalObject.uuid,
            external_source_uuid: externalObject.external_source_uuid,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
        })
        .from(externalObject)
        .innerJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid))
        .where(eq(externalObject.uuid, objectUuid))
        .limit(1);

    if (result.length === 0) {
        return null;
    }

    const row = result[0];
    return {
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
            uuid: externalObject.uuid,
            external_source_uuid: externalObject.external_source_uuid,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
            // External source fields
            source_type: externalSource.type,
            source_name: externalSource.name,
            source_endpoint: externalSource.endpoint,
        })
        .from(externalObject)
        .innerJoin(externalSource, eq(externalObject.external_source_uuid, externalSource.uuid))
        .limit(pageSize)
        .offset(offset);

    return results.map(row => ({
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

    const objects = await db
        .select({
            uuid: externalObject.uuid,
            external_source_uuid: externalObject.external_source_uuid,
            mime_type: externalObject.mime_type,
            file_id: externalObject.file_id,
        })
        .from(externalObject)
        .where(eq(externalObject.external_source_uuid, sourceUuid));

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
        external_source_uuid: objectData.external_source_uuid,
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
    objectData: Omit<ExternalObject, 'uuid'>
): Promise<boolean> {
    if (!validateUUID(objectUuid)) return false;

    try {
        await db
            .update(externalObject)
            .set({
                external_source_uuid: objectData.external_source_uuid,
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