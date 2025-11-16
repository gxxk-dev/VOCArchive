// 表单字段类型定义
// Form Field Type Definitions

import type { WorkInfo, TagApi, CategoryApi, CreatorApi, AssetWithCreators, MediaSourceWithExternalObjects, TagWithCount, CategoryWithCount } from '../../../../db/types';

export interface FormFieldBase {
    name: string;
    label?: string;
    id?: string;
    placeholder?: string;
    required?: boolean;
    readonly?: boolean;
    className?: string;
    sourcePath?: string;
    defaultValue?: string | boolean;
    helpText?: string;
}

export interface TextFieldConfig extends FormFieldBase {
    type: 'text' | 'text_input' | 'text_input_required';
}

export interface HiddenFieldConfig extends FormFieldBase {
    type: 'hidden';
}

export interface UuidFieldConfig extends FormFieldBase {
    type: 'uuid_readonly' | 'uuid_editable';
}

export interface CheckboxFieldConfig extends FormFieldBase {
    type: 'checkbox' | 'checkbox_inline';
}

export interface SelectFieldConfig extends FormFieldBase {
    type: 'md3_select';
    options: Array<{ value: string; text: string }> | string[];
}

export interface QuickSelectInputConfig extends FormFieldBase {
    type: 'quick_select_input';
    quickSelectId: string;
    targetInputId: string;
    dataSource: string;
    valueField?: string;
    displayField?: string;
}

export type FormFieldConfig =
    | TextFieldConfig
    | HiddenFieldConfig
    | UuidFieldConfig
    | CheckboxFieldConfig
    | SelectFieldConfig
    | QuickSelectInputConfig;

export interface FormSectionConfig {
    name: string;
    title?: string;
    fields?: FormFieldConfig[];
    type?: 'dynamic-list' | 'selector' | 'info-display';
    listType?: string;
    selectorType?: string;
    dataSource?: string;
}

export interface FormConfig {
    sections: FormSectionConfig[];
}

// Data types for form rendering
export interface FormRenderData {
    work?: WorkInfo | null;
    creator?: { creator: CreatorApi; wikis: any[] } | null;
    tag?: TagApi | null;
    category?: CategoryApi | null;
    asset?: AssetWithCreators | null;
    media?: MediaSourceWithExternalObjects | null;
    external_source?: any | null; // 修复：移除不存在的ExternalSourceWithObjects类型
    external_object?: any | null;
    [key: string]: any;
}

export interface FormOptions {
    creators?: CreatorApi[];
    tags?: TagWithCount[];
    categories?: CategoryWithCount[];
    works?: any[];
    allExternalSources?: any[];
    allExternalObjects?: any[];
}