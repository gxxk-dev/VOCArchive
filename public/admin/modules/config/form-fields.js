// 表单字段配置
// Form Fields Configuration for Different Content Types

import {
  booleanOptions,
  booleanOptionsZh,
  creatorTypeOptions,
  copyrightBasisOptions,
  relationTypeOptions,
  storageTypeOptions,
  assetTypeOptions,
  footerItemTypeOptions,
  configKeyOptions
} from './option-groups.js';

// Work 表单配置
export const workFormConfig = {
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
          options: copyrightBasisOptions,
          label: 'Copyright Basis',
          defaultValue: 'none',
          sourcePath: 'work.copyright_basis'
        },
        {
          name: 'license',
          type: 'text_input',
          label: 'License',
          containerId: 'license-container',
          sourcePath: 'work.license'
        }
      ]
    },
    {
      name: 'titles',
      title: 'Titles',
      type: 'dynamic-list',
      listType: 'titles_list'
    },
    {
      name: 'creators',
      title: 'creator',
      type: 'dynamic-list',
      listType: 'creators_list',
      dataSource: 'options.creators'
    },
    {
      name: 'wikis',
      title: 'Wikis',
      type: 'dynamic-list',
      listType: 'wikis_list'
    },
    {
      name: 'tags',
      title: '标签 (Tags)',
      type: 'selector',
      selectorType: 'tag_selector',
      dataSource: 'options.tags'
    },
    {
      name: 'categories',
      title: '分类 (Categories)',
      type: 'selector',
      selectorType: 'category_selector',
      dataSource: 'options.categories'
    }
  ]
};

// Creator 表单配置
export const creatorFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Creator Details',
      fields: [
        { name: 'creator_uuid', type: 'hidden', sourcePath: 'creator.uuid' },
        { name: 'creator.uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid', sourcePath: 'creator.uuid' },
        { name: 'creator.name', type: 'text_input_required', label: 'Name', sourcePath: 'creator.name' },
        {
          name: 'type',
          type: 'md3_select',
          options: creatorTypeOptions,
          label: 'Type',
          required: false,
          sourcePath: 'creator.type'
        }
      ]
    },
    {
      name: 'wikis',
      title: 'Wikis',
      type: 'dynamic-list',
      listType: 'wikis_list'
    }
  ]
};

// Media 表单配置
export const mediaFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Media Details',
      fields: [
        { name: 'media_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'work_uuid',
          type: 'quick_select_input',
          label: 'Work UUID',
          quickSelectId: 'work-quick-select',
          targetInputId: 'work_uuid',
          dataSource: 'options.works',
          className: 'uuid'
        },
        {
          name: 'is_music',
          type: 'md3_select',
          options: booleanOptions,
          label: 'Is Music'
        },
        { name: 'file_name', type: 'text_input_required', label: '文件名' },
        { name: 'mime_type', type: 'text_input_required', label: 'MIME Type' },
        { name: 'info', type: 'text_input_required', label: 'Info' }
      ]
    },
    {
      name: 'external_objects',
      title: '外部对象 (External Objects)',
      type: 'selector',
      selectorType: 'external_objects_selector',
      dataSource: 'allExternalSources'
    }
  ]
};

// Asset 表单配置
export const assetFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Asset Details',
      fields: [
        { name: 'asset_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'work_uuid',
          type: 'quick_select_input',
          label: 'Work UUID',
          id: 'work_uuid_asset',
          quickSelectId: 'work-quick-select-asset',
          targetInputId: 'work_uuid_asset',
          dataSource: 'options.works',
          className: 'uuid'
        },
        {
          name: 'asset_type',
          type: 'md3_select',
          options: assetTypeOptions,
          label: '资产类型'
        },
        { name: 'file_name', type: 'text_input_required', label: '文件名' },
        {
          name: 'is_previewpic',
          type: 'md3_select',
          options: booleanOptionsZh,
          label: '是否预览图',
          defaultValue: 'false'
        },
        { name: 'language', type: 'text_input', label: '语言' }
      ]
    },
    {
      name: 'external_objects',
      title: '外部对象 (External Objects)',
      type: 'selector',
      selectorType: 'external_objects_selector',
      dataSource: 'allExternalSources'
    },
    {
      name: 'creators',
      title: '创作者 (Creators)',
      type: 'dynamic-list',
      listType: 'asset_creators_list'
    }
  ]
};

// Relation 表单配置
export const relationFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Relation Details',
      fields: [
        { name: 'relation_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'from_work_uuid',
          type: 'quick_select_input',
          label: 'From Work UUID',
          quickSelectId: 'from-work-quick-select',
          targetInputId: 'from_work_uuid',
          dataSource: 'options.works',
          className: 'uuid'
        },
        {
          name: 'to_work_uuid',
          type: 'quick_select_input',
          label: 'To Work UUID',
          quickSelectId: 'to-work-quick-select',
          targetInputId: 'to_work_uuid',
          dataSource: 'options.works',
          className: 'uuid'
        },
        {
          name: 'relation_type',
          type: 'md3_select',
          options: relationTypeOptions,
          label: 'Relation Type'
        }
      ]
    }
  ]
};

// Tag 表单配置
export const tagFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Tag Details',
      fields: [
        { name: 'tag_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'name',
          type: 'text_input_required',
          label: '标签名称',
          placeholder: '例如: Rock, Ballad, Duet'
        }
      ]
    }
  ]
};

// Category 表单配置
export const categoryFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Category Details',
      fields: [
        { name: 'category_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'name',
          type: 'text_input_required',
          label: '分类名称',
          placeholder: '例如: 原创歌曲, 摇滚音乐'
        },
        {
          name: 'parent_uuid',
          type: 'quick_select_input',
          label: '父分类 (可选)',
          placeholder: '留空表示顶级分类',
          quickSelectId: 'parent-category-quick-select',
          targetInputId: 'parent_uuid',
          dataSource: 'options.categories',
          className: 'uuid'
        }
      ]
    }
  ]
};

// External Source 表单配置
export const externalSourceFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'External Source Details',
      fields: [
        { name: 'external_source_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'type',
          type: 'md3_select',
          options: storageTypeOptions,
          label: '存储类型',
          required: true
        },
        {
          name: 'name',
          type: 'text_input_required',
          label: '存储源名称',
          placeholder: '例如: 主要存储, 备份存储'
        },
        {
          name: 'endpoint',
          type: 'text_input',
          label: '访问端点',
          placeholder: '例如: https://example.com/{ID} 或 https://ipfs.io/ipfs/{ID}',
          helpText: '使用 {ID} 标记文件标识符位置。启用IPFS负载均衡时此字段可留空'
        },
        {
          name: 'isIPFS',
          type: 'checkbox',
          label: '启用IPFS负载均衡 (使用全局网关配置)',
          helpText: '启用后将使用系统配置的IPFS网关列表，支持自动故障转移'
        }
      ]
    }
  ]
};

// External Object 表单配置
export const externalObjectFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'External Object Details',
      fields: [
        { name: 'external_object_uuid', type: 'hidden', sourcePath: 'uuid' },
        { name: 'uuid', type: 'uuid_readonly', label: 'UUID', className: 'uuid' },
        {
          name: 'external_source_uuid',
          type: 'quick_select_input',
          label: '存储源',
          quickSelectId: 'source-quick-select',
          targetInputId: 'external_source_uuid',
          dataSource: 'allExternalSources',
          className: 'uuid'
        },
        {
          name: 'mime_type',
          type: 'text_input_required',
          label: 'MIME 类型',
          placeholder: '例如: image/jpeg, audio/mpeg, video/mp4'
        },
        {
          name: 'file_id',
          type: 'text_input_required',
          label: '文件 ID',
          placeholder: '在存储源中的文件标识符'
        }
      ]
    }
  ]
};

// Footer 表单配置
export const footerFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Footer Item Details',
      fields: [
        { name: 'uuid', type: 'hidden' },
        {
          name: 'item_type',
          type: 'md3_select',
          options: footerItemTypeOptions,
          label: 'Type',
          required: true
        },
        { name: 'text', type: 'text_input_required', label: 'Text' },
        { name: 'url', type: 'text_input', label: 'URL (optional)' },
        { name: 'icon_class', type: 'text_input', label: 'Icon Class (optional)' }
      ]
    }
  ]
};

// Site Config 表单配置
export const siteConfigFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Site Configuration',
      fields: [
        { name: 'config_key', type: 'hidden' },
        {
          name: 'key',
          type: 'md3_select',
          options: configKeyOptions,
          label: '配置键',
          required: true,
          readonly: true // 配置键不可修改
        },
        {
          name: 'value',
          type: 'text_input_required',
          label: '配置值',
          placeholder: '请输入配置值'
        },
        {
          name: 'description',
          type: 'text_input',
          label: '描述 (可选)',
          placeholder: '配置项的描述信息'
        }
      ],
      specialHelp: {
        titleKeys: ['site_title', 'home_title', 'player_title', 'admin_title', 'tags_categories_title', 'migration_title'],
        ipfsGateways: 'ipfs_gateways',
        secretKeys: ['totp_secret', 'jwt_secret']
      }
    }
  ]
};

// Wiki Platform 表单配置
export const wikiPlatformFormConfig = {
  sections: [
    {
      name: 'basic',
      title: 'Wiki Platform Details',
      fields: [
        {
          name: 'platform_key',
          type: 'text_input_required',
          label: '平台键 *',
          placeholder: '例如: wikipedia_zh, vocadb'
        },
        {
          name: 'platform_name',
          type: 'text_input_required',
          label: '平台名称 *',
          placeholder: '例如: 维基百科(中文), VocaDB'
        },
        {
          name: 'url_template',
          type: 'text_input_required',
          label: 'URL模板 *',
          placeholder: '例如: https://zh.wikipedia.org/wiki/{ENCODED_ID}',
          helpText: `可用占位符：
• {ID} - 直接替换为identifier
• {ENCODED_ID} - URL编码后的identifier
• {LANG} - 语言代码
• {TYPE} - 条目类型
示例：
• Wikipedia: https://zh.wikipedia.org/wiki/{ENCODED_ID}
• VocaDB: https://vocadb.net/S/{ID}
• Bilibili: https://www.bilibili.com/video/{ID}`
        },
        {
          name: 'icon_class',
          type: 'text_input',
          label: '图标样式 (可选)',
          placeholder: '例如: fa-wikipedia-w, fa-music'
        }
      ]
    }
  ]
};

// 所有表单配置的映射
export const formConfigs = {
  work: workFormConfig,
  creator: creatorFormConfig,
  media: mediaFormConfig,
  asset: assetFormConfig,
  relation: relationFormConfig,
  tag: tagFormConfig,
  category: categoryFormConfig,
  external_source: externalSourceFormConfig,
  external_object: externalObjectFormConfig,
  footer: footerFormConfig,
  site_config: siteConfigFormConfig,
  wiki_platform: wikiPlatformFormConfig
};

// 工具函数：根据类型获取表单配置
export function getFormConfig(type) {
  return formConfigs[type] || null;
}

// 工具函数：检查表单配置是否存在
export function isValidFormType(type) {
  return type in formConfigs;
}