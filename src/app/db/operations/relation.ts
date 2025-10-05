import { eq, count } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { workRelation, work } from '../schema';
import type { WorkRelationApiInput } from '../types';
import { workUuidToId, workIdToUuid } from '../utils/uuid-id-converter';
import { validateUUID } from '../utils';

// Types for API compatibility
export interface WorkRelation {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

/**
 * Get relation by UUID
 */
export async function getRelationByUUID(db: DrizzleDB, relationUuid: string): Promise<WorkRelation | null> {
    if (!validateUUID(relationUuid)) return null;

    const result = await db
        .select({
            uuid: workRelation.uuid,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .where(eq(workRelation.uuid, relationUuid))
        .limit(1);

    if (!result[0]) return null;

    // Convert IDs back to UUIDs for API compatibility
    const fromWorkUuid = await workIdToUuid(db, result[0].from_work_id);
    const toWorkUuid = await workIdToUuid(db, result[0].to_work_id);

    if (!fromWorkUuid || !toWorkUuid) return null;

    return {
        uuid: result[0].uuid,
        from_work_uuid: fromWorkUuid,
        to_work_uuid: toWorkUuid,
        relation_type: result[0].relation_type,
    };
}

/**
 * List all relations with pagination
 */
export async function listRelations(db: DrizzleDB, page: number, pageSize: number): Promise<WorkRelation[]> {
    if (page < 1 || pageSize < 1) return [];

    const offset = (page - 1) * pageSize;

    const relations = await db
        .select({
            uuid: workRelation.uuid,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .limit(pageSize)
        .offset(offset);

    // Convert IDs back to UUIDs for API compatibility
    const relationsWithUuids = await Promise.all(
        relations.map(async (relation) => {
            const fromWorkUuid = await workIdToUuid(db, relation.from_work_id);
            const toWorkUuid = await workIdToUuid(db, relation.to_work_id);

            if (!fromWorkUuid || !toWorkUuid) {
                return null; // Skip invalid relations
            }

            return {
                uuid: relation.uuid,
                from_work_uuid: fromWorkUuid,
                to_work_uuid: toWorkUuid,
                relation_type: relation.relation_type,
            };
        })
    );

    // Filter out null results
    return relationsWithUuids.filter((relation): relation is WorkRelation => relation !== null);
}

/**
 * Create a new work relation
 */
export async function inputRelation(db: DrizzleDB, relationData: WorkRelationApiInput): Promise<boolean> {
    if (!validateUUID(relationData.uuid) ||
            !validateUUID(relationData.from_work_uuid) ||
            !validateUUID(relationData.to_work_uuid)) {
        return false;
    }

    try {
        // Convert work UUIDs to IDs
        const fromWorkId = await workUuidToId(db, relationData.from_work_uuid);
        const toWorkId = await workUuidToId(db, relationData.to_work_uuid);

        if (!fromWorkId || !toWorkId) {
            console.error('Invalid work UUIDs provided');
            return false;
        }

        await db.insert(workRelation).values({
            uuid: relationData.uuid,
            from_work_id: fromWorkId,
            to_work_id: toWorkId,
            relation_type: relationData.relation_type,
        });
        return true;
    } catch (error) {
        console.error('Error creating relation:', error);
        return false;
    }
}

/**
 * Update a work relation
 */
export async function updateRelation(
    db: DrizzleDB,
    relationUuid: string,
    relationData: Omit<WorkRelationApiInput, 'uuid'>
): Promise<boolean> {
    if (!validateUUID(relationUuid) ||
            !validateUUID(relationData.from_work_uuid) ||
            !validateUUID(relationData.to_work_uuid)) {
        return false;
    }

    try {
        // Convert work UUIDs to IDs
        const fromWorkId = await workUuidToId(db, relationData.from_work_uuid);
        const toWorkId = await workUuidToId(db, relationData.to_work_uuid);

        if (!fromWorkId || !toWorkId) {
            console.error('Invalid work UUIDs provided');
            return false;
        }

        await db
            .update(workRelation)
            .set({
                from_work_id: fromWorkId,
                to_work_id: toWorkId,
                relation_type: relationData.relation_type,
            })
            .where(eq(workRelation.uuid, relationUuid));
        return true;
    } catch (error) {
        console.error('Error updating relation:', error);
        return false;
    }
}

/**
 * Delete a work relation
 */
export async function deleteRelation(db: DrizzleDB, relationUuid: string): Promise<boolean> {
    if (!validateUUID(relationUuid)) return false;

    try {
        await db.delete(workRelation).where(eq(workRelation.uuid, relationUuid));
        return true;
    } catch (error) {
        console.error('Error deleting relation:', error);
        return false;
    }
}