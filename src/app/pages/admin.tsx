import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { FooterSetting } from '../db/operations/admin'
import { AdminContentData } from '../admin/data-loader'
import { WorkCard, DataTable, TagsTable, CategoriesTable, CreatorTable } from './components/admin'

export interface AdminPageProps {
    footerSettings: FooterSetting[]
    activeTab?: string
    contentData?: AdminContentData
}

export const AdminPage = (props: AdminPageProps) => {
    const activeTab = props.activeTab || 'work';
    const { contentData } = props;

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
        <BaseLayout
            title="VOCArchive - 管理后台"
            footerSettings={props.footerSettings}
            cssFiles={['/css/common.css', '/css/admin.css', '/admin/css/selectors.css']}
            jsFiles={['/admin/md3-select.js']}
            moduleFiles={['/admin/admin.js']}
            additionalScripts={`
                // 设置初始活跃标签
                window.INITIAL_ACTIVE_TAB = '${activeTab}';

                console.log('Admin page loaded with active tab:', '${activeTab}');
            `}
        >
            {/* Login Form */}
            <div id="login-container">
                <h2>登录</h2>
                <form id="login-form">
                    <input type="password" id="auth-code" placeholder="请输入授权码" required />
                    <button type="submit">登录</button>
                </form>
                <p id="login-error" class="error-message"></p>
            </div>

            {/* Main Admin Panel */}
            <div id="admin-panel" class="hidden">
                <header>
                    <h1 id="pageHeader">管理后台</h1>
                    <div class="header-controls">
                        <button id="theme-toggle" class="theme-toggle" title="切换深色模式">
                            <i class="fas fa-moon" id="theme-icon"></i>
                        </button>
                        <button id="logout-button">登出</button>
                    </div>
                </header>
                <nav id="tabs">
                    <button class={`tab-button ${activeTab === 'work' ? 'active' : ''}`} data-target="work">作品 (work)</button>
                    <button class={`tab-button ${activeTab === 'creator' ? 'active' : ''}`} data-target="creator">作者 (creator)</button>
                    <button class={`tab-button ${activeTab === 'media' ? 'active' : ''}`} data-target="media">媒体 (Media)</button>
                    <button class={`tab-button ${activeTab === 'asset' ? 'active' : ''}`} data-target="asset">资产 (asset)</button>
                    <button class={`tab-button ${activeTab === 'relation' ? 'active' : ''}`} data-target="relation">关系 (relation)</button>
                    <button class={`tab-button ${activeTab === 'tag' ? 'active' : ''}`} data-target="tag">标签 (tag)</button>
                    <button class={`tab-button ${activeTab === 'category' ? 'active' : ''}`} data-target="category">分类 (category)</button>
                    <button class={`tab-button ${activeTab === 'external_source' ? 'active' : ''}`} data-target="external_source">存储源 (Storage)</button>
                    <button class={`tab-button ${activeTab === 'external_object' ? 'active' : ''}`} data-target="external_object">外部对象 (External)</button>
                    <button class={`tab-button ${activeTab === 'footer' ? 'active' : ''}`} data-target="footer">页脚 (Footer)</button>
                    <button class={`tab-button ${activeTab === 'wiki_platform' ? 'active' : ''}`} data-target="wiki_platform">Wiki平台 (Wiki)</button>
                    <button class={`tab-button ${activeTab === 'site_config' ? 'active' : ''}`} data-target="site_config">系统配置 (Config)</button>
                    <button class={`tab-button ${activeTab === 'migration' ? 'active' : ''}`} data-target="migration">迁移管理 (Migration)</button>
                </nav>
                <main id="content">
                    {renderContent()}
                </main>

                <div id="tool-zone">
                    <h2>工具 (Tools)</h2>
                    <div class="tool-item">
                        <button id="generate-uuid-button">生成 UUID</button>
                        <input type="text" id="generated-uuid-result" readonly placeholder="点击按钮生成..." />
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
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
        </BaseLayout>
    )
}