// 表单配置定义
// Form Configuration Definitions

import type { FormConfig } from './form-field-types';

// Work 表单配置
export const workFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Work Details',
            fields: [
                { name: 'work_uuid', type: 'hidden', sourcePath: 'work.work_uuid' },
                {
                    name: 'work_uuid_display',
                    type: 'uuid_readonly',
                    label: 'Work UUID',
                    id: 'work-uuid',
                    className: 'uuid',
                    sourcePath: 'work.work_uuid'
                },
                {
                    name: 'copyright_basis',
                    type: 'md3_select',
                    options: ['none', 'original', 'cover', 'arrangement'],
                    label: 'Copyright Basis',
                    defaultValue: 'none',
                    sourcePath: 'work.copyright_basis'
                },
                {
                    name: 'license',
                    type: 'text_input',
                    label: 'License',
                    sourcePath: 'license'
                }
            ]
        },
        {
            name: 'titles',
            title: 'Titles',
            type: 'dynamic-list',
            listType: 'work-titles',
            fields: []
        },
        {
            name: 'creators',
            title: 'Creators',
            type: 'dynamic-list',
            listType: 'work-creators',
            fields: []
        },
        {
            name: 'media',
            title: 'Media Sources',
            type: 'dynamic-list',
            listType: 'media-sources',
            fields: []
        },
        {
            name: 'assets',
            title: 'Assets',
            type: 'dynamic-list',
            listType: 'assets',
            fields: []
        },
        {
            name: 'relations',
            title: 'Work Relations',
            type: 'dynamic-list',
            listType: 'work-relations',
            fields: []
        },
        {
            name: 'tags',
            title: 'Tags',
            type: 'selector',
            selectorType: 'tags',
            fields: []
        },
        {
            name: 'categories',
            title: 'Categories',
            type: 'selector',
            selectorType: 'categories',
            fields: []
        }
    ]
};

// Creator 表单配置
export const creatorFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Creator Details',
            fields: [
                { name: 'creator_uuid', type: 'hidden', sourcePath: 'creator.creator.uuid' },
                {
                    name: 'creator.uuid',
                    type: 'uuid_readonly',
                    label: 'UUID',
                    className: 'uuid',
                    sourcePath: 'creator.creator.uuid'
                },
                {
                    name: 'creator.name',
                    type: 'text_input_required',
                    label: 'Name',
                    sourcePath: 'creator.creator.name'
                },
                {
                    name: 'type',
                    type: 'md3_select',
                    options: ['human', 'virtual'],
                    label: 'Type',
                    required: false,
                    sourcePath: 'creator.creator.type'
                }
            ]
        },
        {
            name: 'wikis',
            title: 'Wiki Links',
            type: 'dynamic-list',
            listType: 'creator-wikis',
            fields: []
        }
    ]
};

// Media 表单配置
export const mediaFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Media Details',
            fields: [
                { name: 'media_uuid', type: 'hidden', sourcePath: 'media.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'media.uuid' },
                {
                    name: 'work_uuid',
                    type: 'quick_select_input',
                    label: 'Work UUID',
                    quickSelectId: 'work-quick-select',
                    targetInputId: 'work_uuid',
                    dataSource: 'options.works',
                    className: 'uuid',
                    sourcePath: 'media.work_uuid'
                },
                {
                    name: 'is_music',
                    type: 'md3_select',
                    options: ['true', 'false'],
                    label: 'Is Music',
                    sourcePath: 'media.is_music'
                },
                { name: 'file_name', type: 'text_input_required', label: '文件名', sourcePath: 'media.file_name' },
                { name: 'mime_type', type: 'text_input_required', label: 'MIME Type', sourcePath: 'media.mime_type' },
                { name: 'info', type: 'text_input_required', label: 'Info', sourcePath: 'media.info' }
            ]
        },
        {
            name: 'external_objects',
            title: 'External Objects',
            type: 'dynamic-list',
            listType: 'external-objects',
            fields: []
        }
    ]
};

// Asset 表单配置
export const assetFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Asset Details',
            fields: [
                { name: 'asset_uuid', type: 'hidden', sourcePath: 'asset.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'asset.uuid' },
                {
                    name: 'work_uuid',
                    type: 'quick_select_input',
                    label: 'Work UUID',
                    id: 'work_uuid_asset',
                    quickSelectId: 'work-quick-select-asset',
                    targetInputId: 'work_uuid_asset',
                    dataSource: 'options.works',
                    className: 'uuid',
                    sourcePath: 'asset.work_uuid'
                },
                {
                    name: 'asset_type',
                    type: 'md3_select',
                    options: ['lyrics', 'picture'],
                    label: '资产类型',
                    sourcePath: 'asset.asset_type'
                },
                { name: 'file_name', type: 'text_input_required', label: '文件名', sourcePath: 'asset.file_name' },
                {
                    name: 'is_previewpic',
                    type: 'md3_select',
                    options: ['true', 'false'],
                    label: '是否预览图',
                    defaultValue: 'false',
                    sourcePath: 'asset.is_previewpic'
                },
                { name: 'language', type: 'text_input', label: '语言', sourcePath: 'asset.language' }
            ]
        },
        {
            name: 'creators',
            title: 'Asset Creators',
            type: 'dynamic-list',
            listType: 'asset-creators',
            fields: []
        },
        {
            name: 'external_objects',
            title: 'External Objects',
            type: 'dynamic-list',
            listType: 'external-objects',
            fields: []
        }
    ]
};

// Tag 表单配置
export const tagFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Tag Details',
            fields: [
                { name: 'tag_uuid', type: 'hidden', sourcePath: 'tag.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'tag.uuid' },
                {
                    name: 'name',
                    type: 'text_input_required',
                    label: '标签名称',
                    placeholder: '例如: Rock, Ballad, Duet',
                    sourcePath: 'tag.name'
                }
            ]
        }
    ]
};

// Category 表单配置
export const categoryFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Category Details',
            fields: [
                { name: 'category_uuid', type: 'hidden', sourcePath: 'category.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'category.uuid' },
                {
                    name: 'name',
                    type: 'text_input_required',
                    label: '分类名称',
                    placeholder: '例如: 原创歌曲, 摇滚音乐',
                    sourcePath: 'category.name'
                },
                {
                    name: 'parent_uuid',
                    type: 'quick_select_input',
                    label: '父分类 (可选)',
                    placeholder: '留空表示顶级分类',
                    quickSelectId: 'parent-category-quick-select',
                    targetInputId: 'parent_uuid',
                    dataSource: 'options.categories',
                    className: 'uuid',
                    sourcePath: 'category.parent_uuid'
                }
            ]
        }
    ]
};

// External Source 表单配置
export const externalSourceFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'External Source Details',
            fields: [
                { name: 'external_source_uuid', type: 'hidden', sourcePath: 'external_source.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'external_source.uuid' },
                {
                    name: 'type',
                    type: 'md3_select',
                    options: ['raw_url', 'ipfs'],
                    label: '存储类型',
                    required: true,
                    sourcePath: 'external_source.type'
                },
                {
                    name: 'name',
                    type: 'text_input_required',
                    label: '存储源名称',
                    placeholder: '例如: 主要存储, 备份存储',
                    sourcePath: 'external_source.name'
                },
                {
                    name: 'endpoint',
                    type: 'text_input',
                    label: '访问端点',
                    placeholder: '例如: https://example.com/{ID} 或 https://ipfs.io/ipfs/{ID}',
                    helpText: '使用 {ID} 标记文件标识符位置。启用IPFS负载均衡时此字段可留空',
                    sourcePath: 'external_source.endpoint'
                },
                {
                    name: 'isIPFS',
                    type: 'checkbox',
                    label: '启用IPFS负载均衡 (使用全局网关配置)',
                    helpText: '启用后将使用系统配置的IPFS网关列表，支持自动故障转移',
                    sourcePath: 'external_source.isIPFS'
                }
            ]
        }
    ]
};

// External Object 表单配置
export const externalObjectFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'External Object Details',
            fields: [
                { name: 'external_object_uuid', type: 'hidden', sourcePath: 'external_object.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'external_object.uuid' },
                {
                    name: 'external_source_uuid',
                    type: 'quick_select_input',
                    label: '存储源',
                    quickSelectId: 'source-quick-select',
                    targetInputId: 'external_source_uuid',
                    dataSource: 'allExternalSources',
                    className: 'uuid',
                    sourcePath: 'external_object.source.uuid'
                },
                {
                    name: 'mime_type',
                    type: 'text_input_required',
                    label: 'MIME 类型',
                    placeholder: '例如: image/jpeg, audio/mpeg, video/mp4',
                    sourcePath: 'external_object.mime_type'
                },
                {
                    name: 'file_id',
                    type: 'text_input_required',
                    label: '文件 ID',
                    placeholder: '在存储源中的文件标识符',
                    sourcePath: 'external_object.file_id'
                }
            ]
        }
    ]
};

// Footer 表单配置
export const footerFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Footer Item Details',
            fields: [
                { name: 'uuid', type: 'hidden', sourcePath: 'footer.uuid' },
                {
                    name: 'item_type',
                    type: 'md3_select',
                    options: ['link', 'social', 'copyright'],
                    label: 'Type',
                    required: true,
                    sourcePath: 'footer.item_type'
                },
                { name: 'text', type: 'text_input_required', label: 'Text', sourcePath: 'footer.text' },
                { name: 'url', type: 'text_input', label: 'URL (optional)', sourcePath: 'footer.url' },
                { name: 'icon_class', type: 'text_input', label: 'Icon Class (optional)', sourcePath: 'footer.icon_class' }
            ]
        }
    ]
};

// Site Config 表单配置
export const siteConfigFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Site Configuration',
            fields: [
                {
                    name: 'key',
                    type: 'text_input_required',
                    label: '配置键',
                    placeholder: '例如: site_title, home_title',
                    sourcePath: 'site_config.key'
                },
                {
                    name: 'value',
                    type: 'text_input_required',
                    label: '配置值',
                    placeholder: '配置的值',
                    sourcePath: 'site_config.value'
                },
                {
                    name: 'description',
                    type: 'text_input',
                    label: '描述',
                    placeholder: '配置项的描述 (可选)',
                    sourcePath: 'site_config.description'
                }
            ]
        }
    ]
};

// Wiki Platform 表单配置
export const wikiPlatformFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Wiki Platform Details',
            fields: [
                {
                    name: 'platform_key',
                    type: 'text_input_required',
                    label: '平台键',
                    placeholder: '例如: vocadb, moegirlpedia',
                    sourcePath: 'wiki_platform.platform_key'
                },
                {
                    name: 'platform_name',
                    type: 'text_input_required',
                    label: '平台名称',
                    placeholder: '例如: VocaDB, 萌娘百科',
                    sourcePath: 'wiki_platform.platform_name'
                },
                {
                    name: 'url_template',
                    type: 'text_input_required',
                    label: 'URL 模板',
                    placeholder: '例如: https://vocadb.net/S/{ID}',
                    helpText: '使用 {ID} 标记标识符位置，{ENCODED_ID} 用于URL编码的标识符',
                    sourcePath: 'wiki_platform.url_template'
                },
                {
                    name: 'icon_class',
                    type: 'text_input',
                    label: '图标类',
                    placeholder: '例如: fa-music, fa-book',
                    helpText: 'FontAwesome 图标类名 (可选)',
                    sourcePath: 'wiki_platform.icon_class'
                }
            ]
        }
    ]
};

// Relation 表单配置
export const relationFormConfig: FormConfig = {
    sections: [
        {
            name: 'basic',
            title: 'Work Relation Details',
            fields: [
                { name: 'relation_uuid', type: 'hidden', sourcePath: 'relation.uuid' },
                { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'relation.uuid' },
                {
                    name: 'from_work_uuid',
                    type: 'quick_select_input',
                    label: '源作品 (From Work)',
                    quickSelectId: 'from-work-quick-select',
                    targetInputId: 'from_work_uuid',
                    dataSource: 'options.works',
                    className: 'uuid',
                    sourcePath: 'relation.from_work_uuid'
                },
                {
                    name: 'relation_type',
                    type: 'md3_select',
                    options: ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'],
                    label: '关系类型',
                    required: true,
                    sourcePath: 'relation.relation_type'
                },
                {
                    name: 'to_work_uuid',
                    type: 'quick_select_input',
                    label: '目标作品 (To Work)',
                    quickSelectId: 'to-work-quick-select',
                    targetInputId: 'to_work_uuid',
                    dataSource: 'options.works',
                    className: 'uuid',
                    sourcePath: 'relation.to_work_uuid'
                }
            ]
        }
    ]
};

// 所有表单配置的映射
export const formConfigs: Record<string, FormConfig> = {
    work: workFormConfig,
    creator: creatorFormConfig,
    media: mediaFormConfig,
    asset: assetFormConfig,
    tag: tagFormConfig,
    category: categoryFormConfig,
    external_source: externalSourceFormConfig,
    external_object: externalObjectFormConfig,
    footer: footerFormConfig,
    site_config: siteConfigFormConfig,
    wiki_platform: wikiPlatformFormConfig,
    relation: relationFormConfig
};

// 工具函数：根据类型获取表单配置
export function getFormConfig(type: string): FormConfig | null {
    return formConfigs[type] || null;
}

// 工具函数：检查表单配置是否存在
export function isValidFormType(type: string): boolean {
    return type in formConfigs;
}