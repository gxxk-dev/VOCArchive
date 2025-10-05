import { jsx } from 'hono/jsx'
import { AdminContentData } from '../admin/data-loader'
import {
    WorkCard,
    DataTable,
    TagsTable,
    CategoriesTable,
    CreatorTable,
    ExternalSourcesTable,
    ExternalObjectsTable,
    AssetsTable,
    MediaSourcesTable,
    MigrationTable
} from './components/admin'

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

            case 'external_source':
                return <ExternalSourcesTable sources={contentData.data} />;

            case 'external_object':
                return <ExternalObjectsTable objects={contentData.data} />;

            case 'asset':
                return <AssetsTable assets={contentData.data} />;

            case 'media':
                return <MediaSourcesTable media={contentData.data} />;

            case 'relation':
                return <DataTable target="relation" data={contentData.data} title="关系 (Relation)" />;

            case 'footer':
                return <DataTable target="footer" data={contentData.data} title="页脚 (Footer)" />;

            case 'site_config':
                return <DataTable target="site_config" data={contentData.data} title="系统配置 (Config)" />;

            case 'wiki_platform':
                return <DataTable target="wiki_platform" data={contentData.data} title="Wiki平台 (Wiki)" />;

            case 'migration':
                return <MigrationTable />;

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
                <link rel="stylesheet" href="/css/migration.css" />
                <link rel="stylesheet" href="/admin/css/selectors.css" />
                <script type="module" src="/admin/md3-select.js"></script>
                <script type="module" src="/admin/modules/api.js"></script>
                <script type="module" src="/admin/modules/theme.js"></script>
                <script src="/admin/iframe-handler.js"></script>
                <script type="module" dangerouslySetInnerHTML={{
                    __html: `
                    // Initialize necessary modules for iframe content
                    import { initializeTheme } from '/admin/modules/theme.js';

                    document.addEventListener('DOMContentLoaded', () => {
                        // Initialize theme
                        initializeTheme();

                        // Set up CRUD operation event handlers for server-side rendered buttons
                        document.addEventListener('click', (e) => {
                            const target = e.target;

                            // Handle edit button clicks
                            if (target.classList.contains('edit-button')) {
                                e.preventDefault();
                                const itemTarget = target.dataset.target;
                                const uuid = target.dataset.uuid;

                                if (itemTarget && uuid && window.parent) {
                                    window.parent.postMessage({
                                        type: 'edit-request',
                                        target: itemTarget,
                                        uuid: uuid
                                    }, '*');
                                }
                                return;
                            }

                            // Handle delete button clicks
                            if (target.classList.contains('delete-button')) {
                                e.preventDefault();
                                const itemTarget = target.dataset.target;
                                const row = target.closest('.work-card') || target.closest('tr');
                                const uuid = row?.dataset.uuid;

                                if (itemTarget && uuid && window.parent) {
                                    if (confirm(\`确定要删除这个 \${itemTarget} 吗？\`)) {
                                        window.parent.postMessage({
                                            type: 'delete-request',
                                            target: itemTarget,
                                            uuid: uuid
                                        }, '*');
                                    }
                                }
                                return;
                            }

                            // Handle create button clicks
                            if (target.classList.contains('create-button')) {
                                e.preventDefault();
                                const itemTarget = target.dataset.target;

                                if (itemTarget && window.parent) {
                                    window.parent.postMessage({
                                        type: 'create-request',
                                        target: itemTarget
                                    }, '*');
                                }
                                return;
                            }
                        });

                        // Listen for theme changes from parent window
                        window.addEventListener('message', (event) => {
                            if (event.data.type === 'theme-change') {
                                document.documentElement.setAttribute('data-theme', event.data.theme);
                            }
                        });

                        // Notify parent that iframe is ready
                        if (window.parent) {
                            window.parent.postMessage({
                                type: 'iframe-ready'
                            }, '*');
                        }
                    });
                    `
                }}></script>
            </head>
            <body>
                <div id="content">
                    {renderContent()}
                </div>
            </body>
        </html>
    )
}