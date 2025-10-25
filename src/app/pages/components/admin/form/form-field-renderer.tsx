﻿// 表单字段渲染组件
// Form Field Rendering Components

import { jsx } from 'hono/jsx';
import type { FormFieldConfig, FormRenderData, FormOptions } from './form-field-types';

// 选项组定义
const copyrightBasisOptions = [
    { value: 'none', text: '未知/不明' },
    { value: 'license', text: '按许可证授权' },
    { value: 'accept', text: '已获授权' },
    { value: 'onlymetadata', text: '仅元数据 (文件引用自外部源)' },
    { value: 'arr', text: '版权保留 (如侵权请联系删除)' }
];

const creatorTypeOptions = [
    { value: 'human', text: 'Human' },
    { value: 'virtual', text: 'Virtual' }
];

const booleanOptions = [
    { value: 'true', text: 'True' },
    { value: 'false', text: 'False' }
];

const booleanOptionsZh = [
    { value: 'true', text: '是' },
    { value: 'false', text: '否' }
];

const assetTypeOptions = [
    { value: 'lyrics', text: 'Lyrics' },
    { value: 'picture', text: 'Picture' }
];

const relationTypeOptions = [
    { value: 'original', text: 'Original' },
    { value: 'remix', text: 'Remix' },
    { value: 'cover', text: 'Cover' },
    { value: 'remake', text: 'Remake' },
    { value: 'picture', text: 'Picture' },
    { value: 'lyrics', text: 'Lyrics' }
];

const footerItemTypeOptions = [
    { value: 'link', text: 'Link' },
    { value: 'social', text: 'Social' },
    { value: 'copyright', text: 'Copyright' }
];

const storageTypeOptions = [
    { value: 'raw_url', text: 'Raw URL' },
    { value: 'ipfs', text: 'IPFS' }
];

// 获取字段值的辅助函数
function getFieldValue(field: FormFieldConfig, data?: FormRenderData): string {
    if (!data) {
        return field.defaultValue?.toString() || '';
    }

    const fieldPath = field.sourcePath || field.name;
    const keys = fieldPath.split('.');
    let value: any = data;

    for (const key of keys) {
        if (value && typeof value === 'object') {
            value = value[key];
        } else {
            value = undefined;
            break;
        }
    }

    const result = (value !== undefined && value !== null) ? value.toString() : (field.defaultValue?.toString() || '');
    return result;
}

// 生成新UUID的辅助函数
function generateUUID(): string {
    return crypto.randomUUID();
}

// 文本字段渲染器
function renderTextField(field: FormFieldConfig, data?: FormRenderData) {
    const value = getFieldValue(field, data);
    const requiredAttr = field.required ? true : undefined;
    const readonlyAttr = field.readonly ? true : undefined;

    return (
        <input
            type="text"
            id={field.id || field.name}
            name={field.name}
            value={value}
            placeholder={field.placeholder || ''}
            class={field.className || ''}
            required={requiredAttr}
            readonly={readonlyAttr}
        />
    );
}

// 隐藏字段渲染器
function renderHiddenField(field: FormFieldConfig, data?: FormRenderData) {
    const value = getFieldValue(field, data);

    return (
        <input
            type="hidden"
            name={field.name}
            value={value}
        />
    );
}

// UUID字段渲染器
function renderUuidField(field: FormFieldConfig, data?: FormRenderData) {
    let value = getFieldValue(field, data);

    // 如果没有值，生成新UUID（不管是新建还是编辑模式）
    if (!value || value === '' || value === 'undefined') {
        value = generateUUID();
    }

    const readonlyAttr = field.type === 'uuid_readonly' ? true : undefined;

    return (
        <input
            type="text"
            id={field.id || field.name}
            name={field.name}
            value={value}
            class="uuid"
            required={true}
            readonly={readonlyAttr}
        />
    );
}

// Index字段渲染器
function renderIndexField(field: FormFieldConfig, data?: FormRenderData) {
    let value = getFieldValue(field, data);

    // 如果没有值，生成新UUID作为index（不管是新建还是编辑模式）
    if (!value || value === '' || value === 'undefined') {
        value = generateUUID();
    }

    const readonlyAttr = field.type === 'index_readonly' ? true : undefined;

    return (
        <input
            type="text"
            id={field.id || field.name}
            name={field.name}
            value={value}
            class="index"
            required={true}
            readonly={readonlyAttr}
        />
    );
}

// 信息显示字段渲染器
function renderInfoDisplayField(field: FormFieldConfig, data?: FormRenderData) {
    const value = (field.type === 'info-display' ? field.value : undefined) || getFieldValue(field, data);

    return (
        <div class="info-display">
            <span class="info-value">{value}</span>
        </div>
    );
}

// 复选框字段渲染器
function renderCheckboxField(field: FormFieldConfig, data?: FormRenderData) {
    const value = getFieldValue(field, data);
    const checkedAttr = (value === 'true' || value === 'on') ? true : undefined;

    if (field.type === 'checkbox_inline') {
        return (
            <label>
                <input
                    type="checkbox"
                    name={field.name}
                    checked={checkedAttr}
                /> {field.label}
            </label>
        );
    }

    return (
        <div class="checkbox-field">
            <input
                type="checkbox"
                id={field.id || field.name}
                name={field.name}
                checked={checkedAttr}
            />
            <label for={field.id || field.name}>{field.label}</label>
        </div>
    );
}

// 选择器字段渲染器
function renderSelectField(field: FormFieldConfig, data?: FormRenderData) {
    const value = getFieldValue(field, data);
    const requiredAttr = field.required ? true : undefined;

    if (field.type !== 'md3_select') return <div>Invalid select field</div>;

    let options: Array<{ value: string; text: string }> = [];

    // 根据字段名称获取对应的选项
    if (field.name === 'copyright_basis') {
        options = copyrightBasisOptions;
    } else if (field.name === 'type' && Array.isArray(field.options) && typeof field.options[0] === 'string' && (field.options as string[]).includes('human')) {
        // Creator type: human, virtual
        options = creatorTypeOptions;
    } else if (field.name === 'type' && Array.isArray(field.options) && typeof field.options[0] === 'string' && (field.options as string[]).includes('raw_url')) {
        // Storage type: raw_url, ipfs
        options = storageTypeOptions;
    } else if (field.name === 'is_music') {
        options = booleanOptions;
    } else if (field.name === 'is_previewpic') {
        options = booleanOptionsZh;
    } else if (field.name === 'asset_type') {
        options = assetTypeOptions;
    } else if (field.name === 'relation_type') {
        options = relationTypeOptions;
    } else if (field.name === 'item_type') {
        options = footerItemTypeOptions;
    } else if (Array.isArray(field.options)) {
        options = field.options.map(opt =>
            typeof opt === 'string' ? { value: opt, text: opt } : opt
        );
    }

    return (
        <div class="md3-select-field">
            <select
                id={field.id || field.name}
                name={field.name}
                required={requiredAttr}
            >
                {options.map(option => (
                    <option
                        value={option.value}
                        selected={option.value === value ? true : undefined}
                    >
                        {option.text}
                    </option>
                ))}
            </select>
            <label class="md3-label">{field.label}</label>
            <div class="md3-state-layer"></div>
        </div>
    );
}

// 快速选择输入渲染器
function renderQuickSelectInput(field: FormFieldConfig, data?: FormRenderData, options?: FormOptions) {
    const value = getFieldValue(field, data);

    if (field.type !== 'quick_select_input') return <div>Invalid quick select field</div>;

    // 根据dataSource获取数据
    let selectOptions: Array<{ value: string; text: string }> = [];

    if (field.dataSource && options) {
        if (field.dataSource === 'options.works' && options.works) {
            selectOptions = options.works.map(work => ({
                value: work.work_index,
                text: work.titles?.length > 0 ? work.titles[0].title : `Work ${work.work_index.substring(0, 8)}`
            }));
        } else if (field.dataSource === 'options.creators' && options.creators) {
            selectOptions = options.creators.map(creator => ({
                value: creator.index,
                text: creator.name
            }));
        } else if (field.dataSource === 'options.categories' && options.categories) {
            selectOptions = options.categories.map(category => ({
                value: category.index,
                text: category.name
            }));
        } else if (field.dataSource === 'allExternalSources' && options.allExternalSources) {
            selectOptions = options.allExternalSources.map(source => ({
                value: source.index,
                text: source.name
            }));
        }
    }

    return (
        <div class="input-with-quick-select">
            <input
                type="text"
                id={field.id || field.name}
                name={field.name}
                required={field.required}
                value={value}
                class={field.className || 'uuid'}
            />
            <select
                id={field.quickSelectId}
                name={field.quickSelectId}
                class="quick-select"
                data-target-input={field.targetInputId || field.id || field.name}
            >
                <option value="">Select...</option>
                {selectOptions.map(option => (
                    <option value={option.value} selected={value === option.value ? true : undefined}>
                        {option.text}
                    </option>
                ))}
            </select>
        </div>
    );
}

// 主要字段渲染函数
export function renderFormField(field: FormFieldConfig, data?: FormRenderData, options?: FormOptions) {
    let fieldElement;

    switch (field.type) {
        case 'text':
        case 'text_input':
        case 'text_input_required':
            fieldElement = renderTextField(field, data);
            break;
        case 'hidden':
            fieldElement = renderHiddenField(field, data);
            break;
        case 'uuid_readonly':
        case 'uuid_editable':
            fieldElement = renderUuidField(field, data);
            break;
        case 'index_readonly':
        case 'index_editable':
            fieldElement = renderIndexField(field, data);
            break;
        case 'info-display':
            fieldElement = renderInfoDisplayField(field, data);
            break;
        case 'checkbox':
        case 'checkbox_inline':
            fieldElement = renderCheckboxField(field, data);
            break;
        case 'md3_select':
            fieldElement = renderSelectField(field, data);
            break;
        case 'quick_select_input':
            fieldElement = renderQuickSelectInput(field, data, options);
            break;
        default:
            fieldElement = <div>Unsupported field type: {(field as any).type}</div>;
    }

    // 为非隐藏字段添加标签和帮助文本
    if (field.type !== 'hidden' && field.type !== 'checkbox_inline') {
        return (
            <div class="form-field">
                {field.label && (
                    <label for={field.id || field.name}>{field.label}:</label>
                )}
                {fieldElement}
                {field.helpText && (
                    <small class="form-info">{field.helpText}</small>
                )}
            </div>
        );
    }

    return fieldElement;
}