// Configuration and state management module

// --- Configuration ---
export const API_BASE_URL = '/api';

// --- Global State ---
export let jwtToken = localStorage.getItem('jwtToken');
export let currentTab = 'work';
export let currentEditUUID = null; // To track the item being edited
export let allCreators = [];
export let allWorks = [];
export let allExternalSources = [];
export let allExternalObjects = [];

// Admin title configuration
export let adminTitleTemplate = 'VOCArchive - 管理后台';
export const tabNames = {
    'work': '作品',
    'creator': '作者',
    'media': '媒体',
    'asset': '资产',
    'relation': '关系',
    'tag': '标签',
    'category': '分类',
    'external_source': '存储源',
    'external_object': '外部对象',
    'footer': '页脚',
    'wiki_platform': 'Wiki平台',
    'site_config': '系统配置',
    'migration': '迁移管理'
};

// --- State Mutators ---
export function setJwtToken(token) {
    jwtToken = token;
    if (token) {
        localStorage.setItem('jwtToken', token);
    } else {
        localStorage.removeItem('jwtToken');
    }
}

export function setCurrentTab(tab, updateUrl = true) {
    currentTab = tab;
    // updateUrl 参数控制是否更新URL，用于避免在某些场景下的循环更新
}

export function setCurrentEditUUID(uuid) {
    currentEditUUID = uuid;
}

export function setAllCreators(creators) {
    allCreators = creators;
}

export function setAllWorks(works) {
    allWorks = works;
}

export function setAllExternalSources(sources) {
    allExternalSources = sources;
}

export function setAllExternalObjects(objects) {
    allExternalObjects = objects;
}

export function setAdminTitleTemplate(template) {
    adminTitleTemplate = template;
}