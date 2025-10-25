// Utility functions for database operations

import type {
    AssetApi,
    CategoryApi,
    CreatorWithRole
} from './types';
import { validateIndex as validateIndexFromUtils } from './utils/index-utils';

/**
 * Convert null values to undefined to match interface expectations
 */
export function nullToUndefined<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
}

/**
 * Convert asset data from database format to interface format
 */
export function convertAssetData(asset: {
    index: string;
    file_id?: string;
    work_index: string;
    asset_type: 'lyrics' | 'picture';
    file_name: string;
    is_previewpic: boolean | null;
    language: string | null;
}): AssetApi {
    return {
        index: asset.index,
        work_index: asset.work_index,
        asset_type: asset.asset_type,
        file_name: asset.file_name,
        is_previewpic: nullToUndefined(asset.is_previewpic),
        language: nullToUndefined(asset.language),
    };
}

/**
 * Convert category data from database format to interface format
 */
export function convertCategoryData(category: {
    index: string;
    name: string;
    parent_index: string | null;
}): CategoryApi {
    return {
        index: category.index,
        name: category.name,
        parent_index: nullToUndefined(category.parent_index),
    };
}

/**
 * Convert creator data from database format to interface format
 */
export function convertCreatorData(creator: {
    creator_index: string;
    creator_name: string | null;
    creator_type: 'human' | 'virtual' | null;
    role: string | null;
}): CreatorWithRole | null {
    // Only return if we have the required fields
    if (!creator.creator_type || !creator.role) {
        return null;
    }

    return {
        creator_index: creator.creator_index,
        creator_name: nullToUndefined(creator.creator_name),
        creator_type: creator.creator_type,
        role: creator.role,
    };
}

/**
 * Validate Index format
 */
export function validateIndex(index: string): boolean {
    const result = validateIndexFromUtils(index);
    return result.valid;
}
