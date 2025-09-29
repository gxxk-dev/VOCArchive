// Utility functions for database operations

import type {
    AssetApi,
    CategoryApi,
    CreatorWithRole
} from './types';

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
    uuid: string;
    file_id?: string;
    work_uuid: string;
    asset_type: 'lyrics' | 'picture';
    file_name: string;
    is_previewpic: boolean | null;
    language: string | null;
}): AssetApi {
    return {
        uuid: asset.uuid,
        work_uuid: asset.work_uuid,
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
    uuid: string;
    name: string;
    parent_uuid: string | null;
}): CategoryApi {
    return {
        uuid: category.uuid,
        name: category.name,
        parent_uuid: nullToUndefined(category.parent_uuid),
    };
}

/**
 * Convert creator data from database format to interface format
 */
export function convertCreatorData(creator: {
    creator_uuid: string;
    creator_name: string | null;
    creator_type: 'human' | 'virtual' | null;
    role: string | null;
}): CreatorWithRole | null {
    // Only return if we have the required fields
    if (!creator.creator_type || !creator.role) {
        return null;
    }
    
    return {
        creator_uuid: creator.creator_uuid,
        creator_name: nullToUndefined(creator.creator_name),
        creator_type: creator.creator_type,
        role: creator.role,
    };
}