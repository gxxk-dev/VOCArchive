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
    initializeRenderElements
} from './modules/render-tables.js';
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
    filterTags,
    filterCategories,
    filterExternalObjects,
    copyToClipboard,
    renderExternalObjectsList
} from './modules/utils.js';
import { updatePageTitle } from './modules/utils.js';

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
    initializeRenderElements();
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

    // Make filter functions globally available
    window.filterTags = filterTags;
    window.filterCategories = filterCategories;
    window.filterExternalObjects = filterExternalObjects;

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
                // Set initial title for the current tab (default is 'work')
                updatePageTitle('work');
            }
        } catch (e) {
            console.warn('Failed to load initial title config:', e);
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
                const currentTab = e.target.dataset.target;
                setCurrentTab(currentTab);
                loadContent(currentTab);
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