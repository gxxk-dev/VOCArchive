// Database client
export { createDrizzleClient, type DrizzleDB } from './client';

// Schema exports
export * from './schema';

// Operation modules
export * as WorkOperations from './operations/work';
export * as CreatorOperations from './operations/creator';
export * as MediaOperations from './operations/media';
export * as AssetOperations from './operations/asset';
export * as TagOperations from './operations/tag';
export * as CategoryOperations from './operations/category';
export * as WorkTitleOperations from './operations/work-title';
export * as SearchOperations from './operations/search';
export * as AdminOperations from './operations/admin';
export * as ConfigOperations from './operations/config';
export * as ExternalSourceOperations from './operations/external_source';
export * as ExternalObjectOperations from './operations/external_object';

// Convenience re-exports of common functions
export {
    // Work operations
    getWorkListWithPagination,
    getWorkByIndex,
    getTotalWorkCount,
    inputWork,
    updateWork,
    deleteWork
} from './operations/work';

export {
    // Creator operations
    getCreatorByIndex,
    listCreators,
    inputCreator,
    updateCreator,
    deleteCreator
} from './operations/creator';

export {
    // Media operations
    getMediaByIndex,
    listMedia,
    inputMedia,
    updateMedia,
    deleteMedia,
    getFileURLByIndexWithExternalStorage
} from './operations/media';

export {
    // Asset operations
    getAssetByIndex,
    listAssets,
    inputAsset,
    updateAsset,
    deleteAsset
} from './operations/asset';

export {
    // Tag operations
    listTags,
    getTagByIndex,
    getWorksByTag,
    getWorkCountByTag,
    inputTag,
    updateTag,
    deleteTag,
    addWorkTags,
    removeWorkTags,
    removeAllWorkTags
} from './operations/tag';

export {
    // Category operations
    listCategories,
    getCategoryByIndex,
    getWorksByCategory,
    getWorkCountByCategory,
    inputCategory,
    updateCategory,
    deleteCategory,
    addWorkCategories,
    removeWorkCategories,
    removeAllWorkCategories
} from './operations/category';

export {
    // Work title operations
    getWorkTitleByIndex,
    listWorkTitles,
    inputWorkTitle,
    updateWorkTitle,
    deleteWorkTitle,
    getWorkTitleCount
} from './operations/work-title';

export {
    // Search operations
    searchWorks,
    searchWorksByTitle,
    searchWorksByCreator,
    getAvailableLanguages
} from './operations/search';

export {
    // Admin operations
    getFooterSettings,
    insertFooterSetting,
    updateFooterSetting,
    deleteFooterSetting,
    clearUserDataTables,
    exportAllTables,
    initializeDatabaseWithMigrations
} from './operations/admin';

export {
    // Config operations
    getSiteConfig,
    getPublicSiteConfig,
    upsertSiteConfig,
    getIPFSGateways,
    updateIPFSGateways,
    addIPFSGateway,
    removeIPFSGateway,
    initializeDefaultIPFSGateways,
    initializeDefaultConfig
} from './operations/config';

export {
    // External source operations
    getExternalSourceByIndex,
    listExternalSources,
    inputExternalSource,
    updateExternalSource,
    deleteExternalSource,
    getExternalSourceCount,
    getIPFSSourcesByName
} from './operations/external_source';

export {
    // External object operations
    getExternalObjectByIndex,
    listExternalObjects,
    getExternalObjectsBySource,
    inputExternalObject,
    updateExternalObject,
    deleteExternalObject,
    getExternalObjectCount,
    buildExternalObjectURL,
    buildExternalObjectURLWithLoadBalancing
} from './operations/external_object';