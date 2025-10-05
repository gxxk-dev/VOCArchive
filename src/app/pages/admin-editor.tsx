import { jsx } from 'hono/jsx'

export interface AdminEditorPageProps {
    type?: string
    uuid?: string
}

export const AdminEditorPage = (props: AdminEditorPageProps) => {
    const { type, uuid } = props;

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
                <script type="module" src="/admin/modules/form-handler.js"></script>
                <script type="module" src="/admin/modules/crud-handlers.js"></script>
                <script type="module" src="/admin/modules/config.js"></script>
                <script type="module" src="/admin/modules/utils.js"></script>
                <script type="module" src="/admin/modules/editor.js"></script>
                <script src="/admin/iframe-handler.js"></script>
                <script type="module" dangerouslySetInnerHTML={{
                    __html: `
                    // Initialize editor modules for iframe content
                    import { initializeTheme } from '/admin/modules/theme.js';
                    import { initializeEditor } from '/admin/modules/editor.js';

                    // 只初始化编辑器需要的基本模块，避免form-handler的复杂初始化
                    document.addEventListener('DOMContentLoaded', () => {
                        // Initialize theme first
                        initializeTheme();

                        // 从URL参数中获取type和uuid
                        const urlParams = new URLSearchParams(window.location.search);
                        const type = urlParams.get('type');
                        const uuid = urlParams.get('uuid');

                        console.log('Editor iframe loaded with params:', { type, uuid });

                        // Initialize editor with proper parameters
                        initializeEditor(type, uuid);

                        // Notify parent window that iframe is ready
                        window.parent.postMessage({
                            type: 'editor-iframe-ready',
                            data: { type: type || '', uuid: uuid || '' }
                        }, '*');

                        // Listen for theme changes from parent window
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'theme-change') {
                                document.documentElement.setAttribute('data-theme', event.data.theme);
                            } else if (event.data.type === 'load-editor') {
                                // Handle editor content loading requests
                                initializeEditor(event.data.target, event.data.uuid);
                            }
                        });
                    });
                    `
                }}></script>
            </head>
            <body>
                <div id="editor-container">
                    <div id="editor-header">
                        <h2 id="editor-title">编辑器</h2>
                        <div class="editor-controls">
                            <button id="editor-save" class="primary-button">保存</button>
                            <button id="editor-cancel" class="secondary-button">取消</button>
                        </div>
                    </div>

                    <div id="editor-content">
                        <div id="editor-loading" class="loading-state">
                            <p>加载中...</p>
                        </div>

                        <div id="editor-form-container" class="hidden">
                            <form id="editor-form">
                                {/* Form fields will be dynamically inserted here */}
                            </form>
                        </div>

                        <div id="editor-error" class="error-message hidden">
                            <p id="editor-error-text"></p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    )
}