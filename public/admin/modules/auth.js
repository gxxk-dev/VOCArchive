// Authentication module

import { apiFetch } from './api.js';
import {
    setJwtToken,
    setCurrentTab,
    setAdminTitleTemplate,
    setAllExternalSources,
    setAllExternalObjects
} from './config.js';

let loginContainer, adminPanel;

// Initialize DOM elements for auth
export function initializeAuthElements() {
    loginContainer = document.getElementById('login-container');
    adminPanel = document.getElementById('admin-panel');
}

// --- Authentication Functions ---
export function showLogin() {
    if (loginContainer && adminPanel) {
        loginContainer.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    }
    localStorage.removeItem('jwtToken');
    setJwtToken(null);
}

export async function showAdminPanel() {
    if (loginContainer && adminPanel) {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
    }

    const activeTab = document.querySelector('.tab-button.active');
    const currentTab = activeTab ? activeTab.dataset.target : 'work';
    setCurrentTab(currentTab);

    // Load external sources and objects for reference in other tables
    await loadExternalSources();
    await loadExternalObjects();

    // 获取配置的标题模板
    try {
        const config = await apiFetch('/config/public');
        if (config.admin_title) {
            setAdminTitleTemplate(config.admin_title);
        }
    } catch (e) {
        console.warn('Failed to load title config:', e);
    }

    // 加载配置后更新页面标题
    const { updatePageTitle } = await import('./utils.js');
    updatePageTitle(currentTab);

    // Load content for the current tab
    const { loadContent } = await import('./crud-handlers.js');
    loadContent(currentTab);
}

async function loadExternalSources() {
    try {
        const sources = await apiFetch('/list/external_sources');
        setAllExternalSources(sources);
    } catch (error) {
        console.error('Failed to load external sources:', error);
        setAllExternalSources([]);
    }
}

async function loadExternalObjects() {
    try {
        const objects = await apiFetch('/list/external_objects');
        setAllExternalObjects(objects);
    } catch (error) {
        console.error('Failed to load external objects:', error);
        setAllExternalObjects([]);
    }
}

// --- Login Form Handler ---
export async function handleLogin(authCodeInput, loginError) {
    try {
        const response = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ code: authCodeInput.value }),
        });
        if (response.token) {
            setJwtToken(response.token);
            showAdminPanel();
        } else {
            throw new Error('Login failed: No token received.');
        }
    } catch (error) {
        loginError.textContent = `登录失败: ${error.message}`;
    }
}