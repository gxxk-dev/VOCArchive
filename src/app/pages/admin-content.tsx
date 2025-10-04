import { jsx } from 'hono/jsx'
import { AdminContentData } from '../admin/data-loader'
import { WorkCard, DataTable, TagsTable, CategoriesTable, CreatorTable } from './components/admin'

export interface AdminContentPageProps {
    type: string
    contentData?: AdminContentData
}

export const AdminContentPage = (props: AdminContentPageProps) => {
    const { type, contentData } = props;

    // 渲染内容的辅助函数
    const renderContent = () => {
        if (!contentData) {
            return <div><h2>Loading...</h2></div>;
        }

        if (contentData.error) {
            return (
                <div>
                    <p class="error-message">Failed to load {contentData.type}: {contentData.error}</p>
                </div>
            );
        }

        switch (contentData.type) {
            case 'work':
                return <WorkCard works={contentData.data} />;

            case 'creator':
                return <CreatorTable creators={contentData.data} />;

            case 'tag':
                return <TagsTable tags={contentData.data} />;

            case 'category':
                return <CategoriesTable categories={contentData.data} />;

            case 'media':
                return <DataTable target="media" data={contentData.data} title="媒体 (Media)" />;

            case 'asset':
                return <DataTable target="asset" data={contentData.data} title="资产 (Asset)" />;

            case 'relation':
                return <DataTable target="relation" data={contentData.data} title="关系 (Relation)" />;

            case 'external_source':
                return <DataTable target="external_source" data={contentData.data} title="存储源 (Storage)" />;

            case 'external_object':
                return <DataTable target="external_object" data={contentData.data} title="外部对象 (External)" />;

            case 'footer':
                return <DataTable target="footer" data={contentData.data} title="页脚 (Footer)" />;

            case 'site_config':
                return <DataTable target="site_config" data={contentData.data} title="系统配置 (Config)" />;

            case 'wiki_platform':
                return <DataTable target="wiki_platform" data={contentData.data} title="Wiki平台 (Wiki)" />;

            case 'migration':
                return (
                    <div>
                        <div class="controls">
                            <h2>迁移管理 (Migration)</h2>
                        </div>
                        <p>迁移管理界面将在此渲染...</p>
                    </div>
                );

            default:
                return (
                    <div>
                        <p class="error-message">Unsupported content type: {contentData.type}</p>
                    </div>
                );
        }
    };

    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Admin Content - {type}</title>
                <link rel="stylesheet" href="/css/common.css" />
                <link rel="stylesheet" href="/css/admin.css" />
                <link rel="stylesheet" href="/admin/css/selectors.css" />
                <script type="module" src="/admin/md3-select.js"></script>
                <script type="module" src="/admin/modules/api.js"></script>
                <script type="module" src="/admin/modules/theme.js"></script>
                <script type="module" src="/admin/modules/form-handler.js"></script>
                <script type="module" src="/admin/modules/crud-handlers.js"></script>
                <script type="module" src="/admin/modules/config.js"></script>
                <script type="module" src="/admin/modules/utils.js"></script>
                <script src="/admin/iframe-handler.js"></script>
                <script type="module" dangerouslySetInnerHTML={{
                    __html: `
                    // Initialize necessary modules for iframe content
                    import { initializeTheme } from '/admin/modules/theme.js';
                    import { initializeCrudElements } from '/admin/modules/crud-handlers.js';
                    import { initializeFormElements, setupModalEventListeners } from '/admin/modules/form-handler.js';

                    document.addEventListener('DOMContentLoaded', () => {
                        // Initialize theme first
                        initializeTheme();

                        // Initialize other modules
                        initializeCrudElements();
                        initializeFormElements();
                        setupModalEventListeners();

                        // Listen for theme changes from parent window
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'theme-change') {
                                document.documentElement.setAttribute('data-theme', event.data.theme);
                            }
                        });
                    });
                    `
                }}></script>
            </head>
            <body>
                <div id="content">
                    {renderContent()}
                </div>

                {/* Include modal for iframe content */}
                <div id="form-modal" class="modal hidden">
                    <div class="modal-content">
                        <span class="close-button">&times;</span>
                        <h2 id="form-title"></h2>
                        <form id="modal-form">
                            {/* Form fields will be dynamically inserted here */}
                        </form>
                        <p id="form-error" class="error-message"></p>
                    </div>
                </div>
            </body>
        </html>
    )
}