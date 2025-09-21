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
export * as ExternalSourceOperations from './operations/external_source';
export * as ExternalObjectOperations from './operations/external_object';

// Convenience re-exports of common functions
export {
    // Work operations
    getWorkListWithPagination,
    getWorkByUUID,
    getTotalWorkCount,
    inputWork,
    updateWork,
    deleteWork
} from './operations/work';

export {
    // Creator operations
    getCreatorByUUID,
    listCreators,
    inputCreator,
    updateCreator,
    deleteCreator
} from './operations/creator';

export {
    // Media operations
    getMediaByUUID,
    listMedia,
    inputMedia,
    updateMedia,
    deleteMedia,
    getFileURLByUUIDWithExternalStorage
} from './operations/media';

export {
    // Asset operations
    getAssetByUUID,
    listAssets,
    inputAsset,
    updateAsset,
    deleteAsset
} from './operations/asset';

export {
    // Tag operations
    listTags,
    getTagByUUID,
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
    getCategoryByUUID,
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
    getWorkTitleByUUID,
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
    // External source operations
    getExternalSourceByUUID,
    listExternalSources,
    inputExternalSource,
    updateExternalSource,
    deleteExternalSource,
    getExternalSourceCount
} from './operations/external_source';

export {
    // External object operations
    getExternalObjectByUUID,
    listExternalObjects,
    getExternalObjectsBySource,
    inputExternalObject,
    updateExternalObject,
    deleteExternalObject,
    getExternalObjectCount,
    buildExternalObjectURL
} from './operations/external_object';