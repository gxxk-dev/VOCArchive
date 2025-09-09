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
export * as SearchOperations from './operations/search';
export * as AdminOperations from './operations/admin';

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
    getFileURLByUUID
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
    dropUserTables,
    exportAllTables,
    initializeDatabaseWithMigrations
} from './operations/admin';