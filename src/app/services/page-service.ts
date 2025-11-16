// 页面数据服务
// Page Data Service - 封装页面数据加载逻辑

import type { DrizzleDB } from '../db/client'
import type {
    IndexPageData,
    PlayerPageData,
    TagsCategoriesPageData,
    AdminPageData,
    SimplePageData
} from '../types/page-data'

import { getFooterSettings } from '../db/operations/admin'
import { getPublicSiteConfig } from '../db/operations/config'
import { getWorkByUUID, getWorkListWithPagination, getTotalWorkCount } from '../db/operations/work'
import { searchWorks, getAvailableLanguages } from '../db/operations/search'
import { getWorksByTag, getWorkCountByTag, getTagByUUID, listTagsWithCounts } from '../db/operations/tag'
import { getWorksByCategory, getWorkCountByCategory, getCategoryByUUID, listCategoriesWithCounts } from '../db/operations/category'

/**
 * 加载首页数据
 *
 * @param db - 数据库客户端
 * @param params - 查询参数 {search, page, type, tag, category, lang}
 * @returns 首页所需的完整数据
 */
export async function loadIndexPageData(
    db: DrizzleDB,
    params: {
        search?: string
        page?: string
        type?: string
        tag?: string
        category?: string
        lang?: string
    }
): Promise<IndexPageData> {
    const { search, page, type, tag, category, lang } = params;
    console.log(search, page, type, tag, category, lang);

    let works;
    let totalCount = 0;
    let filterInfo = null;
    const currentPage = parseInt(page || '1') || 1;
    const pageSize = 10;
    const preferredLanguage = lang || 'auto';

    // 根据不同的查询条件加载作品列表
    if (search) {
        works = await searchWorks(db, search, type as 'title' | 'creator' | 'all' || 'all');
        totalCount = works.length; // Search returns all results
    } else if (tag) {
        works = await getWorksByTag(db, tag, currentPage, pageSize);
        totalCount = await getWorkCountByTag(db, tag);
        const tagInfo = await getTagByUUID(db, tag);
        if (tagInfo) {
            filterInfo = {
                type: 'tag' as const,
                name: tagInfo.name,
                uuid: tag
            };
        }
    } else if (category) {
        works = await getWorksByCategory(db, category, currentPage, pageSize);
        totalCount = await getWorkCountByCategory(db, category);
        const categoryInfo = await getCategoryByUUID(db, category);
        if (categoryInfo) {
            filterInfo = {
                type: 'category' as const,
                name: categoryInfo.name,
                uuid: category
            };
        }
    } else {
        works = await getWorkListWithPagination(db, currentPage, pageSize);
        totalCount = await getTotalWorkCount(db);
    }

    // 并行加载公共数据
    const [footerSettings, siteConfig, availableLanguages] = await Promise.all([
        getFooterSettings(db),
        getPublicSiteConfig(db),
        getAvailableLanguages(db)
    ]);

    return {
        works: works as any,
        footerSettings: footerSettings as any,
        siteConfig,
        currentPage,
        totalCount,
        pageSize,
        filterInfo,
        searchQuery: search || '',
        preferredLanguage,
        availableLanguages: availableLanguages as any
    };
}

/**
 * 加载播放器页面数据
 *
 * @param db - 数据库客户端
 * @param workUuid - 作品UUID
 * @returns 播放器页面数据,如果作品不存在则返回 null
 */
export async function loadPlayerPageData(
    db: DrizzleDB,
    workUuid: string
): Promise<PlayerPageData | null> {
    // 并行加载作品信息和公共数据
    const [workInfo, footerSettings, siteConfig] = await Promise.all([
        getWorkByUUID(db, workUuid),
        getFooterSettings(db),
        getPublicSiteConfig(db)
    ]);

    if (!workInfo) {
        return null;
    }

    return {
        workInfo: workInfo as any,
        footerSettings: footerSettings as any,
        siteConfig
    };
}

/**
 * 加载标签分类页面数据
 *
 * @param db - 数据库客户端
 * @param lang - 语言偏好
 * @returns 标签分类页面数据
 */
export async function loadTagsCategoriesPageData(
    db: DrizzleDB,
    lang?: string
): Promise<TagsCategoriesPageData> {
    const preferredLanguage = lang || 'auto';

    // 并行加载所有数据
    const [tags, categories, footerSettings, siteConfig, availableLanguages] = await Promise.all([
        listTagsWithCounts(db),
        listCategoriesWithCounts(db),
        getFooterSettings(db),
        getPublicSiteConfig(db),
        getAvailableLanguages(db)
    ]);

    return {
        tags: tags as any,
        categories: categories as any,
        footerSettings: footerSettings as any,
        siteConfig,
        availableLanguages: availableLanguages as any,
        preferredLanguage
    };
}

/**
 * 加载管理后台主页数据
 *
 * @param db - 数据库客户端
 * @param tab - 活动标签
 * @returns 管理后台主页数据
 */
export async function loadAdminPageData(
    db: DrizzleDB,
    tab?: string
): Promise<AdminPageData> {
    const footerSettings = await getFooterSettings(db);
    // activeTab 验证在路由层完成,这里只是返回
    return {
        footerSettings: footerSettings as any,
        activeTab: tab || 'work'
    };
}

/**
 * 加载简单页面数据(迁移页面、测试工具页面等)
 *
 * @param db - 数据库客户端
 * @returns 包含页脚设置的数据
 */
export async function loadSimplePageData(db: DrizzleDB): Promise<SimplePageData> {
    const footerSettings = await getFooterSettings(db);
    return { footerSettings: footerSettings as any };
}
