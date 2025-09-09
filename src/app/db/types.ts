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
} from './schema';

// Basic table types
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

export type Asset = InferSelectModel<typeof asset>;
export type NewAsset = InferInsertModel<typeof asset>;

export type WorkCreator = InferSelectModel<typeof workCreator>;
export type NewWorkCreator = InferInsertModel<typeof workCreator>;

export type AssetCreator = InferSelectModel<typeof assetCreator>;
export type NewAssetCreator = InferInsertModel<typeof assetCreator>;

export type WorkRelation = InferSelectModel<typeof workRelation>;
export type NewWorkRelation = InferInsertModel<typeof workRelation>;

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

export interface AssetWithCreators extends Asset {
    creator: CreatorWithRole[];
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
    media_sources: MediaSource[];
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
export type CopyrightBasis = 'none' | 'accept' | 'license';
export type CreatorType = 'human' | 'virtual';
export type AssetType = 'lyrics' | 'picture';
export type RelationType = 'original' | 'remix' | 'cover' | 'remake' | 'picture' | 'lyrics';
export type FooterItemType = 'link' | 'social' | 'copyright';

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