import type { DrizzleDB } from '../db/client'
import { getWorkListWithPagination } from '../db/operations/work'
import { listCreators } from '../db/operations/creator'
import { listMedia } from '../db/operations/media'
import { listAssets, listRelations } from '../db/operations/work'
import { listTags } from '../db/operations/tag'
import { listCategories } from '../db/operations/category'
import { listExternalSources } from '../db/operations/external_source'
import { listExternalObjects } from '../db/operations/external_object'
import { getFooterSettings } from '../db/operations/admin'
import { getAllSiteConfig } from '../db/operations/config'
import { getAllWikiPlatforms } from '../db/operations/wiki-platforms'

export type AdminDataType =
    | 'work'
    | 'creator'
    | 'media'
    | 'asset'
    | 'relation'
    | 'tag'
    | 'category'
    | 'external_source'
    | 'external_object'
    | 'footer'
    | 'site_config'
    | 'wiki_platform'
    | 'migration'

export interface AdminContentData {
    type: AdminDataType
    data: any
    error?: string
}

/**
 * 统一的数据加载器 - 根据类型获取对应数据
 */
export async function loadAdminData(db: DrizzleDB, type: AdminDataType): Promise<AdminContentData> {
    try {
        let data: any;

        switch (type) {
            case 'work':
                data = await getWorkListWithPagination(db, 1, 999);
                break;

            case 'creator':
                data = await listCreators(db, 1, 999);
                break;

            case 'media':
                data = await listMedia(db, 1, 999);
                break;

            case 'asset':
                data = await listAssets(db, 1, 999);
                break;

            case 'relation':
                data = await listRelations(db, 1, 999);
                break;

            case 'tag':
                data = await listTags(db);
                break;

            case 'category':
                data = await listCategories(db);
                break;

            case 'external_source':
                data = await listExternalSources(db, 1, 999);
                break;

            case 'external_object':
                data = await listExternalObjects(db, 1, 999);
                break;

            case 'footer':
                data = await getFooterSettings(db);
                break;

            case 'site_config':
                data = await getAllSiteConfig(db);
                break;

            case 'wiki_platform':
                data = await getAllWikiPlatforms(db);
                break;

            case 'migration':
                // 迁移管理不需要数据，返回空对象
                data = {};
                break;

            default:
                throw new Error(`Unsupported admin data type: ${type}`);
        }

        return {
            type,
            data
        };

    } catch (error) {
        console.error(`Failed to load admin data for type ${type}:`, error);
        return {
            type,
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * 获取支持的admin数据类型列表
 */
export function getSupportedAdminTypes(): AdminDataType[] {
    return [
        'work',
        'creator',
        'media',
        'asset',
        'relation',
        'tag',
        'category',
        'external_source',
        'external_object',
        'footer',
        'site_config',
        'wiki_platform',
        'migration'
    ];
}

/**
 * 验证admin数据类型是否有效
 */
export function isValidAdminType(type: string): type is AdminDataType {
    return getSupportedAdminTypes().includes(type as AdminDataType);
}