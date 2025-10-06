/**
 * 选择器配置文件
 * 定义所有选择器的配置信息，包括API端点、显示字段、过滤规则等
 */

/**
 * UUID选择器配置
 * 用于快速选择对象UUID的下拉框配置
 */
export const UUID_SELECTOR_CONFIG = {
    work: {
        apiEndpoint: '/api/list/work',
        valueField: 'work_uuid',
        displayField: 'titles',
        label: '作品',
        placeholder: '--选择作品--',
        displayFormatter: (item) => {
            if (!item) {
                return 'Invalid Item';
            }

            // 优先使用 work_uuid，如果不存在则使用 uuid
            const uuid = item.work_uuid || item.uuid;
            if (!uuid) {
                return 'Invalid Item';
            }

            let title = 'Untitled';

            // 处理不同格式的标题数据
            if (item.titles && Array.isArray(item.titles)) {
                // 标准格式：titles 数组
                const officialTitle = item.titles.find(t => t.is_official);
                title = officialTitle ? officialTitle.title : item.titles[0]?.title || 'Untitled';
            } else if (item.titles && typeof item.titles === 'object') {
                // 如果 titles 是对象而不是数组
                title = item.titles.title || item.titles.name || 'Untitled';
            } else if (item.title) {
                // 直接有 title 字段
                title = item.title;
            } else if (item.name) {
                // 使用 name 字段作为备选
                title = item.name;
            }

            return `${title} (${uuid.substring(0, 8)}...)`;
        }
    },
    creator: {
        apiEndpoint: '/api/list/creators',
        valueField: 'uuid',
        displayField: 'name',
        label: '创作者',
        placeholder: '--选择创作者--',
        displayFormatter: (item) => {
            if (!item || !item.uuid) {
                return 'Invalid Item';
            }
            return `${item.name} (${item.uuid.substring(0, 8)}...)`;
        }
    },
    external_source: {
        apiEndpoint: '/api/list/external_sources',
        valueField: 'uuid',
        displayField: 'name',
        label: '存储源',
        placeholder: '--选择存储源--',
        displayFormatter: (item) => {
            if (!item || !item.uuid) {
                return 'Invalid Item';
            }
            return `${item.name} (${item.uuid.substring(0, 8)}...)`;
        }
    },
    category: {
        apiEndpoint: '/api/list/categories',
        valueField: 'uuid',
        displayField: 'name',
        label: '分类',
        placeholder: '--选择父分类--',
        displayFormatter: (item, level = 0) => {
            if (!item || !item.uuid) {
                return 'Invalid Item';
            }
            const indent = '　'.repeat(level);
            return `${indent}${item.name} (${item.uuid.substring(0, 8)}...)`;
        },
        hierarchical: true
    }
};

/**
 * 多选器配置
 * 用于标签、分类、外部对象等多选组件的配置
 */
export const MULTI_SELECTOR_CONFIG = {
    tags: {
        apiEndpoint: '/api/list/tags',
        valueField: 'uuid',
        displayField: 'name',
        label: '标签',
        placeholder: '搜索标签...',
        filterFields: ['name'],
        className: 'tag-selector',
        itemClassName: 'tag-checkbox',
        chipClassName: 'tag-chip'
    },
    categories: {
        apiEndpoint: '/api/list/categories',
        valueField: 'uuid',
        displayField: 'name',
        label: '分类',
        placeholder: '搜索分类...',
        filterFields: ['name'],
        className: 'category-selector',
        itemClassName: 'category-checkbox',
        chipClassName: 'category-chip',
        hierarchical: true
    },
    external_objects: {
        apiEndpoint: '/api/list/external_objects',
        valueField: 'uuid',
        displayField: 'file_id',
        label: '外部对象',
        placeholder: '搜索外部对象...',
        filterFields: ['file_id', 'mime_type'],
        className: 'external-objects-selector',
        itemClassName: 'external-object-checkbox',
        chipClassName: 'external-object-chip',
        refreshable: true
    }
};

/**
 * MD3选择器配置
 * Material Design 3风格的下拉选择器配置
 */
export const MD3_SELECTOR_CONFIG = {
    // 通用配置选项
    default: {
        className: 'md3-select-field',
        required: false,
        placeholder: '--请选择--'
    },

    // 预定义的选择器类型
    presets: {
        boolean: {
            label: '是/否',
            options: [
                { value: 'true', text: '是' },
                { value: 'false', text: '否' }
            ]
        },

        asset_type: {
            label: '资产类型',
            options: [
                { value: 'lyrics', text: '歌词' },
                { value: 'picture', text: '图片' }
            ]
        },

        storage_type: {
            label: '存储类型',
            options: [
                { value: 'raw_url', text: '直接 URL' },
                { value: 'ipfs', text: 'IPFS' }
            ]
        },

        footer_item_type: {
            label: '页脚项目类型',
            options: [
                { value: 'link', text: '链接' },
                { value: 'social', text: '社交媒体' },
                { value: 'copyright', text: '版权信息' }
            ]
        },

        relation_type: {
            label: '关系类型',
            options: [
                { value: 'remix', text: '重混' },
                { value: 'cover', text: '翻唱' },
                { value: 'original', text: '原创' },
                { value: 'derive', text: '衍生' }
            ]
        },

        site_config_keys: {
            label: '配置键',
            options: [
                { value: 'site_title', text: '网站标题 (site_title)' },
                { value: 'home_title', text: '主页标题 (home_title)' },
                { value: 'admin_title', text: '管理标题 (admin_title)' },
                { value: 'description', text: '网站描述 (description)' }
            ]
        }
    }
};

/**
 * 选择器事件配置
 * 定义选择器的事件处理配置
 */
export const SELECTOR_EVENTS = {
    // 快速选择器的事件
    quickSelect: {
        change: 'quick-select-change',
        load: 'quick-select-load'
    },

    // 多选器的事件
    multiSelect: {
        filter: 'multi-select-filter',
        select: 'multi-select-select',
        refresh: 'multi-select-refresh'
    },

    // MD3选择器的事件
    md3Select: {
        change: 'md3-select-change',
        focus: 'md3-select-focus',
        blur: 'md3-select-blur'
    }
};

/**
 * 选择器CSS类名配置
 * 统一管理所有选择器相关的CSS类名
 */
export const SELECTOR_CLASSES = {
    // 容器类名
    containers: {
        quickSelect: 'quick-select-container',
        inputWithQuickSelect: 'input-with-quick-select',
        tagSelector: 'tag-selector',
        categorySelector: 'category-selector',
        externalObjectsSelector: 'external-objects-selector'
    },

    // 输入框类名
    inputs: {
        quickSelectField: 'quick-select-field',
        quickSelectHint: 'quick-select-hint',
        filterInput: 'filter-input'
    },

    // 列表项类名
    items: {
        tagCheckbox: 'tag-checkbox',
        tagChip: 'tag-chip',
        categoryCheckbox: 'category-checkbox',
        categoryChip: 'category-chip',
        externalObjectCheckbox: 'external-object-checkbox'
    },

    // 状态类名
    states: {
        selected: 'selected',
        disabled: 'disabled',
        loading: 'loading',
        error: 'error'
    }
};

/**
 * 获取UUID选择器配置
 * @param {string} type - 选择器类型
 * @returns {object} 配置对象
 */
export function getUuidSelectorConfig(type) {
    return UUID_SELECTOR_CONFIG[type] || null;
}

/**
 * 获取多选器配置
 * @param {string} type - 选择器类型
 * @returns {object} 配置对象
 */
export function getMultiSelectorConfig(type) {
    return MULTI_SELECTOR_CONFIG[type] || null;
}

/**
 * 获取MD3选择器预设配置
 * @param {string} preset - 预设类型
 * @returns {object} 配置对象
 */
export function getMD3SelectorPreset(preset) {
    return MD3_SELECTOR_CONFIG.presets[preset] || null;
}

/**
 * 获取选择器CSS类名
 * @param {string} category - 类名分类
 * @param {string} type - 具体类型
 * @returns {string} CSS类名
 */
export function getSelectorClass(category, type) {
    return SELECTOR_CLASSES[category]?.[type] || '';
}