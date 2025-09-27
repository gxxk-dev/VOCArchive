import { eq, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { workTitle, work } from '../schema';
import { workUuidToId, workIdToUuid } from '../utils/uuid-id-converter';

// Types
export interface WorkTitle {
    uuid: string;
    work_uuid: string;
    is_official: boolean;
    is_for_search: boolean;
    language: string;
    title: string;
}

export interface WorkTitleInput {
    work_uuid: string;
    is_official: boolean;
    is_for_search?: boolean;
    language: string;
    title: string;
}

export interface WorkTitleUpdate {
    isOfficial?: boolean;
    is_for_search?: boolean;
    language?: string;
    title?: string;
}

// UUID validation
const UUID_PATTERNS = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateUUID(uuid: string): boolean {
    return UUID_PATTERNS.test(uuid);
}

/**
 * Get a single work title by UUID
 */
export async function getWorkTitleByUUID(db: DrizzleDB, titleUuid: string): Promise<WorkTitle | null> {
    if (!validateUUID(titleUuid)) {
        return null;
    }

    try {
        const result = await db
            .select({
                uuid: workTitle.uuid,
                work_id: workTitle.work_id,
                is_official: workTitle.is_official,
                is_for_search: workTitle.is_for_search,
                language: workTitle.language,
                title: workTitle.title,
            })
            .from(workTitle)
            .where(eq(workTitle.uuid, titleUuid))
            .limit(1);

        if (!result[0]) return null;

        // Convert work ID back to UUID for API compatibility
        const workUuid = await workIdToUuid(db, result[0].work_id);
        if (!workUuid) return null;

        return {
            uuid: result[0].uuid,
            work_uuid: workUuid,
            is_official: result[0].is_official,
            is_for_search: result[0].is_for_search,
            language: result[0].language,
            title: result[0].title,
        };
    } catch (error) {
        console.error('Error getting work title:', error);
        return null;
    }
}

/**
 * List all work titles for a specific work UUID
 */
export async function listWorkTitles(db: DrizzleDB, workUuid: string, includeForSearch: boolean = true): Promise<WorkTitle[]> {
    if (!validateUUID(workUuid)) {
        return [];
    }

    try {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return [];

        const query = db
            .select({
                uuid: workTitle.uuid,
                work_id: workTitle.work_id,
                is_official: workTitle.is_official,
                is_for_search: workTitle.is_for_search,
                language: workTitle.language,
                title: workTitle.title,
            })
            .from(workTitle)
            .where(eq(workTitle.work_id, workId));

        const allTitles = await query;

        // Convert to API format with work UUID
        const titlesWithWorkUuid = allTitles.map(title => ({
            uuid: title.uuid,
            work_uuid: workUuid,
            is_official: title.is_official,
            is_for_search: title.is_for_search,
            language: title.language,
            title: title.title,
        }));

        // Filter out ForSearch titles if not explicitly requested
        if (!includeForSearch) {
            return titlesWithWorkUuid.filter(title => !title.is_for_search);
        }

        return titlesWithWorkUuid;
    } catch (error) {
        console.error('Error listing work titles:', error);
        return [];
    }
}

/**
 * Create a new work title
 */
export async function inputWorkTitle(db: DrizzleDB, titleData: WorkTitleInput): Promise<string | null> {
    if (!validateUUID(titleData.work_uuid)) {
        return null;
    }

    try {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, titleData.work_uuid);
        if (!workId) {
            console.error('Work not found:', titleData.work_uuid);
            return null;
        }

        const titleUuid = crypto.randomUUID();

        await db.insert(workTitle).values({
            uuid: titleUuid,
            work_id: workId,
            is_official: titleData.is_official,
            is_for_search: titleData.is_for_search || false,
            language: titleData.language,
            title: titleData.title,
        });

        return titleUuid;
    } catch (error) {
        console.error('Error creating work title:', error);
        return null;
    }
}

/**
 * Update an existing work title
 */
export async function updateWorkTitle(
    db: DrizzleDB,
    titleUuid: string,
    updates: WorkTitleUpdate
): Promise<boolean> {
    if (!validateUUID(titleUuid)) {
        return false;
    }

    // Check if title exists
    const existingTitle = await db
        .select({ uuid: workTitle.uuid })
        .from(workTitle)
        .where(eq(workTitle.uuid, titleUuid))
        .limit(1);

    if (existingTitle.length === 0) {
        return false;
    }

    try {
        // Build update object with only provided fields
        const updateData: any = {};

        if (updates.isOfficial !== undefined) {
            updateData.is_official = updates.isOfficial;
        }
        if (updates.is_for_search !== undefined) {
            updateData.is_for_search = updates.is_for_search;
        }
        if (updates.language !== undefined) {
            updateData.language = updates.language;
        }
        if (updates.title !== undefined) {
            updateData.title = updates.title;
        }

        // Only update if there are changes
        if (Object.keys(updateData).length === 0) {
            return true;
        }

        await db
            .update(workTitle)
            .set(updateData)
            .where(eq(workTitle.uuid, titleUuid));

        return true;
    } catch (error) {
        console.error('Error updating work title:', error);
        return false;
    }
}

/**
 * Delete a work title
 */
export async function deleteWorkTitle(db: DrizzleDB, titleUuid: string): Promise<boolean> {
    if (!validateUUID(titleUuid)) {
        return false;
    }

    try {
        // Check if title exists
        const existingTitle = await db
            .select({ uuid: workTitle.uuid })
            .from(workTitle)
            .where(eq(workTitle.uuid, titleUuid))
            .limit(1);

        if (existingTitle.length === 0) {
            return false;
        }

        await db.delete(workTitle).where(eq(workTitle.uuid, titleUuid));
        return true;
    } catch (error) {
        console.error('Error deleting work title:', error);
        return false;
    }
}

/**
 * Get total count of work titles for a work
 */
export async function getWorkTitleCount(db: DrizzleDB, workUuid: string): Promise<number> {
    if (!validateUUID(workUuid)) {
        return 0;
    }

    try {
        // Convert work UUID to ID
        const workId = await workUuidToId(db, workUuid);
        if (!workId) return 0;

        const result = await db
            .select({ uuid: workTitle.uuid })
            .from(workTitle)
            .where(eq(workTitle.work_id, workId));

        return result.length;
    } catch (error) {
        console.error('Error getting work title count:', error);
        return 0;
    }
}