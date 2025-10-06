// Main admin application entry point

// Import required modules only
import { jwtToken, setCurrentTab, allExternalObjects, setAllExternalObjects } from './core/config.js';
import { initializeTheme, initializeThemeElements, toggleTheme } from './ui/theme.js';
import {
    showLogin,
    showAdminPanel,
    handleLogin,
    initializeAuthElements
} from './core/auth.js';
import {
    loadContent,
    initializeContentLoaderElements
} from './ui/content-loader.js';
import {
    copyToClipboard,
    renderExternalObjectsList,
    updatePageTitle
} from './utils/index.js';
import { apiFetch } from './api/index.js';
import { showEditorModal, hideEditorModal, loadEditorForCreate, loadEditorForEdit, closeEditor } from './ui/iframe-manager.js';

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
    initializeContentLoaderElements();

    // Load initial page title configuration
    await loadInitialPageTitle();

    // Initialize theme
    initializeTheme();

    // Set up all event listeners
    setupEventListeners();

    // === IFRAME MANAGEMENT FUNCTIONS ===
    // The implementation is now in iframe-manager.js

    /**
     * Handle backend delete operation and refresh content
     * @param {string} target - Item type to delete
     * @param {string} uuid - Item UUID to delete
     */
    async function handleBackendDelete(target, uuid) {
        try {
            console.log('Deleting item:', { target, uuid });

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
        hideEditorModal(editorModal);
    } else {
        showLogin();
    }

    // Load initial page title configuration
    async function loadInitialPageTitle() {
        try {
            const { setAdminTitleTemplate } = await import('./core/config.js');
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
                import('./ui/theme.js').then(({ getTheme }) => {
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
                            loadEditorForEdit(editor, editorModal, event.data.target, event.data.uuid);
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
                            loadEditorForCreate(editor, editorModal, event.data.target);
                        } else {
                            console.error('Invalid create request data:', event.data);
                        }
                        break;

                    case 'iframe-ready':
                        console.log('Content iframe is ready');
                        // 发送当前主题给content iframe
                        import('./ui/theme.js').then(({ getTheme }) => {
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
                        import('./ui/theme.js').then(({ getTheme }) => {
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
                        closeEditor(editor, editorModal);
                        // 刷新content iframe以显示更新后的数据
                        const currentTab = new URLSearchParams(window.location.search).get('tab') || 'work';
                        loadContent(currentTab, true);
                        break;

                    case 'editor-cancel':
                        console.log('Editor cancelled');
                        closeEditor(editor, editorModal);
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
                    closeEditor(editor, editorModal);
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
            const objects = await apiFetch('/list/external_objects');
            setAllExternalObjects(objects);
        } catch (error) {
            console.error('Failed to load external objects:', error);
            setAllExternalObjects([]);
        }
    }
});