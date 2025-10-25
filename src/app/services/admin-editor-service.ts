// 管理后台编辑器服务
// Admin Editor Service - 封装编辑器页面的复杂业务逻辑

import type { DrizzleDB } from '../db/client'
import type { FormOptions, EditorData, EditorFullData } from '../types/admin-data'

import { getWorkByIndex, getWorkListWithPagination } from '../db/operations/work'
import { getTagByIndex, listTagsWithCounts } from '../db/operations/tag'
import { getCategoryByIndex, listCategoriesWithCounts } from '../db/operations/category'
import { getFooterByIndex } from '../db/operations/admin'
import { getSiteConfig } from '../db/operations/config'
import { listExternalSources } from '../db/operations/external_source'
import { eq } from 'drizzle-orm'
import { tag, workTag, category, workCategory, work } from '../db/schema'

/**
 * 加载编辑器数据(根据类型和索引)
 *
 * @param db - 数据库客户端
 * @param type - 数据类型
 * @param index - 数据索引
 * @returns 加载的数据,如果不存在则返回 undefined
 */
export async function loadEditorData(
    db: DrizzleDB,
    type: string,
    index?: string
): Promise<EditorData> {
    if (!index || !type) {
        console.log(`New item creation for type: ${type}`);
        return undefined as any;
    }

    console.log(`Loading data for ${type} with index: ${index}`);

    try {
        switch (type) {
            case 'work':
                const workData = await getWorkByIndex(db, index);
                console.log('Loaded work data:', workData);
                return workData as any;

            case 'creator': {
                const { getCreatorByIndex } = await import('../db/operations/creator');
                const creatorData = await getCreatorByIndex(db, index);
                console.log('Loaded creator data:', creatorData);
                return creatorData as any;
            }

            case 'tag':
                const tagData = await getTagByIndex(db, index);
                console.log('Loaded tag data:', tagData);
                return tagData as any;

            case 'category':
                const categoryData = await getCategoryByIndex(db, index);
                console.log('Loaded category data:', categoryData);
                return categoryData as any;

            case 'asset': {
                const { getAssetByIndex } = await import('../db/operations/asset');
                const assetData = await getAssetByIndex(db, index);
                console.log('Loaded asset data:', assetData);

                // 加载作品的标签和分类
                if (assetData && assetData.work_index) {
                    const workTags = await db
                        .select({
                            index: tag.index,
                            name: tag.name,
                        })
                        .from(tag)
                        .innerJoin(workTag, eq(tag.id, workTag.tag_id))
                        .innerJoin(work, eq(workTag.work_id, work.id))
                        .where(eq(work.index, assetData.work_index));

                    const workCategories = await db
                        .select({
                            index: category.index,
                            name: category.name,
                        })
                        .from(category)
                        .innerJoin(workCategory, eq(category.id, workCategory.category_id))
                        .innerJoin(work, eq(workCategory.work_id, work.id))
                        .where(eq(work.index, assetData.work_index));

                    return {
                        asset: assetData as any,
                        work_tags: workTags,
                        work_categories: workCategories
                    } as any;
                }
                return assetData as any;
            }

            case 'media': {
                const { getMediaByIndex } = await import('../db/operations/media');
                const mediaData = await getMediaByIndex(db, index);
                console.log('Loaded media data:', mediaData);

                // 加载作品的标签和分类
                if (mediaData && mediaData.work_index) {
                    const workTags = await db
                        .select({
                            index: tag.index,
                            name: tag.name,
                        })
                        .from(tag)
                        .innerJoin(workTag, eq(tag.id, workTag.tag_id))
                        .innerJoin(work, eq(workTag.work_id, work.id))
                        .where(eq(work.index, mediaData.work_index));

                    const workCategories = await db
                        .select({
                            index: category.index,
                            name: category.name,
                        })
                        .from(category)
                        .innerJoin(workCategory, eq(category.id, workCategory.category_id))
                        .innerJoin(work, eq(workCategory.work_id, work.id))
                        .where(eq(work.index, mediaData.work_index));

                    return {
                        media: mediaData as any,
                        work_tags: workTags,
                        work_categories: workCategories
                    } as any;
                }
                return mediaData as any;
            }

            case 'relation': {
                const { getRelationByIndex } = await import('../db/operations/relation');
                const relationData = await getRelationByIndex(db, index);
                console.log('Loaded relation data:', relationData);
                return relationData as any;
            }

            case 'external_source': {
                const { getExternalSourceByIndex } = await import('../db/operations/external_source');
                const sourceData = await getExternalSourceByIndex(db, index);
                console.log('Loaded external_source data:', sourceData);
                return sourceData as any;
            }

            case 'external_object': {
                const { getExternalObjectByIndex } = await import('../db/operations/external_object');
                const objectData = await getExternalObjectByIndex(db, index);
                console.log('Loaded external_object data:', objectData);
                return objectData as any;
            }

            case 'site_config':
                // Site config 使用 key 而不是 index
                try {
                    const configData = await getSiteConfig(db, index);
                    console.log('Loaded site_config data:', configData);
                    return configData as any;
                } catch (error) {
                    console.error('Error loading site_config:', error);
                    return undefined as any;
                }

            case 'wiki_platform':
                // Wiki platform 使用 platform_key 而不是 index
                try {
                    const { getWikiPlatformByKey } = await import('../db/operations/wiki-platforms');
                    const platformData = await getWikiPlatformByKey(db, index);
                    console.log('Loaded wiki_platform data:', platformData);
                    return platformData as any;
                } catch (error) {
                    console.error('Error loading wiki_platform:', error);
                    return undefined as any;
                }

            case 'footer':
                const footerData = await getFooterByIndex(db, index);
                console.log('Loaded footer data:', footerData);
                return footerData as any;

            default:
                console.warn(`Unsupported type for data loading: ${type}`);
                return undefined as any;
        }
    } catch (error) {
        console.error(`Error loading editor data for type ${type}:`, error);
        return undefined as any;
    }
}

/**
 * 加载表单选项数据(用于下拉框等)
 *
 * @param db - 数据库客户端
 * @param type - 表单类型
 * @returns 表单选项对象
 */
export async function loadFormOptions(
    db: DrizzleDB,
    type: string
): Promise<FormOptions> {
    console.log(`Loading options for type: ${type}`);

    const options: FormOptions = {
        creators: [],
        tags: [],
        categories: [],
        works: [],
        allExternalSources: [],
        allExternalObjects: []
    };

    try {
        // 根据表单类型加载相应的选项数据

        // 加载创作者(work, asset 表单需要)
        if (['work', 'asset'].includes(type)) {
            try {
                const { listCreators } = await import('../db/operations/creator');
                const allCreators = await listCreators(db, 1, 999);
                options.creators = (allCreators || []) as any;
                console.log(`Loaded ${options.creators.length} creators`);
            } catch (error) {
                console.error('Error loading creators:', error);
                options.creators = [];
            }
        }

        // 加载作品(media, asset, relation 表单需要)
        if (['media', 'asset', 'relation'].includes(type)) {
            try {
                const allWorks = await getWorkListWithPagination(db, 1, 999);
                options.works = (allWorks || []) as any;
                console.log(`Loaded ${options.works.length} works`);
            } catch (error) {
                console.error('Error loading works:', error);
                options.works = [];
            }
        }

        // 加载标签和分类(work 表单需要)
        if (type === 'work') {
            try {
                const tags = await listTagsWithCounts(db);
                options.tags = (tags || []) as any;
                console.log(`Loaded ${options.tags.length} tags`);

                const categories = await listCategoriesWithCounts(db);
                options.categories = (categories || []) as any;
                console.log(`Loaded ${options.categories.length} categories`);
            } catch (error) {
                console.error('Error loading tags/categories:', error);
                options.tags = [];
                options.categories = [];
            }
        }

        // 加载分类(category 表单需要,用于父分类选择)
        if (type === 'category') {
            try {
                const categories = await listCategoriesWithCounts(db);
                options.categories = (categories || []) as any;
                console.log(`Loaded ${options.categories.length} categories for parent selection`);
            } catch (error) {
                console.error('Error loading categories:', error);
                options.categories = [];
            }
        }

        // 加载外部存储源(所有表单都可能需要)
        try {
            const externalSources = await listExternalSources(db, 1, 999);
            options.allExternalSources = (externalSources || []) as any;
            console.log(`Loaded ${options.allExternalSources.length} external sources`);
        } catch (error) {
            console.error('Error loading external sources:', error);
            options.allExternalSources = [];
        }

        // 加载外部对象(用于 media 和 asset 表单)
        try {
            const { listExternalObjects } = await import('../db/operations/external_object');
            const externalObjects = await listExternalObjects(db, 1, 999);
            options.allExternalObjects = (externalObjects || []) as any;
            console.log(`Loaded ${options.allExternalObjects.length} external objects`);
        } catch (error) {
            console.error('Error loading external objects:', error);
            options.allExternalObjects = [];
        }

    } catch (error) {
        console.error('Error loading form options:', error);
    }

    return options;
}

/**
 * 加载编辑器所需的完整数据(数据 + 选项)
 *
 * @param db - 数据库客户端
 * @param type - 数据类型
 * @param index - 数据索引(可选,用于编辑已有数据)
 * @returns 包含数据和选项的对象
 */
export async function loadEditorFullData(
    db: DrizzleDB,
    type: string,
    index?: string
): Promise<EditorFullData> {
    const [data, options] = await Promise.all([
        loadEditorData(db, type, index),
        loadFormOptions(db, type)
    ]);

    console.log(`Final data being passed to AdminEditorPage:`, {
        type,
        index,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : [],
        data: data ? JSON.stringify(data, null, 2) : 'undefined'
    });

    return { data, options };
}
