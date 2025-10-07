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
            'footer': '页脚',
            'site_config': '配置',
            'wiki_platform': 'Wiki平台'
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
                <script type="module" src="/admin/js/ui/components/md3-select.js"></script>
                <script type="module" src="/admin/js/api/index.js"></script>
                <script type="module" src="/admin/js/ui/theme.js"></script>
                <script src="/admin/js/iframe-client.js"></script>
                <script type="module" src="/admin/js/editor-client.js"></script>
                <script
                    type="application/json"
                    id="editor-config"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            type: type || '',
                            uuid: uuid || '',
                            isNew: !uuid
                        })
                    }}
                ></script>
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
