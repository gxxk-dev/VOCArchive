/**
 * 表单生成器 - 向后兼容层
 * 提供基于新选择器模块的向后兼容函数
 */

import { SelectorFactory } from './selectors.js';

/**
 * 创建快速选择器（向后兼容）
 * @param {string} id - 选择器ID
 * @param {string} name - 选择器名称
 * @param {Array} data - 数据数组
 * @param {string} valueField - 值字段
 * @param {string} displayField - 显示字段
 * @param {string} selectedValue - 选中值
 * @param {string} targetInputId - 目标输入框ID
 * @returns {string} HTML字符串
 */
export function createQuickSelect(id, name, data, valueField, displayField, selectedValue, targetInputId) {
    if (!data || data.length === 0) return '';

    // 根据 valueField 确定选择器类型
    let selectorType = 'work';
    if (valueField === 'uuid' && displayField === 'name') {
        // 可能是 creator 或其他
        if (data[0]?.type) {
            selectorType = 'creator';
        } else {
            selectorType = 'external_source';
        }
    }

    const selector = SelectorFactory.createUuidSelector(selectorType, {
        selectedValue,
        targetInputId
    });

    selector.setData(data);
    return selector.render(id, name);
}

/**
 * 创建分类快速选择器（向后兼容）
 * @param {string} id - 选择器ID
 * @param {string} name - 选择器名称
 * @param {Array} categories - 分类数据
 * @param {string} selectedValue - 选中值
 * @param {string} targetInputId - 目标输入框ID
 * @returns {string} HTML字符串
 */
export function createCategoryQuickSelect(id, name, categories, selectedValue, targetInputId) {
    if (!categories || categories.length === 0) return '';

    const selector = SelectorFactory.createUuidSelector('category', {
        selectedValue,
        targetInputId
    });

    selector.setData(categories);
    return selector.render(id, name);
}

/**
 * 创建标签选择器（向后兼容）
 * @param {Array} tags - 标签数组
 * @param {Array} selectedTags - 选中的标签
 * @returns {string} HTML字符串
 */
export function createTagSelector(tags = [], selectedTags = []) {
    const selector = SelectorFactory.createMultiSelector('tags', {
        selectedItems: selectedTags
    });

    selector.setData(tags);
    return selector.render();
}

/**
 * 创建分类选择器（向后兼容）
 * @param {Array} categories - 分类数组
 * @param {Array} selectedCategories - 选中的分类
 * @returns {string} HTML字符串
 */
export function createCategorySelector(categories = [], selectedCategories = []) {
    const selector = SelectorFactory.createMultiSelector('categories', {
        selectedItems: selectedCategories
    });

    selector.setData(categories);
    return selector.render();
}

/**
 * 创建外部对象选择器（向后兼容）
 * @param {Array} externalSources - 外部存储源数组
 * @param {Array} selectedExternalObjects - 选中的外部对象
 * @returns {string} HTML字符串
 */
export function createExternalObjectsSelector(externalSources = [], selectedExternalObjects = []) {
    const selector = SelectorFactory.createMultiSelector('external_objects', {
        selectedItems: selectedExternalObjects
    });

    // 注意：外部对象选择器需要特殊处理，因为它需要动态加载数据
    // 这里返回一个占位符，实际的数据加载会在页面渲染后通过 JavaScript 完成
    return `
        <div class="external-objects-list">
            <div class="external-object-filter-field">
                <input type="text" id="external-object-filter" oninput="window.filterSelector('external_objects', this.value)" class="filter-input">
                <label class="md3-label">搜索外部对象...</label>
                <div class="md3-state-layer"></div>
            </div>
            <div id="external-object-checkboxes">
                <div class="external-objects-info">
                    <p>选择关联的外部对象。这些对象将用于在不同存储源中访问此资产的文件。</p>
                    <button type="button" id="refresh-external-objects" class="refresh-button">刷新外部对象列表</button>
                </div>
                <div id="external-objects-container">
                    <p>正在加载外部对象...</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * 创建 MD3 选择器（向后兼容）
 * @param {string} id - 选择器ID
 * @param {string} name - 选择器名称
 * @param {string} labelText - 标签文本
 * @param {Array} options - 选项数组
 * @param {string} selectedValue - 选中值
 * @param {boolean} required - 是否必填
 * @returns {string} HTML字符串
 */
export function createMD3Select(id, name, labelText, options, selectedValue = '', required = false, disabled = false) {
    const selector = SelectorFactory.createMD3Selector({
        id,
        name,
        labelText,
        options,
        selectedValue,
        required,
        disabled
    });

    return selector.render();
}

/**
 * 初始化选择器事件处理（向后兼容）
 * 这个函数应该在页面加载后调用，以确保选择器事件正常工作
 */
export function initializeLegacySelectors() {
    // 为外部对象选择器添加刷新功能
    document.addEventListener('click', (e) => {
        if (e.target.id === 'refresh-external-objects') {
            refreshExternalObjects();
        }
    });

    // 全局过滤函数（向后兼容）
    if (!window.filterTags) {
        window.filterTags = (searchTerm) => {
            window.filterSelector('tags', searchTerm);
        };
    }

    if (!window.filterCategories) {
        window.filterCategories = (searchTerm) => {
            window.filterSelector('categories', searchTerm);
        };
    }

    if (!window.filterExternalObjects) {
        window.filterExternalObjects = (searchTerm) => {
            window.filterSelector('external_objects', searchTerm);
        };
    }
}

/**
 * 刷新外部对象列表
 */
async function refreshExternalObjects() {
    const container = document.getElementById('external-objects-container');
    if (!container) return;

    try {
        container.innerHTML = '<p>正在加载外部对象...</p>';

        // 这里需要导入 API 模块来获取数据
        const { apiFetch } = await import('./api.js');
        const externalObjects = await apiFetch('/list/external_objects');

        if (externalObjects && externalObjects.length > 0) {
            const selector = SelectorFactory.createMultiSelector('external_objects');
            selector.setData(externalObjects);
            container.innerHTML = selector.generateItems();
        } else {
            container.innerHTML = '<p>暂无可用的外部对象</p>';
        }
    } catch (error) {
        console.error('刷新外部对象失败:', error);
        container.innerHTML = '<p>加载失败，请重试</p>';
    }
}

// 自动初始化（如果在浏览器环境中）
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', initializeLegacySelectors);
}