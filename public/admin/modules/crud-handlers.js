// CRUD operations handling module

import { apiFetch } from './api.js';
import { updatePageTitle } from './utils.js';
import { renderTable } from './render-tables.js';
import { showFormModal } from './form-handler.js';

let content; // Global reference to content element

// Initialize DOM elements for CRUD operations
export function initializeCrudElements() {
    content = document.getElementById('content');
}

// --- Content Loading ---
export async function loadContent(target) {
    // 更新页面标题
    updatePageTitle(target);

    content.innerHTML = '<h2>Loading...</h2>';
    try {
        let endpoint, data;
        if (target === 'footer') {
            endpoint = '/footer';
            data = await apiFetch(endpoint);
        } else if (target === 'tag') {
            endpoint = '/list/tags';
            data = await apiFetch(endpoint);
        } else if (target === 'category') {
            endpoint = '/list/categories';
            data = await apiFetch(endpoint);
        } else if (target === 'external_source') {
            endpoint = '/list/external_sources';
            data = await apiFetch(endpoint);
        } else if (target === 'external_object') {
            endpoint = '/list/external_objects/1/999';
            data = await apiFetch(endpoint);
        } else if (target === 'site_config') {
            endpoint = '/config';
            data = await apiFetch(endpoint);
            console.log("Get Config:", data);
        } else if (target === 'wiki_platform') {
            endpoint = '/list/wiki_platforms';
            data = await apiFetch(endpoint);
        } else if (target === 'migration') {
            // 迁移管理不需要数据，直接渲染界面
            renderMigrationInterface();
            return;
        } else {
            endpoint = `/list/${target}/1?pageSize=999`;
            data = await apiFetch(endpoint);
        }
        renderTable(target, data);
    } catch (error) {
        content.innerHTML = `<p class="error-message">Failed to load ${target}: ${error.message}</p>`;
    }
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

// 渲染迁移管理界面
function renderMigrationInterface() {
    content.innerHTML = `
        <div class="migration-container">
            <h2>迁移管理</h2>

            <!-- 迁移状态 -->
            <div class="migration-section">
                <h3>迁移状态</h3>
                <button id="check-migration-status" class="migration-button">检查迁移状态</button>
                <div id="migration-status-result" class="migration-status-result"></div>
            </div>

            <!-- 数据库迁移 -->
            <div class="migration-section">
                <h3>数据库迁移</h3>
                <p>执行数据库架构迁移，应用新的表结构和数据变更。</p>
                <button id="execute-migration" class="migration-button">执行迁移</button>
                <div id="migration-result" class="migration-status-result"></div>
            </div>

            <!-- 验证迁移 -->
            <div class="migration-section">
                <h3>验证迁移</h3>
                <p>验证迁移后的数据完整性和一致性。</p>
                <button id="validate-migration" class="migration-button">验证迁移</button>
                <div id="validation-result" class="migration-status-result"></div>
            </div>

            <!-- 外部存储迁移 -->
            <div class="migration-section danger-section">
                <h3>外部存储迁移</h3>
                <p>⚠️ 将旧的文件存储迁移到外部存储架构。<strong>执行前请备份数据库！</strong></p>
                <div class="migration-params">
                    <label for="asset-url">资源基础URL *:</label>
                    <input type="url" id="asset-url" placeholder="https://assets.example.com" required>
                    <label for="batch-size">批处理大小:</label>
                    <input type="number" id="batch-size" value="50" min="1" max="1000">
                </div>
                <button id="execute-storage-migration" class="migration-button danger-button">执行存储迁移</button>
                <div id="storage-migration-result" class="migration-status-result"></div>
            </div>
        </div>
    `;

    // 绑定事件监听器
    bindMigrationEventListeners();
}

// 绑定迁移功能的事件监听器
function bindMigrationEventListeners() {
    // 检查迁移状态
    document.getElementById('check-migration-status').addEventListener('click', async () => {
        const resultDiv = document.getElementById('migration-status-result');
        resultDiv.textContent = '正在检查迁移状态...';
        resultDiv.className = 'migration-status-result show';

        try {
            const response = await apiFetch('/migration/status');
            resultDiv.textContent = JSON.stringify(response, null, 2);
            resultDiv.className = 'migration-status-result show success';
        } catch (error) {
            resultDiv.textContent = `错误: ${error.message}`;
            resultDiv.className = 'migration-status-result show error';
        }
    });

    // 执行数据库迁移
    document.getElementById('execute-migration').addEventListener('click', async () => {
        if (!confirm('确定要执行数据库迁移吗？这将应用所有待执行的迁移。')) return;

        const resultDiv = document.getElementById('migration-result');
        resultDiv.textContent = '正在执行迁移...';
        resultDiv.className = 'migration-status-result show';

        try {
            const response = await apiFetch('/migration/execute', {
                method: 'POST',
                body: JSON.stringify({})
            });
            resultDiv.textContent = JSON.stringify(response, null, 2);
            resultDiv.className = 'migration-status-result show success';
        } catch (error) {
            resultDiv.textContent = `迁移失败: ${error.message}`;
            resultDiv.className = 'migration-status-result show error';
        }
    });

    // 验证迁移
    document.getElementById('validate-migration').addEventListener('click', async () => {
        const resultDiv = document.getElementById('validation-result');
        resultDiv.textContent = '正在验证迁移...';
        resultDiv.className = 'migration-status-result show';

        try {
            const response = await apiFetch('/migration/validate', { method: 'POST' });
            resultDiv.textContent = JSON.stringify(response, null, 2);
            resultDiv.className = 'migration-status-result show success';
        } catch (error) {
            resultDiv.textContent = `验证失败: ${error.message}`;
            resultDiv.className = 'migration-status-result show error';
        }
    });

    // 执行外部存储迁移
    document.getElementById('execute-storage-migration').addEventListener('click', async () => {
        const assetUrl = document.getElementById('asset-url').value;
        const batchSize = parseInt(document.getElementById('batch-size').value) || 50;

        if (!assetUrl) {
            alert('请输入资源基础URL');
            return;
        }

        if (!confirm('⚠️ 确定要执行外部存储迁移吗？\n\n执行前请确保：\n1. 已备份数据库\n2. 资源URL正确\n3. 了解迁移风险')) return;

        const resultDiv = document.getElementById('storage-migration-result');
        resultDiv.textContent = '正在执行外部存储迁移...';
        resultDiv.className = 'migration-status-result show';

        try {
            const response = await apiFetch('/migration/external-storage', {
                method: 'POST',
                body: JSON.stringify({
                    asset_url: assetUrl,
                    batch_size: batchSize
                })
            });
            resultDiv.textContent = JSON.stringify(response, null, 2);
            resultDiv.className = 'migration-status-result show success';
        } catch (error) {
            resultDiv.textContent = `存储迁移失败: ${error.message}`;
            resultDiv.className = 'migration-status-result show error';
        }
    });
}