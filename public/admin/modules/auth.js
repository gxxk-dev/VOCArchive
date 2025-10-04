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

    // 使用初始标签或默认为work
    const initialTab = window.INITIAL_ACTIVE_TAB || 'work';
    setCurrentTab(initialTab, false); // 不更新URL，因为已经在URL中了

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
    updatePageTitle(initialTab);

    // 设置当前标签状态
    setCurrentTab(initialTab);

    // 更新iframe src以包含JWT token
    await updateIframeWithToken(initialTab);
}

// 更新iframe的src以包含JWT token
async function updateIframeWithToken(tab) {
    const iframe = document.getElementById('content');
    if (iframe) {
        const { jwtToken } = await import('./config.js');
        let src = `/admin/content/${tab}`;
        if (jwtToken) {
            src += `?token=${encodeURIComponent(jwtToken)}`;
        }
        iframe.src = src;
    }
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