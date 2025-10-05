import { eq, inArray } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { creator, creatorWiki, workCreator, work } from '../schema';
import { creatorUuidToId } from '../utils/uuid-id-converter';
import { enrichWikiReferences } from './wiki-platforms';
import { validateUUID } from '../utils';

import { Creator, CreatorApi, WikiRef } from '../types';

/**
 * Convert Creator (DB layer) to CreatorApi (API layer)
 */
function convertCreatorToApi(creator: Creator): CreatorApi {
    return {
        uuid: creator.uuid,
        name: creator.name,
        type: creator.type,
    };
}

/**
 * Get creator by UUID with wiki references
 */
export async function getCreatorByUUID(
    db: DrizzleDB,
    creatorUuid: string
): Promise<{ creator: CreatorApi, wikis: WikiRef[] } | null> {
    if (!validateUUID(creatorUuid)) {
        return null;
    }

    // Get creator
    const creatorResult = await db
        .select()
        .from(creator)
        .where(eq(creator.uuid, creatorUuid))
        .limit(1);

    if (creatorResult.length === 0) {
        return null;
    }

    // Get wikis
    const wikiRefs = await db
        .select({
            platform: creatorWiki.platform,
            identifier: creatorWiki.identifier,
        })
        .from(creatorWiki)
        .innerJoin(creator, eq(creatorWiki.creator_id, creator.id))
        .where(eq(creator.uuid, creatorUuid));

    // Enrich wiki references with complete URL information
    const wikis = await enrichWikiReferences(db, wikiRefs);

    return {
        creator: convertCreatorToApi(creatorResult[0]),
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
): Promise<CreatorApi[]> {
    if (page < 1 || pageSize < 1) {
        return [];
    }

    const offset = (page - 1) * pageSize;

    const creators = await db
        .select()
        .from(creator)
        .limit(pageSize)
        .offset(offset);

    return creators.map(convertCreatorToApi);
}

/**
 * Create a new creator with wiki references
 */
export async function inputCreator(
    db: DrizzleDB,
    creatorData: CreatorApi,
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
        // Get creator ID for foreign key operations
        const creatorId = await creatorUuidToId(db, creatorData.uuid);
        if (!creatorId) {
            throw new Error(`Creator not found after insert: ${creatorData.uuid}`);
        }

        await db.insert(creatorWiki).values(
            wikis.map(wiki => ({
                creator_id: creatorId,
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
    creatorData: CreatorApi,
    wikis?: WikiRef[]
): Promise<boolean> {
    if (!validateUUID(creatorUuid)) return false;

    try {
        // For D1 compatibility, execute operations sequentially without transactions
        // Get creator ID for foreign key operations
        const creatorId = await creatorUuidToId(db, creatorUuid);
        if (!creatorId) {
            throw new Error(`Creator not found: ${creatorUuid}`);
        }

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
            .where(eq(creatorWiki.creator_id, creatorId));

        // Insert new wiki entries
        if (wikis && wikis.length > 0) {
            await db.insert(creatorWiki).values(
                wikis.map(wiki => ({
                    creator_id: creatorId,
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
            .select({ work_uuid: work.uuid })
            .from(workCreator)
            .innerJoin(creator, eq(workCreator.creator_id, creator.id))
            .innerJoin(work, eq(workCreator.work_id, work.id))
            .where(eq(creator.uuid, creatorUuid));

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