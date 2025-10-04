// CRUD operations handling module

import { apiFetch } from './api.js';
import { updatePageTitle } from './utils.js';
import { showFormModal } from './form-handler.js';

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

// --- Edit & Delete Logic ---
export async function handleEdit(e) {
    const button = e.target;
    const target = button.dataset.target;
    const uuid = button.dataset.uuid;

    if (target === 'footer') {
        try {
            const allSettings = await apiFetch('/footer');
            const data = allSettings.find(item => item.uuid === uuid);
            if (data) {
                showFormModal(target, data);
            } else {
                alert('Could not find the item to edit.');
            }
        } catch (error) {
            alert(`Failed to fetch item details: ${error.message}`);
        }
        return;
    }

    if (target === 'site_config') {
        try {
            const data = await apiFetch(`/config/${uuid}`);
            console.log(data);
            showFormModal(target, data);
        } catch (error) {
            alert(`Failed to fetch item details: ${error.message}`);
        }
        return;
    }

    if (target === 'wiki_platform') {
        try {
            const data = await apiFetch(`/get/wiki_platform/${uuid}`);
            showFormModal(target, data);
        } catch (error) {
            alert(`Failed to fetch wiki platform details: ${error.message}`);
        }
        return;
    }

    const endpointMap = {
        creator: 'creator',
        work: 'work',
        asset: 'asset',
        media: 'media'
    };
    const getEndpoint = endpointMap[target] || target;
    try {
        const data = await apiFetch(`/get/${getEndpoint}/${uuid}`);
        console.log(data);
        showFormModal(target, data);
    } catch (error) {
        alert(`Failed to fetch item details: ${error.message}`);
    }
}

export async function handleDelete(e) {
    const button = e.target;
    const target = button.dataset.target;
    const row = button.closest('.work-card') || button.closest('tr');
    const uuid = row.dataset.uuid;

    if (!uuid || !confirm(`Are you sure you want to delete this item from ${target}?`)) return;

    if (target === 'footer') {
        try {
            await apiFetch(`/footer/settings/${uuid}`, { method: 'DELETE' });
            row.remove();
        } catch (error) {
            alert(`Failed to delete item: ${error.message}`);
        }
        return;
    }

    if (target === 'wiki_platform') {
        try {
            await apiFetch(`/delete/wiki_platform`, {
                method: 'POST',
                body: JSON.stringify({ platform_key: uuid }),
            });
            row.remove();
        } catch (error) {
            alert(`Failed to delete wiki platform: ${error.message}`);
        }
        return;
    }

    const uuidKeyMap = {
        work: 'work_uuid',
        creator: 'creator_uuid',
        media: 'media_uuid',
        asset: 'asset_uuid',
        relation: 'relation_uuid',
        tag: 'tag_uuid',
        category: 'category_uuid',
        external_source: 'external_source_uuid',
        external_object: 'external_object_uuid'
    };
    const endpointMap = { creator: 'creator', work: 'work' };
    const uuidKey = uuidKeyMap[target];
    const deleteEndpoint = endpointMap[target] || target;

    try {
        await apiFetch(`/delete/${deleteEndpoint}`, {
            method: 'POST',
            body: JSON.stringify({ [uuidKey]: uuid }),
        });
        row.remove();
    } catch (error) {
        alert(`Failed to delete item: ${error.message}`);
    }
}