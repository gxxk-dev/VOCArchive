// 管理后台数据类型定义
// Admin Data Type Definitions

import type {
    WorkInfo,
    CreatorInfo,
    TagInfo,
    TagWithCount,
    CategoryInfo,
    CategoryWithCount,
    MediaSource,
    Asset
} from './page-data'

/**
 * 表单选项
 */
export interface FormOptions {
    creators: CreatorInfo[]
    tags: TagWithCount[]
    categories: CategoryWithCount[]
    works: WorkInfo[]
    allExternalSources: ExternalSource[]
    allExternalObjects: ExternalObject[]
}

/**
 * 外部存储源
 */
export interface ExternalSource {
    id: number
    uuid: string
    name: string
    endpoint: string | null
    storage_type: 'raw_url' | 'ipfs'
    created_at: string
    updated_at: string
}

/**
 * 外部对象
 */
export interface ExternalObject {
    id: number
    uuid: string
    external_source_uuid: string
    object_key: string
    created_at: string
    updated_at: string
}

/**
 * 作品关系
 */
export interface WorkRelation {
    id: number
    uuid: string
    from_work_uuid: string
    to_work_uuid: string
    relation_type: 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics'
    created_at: string
    updated_at: string
}

/**
 * 站点配置项
 */
export interface SiteConfigItem {
    key: string
    value: string
    created_at: string
    updated_at: string
}

/**
 * Wiki 平台
 */
export interface WikiPlatform {
    platform_key: string
    name: string
    url_pattern: string
    created_at: string
    updated_at: string
}

/**
 * 页脚设置
 */
export interface FooterSettingsItem {
    id: number
    uuid: string
    enabled: boolean
    content: string | null
    created_at: string
    updated_at: string
}

/**
 * 资产数据(带作品标签和分类)
 */
export interface AssetWithWorkInfo {
    asset: Asset
    work_tags: { uuid: string; name: string }[]
    work_categories: { uuid: string; name: string }[]
}

/**
 * 媒体源数据(带作品标签和分类)
 */
export interface MediaWithWorkInfo {
    media: MediaSource
    work_tags: { uuid: string; name: string }[]
    work_categories: { uuid: string; name: string }[]
}

/**
 * 编辑器数据类型(联合类型)
 */
export type EditorData =
    | WorkInfo
    | CreatorInfo
    | TagInfo
    | CategoryInfo
    | AssetWithWorkInfo
    | Asset
    | MediaWithWorkInfo
    | MediaSource
    | WorkRelation
    | ExternalSource
    | ExternalObject
    | SiteConfigItem
    | WikiPlatform
    | FooterSettingsItem
    | undefined

/**
 * 编辑器完整数据
 */
export interface EditorFullData {
    data: EditorData
    options: FormOptions
}
