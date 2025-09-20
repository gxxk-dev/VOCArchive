import { eq } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { externalSource } from '../schema';
import type { ExternalSource, NewExternalSource } from '../types';

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get external source by UUID
 */
export async function getExternalSourceByUUID(
    db: DrizzleDB, 
    sourceUuid: string
): Promise<ExternalSource | null> {
    if (!validateUUID(sourceUuid)) {
        return null;
    }

    const sourceResult = await db
        .select({
            uuid: externalSource.uuid,
            type: externalSource.type,
            name: externalSource.name,
            endpoint: externalSource.endpoint,
        })
        .from(externalSource)
        .where(eq(externalSource.uuid, sourceUuid))
        .limit(1);

    return sourceResult[0] || null;
}

/**
 * Get paginated list of external sources
 */
export async function listExternalSources(
    db: DrizzleDB, 
    page: number, 
    pageSize: number
): Promise<ExternalSource[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;
    
    const sources = await db
        .select({
            uuid: externalSource.uuid,
            type: externalSource.type,
            name: externalSource.name,
            endpoint: externalSource.endpoint,
        })
        .from(externalSource)
        .limit(pageSize)
        .offset(offset);

    return sources;
}

/**
 * Create a new external source
 */
export async function inputExternalSource(
    db: DrizzleDB,
    sourceData: NewExternalSource
): Promise<void> {
    await db.insert(externalSource).values({
        uuid: sourceData.uuid,
        type: sourceData.type,
        name: sourceData.name,
        endpoint: sourceData.endpoint,
    });
}

/**
 * Update an existing external source
 */
export async function updateExternalSource(
    db: DrizzleDB,
    sourceUuid: string,
    sourceData: Omit<ExternalSource, 'uuid'>
): Promise<boolean> {
    if (!validateUUID(sourceUuid)) return false;

    try {
        await db
            .update(externalSource)
            .set({
                type: sourceData.type,
                name: sourceData.name,
                endpoint: sourceData.endpoint,
            })
            .where(eq(externalSource.uuid, sourceUuid));

        return true;
    } catch (error) {
        console.error('Error updating external source:', error);
        return false;
    }
}

/**
 * Delete an external source
 */
export async function deleteExternalSource(db: DrizzleDB, sourceUuid: string): Promise<boolean> {
    if (!validateUUID(sourceUuid)) return false;

    try {
        // Delete external source (cascade will handle related external objects)
        await db.delete(externalSource).where(eq(externalSource.uuid, sourceUuid));
        
        return true;
    } catch (error) {
        console.error('Error deleting external source:', error);
        return false;
    }
}

/**
 * Get total count of external sources
 */
export async function getExternalSourceCount(db: DrizzleDB): Promise<number> {
    try {
        const result = await db.select().from(externalSource);
        return result.length;
    } catch (error) {
        console.error('Error getting external source count:', error);
        return 0;
    }
}