import { eq, count } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { workRelation, work } from '../schema';
import type { WorkRelationApiInput } from '../types';
import { workIndexToId, workIdToIndex } from '../utils/index-id-converter';
import { validateIndex } from '../utils';

// Types for API compatibility
export interface WorkRelation {
    index: string;
    from_work_index: string;
    to_work_index: string;
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
}

/**
 * Get relation by index 
 */
export async function getRelationByIndex(db: DrizzleDB, relationindex: string): Promise<WorkRelation | null> {
    if (!validateIndex(relationindex)) return null;

    const result = await db
        .select({
            index: workRelation.index,
            from_work_id: workRelation.from_work_id,
            to_work_id: workRelation.to_work_id,
            relation_type: workRelation.relation_type,
        })
        .from(workRelation)
        .where(eq(workRelation.index, relationindex))
        .limit(1);

    if (!result[0]) return null;

    // Convert IDs back to UUIDs for API compatibility
    const fromWorkindex = await workIdToIndex(db, result[0].from_work_id);
    const toWorkindex = await workIdToIndex(db, result[0].to_work_id);

    if (!fromWorkindex || !toWorkindex) return null;

    return {
        index: result[0].index,
        from_work_index: fromWorkindex,
        to_work_index: toWorkindex,
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
            index: workRelation.index,
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
            const fromWorkindex = await workIdToIndex(db, relation.from_work_id);
            const toWorkindex = await workIdToIndex(db, relation.to_work_id);

            if (!fromWorkindex || !toWorkindex) {
                return null; // Skip invalid relations
            }

            return {
                index: relation.index,
                from_work_index: fromWorkindex,
                to_work_index: toWorkindex,
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
    if (!validateIndex(relationData.index) ||
            !validateIndex(relationData.from_work_index) ||
            !validateIndex(relationData.to_work_index)) {
        return false;
    }

    try {
        // Convert work UUIDs to IDs
        const fromWorkId = await workIndexToId(db, relationData.from_work_index);
        const toWorkId = await workIndexToId(db, relationData.to_work_index);

        if (!fromWorkId || !toWorkId) {
            console.error('Invalid work UUIDs provided');
            return false;
        }

        await db.insert(workRelation).values({
            index: relationData.index,
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
    relationindex: string,
    relationData: WorkRelationApiInput
): Promise<boolean> {
    if (!validateIndex(relationindex) ||
            !validateIndex(relationData.from_work_index) ||
            !validateIndex(relationData.to_work_index)) {
        return false;
    }

    try {
        // Convert work UUIDs to IDs
        const fromWorkId = await workIndexToId(db, relationData.from_work_index);
        const toWorkId = await workIndexToId(db, relationData.to_work_index);

        if (!fromWorkId || !toWorkId) {
            console.error('Invalid work UUIDs provided');
            return false;
        }

        // Check if index is being changed
        const newIndex = relationData.index;
        if (newIndex && newIndex !== relationindex) {
            // Validate new index
            if (!validateIndex(newIndex)) {
                throw new Error(`Invalid new index: ${newIndex}`);
            }

            // Check if new index already exists
            const existingRelation = await db
                .select({ id: workRelation.id })
                .from(workRelation)
                .where(eq(workRelation.index, newIndex))
                .limit(1);

            if (existingRelation.length > 0) {
                throw new Error(`Index already exists: ${newIndex}`);
            }

            // Update relation with new index and other fields
            await db
                .update(workRelation)
                .set({
                    index: newIndex,
                    from_work_id: fromWorkId,
                    to_work_id: toWorkId,
                    relation_type: relationData.relation_type,
                })
                .where(eq(workRelation.index, relationindex));
        } else {
            // Update relation without changing index
            await db
                .update(workRelation)
                .set({
                    from_work_id: fromWorkId,
                    to_work_id: toWorkId,
                    relation_type: relationData.relation_type,
                })
                .where(eq(workRelation.index, relationindex));
        }

        return true;
    } catch (error) {
        console.error('Error updating relation:', error);
        return false;
    }
}

/**
 * Delete a work relation
 */
export async function deleteRelation(db: DrizzleDB, relationindex: string): Promise<boolean> {
    if (!validateIndex(relationindex)) return false;

    try {
        await db.delete(workRelation).where(eq(workRelation.index, relationindex));
        return true;
    } catch (error) {
        console.error('Error deleting relation:', error);
        return false;
    }
}