import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import {
    creator,
    creatorWiki,
    work,
    workTitle,
    workLicense,
    mediaSource,
    asset,
    workCreator,
    assetCreator,
    workRelation,
    workWiki,
    tag,
    category,
    workTag,
    workCategory,
    footerSettings,
    externalSource,
    externalObject,
    siteConfig,
} from '../schema';

// Basic table types from new schema (with ID primary keys)
export type Creator = InferSelectModel<typeof creator>;
export type NewCreator = InferInsertModel<typeof creator>;

export type CreatorWiki = InferSelectModel<typeof creatorWiki>;
export type NewCreatorWiki = InferInsertModel<typeof creatorWiki>;

export type Work = InferSelectModel<typeof work>;
export type NewWork = InferInsertModel<typeof work>;

export type WorkTitle = InferSelectModel<typeof workTitle>;
export type NewWorkTitle = InferInsertModel<typeof workTitle>;

export type WorkLicense = InferSelectModel<typeof workLicense>;
export type NewWorkLicense = InferInsertModel<typeof workLicense>;

export type MediaSource = InferSelectModel<typeof mediaSource>;
export type NewMediaSource = InferInsertModel<typeof mediaSource>;

// Application-layer MediaSource type that excludes redundant fields
export type MediaSourceForApplication = Omit<MediaSource, 'url'>;

// Custom type for media source input where url is optional (redundant with external objects)
export type MediaSourceInput = Omit<NewMediaSource, 'url'> & {
    url?: string | null;
};

// API-compatible input types (still accept UUID but convert to ID internally)
export type MediaSourceApiInput = Omit<MediaSourceInput, 'work_id'> & {
    work_uuid: string; // API still accepts UUID
};

export type MediaSourceForDatabase = Omit<NewMediaSource, 'url'> & {
    work_id: number; // Database expects ID
    url?: string | null;
};

export type Asset = InferSelectModel<typeof asset>;
export type NewAsset = InferInsertModel<typeof asset>;

// Application-layer Asset type that excludes redundant fields
export type AssetForApplication = Omit<Asset, 'file_id'>;

// Custom type for asset input where file_id is optional (redundant with external objects)
export type AssetInput = Omit<NewAsset, 'file_id'> & {
    file_id?: string | null;
};

// API-compatible input types
export type AssetApiInput = Omit<AssetInput, 'work_id'> & {
    work_uuid: string; // API still accepts UUID
};

export type WorkCreator = InferSelectModel<typeof workCreator>;
export type NewWorkCreator = InferInsertModel<typeof workCreator>;

// API-compatible work creator input
export type WorkCreatorApiInput = {
    work_uuid: string;
    creator_uuid: string;
    role: string;
};

export type AssetCreator = InferSelectModel<typeof assetCreator>;
export type NewAssetCreator = InferInsertModel<typeof assetCreator>;

// API-compatible asset creator input
export type AssetCreatorApiInput = {
    asset_uuid: string;
    creator_uuid: string;
    role: string;
};

export type WorkRelation = InferSelectModel<typeof workRelation>;
export type NewWorkRelation = InferInsertModel<typeof workRelation>;

// API-compatible work relation input
export type WorkRelationApiInput = Omit<WorkRelation, 'id' | 'from_work_id' | 'to_work_id'> & {
    from_work_uuid: string;
    to_work_uuid: string;
};

export type WorkWiki = InferSelectModel<typeof workWiki>;
export type NewWorkWiki = InferInsertModel<typeof workWiki>;

export type Tag = InferSelectModel<typeof tag>;
export type NewTag = InferInsertModel<typeof tag>;

export type Category = InferSelectModel<typeof category>;
export type NewCategory = InferInsertModel<typeof category>;

export type WorkTag = InferSelectModel<typeof workTag>;
export type NewWorkTag = InferInsertModel<typeof workTag>;

export type WorkCategory = InferSelectModel<typeof workCategory>;
export type NewWorkCategory = InferInsertModel<typeof workCategory>;

export type FooterSettings = InferSelectModel<typeof footerSettings>;
export type NewFooterSettings = InferInsertModel<typeof footerSettings>;

export type ExternalSource = InferSelectModel<typeof externalSource>;
export type NewExternalSource = InferInsertModel<typeof externalSource>;

// API-compatible external source input (still accepts UUID)
export type ExternalSourceApiInput = Omit<NewExternalSource, 'id'> & {
    uuid: string;
    type: 'raw_url' | 'ipfs';
    name: string;
    endpoint: string;
};

export type ExternalObject = InferSelectModel<typeof externalObject>;
export type NewExternalObject = InferInsertModel<typeof externalObject>;

// API-compatible external object input
export type ExternalObjectApiInput = Omit<NewExternalObject, 'id' | 'external_source_id'> & {
    uuid: string;
    external_source_uuid: string; // API accepts UUID
    mime_type: string;
    file_id: string;
};

export type SiteConfig = InferSelectModel<typeof siteConfig>;
export type NewSiteConfig = InferInsertModel<typeof siteConfig>;

// Site configuration key enum
export type SiteConfigKey =
    | 'site_title'            // 网站标题（HTML title）
    | 'home_title'            // 主页标题
    | 'player_title'          // 播放器页标题
    | 'admin_title'           // 管理后台标题
    | 'tags_categories_title' // 标签分类页标题
    | 'migration_title'       // 迁移页面标题
    | 'totp_secret'           // TOTP 密钥
    | 'jwt_secret'            // JWT 密钥
    | 'db_version';           // 数据库版本号

// Composite types for complex queries (matching existing interfaces)

export interface WikiRef {
    platform: string;
    identifier: string;
}

export interface CreatorWithRole {
    creator_uuid: string;
    creator_name?: string;
    creator_type: 'human' | 'virtual';
    role: string;
    wikis?: WikiRef[];
}

export interface AssetWithCreators extends AssetForApplication {
    creator: CreatorWithRole[];
    external_objects?: ExternalObject[];
}

export interface MediaSourceWithExternalObjects extends MediaSourceForApplication {
    external_objects?: ExternalObject[];
}

export interface CategoryWithChildren extends Category {
    children?: CategoryWithChildren[];
}

export interface WorkRelationWithTitles extends WorkRelation {
    related_work_titles?: {
        from_work_titles: Array<{ 
            language: string;
            title: string;
        }>;
        to_work_titles: Array<{ 
            language: string;
            title: string;
        }>;
    };
}

export interface WorkInfo {
    work: Work;
    titles: WorkTitle[];
    license?: string;
    media_sources: MediaSourceWithExternalObjects[];
    asset: AssetWithCreators[];
    creator: CreatorWithRole[];
    relation: WorkRelationWithTitles[];
    wikis: WikiRef[];
    tags?: Tag[];
    categories?: Category[];
}

export interface WorkListItem {
    work_uuid: string;
    titles: WorkTitle[];
    preview_asset?: Asset;
    non_preview_asset?: Asset;
    creator: CreatorWithRole[];
    tags: Tag[];
    categories: Category[];
}

// Enum types for better type safety
export type CopyrightBasis = 'none' | 'accept' | 'license' | 'onlymetadata' | 'arr';
export type CreatorType = 'human' | 'virtual';
export type AssetType = 'lyrics' | 'picture';
export type RelationType = 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
export type FooterItemType = 'link' | 'social' | 'copyright';
export type ExternalSourceType = 'raw_url' | 'ipfs';

// Utility types for API responses
export interface PaginationParams {
    page: number;
    pageSize: number;
}

export interface SearchParams {
    query?: string;
    type?: 'title' | 'creator' | 'all';
    language?: string;
}

export interface FilterParams {
    tag?: string;
    category?: string;
    language?: string;
}

// Migration system types
export interface Migration {
    version: number;
    description: string;
    filename?: string;
    upSql?: string;
    downSql?: string;
    parameters?: MigrationParameterDefinition[];
    up: (db: any, parameters?: MigrationParameters) => Promise<void>;
    down?: (db: any, parameters?: MigrationParameters) => Promise<void>;
    requiresParameters?: boolean;
}

export interface MigrationInfo {
    version: number;
    description: string;
    fileName: string;
    status: 'applied' | 'current' | 'pending' | 'available';
    appliedAt?: Date;
    error?: string;
    canExecute?: boolean;
    parameters?: MigrationParameterDefinition[];
    filePath?: string;
}

export interface MigrationResult {
    version: number;
    success: boolean;
    error?: string;
    executionTime?: number;
    rollbackApplied?: boolean;
    duration?: number;
    details?: string;
}

export interface MigrationBatchResult {
    success: boolean;
    results: MigrationResult[];
    totalExecuted: number;
    totalFailed: number;
    rollbacksApplied: number;
    error?: string;
    fromVersion?: number;
    toVersion?: number;
    totalDuration?: number;
}

export interface MigrationSystemStatus {
    currentVersion: number;
    latestVersion: number;
    pendingCount: number;
    needsMigration: boolean;
    migrations: MigrationInfo[];
    status?: any;
    error?: string;
}

export interface MigrationExecuteOptions {
    dryRun?: boolean;
    force?: boolean;
    targetVersion?: number;
    parameters?: Record<number, MigrationParameters>;
    batchSize?: number;
}

export interface MigrationParameterDefinition {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'url';
    description: string;
    required?: boolean;
    defaultValue?: any;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: string[];
    };
}

export interface MigrationParameters {
    [key: string]: any;
}

export interface MigrationParameterRequirement {
    version: number;
    description: string;
    parameters: MigrationParameterDefinition[];
}

export interface BatchParameterRequirements {
    hasUnmetRequirements: boolean;
    requirementsWithParameters: MigrationParameterRequirement[];
    missingParameters?: number[];
}

export interface ParameterValidationResult {
    valid: boolean;
    errors: string[];
    isValid?: boolean; // 向后兼容
    processedValues?: MigrationParameters;
}

export interface MigrationValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    isValid?: boolean; // 向后兼容
}