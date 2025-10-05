import { jsx } from 'hono/jsx'
import { getFormConfig } from './components/admin/form/form-config'
import { FormRenderer } from './components/admin/form/form-renderer'
import type { FormRenderData, FormOptions } from './components/admin/form/form-field-types'

export interface AdminEditorPageProps {
    type?: string
    uuid?: string
    data?: FormRenderData
    options?: FormOptions
}

export const AdminEditorPage = (props: AdminEditorPageProps) => {
    const { type, uuid, data, options } = props;

    // 获取表单配置
    const formConfig = type ? getFormConfig(type) : null;

    // 确定标题
    const getTypeDisplayName = (type: string) => {
        const typeNames: Record<string, string> = {
            'work': '作品',
            'creator': '作者',
            'media': '媒体',
            'asset': '资产',
            'relation': '关系',
            'tag': '标签',
            'category': '分类',
            'external_source': '存储源',
            'external_object': '外部对象',
            'footer': '页脚'
        };
        return typeNames[type] || type;
    };

    const isNewItem = !uuid;
    const actionText = isNewItem ? '新建' : '编辑';
    const typeDisplayName = type ? getTypeDisplayName(type) : '内容';
    const editorTitle = `${actionText}${typeDisplayName}`;

    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Admin Editor - {type || 'Editor'}</title>
                <link rel="stylesheet" href="/css/common.css" />
                <link rel="stylesheet" href="/css/admin.css" />
                <link rel="stylesheet" href="/css/editor.css" />
                <link rel="stylesheet" href="/admin/css/selectors.css" />
                <script type="module" src="/admin/md3-select.js"></script>
                <script type="module" src="/admin/modules/api.js"></script>
                <script type="module" src="/admin/modules/theme.js"></script>
                <script src="/admin/iframe-handler.js"></script>
                <script type="module" dangerouslySetInnerHTML={{
                    __html: `
                    // Initialize editor modules for iframe content
                    import { initializeTheme } from '/admin/modules/theme.js';

                    document.addEventListener('DOMContentLoaded', () => {
                        // Initialize theme first
                        initializeTheme();

                        // 设置保存和取消按钮的事件处理
                        const saveButton = document.getElementById('editor-save');
                        const cancelButton = document.getElementById('editor-cancel');
                        const form = document.getElementById('editor-form');

                        if (saveButton && form) {
                            saveButton.addEventListener('click', async (e) => {
                                e.preventDefault();
                                await handleFormSave();
                            });
                        }

                        if (cancelButton) {
                            cancelButton.addEventListener('click', (e) => {
                                e.preventDefault();
                                handleFormCancel();
                            });
                        }

                        if (form) {
                            form.addEventListener('submit', async (e) => {
                                e.preventDefault();
                                await handleFormSave();
                            });
                        }

                        // Notify parent window that iframe is ready
                        window.parent.postMessage({
                            type: 'editor-iframe-ready',
                            data: { type: '${type || ''}', uuid: '${uuid || ''}' }
                        }, '*');

                        // Listen for theme changes from parent window
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'theme-change') {
                                document.documentElement.setAttribute('data-theme', event.data.theme);
                            }
                        });

                        // 初始化动态列表功能
                        initializeDynamicListHandlers();

                        // 初始化快速选择器功能
                        initializeQuickSelectHandlers();

                        // 初始化过滤器功能
                        initializeFilterHandlers();

                        console.log('Editor iframe loaded with server-rendered form');
                    });

                    // 初始化动态列表处理器
                    function initializeDynamicListHandlers() {
                        const form = document.getElementById('editor-form');
                        if (!form) return;

                        // 处理添加按钮点击
                        form.addEventListener('click', (e) => {
                            if (e.target.classList.contains('add-row-button')) {
                                e.preventDefault();
                                handleAddRowClick(e.target);
                            } else if (e.target.classList.contains('remove-row-button')) {
                                e.preventDefault();
                                handleRemoveRowClick(e.target);
                            }
                        });
                    }

                    // 处理添加行点击
                    function handleAddRowClick(button) {
                        const buttonId = button.id;
                        let listContainer;
                        let newRowHtml;

                        switch (buttonId) {
                            case 'add-title-button':
                                listContainer = document.getElementById('titles-list');
                                newRowHtml = createTitleRow();
                                break;
                            case 'add-creator-button':
                                listContainer = document.getElementById('creator-list');
                                newRowHtml = createCreatorRow();
                                break;
                            case 'add-asset-creator-button':
                                listContainer = document.getElementById('asset-creator-list');
                                newRowHtml = createCreatorRow();
                                break;
                            case 'add-wiki-button':
                                listContainer = document.getElementById('wikis-list');
                                newRowHtml = createWikiRow();
                                break;
                            default:
                                console.warn('Unknown add button:', buttonId);
                                return;
                        }

                        if (listContainer && newRowHtml) {
                            listContainer.insertAdjacentHTML('beforeend', newRowHtml);
                        }
                    }

                    // 处理删除行点击
                    function handleRemoveRowClick(button) {
                        const listItem = button.closest('.dynamic-list-item');
                        if (listItem) {
                            listItem.remove();
                        }
                    }

                    // 创建标题行HTML
                    function createTitleRow() {
                        return \`
                            <div class="dynamic-list-item">
                                <input type="text" name="title_text" placeholder="Title" required value="">
                                <input type="text" name="title_lang" placeholder="Lang" required value="ja">
                                <label><input type="checkbox" name="title_is_official"> 官方标题</label>
                                <label><input type="checkbox" name="title_is_for_search"> 仅用于搜索</label>
                                <button type="button" class="remove-row-button">Remove</button>
                            </div>
                        \`;
                    }

                    // 创建创作者行HTML
                    function createCreatorRow() {
                        return \`
                            <div class="dynamic-list-item">
                                <div class="md3-select-field">
                                    <select name="creator_uuid" required>
                                        <option value="">Select Creator</option>
                                    </select>
                                    <label class="md3-label">Creator</label>
                                    <div class="md3-state-layer"></div>
                                </div>
                                <input type="text" name="creator_role" placeholder="Role" required value="">
                                <button type="button" class="remove-row-button">Remove</button>
                            </div>
                        \`;
                    }

                    // 创建Wiki行HTML
                    function createWikiRow() {
                        return \`
                            <div class="dynamic-list-item">
                                <input type="text" name="wiki_platform" placeholder="Wiki Platform" required value="">
                                <input type="text" name="wiki_id" placeholder="Wiki ID" required value="">
                                <button type="button" class="remove-row-button">Remove</button>
                            </div>
                        \`;
                    }

                    // 初始化快速选择器处理器
                    function initializeQuickSelectHandlers() {
                        const form = document.getElementById('editor-form');
                        if (!form) return;

                        // 处理快速选择器变化
                        form.addEventListener('change', (e) => {
                            if (e.target.classList.contains('quick-select')) {
                                const selectedValue = e.target.value;
                                const targetInputId = e.target.dataset.targetInput;
                                const targetInput = document.getElementById(targetInputId);

                                if (targetInput && selectedValue) {
                                    targetInput.value = selectedValue;
                                }
                            }
                        });
                    }

                    // 初始化过滤器处理器
                    function initializeFilterHandlers() {
                        // 标签过滤器
                        const tagFilter = document.querySelector('.tag-filter');
                        if (tagFilter) {
                            tagFilter.addEventListener('input', (e) => {
                                filterItems('.tag-selector-item', e.target.value, '.tag-name');
                            });
                        }

                        // 分类过滤器
                        const categoryFilter = document.querySelector('.category-filter');
                        if (categoryFilter) {
                            categoryFilter.addEventListener('input', (e) => {
                                filterItems('.category-selector-item', e.target.value, '.category-name');
                            });
                        }

                        // 外部对象过滤器
                        const externalObjectFilter = document.querySelector('.external-object-filter');
                        if (externalObjectFilter) {
                            externalObjectFilter.addEventListener('input', (e) => {
                                filterItems('.external-object-item', e.target.value, 'span');
                            });
                        }
                    }

                    // 通用过滤函数
                    function filterItems(itemSelector, searchTerm, textSelector) {
                        const items = document.querySelectorAll(itemSelector);
                        const lowerSearchTerm = searchTerm.toLowerCase();

                        items.forEach(item => {
                            const textElement = item.querySelector(textSelector);
                            const text = textElement ? textElement.textContent.toLowerCase() : '';

                            if (text.includes(lowerSearchTerm)) {
                                item.style.display = '';
                            } else {
                                item.style.display = 'none';
                            }
                        });
                    }

                    // 处理表单保存
                    async function handleFormSave() {
                        const form = document.getElementById('editor-form');
                        const saveButton = document.getElementById('editor-save');

                        if (!form || !saveButton) return;

                        try {
                            // 禁用保存按钮
                            saveButton.disabled = true;
                            saveButton.textContent = '保存中...';

                            // 获取表单数据
                            const formData = new FormData(form);
                            let data;

                            // 根据类型构建特定的数据结构
                            if ('${type}' === 'creator') {
                                // Creator特定的数据处理
                                const wikis = [];
                                document.querySelectorAll('#wikis-list .dynamic-list-item').forEach(item => {
                                    const platform = item.querySelector('input[name="wiki_platform"]')?.value;
                                    const identifier = item.querySelector('input[name="wiki_id"]')?.value;
                                    if (platform && identifier) {
                                        wikis.push({
                                            platform: platform,
                                            identifier: identifier,
                                        });
                                    }
                                });

                                data = {
                                    creator_uuid: formData.get('creator_uuid'),
                                    creator: {
                                        uuid: formData.get('creator.uuid'),
                                        name: formData.get('creator.name'),
                                        type: formData.get('type'),
                                    },
                                    wikis: wikis,
                                };
                            } else {
                                // 其他类型使用通用处理
                                data = Object.fromEntries(formData.entries());
                            }

                            // 确定API端点
                            const isNewItem = !('${uuid}');
                            const endpoint = isNewItem ? '/input/${type}' : '/update/${type}';

                            // 添加UUID（用于更新）
                            if (!isNewItem) {
                                data.uuid = '${uuid}';
                            }

                            // 发送API请求
                            const response = await fetch(\`/api\${endpoint}\`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(data)
                            });

                            if (!response.ok) {
                                throw new Error(\`HTTP error! status: \${response.status}\`);
                            }

                            const result = await response.json();

                            console.log('Save successful:', result);

                            // 通知父窗口保存成功
                            window.parent.postMessage({
                                type: 'editor-save-success',
                                data: {
                                    action: isNewItem ? 'create' : 'update',
                                    type: '${type}',
                                    uuid: '${uuid}' || result.uuid,
                                    result: result
                                }
                            }, '*');

                            // 重置按钮状态
                            saveButton.disabled = false;
                            saveButton.textContent = '保存';

                        } catch (error) {
                            console.error('Save failed:', error);

                            // 显示错误信息
                            const errorDiv = document.getElementById('editor-error');
                            const errorText = document.getElementById('editor-error-text');
                            if (errorDiv && errorText) {
                                errorText.textContent = \`保存失败: \${error.message}\`;
                                errorDiv.classList.remove('hidden');
                            }

                            // 重置按钮状态
                            saveButton.disabled = false;
                            saveButton.textContent = '保存';
                        }
                    }

                    // 处理表单取消
                    function handleFormCancel() {
                        // 通知父窗口取消编辑
                        window.parent.postMessage({
                            type: 'editor-cancel',
                            data: {
                                type: '${type}',
                                uuid: '${uuid}'
                            }
                        }, '*');
                    }
                    `
                }}></script>
            </head>
            <body>
                <div id="editor-container">
                    <div id="editor-header">
                        <h2 id="editor-title">{editorTitle}</h2>
                        <div class="editor-controls">
                            <button id="editor-save" class="primary-button">保存</button>
                            <button id="editor-cancel" class="secondary-button">取消</button>
                        </div>
                    </div>

                    <div id="editor-content">
                        {!formConfig ? (
                            <div id="editor-error" class="error-message">
                                <p id="editor-error-text">不支持的内容类型: {type}</p>
                            </div>
                        ) : (
                            <div id="editor-form-container">
                                <form id="editor-form">
                                    <FormRenderer
                                        config={formConfig}
                                        data={data}
                                        options={options}
                                    />
                                </form>
                            </div>
                        )}

                        <div id="editor-error" class="error-message hidden">
                            <p id="editor-error-text"></p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}