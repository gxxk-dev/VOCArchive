// Main admin application entry point

// Import required modules only
import { jwtToken, setCurrentTab, allExternalObjects, setAllExternalObjects } from './modules/config.js';
import { initializeTheme, initializeThemeElements, toggleTheme } from './modules/theme.js';
import {
    showLogin,
    showAdminPanel,
    handleLogin,
    initializeAuthElements
} from './modules/auth.js';
import {
    loadContent,
    initializeCrudElements
} from './modules/crud-handlers.js';
import {
    copyToClipboard,
    renderExternalObjectsList,
    updatePageTitle
} from './modules/utils.js';
// Application initialization
document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const authCodeInput = document.getElementById('auth-code');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const themeToggle = document.getElementById('theme-toggle');
    const tabs = document.getElementById('tabs');
    const content = document.getElementById('content');
    const editor = document.getElementById('editor');
    const editorModal = document.getElementById('editor-modal');

    // Initialize module DOM elements
    initializeAuthElements();
    initializeThemeElements();
    initializeCrudElements();

    // Load initial page title configuration
    await loadInitialPageTitle();

    // Initialize theme
    initializeTheme();

    // Set up all event listeners
    setupEventListeners();

    // === IFRAME MANAGEMENT FUNCTIONS ===
    // 定义函数在使用之前

    /*
     * 管理后台系统使用两个独立的iframe：
     *
     * 1. Content Iframe (#content):
     *    - 用于显示数据列表和内容
     *    - 连接到 /admin/content/:type 路由
     *    - 处理数据展示、搜索、分页等功能
     *    - 发送 edit-request, delete-request, create-request 消息
     *
     * 2. Editor Iframe (#editor):
     *    - 用于编辑和创建数据项，以modal形式显示
     *    - 连接到 /admin/editor 路由
     *    - 处理表单编辑、保存、取消等功能
     *    - 发送 editor-save-success, editor-cancel 消息
     *    - 以modal弹窗形式覆盖在content iframe之上
     *
     * 两个iframe通过postMessage API与父窗口通信，
     * 父窗口负责协调它们之间的交互和状态管理。
     */

    /**
     * Show editor modal
     */
    function showEditorModal() {
        if (editorModal) {
            editorModal.classList.remove('hidden');
        }
    }

    /**
     * Hide editor modal
     */
    function hideEditorModal() {
        if (editorModal) {
            editorModal.classList.add('hidden');
        }
    }

    /**
     * Load editor for creating new item
     * @param {string} type - Item type to create
     */
    async function loadEditorForCreate(type) {
        console.log('Loading editor for create:', type);

        if (!editor || !editorModal) {
            console.error('Editor iframe or modal not found');
            return;
        }

        // Get JWT token for editor authorization
        const { jwtToken } = await import('./modules/config.js');
        const editorUrl = `/admin/editor?type=${encodeURIComponent(type)}&token=${encodeURIComponent(jwtToken)}`;

        editor.src = editorUrl;
        showEditorModal();
    }

    /**
     * Load editor for editing existing item
     * @param {string} type - Item type
     * @param {string} uuid - Item UUID
     */
    async function loadEditorForEdit(type, uuid) {
        console.log('Loading editor for edit:', { type, uuid });

        if (!editor || !editorModal) {
            console.error('Editor iframe or modal not found');
            return;
        }

        // Get JWT token for editor authorization
        const { jwtToken } = await import('./modules/config.js');
        const editorUrl = `/admin/editor?type=${encodeURIComponent(type)}&uuid=${encodeURIComponent(uuid)}&token=${encodeURIComponent(jwtToken)}`;

        editor.src = editorUrl;
        showEditorModal();
    }

    /**
     * Close editor modal
     */
    function closeEditor() {
        console.log('Closing editor modal');
        hideEditorModal();

        if (editor) {
            editor.src = '';
        }
    }

    /**
     * Handle backend delete operation and refresh content
     * @param {string} target - Item type to delete
     * @param {string} uuid - Item UUID to delete
     */
    async function handleBackendDelete(target, uuid) {
        try {
            console.log('Deleting item:', { target, uuid });

            // Import API module dynamically
            const { apiFetch } = await import('./modules/api.js');

            // Handle special cases for delete endpoints
            if (target === 'footer') {
                await apiFetch(`/footer/settings/${uuid}`, { method: 'DELETE' });
            } else if (target === 'wiki_platform') {
                await apiFetch(`/delete/wiki_platform`, {
                    method: 'POST',
                    body: JSON.stringify({ platform_key: uuid }),
                });
            } else {
                // Standard delete endpoint
                const uuidKeyMap = {
                    work: 'work_uuid',
                    creator: 'creator_uuid',
                    media: 'media_uuid',
                    asset: 'asset_uuid',
                    tag: 'tag_uuid',
                    category: 'category_uuid',
                    external_source: 'uuid',
                    external_object: 'uuid',
                    relation: 'relation_uuid'
                };

                const uuidKey = uuidKeyMap[target] || 'uuid';
                await apiFetch(`/delete/${target}`, {
                    method: 'POST',
                    body: JSON.stringify({ [uuidKey]: uuid }),
                });
            }

            console.log('Delete successful, refreshing content');

            // Refresh the content iframe to show updated data
            const currentTab = new URLSearchParams(window.location.search).get('tab') || 'work';
            loadContent(currentTab, true);

        } catch (error) {
            console.error('Delete failed:', error);
            alert(`删除失败: ${error.message}`);
        }
    }

    // --- Initial Check ---
    if (jwtToken) {
        showAdminPanel();
        // 确保初始时隐藏editor modal
        hideEditorModal();
    } else {
        showLogin();
    }

    // Load initial page title configuration
    async function loadInitialPageTitle() {
        try {
            const { apiFetch } = await import('./modules/api.js');
            const { setAdminTitleTemplate } = await import('./modules/config.js');
            const config = await apiFetch('/config/public');
            if (config.admin_title) {
                setAdminTitleTemplate(config.admin_title);
                // Set initial title for the current tab (use INITIAL_ACTIVE_TAB from URL)
                const initialTab = window.INITIAL_ACTIVE_TAB || 'work';
                updatePageTitle(initialTab);
                // 设置当前标签，但不更新URL（因为已经在URL中了）
                setCurrentTab(initialTab, false);
            }
        } catch (e) {
            console.warn('Failed to load initial title config:', e);
            // 如果配置加载失败，仍然设置初始标签
            const initialTab = window.INITIAL_ACTIVE_TAB || 'work';
            setCurrentTab(initialTab, false);
        }
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Login form
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginError.textContent = '';
            await handleLogin(authCodeInput, loginError);
        });

        // Logout button
        logoutButton.addEventListener('click', showLogin);

        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                toggleTheme();
                // 向两个iframe都发送主题变更消息
                import('./modules/theme.js').then(({ getTheme }) => {
                    const currentTheme = getTheme();

                    // 向content iframe发送主题消息
                    if (content && content.contentWindow) {
                        content.contentWindow.postMessage({
                            type: 'theme-change',
                            theme: currentTheme
                        }, '*');
                    }

                    // 向editor iframe发送主题消息
                    if (editor && editor.contentWindow) {
                        editor.contentWindow.postMessage({
                            type: 'theme-change',
                            theme: currentTheme
                        }, '*');
                    }
                });
            });
        }

        // Tab navigation
        tabs.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-button')) {
                document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                const targetTab = e.target.dataset.target;

                // 更新URL但不重新加载页面
                const url = new URL(window.location);
                url.searchParams.set('tab', targetTab);
                history.pushState({tab: targetTab}, '', url);

                // 设置当前标签并加载内容
                setCurrentTab(targetTab);
                loadContent(targetTab, true); // 强制重新加载内容
            }
        });

        // 处理浏览器前进后退
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.tab) {
                // 更新标签状态
                const targetTab = event.state.tab;
                document.querySelectorAll('.tab-button').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.target === targetTab);
                });

                setCurrentTab(targetTab);
                loadContent(targetTab, true);
            }
        });

        // Listen for messages from both iframes
        console.log('Setting up message listener in parent window...');
        window.addEventListener('message', (event) => {
            console.log('Parent window received message:', event.data);
            // 验证消息来源（可以在生产环境中添加更严格的验证）
            if (event.data && event.data.type) {
                switch (event.data.type) {
                    // === CONTENT IFRAME MESSAGES ===
                    // 这些消息来自content iframe（数据展示页面）
                    case 'edit-request':
                        console.log('Received edit request from content iframe:', event.data);
                        // 使用编辑器iframe处理编辑请求
                        if (event.data.target && event.data.uuid) {
                            loadEditorForEdit(event.data.target, event.data.uuid);
                        } else {
                            console.error('Invalid edit request data:', event.data);
                        }
                        break;

                    case 'delete-request':
                        console.log('Received delete request from content iframe:', event.data);
                        // Handle delete operation directly and refresh iframe content
                        handleBackendDelete(event.data.target, event.data.uuid);
                        break;

                    case 'create-request':
                        console.log('Received create request from content iframe:', event.data);
                        // 使用编辑器iframe处理创建请求
                        if (event.data.target) {
                            loadEditorForCreate(event.data.target);
                        } else {
                            console.error('Invalid create request data:', event.data);
                        }
                        break;

                    case 'iframe-ready':
                        console.log('Content iframe is ready');
                        // 发送当前主题给content iframe
                        import('./modules/theme.js').then(({ getTheme }) => {
                            const currentTheme = getTheme();
                            if (content && content.contentWindow) {
                                content.contentWindow.postMessage({
                                    type: 'theme-change',
                                    theme: currentTheme
                                }, '*');
                            }
                        });
                        break;

                    case 'test-message':
                        console.log('Received test message from content iframe:', event.data.message);
                        break;

                    // === EDITOR IFRAME MESSAGES ===
                    // 这些消息来自editor iframe（编辑器页面）
                    case 'editor-iframe-ready':
                        console.log('Editor iframe is ready');
                        // 发送当前主题给编辑器 iframe
                        import('./modules/theme.js').then(({ getTheme }) => {
                            const currentTheme = getTheme();
                            if (editor && editor.contentWindow) {
                                editor.contentWindow.postMessage({
                                    type: 'theme-change',
                                    theme: currentTheme
                                }, '*');
                            }
                        });
                        break;

                    case 'editor-save-success':
                        console.log('Editor save successful:', event.data);
                        // 关闭编辑器并刷新内容
                        closeEditor();
                        // 刷新content iframe以显示更新后的数据
                        const currentTab = new URLSearchParams(window.location.search).get('tab') || 'work';
                        loadContent(currentTab, true);
                        break;

                    case 'editor-cancel':
                        console.log('Editor cancelled');
                        closeEditor();
                        break;

                    default:
                        console.log('Unknown message type:', event.data.type);
                        break;
                }
            }
        });

        // 点击editor modal背景关闭modal
        if (editorModal) {
            editorModal.addEventListener('click', (e) => {
                if (e.target === editorModal) {
                    closeEditor();
                }
            });
        }

        // Global document click handler for various features
        document.addEventListener('click', (e) => {
            const target = e.target;

            // Handle refresh external objects button
            if (target.id === 'refresh-external-objects') {
                e.preventDefault();

                // Get currently selected external objects
                const selectedCheckboxes = document.querySelectorAll('input[name="external_objects"]:checked');
                const currentSelectedObjects = Array.from(selectedCheckboxes).map(checkbox => ({
                    uuid: checkbox.value
                }));

                loadExternalObjects().then(() => {
                    // Re-render the external objects list after refresh, preserving selections
                    const container = document.getElementById('external-objects-container');
                    if (container) {
                        renderExternalObjectsList(allExternalObjects, container, currentSelectedObjects);
                    }
                });
                return;
            }

            // Handle UUID copying
            if (target.classList.contains('uuid') || target.id === 'generated-uuid-result') {
                let textToCopy = '';
                if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
                    textToCopy = target.value;
                } else if (target.hasAttribute('title') && target.getAttribute('title').length > 0) {
                    textToCopy = target.getAttribute('title');
                } else {
                    textToCopy = target.textContent;
                }

                if (textToCopy) {
                    copyToClipboard(textToCopy, target);
                }
            }
        });
    }

    // External objects loading helper
    async function loadExternalObjects() {
        try {
            const { apiFetch } = await import('./modules/api.js');
            const objects = await apiFetch('/list/external_objects');
            setAllExternalObjects(objects);
        } catch (error) {
            console.error('Failed to load external objects:', error);
            setAllExternalObjects([]);
        }
    }
});