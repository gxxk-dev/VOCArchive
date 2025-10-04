// Main admin application entry point

// Import all modules
import { jwtToken, setCurrentTab, allExternalObjects, setAllExternalObjects } from './modules/config.js';
import { initializeTheme, initializeThemeElements, toggleTheme } from './modules/theme.js';
import {
    showLogin,
    showAdminPanel,
    handleLogin,
    initializeAuthElements
} from './modules/auth.js';
import {
    initializeFormElements,
    showFormModal,
    setupModalEventListeners
} from './modules/form-handler.js';
import {
    initializeCrudElements,
    loadContent,
    handleEdit,
    handleDelete
} from './modules/crud-handlers.js';
import {
    initializeToolElements,
    setupUuidGeneration
} from './modules/tools.js';
import {
    copyToClipboard,
    renderExternalObjectsList
} from './modules/utils.js';
import { updatePageTitle } from './modules/utils.js';
import { initializeLegacySelectors } from './modules/form-generator-legacy.js';

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
    const modal = document.getElementById('form-modal');
    const closeModalButton = document.querySelector('.close-button');

    // Initialize all module DOM elements
    initializeAuthElements();
    initializeThemeElements();
    initializeFormElements();
    initializeCrudElements();
    initializeToolElements();

    // Load initial page title configuration
    await loadInitialPageTitle();

    // Initialize theme
    initializeTheme();

    // Set up all event listeners
    setupEventListeners();

    // Setup modal event listeners for dynamic lists
    setupModalEventListeners();

    // Setup tool functionalities
    setupUuidGeneration();

    // Initialize legacy selectors for backward compatibility
    initializeLegacySelectors();

    // --- Initial Check ---
    if (jwtToken) {
        showAdminPanel();
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
            themeToggle.addEventListener('click', toggleTheme);
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

        // Content area clicks (for CRUD operations and forms)
        content.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-button')) {
                handleDelete(e);
            }
            if (e.target.classList.contains('create-button')) {
                showFormModal(e.target.dataset.target);
            }
            if (e.target.classList.contains('edit-button')) {
                handleEdit(e);
            }
        });

        // Modal management
        closeModalButton.addEventListener('click', () => modal.classList.add('hidden'));
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });

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