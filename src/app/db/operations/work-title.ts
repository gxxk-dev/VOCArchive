import { generateIndex } from '../utils/index-utils';
﻿import { eq, and } from 'drizzle-orm';
import type { DrizzleDB } from '../client';
import { workTitle, work } from '../schema';
import { workIndexToId, workIdToIndex } from '../utils/index-id-converter';
import { validateIndex } from '../utils';

import { WorkTitle, WorkTitleApi, WorkTitleInput, WorkTitleUpdate } from '../types';

/**
 * Get a single work title by index 
 */
export async function getWorkTitleByIndex(db: DrizzleDB, titleindex: string): Promise<WorkTitleApi | null> {
    if (!validateIndex(titleindex)) {
        return null;
    }

    try {
        const result = await db
            .select({
                index: workTitle.index,
                work_id: workTitle.work_id,
                is_official: workTitle.is_official,
                is_for_search: workTitle.is_for_search,
                language: workTitle.language,
                title: workTitle.title,
            })
            .from(workTitle)
            .where(eq(workTitle.index, titleindex))
            .limit(1);

        if (!result[0]) return null;

        // Convert work ID back to index for API compatibility
        const workindex = await workIdToIndex(db, result[0].work_id);
        if (!workindex) return null;

        return {
            index: result[0].index,
            work_index: workindex,
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
 * List all work titles for a specific work index 
 */
export async function listWorkTitles(db: DrizzleDB, workindex: string, includeForSearch: boolean = true): Promise<WorkTitleApi[]> {
    if (!validateIndex(workindex)) {
        return [];
    }

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return [];

        const query = db
            .select({
                index: workTitle.index,
                work_id: workTitle.work_id,
                is_official: workTitle.is_official,
                is_for_search: workTitle.is_for_search,
                language: workTitle.language,
                title: workTitle.title,
            })
            .from(workTitle)
            .where(eq(workTitle.work_id, workId));

        const allTitles = await query;

        // Convert to API format with work index 
        const titlesWithWorkindex = allTitles.map(title => ({
            index: title.index,
            work_index: workindex,
            is_official: title.is_official,
            is_for_search: title.is_for_search,
            language: title.language,
            title: title.title,
        }));

        // Filter out ForSearch titles if not explicitly requested
        if (!includeForSearch) {
            return titlesWithWorkindex.filter(title => !title.is_for_search);
        }

        return titlesWithWorkindex;
    } catch (error) {
        console.error('Error listing work titles:', error);
        return [];
    }
}

/**
 * Create a new work title
 */
export async function inputWorkTitle(db: DrizzleDB, titleData: WorkTitleInput): Promise<string | null> {
    if (!validateIndex(titleData.work_index)) {
        return null;
    }

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, titleData.work_index);
        if (!workId) {
            console.error('Work not found:', titleData.work_index);
            return null;
        }

        const titleindex = generateIndex();

        await db.insert(workTitle).values({
            index: titleindex,
            work_id: workId,
            is_official: titleData.is_official,
            is_for_search: titleData.is_for_search || false,
            language: titleData.language,
            title: titleData.title,
        });

        return titleindex;
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
    titleindex: string,
    updates: WorkTitleUpdate
): Promise<boolean> {
    if (!validateIndex(titleindex)) {
        return false;
    }

    // Check if title exists
    const existingTitle = await db
        .select({ index: workTitle.index })
        .from(workTitle)
        .where(eq(workTitle.index, titleindex))
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
            .where(eq(workTitle.index, titleindex));

        return true;
    } catch (error) {
        console.error('Error updating work title:', error);
        return false;
    }
}

/**
 * Delete a work title
 */
export async function deleteWorkTitle(db: DrizzleDB, titleindex: string): Promise<boolean> {
    if (!validateIndex(titleindex)) {
        return false;
    }

    try {
        // Check if title exists
        const existingTitle = await db
            .select({ index: workTitle.index })
            .from(workTitle)
            .where(eq(workTitle.index, titleindex))
            .limit(1);

        if (existingTitle.length === 0) {
            return false;
        }

        await db.delete(workTitle).where(eq(workTitle.index, titleindex));
        return true;
    } catch (error) {
        console.error('Error deleting work title:', error);
        return false;
    }
}

/**
 * Get total count of work titles for a work
 */
export async function getWorkTitleCount(db: DrizzleDB, workindex: string): Promise<number> {
    if (!validateIndex(workindex)) {
        return 0;
    }

    try {
        // Convert work index to ID
        const workId = await workIndexToId(db, workindex);
        if (!workId) return 0;

        const result = await db
            .select({ index: workTitle.index })
            .from(workTitle)
            .where(eq(workTitle.work_id, workId));

        return result.length;
    } catch (error) {
        console.error('Error getting work title count:', error);
        return 0;
    }
}