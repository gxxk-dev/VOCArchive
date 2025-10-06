// CRUD operations handling module

import { apiFetch } from './api.js';
import { updatePageTitle } from './utils.js';

let content; // Global reference to content element

// Initialize DOM elements for CRUD operations
export function initializeCrudElements() {
    content = document.getElementById('content');
}

// --- Content Loading ---
export async function loadContent(target, forceReload = false) {
    // 更新页面标题
    updatePageTitle(target);

    // 如果不是强制重新加载，检查当前iframe是否已经加载了正确的内容
    if (!forceReload) {
        const expectedSrc = `/admin/content/${target}`;
        // 检查当前iframe的src是否已经是目标内容（忽略token参数）
        if (content.src && content.src.includes(expectedSrc)) {
            console.log('Correct iframe content already loaded for', target, ', skipping reload');
            return;
        }
    }

    console.log('Loading iframe content for', target, ', forceReload:', forceReload);

    // 获取JWT token
    const { jwtToken } = await import('./config.js');

    // 设置iframe的src来加载新内容，包含token参数
    let src = `/admin/content/${target}`;
    if (jwtToken) {
        src += `?token=${encodeURIComponent(jwtToken)}`;
    }

    content.src = src;

    // 监听iframe加载完成，发送当前主题状态
    content.onload = () => {
        // Import theme module and send current theme to iframe
        import('./theme.js').then(({ getTheme }) => {
            const currentTheme = getTheme();
            if (content.contentWindow) {
                content.contentWindow.postMessage({
                    type: 'theme-change',
                    theme: currentTheme
                }, '*');
            }
        });
    };
}

