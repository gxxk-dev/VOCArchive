/**
 * 选择器模块 - 统一管理所有选择器组件
 * 包含 UUID选择器、多选器、MD3选择器等的创建和管理功能
 */

import {
    getUuidSelectorConfig,
    getMultiSelectorConfig,
    getMD3SelectorPreset,
    getSelectorClass,
    SELECTOR_EVENTS,
    SELECTOR_CLASSES
} from './selector-config.js';

/**
 * UUID选择器类
 * 用于快速选择对象UUID的下拉框
 */
export class UuidSelector {
    constructor(type, options = {}) {
        this.type = type;
        this.config = getUuidSelectorConfig(type);
        this.options = { ...this.config, ...options };
        this.data = [];
        this.selectedValue = options.selectedValue || '';
        this.targetInputId = options.targetInputId || '';
    }

    /**
     * 加载数据
     * @param {Array} data - 数据数组
     */
    setData(data) {
        this.data = data || [];
        return this;
    }

    /**
     * 生成HTML
     * @param {string} id - 选择器ID
     * @param {string} name - 选择器名称
     * @returns {string} HTML字符串
     */
    render(id, name) {
        if (!this.config) {
            console.warn(`未找到选择器配置: ${this.type}`);
            return '';
        }

        if (!this.data || this.data.length === 0) {
            return '';
        }

        const options = this.generateOptions();

        return `
            <div class="${getSelectorClass('containers', 'quickSelect')}">
                <span class="${getSelectorClass('inputs', 'quickSelectHint')}">${this.config.label}</span>
                <div class="md3-select-field ${getSelectorClass('inputs', 'quickSelectField')}">
                    <select id="${id}" name="${name}" class="quick-select" data-target-input="${this.targetInputId}">
                        <option value="">${this.config.placeholder}</option>
                        ${options}
                    </select>
                    <div class="md3-state-layer"></div>
                </div>
            </div>
        `;
    }

    /**
     * 生成选项HTML
     * @returns {string} 选项HTML字符串
     */
    generateOptions() {
        if (this.config.hierarchical) {
            return this.generateHierarchicalOptions(this.data);
        }

        return this.data.map(item => {
            const value = item[this.config.valueField];
            const display = this.config.displayFormatter(item);
            const isSelected = value === this.selectedValue ? 'selected' : '';
            return `<option value="${value}" ${isSelected}>${display}</option>`;
        }).join('');
    }

    /**
     * 生成层级选项HTML
     * @param {Array} items - 数据项
     * @param {number} level - 层级
     * @returns {string} 选项HTML字符串
     */
    generateHierarchicalOptions(items, level = 0) {
        let options = '';
        items.forEach(item => {
            const value = item[this.config.valueField];
            const display = this.config.displayFormatter(item, level);
            const isSelected = value === this.selectedValue ? 'selected' : '';
            options += `<option value="${value}" ${isSelected}>${display}</option>`;

            if (item.children && item.children.length > 0) {
                options += this.generateHierarchicalOptions(item.children, level + 1);
            }
        });
        return options;
    }
}

/**
 * 多选器类
 * 用于标签、分类、外部对象等多选组件
 */
export class MultiSelector {
    constructor(type, options = {}) {
        this.type = type;
        this.config = getMultiSelectorConfig(type);
        this.options = { ...this.config, ...options };
        this.data = [];
        this.selectedItems = options.selectedItems || [];
        this.filteredData = [];
    }

    /**
     * 设置数据
     * @param {Array} data - 数据数组
     */
    setData(data) {
        this.data = data || [];
        this.filteredData = [...this.data];
        return this;
    }

    /**
     * 设置选中项
     * @param {Array} selectedItems - 选中项数组
     */
    setSelectedItems(selectedItems) {
        this.selectedItems = selectedItems || [];
        return this;
    }

    /**
     * 生成HTML
     * @returns {string} HTML字符串
     */
    render() {
        if (!this.config) {
            console.warn(`未找到选择器配置: ${this.type}`);
            return '';
        }

        if (!this.data || this.data.length === 0) {
            return `<p>暂无可用${this.config.label}</p>`;
        }

        const items = this.generateItems();
        const refreshButton = this.config.refreshable ? this.generateRefreshButton() : '';

        return `
            <div class="${this.config.className}">
                <input type="text" id="${this.type}-filter" placeholder="${this.config.placeholder}"
                       oninput="window.filterSelector('${this.type}', this.value)" class="${getSelectorClass('inputs', 'filterInput')}">
                <div id="${this.type}-checkboxes" class="${this.type}-list">
                    ${refreshButton}
                    ${items}
                </div>
            </div>
        `;
    }

    /**
     * 生成选项HTML
     * @returns {string} 选项HTML字符串
     */
    generateItems() {
        if (this.config.hierarchical) {
            return this.generateHierarchicalItems(this.data);
        }

        const selectedIds = this.selectedItems.map(item => item.uuid || item[this.config.valueField]);

        return this.data.map(item => {
            const value = item[this.config.valueField];
            const display = item[this.config.displayField];
            const isChecked = selectedIds.includes(value) ? 'checked' : '';
            const chipClass = isChecked ? `${this.config.chipClassName} selected` : this.config.chipClassName;

            return `
                <label class="${this.config.itemClassName}">
                    <input type="checkbox" name="selected_${this.type}" value="${value}" ${isChecked}>
                    <span class="${chipClass}">${display}</span>
                </label>
            `;
        }).join('');
    }

    /**
     * 生成层级选项HTML
     * @param {Array} items - 数据项
     * @param {number} level - 层级
     * @returns {string} 选项HTML字符串
     */
    generateHierarchicalItems(items, level = 0) {
        let result = '';
        const selectedIds = this.selectedItems.map(item => item.uuid || item[this.config.valueField]);

        items.forEach(item => {
            const value = item[this.config.valueField];
            const display = item[this.config.displayField];
            const isChecked = selectedIds.includes(value) ? 'checked' : '';
            const chipClass = isChecked ? `${this.config.chipClassName} selected` : this.config.chipClassName;
            const indent = '　'.repeat(level);

            result += `
                <label class="${this.config.itemClassName} indent-level-${Math.min(level, 10)}">
                    <input type="checkbox" name="selected_${this.type}" value="${value}" ${isChecked}>
                    <span class="${chipClass}">${indent}${display}</span>
                </label>
            `;

            if (item.children && item.children.length > 0) {
                result += this.generateHierarchicalItems(item.children, level + 1);
            }
        });

        return result;
    }

    /**
     * 生成刷新按钮
     * @returns {string} 刷新按钮HTML
     */
    generateRefreshButton() {
        return `
            <div class="${this.type}-info">
                <p>选择关联的${this.config.label}。</p>
                <button type="button" id="refresh-${this.type}" class="refresh-button">刷新${this.config.label}列表</button>
            </div>
        `;
    }

    /**
     * 过滤数据
     * @param {string} searchTerm - 搜索词
     */
    filter(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredData = this.data.filter(item => {
            return this.config.filterFields.some(field => {
                const value = item[field];
                return value && value.toLowerCase().includes(term);
            });
        });

        // 重新渲染过滤后的项目
        this.rerenderItems();
    }

    /**
     * 重新渲染项目
     */
    rerenderItems() {
        const container = document.getElementById(`${this.type}-checkboxes`);
        if (container) {
            const refreshButton = this.config.refreshable ? this.generateRefreshButton() : '';
            const items = this.generateFilteredItems();
            container.innerHTML = refreshButton + items;
        }
    }

    /**
     * 生成过滤后的项目HTML
     * @returns {string} 项目HTML字符串
     */
    generateFilteredItems() {
        const tempData = this.data;
        this.data = this.filteredData;
        const result = this.generateItems();
        this.data = tempData;
        return result;
    }
}

/**
 * MD3选择器类
 * Material Design 3风格的下拉选择器
 */
export class MD3Selector {
    constructor(options = {}) {
        this.id = options.id || '';
        this.name = options.name || '';
        this.labelText = options.labelText || '';
        this.options = options.options || [];
        this.selectedValue = options.selectedValue || '';
        this.required = options.required || false;
        this.disabled = options.disabled || false;
        this.preset = options.preset || null;
    }

    /**
     * 使用预设配置
     * @param {string} presetName - 预设名称
     */
    usePreset(presetName) {
        const preset = getMD3SelectorPreset(presetName);
        if (preset) {
            this.preset = preset;
            this.labelText = preset.label;
            this.options = preset.options;
        }
        return this;
    }

    /**
     * 生成HTML
     * @returns {string} HTML字符串
     */
    render() {
        const requiredAttr = this.required ? 'required' : '';
        const disabledAttr = this.disabled ? 'disabled' : '';
        const options = this.preset ? this.preset.options : this.options;

        const optionsHtml = options.map(option => {
            const value = typeof option === 'object' ? option.value : option;
            const text = typeof option === 'object' ? option.text : option;
            const selected = value === this.selectedValue ? 'selected' : '';
            return `<option value="${value}" ${selected}>${text}</option>`;
        }).join('');

        return `
            <div class="md3-select-field${this.disabled ? ' disabled' : ''}">
                <select id="${this.id}" name="${this.name}" ${requiredAttr} ${disabledAttr}>
                    ${optionsHtml}
                </select>
                <label class="md3-label">${this.labelText}</label>
                <div class="md3-state-layer"></div>
            </div>
        `;
    }
}

/**
 * 选择器工厂类
 * 用于创建和管理选择器实例
 */
export class SelectorFactory {
    /**
     * 创建UUID选择器
     * @param {string} type - 选择器类型
     * @param {object} options - 选项
     * @returns {UuidSelector} UUID选择器实例
     */
    static createUuidSelector(type, options = {}) {
        return new UuidSelector(type, options);
    }

    /**
     * 创建多选器
     * @param {string} type - 选择器类型
     * @param {object} options - 选项
     * @returns {MultiSelector} 多选器实例
     */
    static createMultiSelector(type, options = {}) {
        return new MultiSelector(type, options);
    }

    /**
     * 创建MD3选择器
     * @param {object} options - 选项
     * @returns {MD3Selector} MD3选择器实例
     */
    static createMD3Selector(options = {}) {
        return new MD3Selector(options);
    }
}

/**
 * 全局选择器管理器
 * 管理页面中所有选择器的状态和事件
 */
export class SelectorManager {
    constructor() {
        this.selectors = new Map();
        this.eventHandlers = new Map();
        this.initializeGlobalEvents();
    }

    /**
     * 注册选择器
     * @param {string} id - 选择器ID
     * @param {object} selector - 选择器实例
     */
    register(id, selector) {
        this.selectors.set(id, selector);
    }

    /**
     * 获取选择器
     * @param {string} id - 选择器ID
     * @returns {object} 选择器实例
     */
    get(id) {
        return this.selectors.get(id);
    }

    /**
     * 移除选择器
     * @param {string} id - 选择器ID
     */
    remove(id) {
        this.selectors.delete(id);
    }

    /**
     * 初始化全局事件
     */
    initializeGlobalEvents() {
        // UUID选择器事件处理
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quick-select')) {
                this.handleQuickSelectChange(e);
            }

            // MD3选择器状态处理
            if (e.target.closest('.md3-select-field')) {
                this.handleMD3SelectChange(e);
            }
        });

        // 多选器事件处理
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.endsWith('-filter')) {
                this.handleMultiSelectorFilter(e);
            }
        });

        // DOM变化观察器，自动初始化新插入的MD3选择器
        this.setupMD3Observer();
    }

    /**
     * 设置MD3选择器观察器
     */
    setupMD3Observer() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 初始化新添加的MD3选择器
                        const md3Fields = node.querySelectorAll ? node.querySelectorAll('.md3-select-field') : [];
                        if (node.classList && node.classList.contains('md3-select-field')) {
                            this.initializeMD3Field(node);
                        }
                        md3Fields.forEach(field => this.initializeMD3Field(field));
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // 初始化现有的MD3选择器
        document.querySelectorAll('.md3-select-field').forEach(field => {
            this.initializeMD3Field(field);
        });
    }

    /**
     * 初始化MD3选择器字段
     * @param {Element} field - MD3选择器字段元素
     */
    initializeMD3Field(field) {
        const select = field.querySelector('select');
        if (!select) return;

        // 检查是否有选中值
        const updateLabelState = () => {
            if (select.value && select.value !== '') {
                field.classList.add('has-value');
            } else {
                field.classList.remove('has-value');
            }
        };

        // 初始状态检查
        updateLabelState();

        // 监听变化
        select.addEventListener('change', updateLabelState);
        select.addEventListener('input', updateLabelState);
    }

    /**
     * 处理MD3选择器变化事件
     * @param {Event} e - 事件对象
     */
    handleMD3SelectChange(e) {
        const field = e.target.closest('.md3-select-field');
        if (field) {
            // 更新has-value类
            if (e.target.value && e.target.value !== '') {
                field.classList.add('has-value');
            } else {
                field.classList.remove('has-value');
            }
        }
    }

    /**
     * 处理快速选择器变化事件
     * @param {Event} e - 事件对象
     */
    handleQuickSelectChange(e) {
        const selectedValue = e.target.value;
        const targetInputId = e.target.dataset.targetInput;
        const targetInput = document.getElementById(targetInputId);

        if (targetInput && selectedValue) {
            targetInput.value = selectedValue;

            // 触发自定义事件
            const customEvent = new CustomEvent(SELECTOR_EVENTS.quickSelect.change, {
                detail: { selectedValue, targetInputId }
            });
            document.dispatchEvent(customEvent);
        }
    }

    /**
     * 处理多选器过滤事件
     * @param {Event} e - 事件对象
     */
    handleMultiSelectorFilter(e) {
        const filterId = e.target.id;
        const selectorType = filterId.replace('-filter', '');
        const searchTerm = e.target.value;

        const selector = this.get(selectorType);
        if (selector && typeof selector.filter === 'function') {
            selector.filter(searchTerm);
        }

        // 触发自定义事件
        const customEvent = new CustomEvent(SELECTOR_EVENTS.multiSelect.filter, {
            detail: { selectorType, searchTerm }
        });
        document.dispatchEvent(customEvent);
    }
}

// 创建全局选择器管理器实例
export const selectorManager = new SelectorManager();

// === 快速选择器创建函数 ===

/**
 * 创建快速选择器
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
 * 创建分类快速选择器
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
 * 创建标签选择器
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
 * 创建分类选择器
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
 * 创建外部对象选择器
 * @param {Array} externalSources - 外部存储源数组
 * @param {Array} selectedExternalObjects - 选中的外部对象
 * @returns {string} HTML字符串
 */
export function createExternalObjectsSelector(externalSources = [], selectedExternalObjects = []) {
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
 * 创建 MD3 选择器
 * @param {string} id - 选择器ID
 * @param {string} name - 选择器名称
 * @param {string} labelText - 标签文本
 * @param {Array} options - 选项数组
 * @param {string} selectedValue - 选中值
 * @param {boolean} required - 是否必填
 * @param {boolean} disabled - 是否禁用
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
 * 刷新外部对象列表
 */
export async function refreshExternalObjects() {
    const container = document.getElementById('external-objects-container');
    if (!container) return;

    try {
        container.innerHTML = '<p>正在加载外部对象...</p>';

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

/**
 * 初始化选择器事件处理
 */
export function initializeSelectors() {
    // 为外部对象选择器添加刷新功能
    document.addEventListener('click', (e) => {
        if (e.target.id === 'refresh-external-objects') {
            refreshExternalObjects();
        }
    });

    // 全局过滤函数
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

// 向全局对象暴露选择器功能
if (typeof window !== 'undefined') {
    window.SelectorFactory = SelectorFactory;
    window.selectorManager = selectorManager;
    window.createQuickSelect = createQuickSelect;
    window.createCategoryQuickSelect = createCategoryQuickSelect;
    window.createTagSelector = createTagSelector;
    window.createCategorySelector = createCategorySelector;
    window.createExternalObjectsSelector = createExternalObjectsSelector;
    window.createMD3Select = createMD3Select;
    window.refreshExternalObjects = refreshExternalObjects;

    // 向后兼容的全局函数
    window.filterSelector = (type, searchTerm) => {
        const selector = selectorManager.get(type);
        if (selector && typeof selector.filter === 'function') {
            selector.filter(searchTerm);
        }
    };

    // 自动初始化
    document.addEventListener('DOMContentLoaded', initializeSelectors);
}