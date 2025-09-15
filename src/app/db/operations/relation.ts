import { eq, count } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { workRelation } from '../schema';

// Types
export interface WorkRelation {
    uuid: string;
    from_work_uuid: string;
    to_work_uuid: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get relation by UUID
 */
export async function getRelationByUUID(db: DrizzleDB, relationUuid: string): Promise<WorkRelation | null> {
    if (!validateUUID(relationUuid)) return null;

    const result = await db
        .select({
            uuid: workRelation.uuid,
            from_work_uuid: workRelation.from_work_uuid,
            to_work_uuid: workRelation.to_work_uuid,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .where(eq(workRelation.uuid, relationUuid))
        .limit(1);

    return result[0] || null;
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
            from_work_uuid: workRelation.from_work_uuid,
            to_work_uuid: workRelation.to_work_uuid,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .limit(pageSize)
        .offset(offset);

    return relations;
}

/**
 * Create a new work relation
 */
export async function inputRelation(db: DrizzleDB, relationData: WorkRelation): Promise<boolean> {
    if (!validateUUID(relationData.uuid) || 
            !validateUUID(relationData.from_work_uuid) || 
            !validateUUID(relationData.to_work_uuid)) {
        return false;
    }

    try {
        await db.insert(workRelation).values({
            uuid: relationData.uuid,
            from_work_uuid: relationData.from_work_uuid,
            to_work_uuid: relationData.to_work_uuid,
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
    relationData: Omit<WorkRelation, 'uuid'>
): Promise<boolean> {
    if (!validateUUID(relationUuid) || 
            !validateUUID(relationData.from_work_uuid) || 
            !validateUUID(relationData.to_work_uuid)) {
        return false;
    }

    try {
        await db
            .update(workRelation)
            .set({
                from_work_uuid: relationData.from_work_uuid,
                to_work_uuid: relationData.to_work_uuid,
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