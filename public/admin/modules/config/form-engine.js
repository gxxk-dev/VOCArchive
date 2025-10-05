// 通用表单渲染引擎
// Form Engine - Universal Form Rendering System

import { allFieldTypes, getFieldTemplate, isValidFieldType } from './field-types.js';
import { formConfigs, getFormConfig, isValidFormType } from './form-fields.js';
import { optionGroups, getOptionGroup } from './option-groups.js';

/**
 * 表单渲染引擎类
 */
export class FormEngine {
    constructor() {
        this.fieldRenderers = new Map();
        this.validators = new Map();
        this.eventHandlers = new Map();

        // 注册默认字段渲染器
        this.registerDefaultRenderers();
    }

    /**
     * 注册默认字段渲染器
     */
    registerDefaultRenderers() {
        // 基础字段渲染器
        this.fieldRenderers.set('text', this.renderTextField.bind(this));
        this.fieldRenderers.set('text_input', this.renderTextField.bind(this));
        this.fieldRenderers.set('text_input_required', this.renderTextField.bind(this));
        this.fieldRenderers.set('hidden', this.renderHiddenField.bind(this));
        this.fieldRenderers.set('checkbox', this.renderCheckboxField.bind(this));
        this.fieldRenderers.set('md3_select', this.renderMD3SelectField.bind(this));
        this.fieldRenderers.set('quick_select_input', this.renderQuickSelectInput.bind(this));

        // UUID字段渲染器
        this.fieldRenderers.set('uuid_readonly', this.renderUuidField.bind(this));
        this.fieldRenderers.set('uuid_editable', this.renderUuidField.bind(this));

        // 复合字段渲染器
        this.fieldRenderers.set('dynamic-list', this.renderDynamicList.bind(this));
        this.fieldRenderers.set('selector', this.renderSelector.bind(this));
        this.fieldRenderers.set('section', this.renderSection.bind(this));
    }

    /**
     * 根据类型和数据生成完整表单
     * @param {string} type - 表单类型
     * @param {Object} data - 数据对象
     * @param {Object} options - 附加选项
     * @returns {string} 生成的HTML
     */
    generateForm(type, data = null, options = {}) {
        if (!isValidFormType(type)) {
            return '<p>Form not implemented for this type.</p>';
        }

        const config = getFormConfig(type);
        if (!config || !config.sections) {
            return '<p>Invalid form configuration.</p>';
        }

        let formHtml = '';

        for (const section of config.sections) {
            formHtml += this.renderSection(section, data, options);
        }

        return formHtml;
    }

    /**
     * 渲染表单章节
     * @param {Object} section - 章节配置
     * @param {Object} data - 数据对象
     * @param {Object} options - 附加选项
     * @returns {string} 生成的HTML
     */
    renderSection(section, data = {}, options = {}) {
        if (section.type === 'dynamic-list') {
            return this.renderDynamicList(section, data, options);
        }

        if (section.type === 'selector') {
            return this.renderSelector(section, data, options);
        }

        // 标准字段章节
        let sectionHtml = '';

        if (section.title) {
            sectionHtml += `
                <div class="form-section">
                    <h4>${section.title}</h4>
            `;
        }

        if (section.fields) {
            for (const field of section.fields) {
                sectionHtml += this.renderField(field, data, options);
            }
        }

        if (section.title) {
            sectionHtml += '</div>';
        }

        return sectionHtml;
    }

    /**
     * 渲染单个字段
     * @param {Object} field - 字段配置
     * @param {Object} data - 数据对象
     * @param {Object} options - 附加选项
     * @returns {string} 生成的HTML
     */
    renderField(field, data = {}, options = {}) {
        const renderer = this.fieldRenderers.get(field.type);
        if (!renderer) {
            console.warn(`No renderer found for field type: ${field.type}`);
            return `<p>Unsupported field type: ${field.type}</p>`;
        }

        // 准备字段属性
        const fieldProps = this.prepareFieldProps(field, data, options);

        // 添加标签（如果需要）
        let fieldHtml = '';
        if (field.label && field.type !== 'hidden') {
            fieldHtml += `<label for="${fieldProps.id}">${field.label}:</label>`;
        }

        // 渲染字段本身
        fieldHtml += renderer(fieldProps, field, data, options);

        // 添加帮助文本（如果有）
        if (field.helpText) {
            fieldHtml += `<small class="form-info">${field.helpText}</small>`;
        }

        return fieldHtml;
    }

    /**
     * 准备字段属性
     * @param {Object} field - 字段配置
     * @param {Object} data - 数据对象
     * @param {Object} options - 附加选项
     * @returns {Object} 字段属性对象
     */
    prepareFieldProps(field, data, options) {
        const props = {
            id: field.id || field.name,
            name: field.name,
            value: this.getFieldValue(field, data),
            placeholder: field.placeholder || '',
            required: field.required || field.type === 'text_input_required',
            readonly: field.readonly || false,
            className: field.className || ''
        };

        // 处理选项
        if (field.options) {
            if (typeof field.options === 'string') {
                // 选项组引用
                props.options = getOptionGroup(field.options) || [];
            } else if (Array.isArray(field.options)) {
                // 直接选项数组
                props.options = field.options;
            }
        }

        return props;
    }

    /**
     * 获取字段值
     * @param {Object} field - 字段配置
     * @param {Object} data - 数据对象
     * @returns {any} 字段值
     */
    getFieldValue(field, data) {
        if (!data) return field.defaultValue || '';

        // 使用 sourcePath 或默认使用 field.name
        const fieldPath = field.sourcePath || field.name;

        // 支持嵌套属性访问
        const keys = fieldPath.split('.');
        let value = data;

        for (const key of keys) {
            if (value && typeof value === 'object') {
                value = value[key];
            } else {
                value = undefined;
                break;
            }
        }

        return value !== undefined ? value : (field.defaultValue || '');
    }

    // ============ 字段渲染器实现 ============

    /**
     * 渲染文本字段
     */
    renderTextField(props, field) {
        const requiredAttr = props.required ? 'required' : '';
        const readonlyAttr = props.readonly ? 'readonly' : '';

        return `<input type="text" id="${props.id}" name="${props.name}" value="${props.value}" placeholder="${props.placeholder}" class="${props.className}" ${requiredAttr} ${readonlyAttr}>`;
    }

    /**
     * 渲染隐藏字段
     */
    renderHiddenField(props) {
        return `<input type="hidden" name="${props.name}" value="${props.value}">`;
    }

    /**
     * 渲染UUID字段
     */
    renderUuidField(props, field, data) {
        // 如果没有值且不是编辑模式，生成新UUID
        if (!props.value && !data) {
            props.value = crypto.randomUUID();
        }

        const readonlyAttr = field.type === 'uuid_readonly' ? 'readonly' : '';

        return `<input type="text" id="${props.id}" name="${props.name}" value="${props.value}" class="uuid" required ${readonlyAttr}>`;
    }

    /**
     * 渲染复选框字段
     */
    renderCheckboxField(props, field) {
        const checkedAttr = props.value ? 'checked' : '';

        if (field.type === 'checkbox_inline') {
            return `<label><input type="checkbox" name="${props.name}" ${checkedAttr}> ${field.label}</label>`;
        }

        return `
            <div class="checkbox-field">
                <input type="checkbox" id="${props.id}" name="${props.name}" ${checkedAttr}>
                <label for="${props.id}">${field.label}</label>
            </div>
        `;
    }

    /**
     * 渲染MD3选择器字段
     */
    renderMD3SelectField(props, field) {
        const requiredAttr = props.required ? 'required' : '';
        const options = props.options || [];

        const optionsHtml = options.map(option => {
            const value = typeof option === 'object' ? option.value : option;
            const text = typeof option === 'object' ? option.text : option;
            const selected = value === props.value ? 'selected' : '';
            return `<option value="${value}" ${selected}>${text}</option>`;
        }).join('');

        return `
            <div class="md3-select-field">
                <select id="${props.id}" name="${props.name}" ${requiredAttr}>
                    ${optionsHtml}
                </select>
                <label class="md3-label">${field.label}</label>
                <div class="md3-state-layer"></div>
            </div>
        `;
    }

    /**
     * 渲染快速选择输入组合
     */
    renderQuickSelectInput(props, field, data, options) {
        // 获取数据源
        const dataSource = this.getDataSource(field.dataSource, options);
        const quickSelector = this.generateQuickSelect(field, dataSource, props.value);

        return `
            <div class="input-with-quick-select">
                <input type="text" id="${props.id}" name="${props.name}" required value="${props.value}" class="${props.className}">
                ${quickSelector}
            </div>
        `;
    }

    /**
     * 渲染动态列表
     */
    renderDynamicList(section, data, options) {
        const listType = allFieldTypes[section.listType];
        if (!listType) {
            return `<p>Unknown list type: ${section.listType}</p>`;
        }

        const listData = this.getListData(section, data);
        const listItems = listData.map(item => listType.itemTemplate(item, options)).join('');

        return `
            <div class="form-section">
                <h4>${section.title}</h4>
                <div id="${listType.listId}" class="dynamic-list">
                    ${listItems}
                </div>
                <button type="button" id="${listType.addButtonId}" class="add-row-button">${listType.addButtonText}</button>
            </div>
        `;
    }

    /**
     * 渲染选择器
     */
    renderSelector(section, data, options) {
        const selectorType = allFieldTypes[section.selectorType];
        if (!selectorType) {
            return `<p>Unknown selector type: ${section.selectorType}</p>`;
        }

        const dataSource = this.getDataSource(section.dataSource, options);
        const selectedItems = this.getSelectedItems(section, data);
        const selectorContent = this.generateSelectorContent(section.selectorType, dataSource, selectedItems);

        return `
            <div class="form-section">
                <h4>${section.title}</h4>
                <div id="${selectorType.selectorId}" class="${selectorType.className}">
                    ${selectorContent}
                </div>
            </div>
        `;
    }

    // ============ 辅助方法 ============

    /**
     * 获取数据源
     */
    getDataSource(dataSourcePath, options) {
        if (!dataSourcePath) return [];

        // 支持点分隔的路径，如 'options.tags'
        const keys = dataSourcePath.split('.');
        let source = { options, allExternalSources: options.allExternalSources || [] };

        for (const key of keys) {
            if (source && typeof source === 'object') {
                source = source[key];
            } else {
                return [];
            }
        }

        return Array.isArray(source) ? source : [];
    }

    /**
     * 获取列表数据
     */
    getListData(section, data) {
        if (!data) return [];

        const listName = section.name;
        const listData = data[listName];

        return Array.isArray(listData) ? listData : [];
    }

    /**
     * 获取选中项目
     */
    getSelectedItems(section, data) {
        if (!data) return [];

        const selectorName = section.name;
        const selectedData = data[selectorName];

        return Array.isArray(selectedData) ? selectedData : [];
    }

    /**
     * 生成快速选择器
     */
    generateQuickSelect(field, dataSource, selectedValue) {
        if (!dataSource || dataSource.length === 0) return '';

        const options = dataSource.map(item => {
            const value = item[field.valueField || 'uuid'];
            let display = item[field.displayField || 'name'];

            // 特殊处理titles字段
            if (field.displayField === 'titles' && Array.isArray(display)) {
                display = display.find(t => t.is_official)?.title || display[0]?.title || 'Untitled';
            }

            const selected = value === selectedValue ? 'selected' : '';
            return `<option value="${value}" ${selected}>${display}</option>`;
        }).join('');

        return `
            <select id="${field.quickSelectId}" name="${field.quickSelectId}" class="quick-select">
                <option value="">Select...</option>
                ${options}
            </select>
            <script>
                document.getElementById('${field.quickSelectId}').addEventListener('change', function() {
                    const target = document.getElementById('${field.targetInputId}');
                    if (target) target.value = this.value;
                });
            </script>
        `;
    }

    /**
     * 生成选择器内容
     */
    generateSelectorContent(selectorType, dataSource, selectedItems) {
        switch (selectorType) {
            case 'tag_selector':
                return this.generateTagSelector(dataSource, selectedItems);
            case 'category_selector':
                return this.generateCategorySelector(dataSource, selectedItems);
            case 'external_objects_selector':
                return this.generateExternalObjectsSelector(dataSource, selectedItems);
            default:
                return '<p>Unknown selector type</p>';
        }
    }

    /**
     * 生成标签选择器
     */
    generateTagSelector(tags, selectedTags) {
        if (!tags || tags.length === 0) {
            return '<p>暂无可用标签</p>';
        }

        const selectedUuids = selectedTags.map(tag => tag.uuid || tag);
        const tagItems = tags.map(tag => {
            const checked = selectedUuids.includes(tag.uuid) ? 'checked' : '';
            return `
                <label class="tag-item">
                    <input type="checkbox" name="tag_uuids" value="${tag.uuid}" ${checked}>
                    <span class="tag-name">${tag.name}</span>
                </label>
            `;
        }).join('');

        return `
            <div class="tag-list">
                <div class="filter-field">
                    <input type="text" class="filter-input" placeholder="搜索标签..." oninput="filterTags(this.value)">
                </div>
                <div class="tag-items" id="tag-items">
                    ${tagItems}
                </div>
            </div>
            <script>
                function filterTags(searchTerm) {
                    const items = document.querySelectorAll('#tag-items .tag-item');
                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
                    });
                }
            </script>
        `;
    }

    /**
     * 生成分类选择器
     */
    generateCategorySelector(categories, selectedCategories) {
        if (!categories || categories.length === 0) {
            return '<p>暂无可用分类</p>';
        }

        const selectedUuids = selectedCategories.map(cat => cat.uuid || cat);
        const categoryItems = categories.map(category => {
            const checked = selectedUuids.includes(category.uuid) ? 'checked' : '';
            return `
                <label class="category-item">
                    <input type="checkbox" name="category_uuids" value="${category.uuid}" ${checked}>
                    <span class="category-name">${category.name}</span>
                </label>
            `;
        }).join('');

        return `
            <div class="category-list">
                <div class="filter-field">
                    <input type="text" class="filter-input" placeholder="搜索分类..." oninput="filterCategories(this.value)">
                </div>
                <div class="category-items" id="category-items">
                    ${categoryItems}
                </div>
            </div>
            <script>
                function filterCategories(searchTerm) {
                    const items = document.querySelectorAll('#category-items .category-item');
                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
                    });
                }
            </script>
        `;
    }

    /**
     * 生成外部对象选择器
     */
    generateExternalObjectsSelector(externalSources, selectedExternalObjects) {
        return `
            <div class="external-objects-list">
                <div class="external-object-filter-field">
                    <input type="text" id="external-object-filter" oninput="filterExternalObjects(this.value)" class="filter-input">
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
            <script>
                function filterExternalObjects(searchTerm) {
                    const items = document.querySelectorAll('#external-objects-container .external-object-item');
                    items.forEach(item => {
                        const text = item.textContent.toLowerCase();
                        item.style.display = text.includes(searchTerm.toLowerCase()) ? 'block' : 'none';
                    });
                }
            </script>
        `;
    }
}

// 创建全局表单引擎实例
export const formEngine = new FormEngine();

// 主要导出函数：生成表单字段
export function generateFormFields(target, data = null, options = {}) {
    return formEngine.generateForm(target, data, options);
}