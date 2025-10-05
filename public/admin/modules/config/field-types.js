// 可复用字段类型定义
// Field Types Configuration for Form Generator

// 基础输入字段类型
export const basicFieldTypes = {
  // UUID字段
  uuid_readonly: {
    type: 'text',
    className: 'uuid',
    readonly: true,
    generator: () => crypto.randomUUID(),
    template: (props) => `<input type="text" id="${props.id}" name="${props.name}" required value="${props.value}" readonly class="uuid">`
  },

  uuid_editable: {
    type: 'text',
    className: 'uuid',
    readonly: false,
    generator: () => crypto.randomUUID(),
    template: (props) => `<input type="text" id="${props.id}" name="${props.name}" required value="${props.value}" class="uuid">`
  },

  // 文本输入
  text_input: {
    type: 'text',
    template: (props) => `<input type="text" id="${props.id}" name="${props.name}" ${props.required ? 'required' : ''} value="${props.value || ''}" placeholder="${props.placeholder || ''}">`
  },

  text_input_required: {
    type: 'text',
    required: true,
    template: (props) => `<input type="text" id="${props.id}" name="${props.name}" required value="${props.value || ''}" placeholder="${props.placeholder || ''}">`
  },

  // 隐藏字段
  hidden: {
    type: 'hidden',
    template: (props) => `<input type="hidden" name="${props.name}" value="${props.value || ''}">`
  },

  // 复选框
  checkbox: {
    type: 'checkbox',
    template: (props) => `
      <div class="checkbox-field">
        <input type="checkbox" id="${props.id}" name="${props.name}" ${props.checked ? 'checked' : ''}>
        <label for="${props.id}">${props.label}</label>
      </div>
    `
  },

  checkbox_inline: {
    type: 'checkbox-inline',
    template: (props) => `<label><input type="checkbox" name="${props.name}" ${props.checked ? 'checked' : ''}> ${props.label}</label>`
  }
};

// MD3 Select下拉框类型
export const selectFieldTypes = {
  md3_select: {
    type: 'select',
    template: (props) => {
      const optionsHtml = props.options.map(option => {
        const value = typeof option === 'object' ? option.value : option;
        const text = typeof option === 'object' ? option.text : option;
        const selected = value === props.value ? 'selected' : '';
        return `<option value="${value}" ${selected}>${text}</option>`;
      }).join('');

      return `
        <div class="md3-select-field">
          <select id="${props.id}" name="${props.name}" ${props.required ? 'required' : ''}>
            ${optionsHtml}
          </select>
          <label class="md3-label">${props.label}</label>
          <div class="md3-state-layer"></div>
        </div>
      `;
    }
  },

  // 快速选择输入组合
  quick_select_input: {
    type: 'quick-select-combo',
    template: (props) => `
      <div class="input-with-quick-select">
        <input type="text" id="${props.id}" name="${props.name}" required value="${props.value || ''}" class="uuid">
        ${props.quickSelector || ''}
      </div>
    `
  }
};

// 动态列表字段类型
export const dynamicListTypes = {
  // 标题列表
  titles_list: {
    type: 'dynamic-list',
    listId: 'titles-list',
    addButtonId: 'add-title-button',
    addButtonText: 'Add Title',
    itemTemplate: (data = {}) => `
      <div class="dynamic-list-item">
        <input type="text" name="title_text" placeholder="Title" required value="${data.title || ''}">
        <input type="text" name="title_lang" placeholder="Lang" required value="${data.language || 'ja'}">
        <label><input type="checkbox" name="title_is_official" ${data.is_official ? 'checked' : ''}> 官方标题</label>
        <label><input type="checkbox" name="title_is_for_search" ${data.is_for_search ? 'checked' : ''}> 仅用于搜索</label>
        <button type="button" class="remove-row-button">Remove</button>
      </div>
    `
  },

  // 创作者列表
  creators_list: {
    type: 'dynamic-list',
    listId: 'creator-list',
    addButtonId: 'add-creator-button',
    addButtonText: 'Add Creator',
    itemTemplate: (data = {}, options = {}) => {
      const creatorOptions = (options.creators || []).map(c =>
        `<option value="${c.uuid}" ${data.creator_uuid === c.uuid ? 'selected' : ''}>${c.name}</option>`
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
          <input type="text" name="creator_role" placeholder="Role" required value="${data.role || ''}">
          <button type="button" class="remove-row-button">Remove</button>
        </div>
      `;
    }
  },

  // Wiki列表
  wikis_list: {
    type: 'dynamic-list',
    listId: 'wikis-list',
    addButtonId: 'add-wiki-button',
    addButtonText: 'Add Wiki',
    itemTemplate: (data = {}) => `
      <div class="dynamic-list-item">
        <input type="text" name="wiki_platform" placeholder="Wiki Platform" required value="${data.platform || ''}">
        <input type="text" name="wiki_id" placeholder="Wiki ID" required value="${data.identifier || ''}">
        <button type="button" class="remove-row-button">Remove</button>
      </div>
    `
  },

  // 资产创作者列表
  asset_creators_list: {
    type: 'dynamic-list',
    listId: 'asset-creator-list',
    addButtonId: 'add-asset-creator-button',
    addButtonText: 'Add Creator',
    itemTemplate: (data = {}) => `
      <div class="dynamic-list-item">
        <input type="text" name="asset_creator_uuid" placeholder="Creator UUID" required value="${data.creator_uuid || ''}">
        <input type="text" name="asset_creator_role" placeholder="Role" required value="${data.role || ''}">
        <button type="button" class="remove-row-button">Remove</button>
      </div>
    `
  }
};

// 特殊选择器字段类型
export const selectorTypes = {
  // 标签选择器
  tag_selector: {
    type: 'tag-selector',
    selectorId: 'tags-selector',
    className: 'tag-selector',
    dataSource: 'options.tags',
    template: (props) => `
      <div id="${props.selectorId}" class="${props.className}">
        ${props.selectorContent || ''}
      </div>
    `
  },

  // 分类选择器
  category_selector: {
    type: 'category-selector',
    selectorId: 'categories-selector',
    className: 'category-selector',
    dataSource: 'options.categories',
    template: (props) => `
      <div id="${props.selectorId}" class="${props.className}">
        ${props.selectorContent || ''}
      </div>
    `
  },

  // 外部对象选择器
  external_objects_selector: {
    type: 'external-objects-selector',
    selectorId: 'external-objects-selector',
    className: 'external-objects-selector',
    dataSource: 'allExternalSources',
    template: (props) => `
      <div id="${props.selectorId}" class="${props.className}">
        ${props.selectorContent || ''}
      </div>
    `
  }
};

// 组合字段类型
export const compositeTypes = {
  // 表单章节
  form_section: {
    type: 'section',
    template: (props) => `
      <div class="form-section">
        <h4>${props.title}</h4>
        ${props.content || ''}
      </div>
    `
  },

  // 带帮助信息的字段
  field_with_help: {
    type: 'field-with-help',
    template: (props) => `
      ${props.fieldContent || ''}
      <small class="${props.helpClass || 'form-info'}">${props.helpText || ''}</small>
    `
  },

  // 带占位符帮助的字段
  field_with_placeholder_help: {
    type: 'field-with-placeholder-help',
    template: (props) => `
      ${props.fieldContent || ''}
      <div class="placeholder-help">
        <strong>💡 可用占位符：</strong><br>
        ${props.placeholderInfo || ''}
      </div>
    `
  }
};

// 合并所有字段类型
export const allFieldTypes = {
  ...basicFieldTypes,
  ...selectFieldTypes,
  ...dynamicListTypes,
  ...selectorTypes,
  ...compositeTypes
};

// 工具函数：根据字段类型获取模板
export function getFieldTemplate(type) {
  return allFieldTypes[type] || null;
}

// 工具函数：检查字段类型是否存在
export function isValidFieldType(type) {
  return type in allFieldTypes;
}