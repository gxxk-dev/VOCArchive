import { eq, inArray } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { creator, creatorWiki, workCreator, work } from '../schema';

// Types matching current interfaces
export interface Creator {
    uuid: string;
    name: string;
    type: 'human' | 'virtual';
}

export interface WikiRef {
    platform: string;
    identifier: string;
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get creator by UUID with wiki references
 */
export async function getCreatorByUUID(
    db: DrizzleDB, 
    creatorUuid: string
): Promise<{ creator: Creator, wikis: WikiRef[] } | null> {
    if (!validateUUID(creatorUuid)) {
        return null;
    }

    // Get creator
    const creatorResult = await db
        .select({
            uuid: creator.uuid,
            name: creator.name,
            type: creator.type,
        })
        .from(creator)
        .where(eq(creator.uuid, creatorUuid))
        .limit(1);

    if (creatorResult.length === 0) {
        return null;
    }

    // Get wikis
    const wikis = await db
        .select({
            platform: creatorWiki.platform,
            identifier: creatorWiki.identifier,
        })
        .from(creatorWiki)
        .where(eq(creatorWiki.creator_uuid, creatorUuid));

    return {
        creator: creatorResult[0],
        wikis: wikis,
    };
}

/**
 * Get paginated list of creators
 */
export async function listCreators(
    db: DrizzleDB, 
    page: number, 
    pageSize: number
): Promise<Creator[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;
    
    const creators = await db
        .select({
            uuid: creator.uuid,
            name: creator.name,
            type: creator.type,
        })
        .from(creator)
        .limit(pageSize)
        .offset(offset);

    return creators;
}

/**
 * Create a new creator with wiki references
 */
export async function inputCreator(
    db: DrizzleDB,
    creatorData: Creator,
    wikis?: WikiRef[]
): Promise<void> {
    // For D1 compatibility, execute operations sequentially without transactions
    // Insert creator
    await db.insert(creator).values({
        uuid: creatorData.uuid,
        name: creatorData.name,
        type: creatorData.type,
    });
    
    // Insert wiki references
    if (wikis && wikis.length > 0) {
        await db.insert(creatorWiki).values(
            wikis.map(wiki => ({
                creator_uuid: creatorData.uuid,
                platform: wiki.platform,
                identifier: wiki.identifier,
            }))
        );
    }
}

/**
 * Update an existing creator and wiki references
 */
export async function updateCreator(
    db: DrizzleDB,
    creatorUuid: string,
    creatorData: Creator,
    wikis?: WikiRef[]
): Promise<boolean> {
    if (!validateUUID(creatorUuid)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Update creator
        await db
            .update(creator)
            .set({
                name: creatorData.name,
                type: creatorData.type,
            })
            .where(eq(creator.uuid, creatorUuid));

        // Delete old wiki entries
        await db
            .delete(creatorWiki)
            .where(eq(creatorWiki.creator_uuid, creatorUuid));

        // Insert new wiki entries
        if (wikis && wikis.length > 0) {
            await db.insert(creatorWiki).values(
                wikis.map(wiki => ({
                    creator_uuid: creatorUuid,
                    platform: wiki.platform,
                    identifier: wiki.identifier,
                }))
            );
        }

        return true;
    } catch (error) {
        console.error('Error updating creator:', error);
        return false;
    }
}

/**
 * Delete a creator and all related data
 */
export async function deleteCreator(db: DrizzleDB, creatorUuid: string): Promise<boolean> {
    if (!validateUUID(creatorUuid)) return false;

    try {
        // Check if creator exists
        const existingCreator = await db
            .select({ uuid: creator.uuid })
            .from(creator)
            .where(eq(creator.uuid, creatorUuid))
            .limit(1);

        if (existingCreator.length === 0) return false;

        // Delete creator (cascade will handle related tables)
        await db.delete(creator).where(eq(creator.uuid, creatorUuid));
        
        return true;
    } catch (error) {
        console.error('Error deleting creator:', error);
        return false;
    }
}

/**
 * Delete all works by a creator
 */
export async function deleteWorksByCreator(db: DrizzleDB, creatorUuid: string): Promise<number> {
    if (!validateUUID(creatorUuid)) return 0;

    try {
        // Get all work UUIDs for this creator
        const creatorWorks = await db
            .select({ work_uuid: workCreator.work_uuid })
            .from(workCreator)
            .where(eq(workCreator.creator_uuid, creatorUuid));

        if (creatorWorks.length === 0) return 0;

        const workUuids = creatorWorks.map(w => w.work_uuid);

        // Delete all works (cascade will handle related data)
        await db.delete(work).where(inArray(work.uuid, workUuids));

        return workUuids.length;
    } catch (error) {
        console.error('Error deleting works by creator:', error);
        return 0;
    }
}