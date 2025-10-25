import { eq, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { externalSource } from '../schema';
import type { ExternalSource, NewExternalSource, ExternalSourceApiInput } from '../types';
import { validateIndex } from '../utils';

/**
 * Get external source by index 
 */
export async function getExternalSourceByIndex(
    db: DrizzleDB,
    sourceindex: string
): Promise<ExternalSource | null> {
    if (!validateIndex(sourceindex)) {
        return null;
    }

    const sourceResult = await db
        .select({
            id: externalSource.id,
            index: externalSource.index,
            type: externalSource.type,
            name: externalSource.name,
            endpoint: externalSource.endpoint,
            isIPFS: externalSource.isIPFS,
        })
        .from(externalSource)
        .where(eq(externalSource.index, sourceindex))
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
            id: externalSource.id,
            index: externalSource.index,
            type: externalSource.type,
            name: externalSource.name,
            endpoint: externalSource.endpoint,
            isIPFS: externalSource.isIPFS,
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
    sourceData: ExternalSourceApiInput
): Promise<void> {
    await db.insert(externalSource).values({
        index: sourceData.index,
        type: sourceData.type,
        name: sourceData.name,
        endpoint: sourceData.endpoint,
        isIPFS: sourceData.isIPFS,
    });
}

/**
 * Update an existing external source
 */
export async function updateExternalSource(
    db: DrizzleDB,
    sourceindex: string,
    sourceData: ExternalSourceApiInput
): Promise<boolean> {
    if (!validateIndex(sourceindex)) return false;

    try {
        // Check if index is being changed
        const newIndex = sourceData.index;
        if (newIndex && newIndex !== sourceindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingSource = await db
                .select({ id: externalSource.id })
                .from(externalSource)
                .where(eq(externalSource.index, newIndex))
                .limit(1);

            if (existingSource.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update external source with new index and other fields
            await db
                .update(externalSource)
                .set({
                    index: newIndex,
                    type: sourceData.type,
                    name: sourceData.name,
                    endpoint: sourceData.endpoint,
                    isIPFS: sourceData.isIPFS,
                })
                .where(eq(externalSource.index, sourceindex));
        } else {
            // Update external source without changing index
            await db
                .update(externalSource)
                .set({
                    type: sourceData.type,
                    name: sourceData.name,
                    endpoint: sourceData.endpoint,
                    isIPFS: sourceData.isIPFS,
                })
                .where(eq(externalSource.index, sourceindex));
        }

        return true;
    } catch (error) {
        console.error('Error updating external source:', error);
        return false;
    }
}

/**
 * Delete an external source
 */
export async function deleteExternalSource(db: DrizzleDB, sourceindex: string): Promise<boolean> {
    if (!validateIndex(sourceindex)) return false;

    try {
        // Delete external source (cascade will handle related external objects)
        await db.delete(externalSource).where(eq(externalSource.index, sourceindex));
        
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

/**
 * Get all IPFS sources with the same name for load balancing
 */
export async function getIPFSSourcesByName(
    db: DrizzleDB,
    sourceName: string
): Promise<ExternalSource[]> {
    try {
        const sources = await db
            .select({
                id: externalSource.id,
                index: externalSource.index,
                type: externalSource.type,
                name: externalSource.name,
                endpoint: externalSource.endpoint,
                isIPFS: externalSource.isIPFS,
            })
            .from(externalSource)
            .where(and(eq(externalSource.name, sourceName), eq(externalSource.isIPFS, true)));

        return sources;
    } catch (error) {
        console.error('Error getting IPFS sources by name:', error);
        return [];
    }
}