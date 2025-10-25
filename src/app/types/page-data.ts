// 页面数据类型定义
// Page Data Type Definitions

/**
 * 作品信息(基础)
 */
export interface WorkInfo {
    id: number
    index: string
    copyright_basis: string | null
    issue_date: string | null
    created_at: string
    updated_at: string
    titles?: WorkTitle[]
    creators?: WorkCreator[]
    tags?: TagInfo[]
    categories?: CategoryInfo[]
    mediaSources?: MediaSource[]
    assets?: Asset[]
}

/**
 * 作品标题
 */
export interface WorkTitle {
    id: number
    work_id: number
    language: string
    title: string
    is_official: boolean
    is_for_search: boolean
}

/**
 * 作品创作者关联
 */
export interface WorkCreator {
    role: string
    creator: CreatorInfo
}

/**
 * 创作者信息
 */
export interface CreatorInfo {
    id: number
    index: string
    name: string
    type: 'human' | 'virtual'
    created_at: string
    updated_at: string
}

/**
 * 标签信息
 */
export interface TagInfo {
    id: number
    index: string
    name: string
    created_at: string
    updated_at: string
}

/**
 * 带计数的标签信息
 */
export interface TagWithCount extends TagInfo {
    workCount: number
}

/**
 * 分类信息
 */
export interface CategoryInfo {
    id: number
    index: string
    name: string
    parent_id: number | null
    created_at: string
    updated_at: string
}

/**
 * 带计数的分类信息
 */
export interface CategoryWithCount extends CategoryInfo {
    workCount: number
}

/**
 * 媒体源信息
 */
export interface MediaSource {
    id: number
    index: string
    work_index: string
    is_music: boolean
    duration: number | null
    created_at: string
    updated_at: string
}

/**
 * 资产信息
 */
export interface Asset {
    id: number
    index: string
    work_index: string
    asset_type: 'lyrics' | 'picture'
    is_previewpic: boolean
    created_at: string
    updated_at: string
}

/**
 * 页脚设置
 */
export interface FooterSettings {
    id: number
    index: string
    enabled: boolean
    content: string | null
    created_at: string
    updated_at: string
}

/**
 * 站点配置
 */
export interface SiteConfig {
    site_title?: string
    asset_url?: string
    [key: string]: string | undefined
}

/**
 * 语言信息
 */
export interface LanguageInfo {
    language: string
    count: number
}

/**
 * 过滤信息
 */
export interface FilterInfo {
    type: 'tag' | 'category'
    name: string
    index: string
}

/**
 * 首页数据
 */
export interface IndexPageData {
    works: WorkInfo[]
    footerSettings: FooterSettings | null
    siteConfig: SiteConfig
    currentPage: number
    totalCount: number
    pageSize: number
    filterInfo: FilterInfo | null
    searchQuery: string
    preferredLanguage: string
    availableLanguages: LanguageInfo[]
}

/**
 * 播放器页面数据
 */
export interface PlayerPageData {
    workInfo: WorkInfo
    footerSettings: FooterSettings | null
    siteConfig: SiteConfig
}

/**
 * 标签分类页面数据
 */
export interface TagsCategoriesPageData {
    tags: TagWithCount[]
    categories: CategoryWithCount[]
    footerSettings: FooterSettings | null
    siteConfig: SiteConfig
    availableLanguages: LanguageInfo[]
    preferredLanguage: string
}

/**
 * 管理后台主页数据
 */
export interface AdminPageData {
    footerSettings: FooterSettings | null
    activeTab: string
}

/**
 * 简单页面数据
 */
export interface SimplePageData {
    footerSettings: FooterSettings | null
}
