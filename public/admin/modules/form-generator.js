// Form generation module - Configuration Driven
// 配置驱动的表单生成模块

import { generateFormFields as engineGenerateFormFields } from './config/form-engine.js';
import { allExternalSources } from './config.js';

/**
 * 主要表单生成函数 - 使用新的配置驱动引擎
 * @param {string} target - 表单类型
 * @param {Object} data - 数据对象
 * @param {Object} options - 选项
 * @returns {string} 生成的HTML
 */
export function generateFormFields(target, data = null, options = {}) {
    // 确保 allExternalSources 在选项中可用
    const enhancedOptions = {
        ...options,
        allExternalSources: allExternalSources || []
    };

    try {
        // 使用新的配置驱动引擎生成表单
        return engineGenerateFormFields(target, data, enhancedOptions);
    } catch (error) {
        console.error('Form generation error:', error);

        // 如果新引擎失败，回退到基本表单
        return generateFallbackForm(target, data, enhancedOptions);
    }
}

/**
 * 回退表单生成器（向后兼容）
 * @param {string} target - 表单类型
 * @param {Object} data - 数据对象
 * @param {Object} options - 选项
 * @returns {string} 基本表单HTML
 */
function generateFallbackForm(target, data, options) {
    console.warn(`Using fallback form for type: ${target}`);

    // 基本表单模板 - 最小化实现
    const basicForms = {
        work: generateBasicWorkForm(data),
        creator: generateBasicCreatorForm(data),
        tag: generateBasicTagForm(data),
        category: generateBasicCategoryForm(data),
        footer: generateBasicFooterForm(data)
    };

    return basicForms[target] || '<p>Form not implemented for this type.</p>';
}

// 基本表单生成器（回退时使用）
function generateBasicWorkForm(data) {
    return `
        <input type="hidden" name="work_uuid" value="${data?.work_uuid || ''}">
        <label for="work-uuid">Work UUID:</label>
        <input type="text" id="work-uuid" name="work_uuid_display" required value="${data?.work_uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
        <label for="copyright_basis">Copyright Basis:</label>
        <select id="copyright_basis" name="copyright_basis">
            <option value="none" ${(!data?.copyright_basis || data?.copyright_basis === 'none') ? 'selected' : ''}>None</option>
            <option value="original" ${data?.copyright_basis === 'original' ? 'selected' : ''}>Original</option>
            <option value="cover" ${data?.copyright_basis === 'cover' ? 'selected' : ''}>Cover</option>
            <option value="arrangement" ${data?.copyright_basis === 'arrangement' ? 'selected' : ''}>Arrangement</option>
        </select>
        <label for="license">License:</label>
        <input type="text" id="license" name="license" value="${data?.license || ''}">
    `;
}

function generateBasicCreatorForm(data) {
    return `
        <input type="hidden" name="creator_uuid" value="${data?.creator?.uuid || ''}">
        <label for="uuid">UUID:</label>
        <input type="text" id="uuid" name="uuid" required value="${data?.creator?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
        <label for="name">Name:</label>
        <input type="text" id="name" name="name" required value="${data?.creator?.name || ''}">
        <label for="type">Type:</label>
        <select id="type" name="type">
            <option value="human" ${data?.type === 'human' ? 'selected' : ''}>Human</option>
            <option value="virtual" ${data?.type === 'virtual' ? 'selected' : ''}>Virtual</option>
        </select>
    `;
}

function generateBasicTagForm(data) {
    return `
        <input type="hidden" name="tag_uuid" value="${data?.uuid || ''}">
        <label for="uuid">UUID:</label>
        <input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
        <label for="name">标签名称:</label>
        <input type="text" id="name" name="name" required value="${data?.name || ''}" placeholder="例如: Rock, Ballad, Duet">
    `;
}

function generateBasicCategoryForm(data) {
    return `
        <input type="hidden" name="category_uuid" value="${data?.uuid || ''}">
        <label for="uuid">UUID:</label>
        <input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
        <label for="name">分类名称:</label>
        <input type="text" id="name" name="name" required value="${data?.name || ''}" placeholder="例如: 原创歌曲, 摇滚音乐">
        <label for="parent_uuid">父分类 (可选):</label>
        <input type="text" id="parent_uuid" name="parent_uuid" value="${data?.parent_uuid || ''}" class="uuid" placeholder="留空表示顶级分类">
    `;
}

function generateBasicFooterForm(data) {
    return `
        <input type="hidden" name="uuid" value="${data?.uuid || ''}">
        <label for="item_type">Type:</label>
        <select id="item_type" name="item_type" required>
            <option value="link" ${data?.item_type === 'link' ? 'selected' : ''}>Link</option>
            <option value="social" ${data?.item_type === 'social' ? 'selected' : ''}>Social</option>
            <option value="copyright" ${data?.item_type === 'copyright' ? 'selected' : ''}>Copyright</option>
        </select>
        <label for="text">Text:</label>
        <input type="text" id="text" name="text" required value="${data?.text || ''}">
        <label for="url">URL (optional):</label>
        <input type="text" id="url" name="url" value="${data?.url || ''}">
        <label for="icon_class">Icon Class (optional):</label>
        <input type="text" id="icon_class" name="icon_class" value="${data?.icon_class || ''}">
    `;
}

// --- 向后兼容的动态行创建函数 ---
// 注意：这些函数仍被form-handler.js用于现有的UI交互
// 新的表单生成使用配置驱动系统（config/form-engine.js）
// TODO: 在完整迁移到配置驱动系统后，可以考虑重构这些函数

export function createTitleRow(title = { title: '', language: 'ja', is_official: false, is_for_search: false }) {
    console.log("[Edit UI] Show title:", title);
    return `
        <div class="dynamic-list-item">
            <input type="text" name="title_text" placeholder="Title" required value="${title.title || ''}">
            <input type="text" name="title_lang" placeholder="Lang" required value="${title.language || 'ja'}">
            <label><input type="checkbox" name="title_is_official" ${title.is_official ? 'checked' : ''}> 官方标题</label>
            <label><input type="checkbox" name="title_is_for_search" ${title.is_for_search ? 'checked' : ''}> 仅用于搜索</label>
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

export function createCreatorRow(creator = { creator_uuid: '', role: '' }, allCreators = []) {
    console.log("[Edit UI] Show creator:", creator);
    const creator_uuid = creator.creator_uuid || creator.creator?.uuid || creator.uuid || '';
    const creatorRole = creator.role || '';
    const creatorOptions = allCreators.map(c =>
        `<option value="${c.uuid}" ${creator_uuid === c.uuid ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    return `
        <div class="dynamic-list-item">
            <div class="md3-select-field">
                <select name="creator_uuid" required>
                    <option value="">Select Creator</option>
                    ${creatorOptions}
                </select>
                <label class="md3-label">Creator</label>
                <div class="md3-state-layer"></div>
            </div>
            <input type="text" name="creator_role" placeholder="Role" required value="${creatorRole}">
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

export function createWikiRow(wiki = { platform: '', identifier: '' }) {
    console.log("[Edit UI] Show wiki:", wiki);
    return `
        <div class="dynamic-list-item">
            <input type="text" name="wiki_platform" placeholder="Wiki Platform" required value="${wiki.platform || ''}">
            <input type="text" name="wiki_id" placeholder="Wiki ID" required value="${wiki.identifier || ''}">
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

export function createAssetCreatorRow(creator = { creator_uuid: '', role: '' }) {
    return `
        <div class="dynamic-list-item">
            <input type="text" name="asset_creator_uuid" placeholder="Creator UUID" required value="${creator.creator_uuid || ''}">
            <input type="text" name="asset_creator_role" placeholder="Role" required value="${creator.role || ''}">
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

// --- 动态列表管理 ---
export function addDynamicListItem(listId, rowHtml) {
    const list = document.getElementById(listId);
    if (list) {
        list.insertAdjacentHTML('beforeend', rowHtml);
    }
}