// Tools and utilities module

import { apiFetch } from './api.js';
import { loadContent } from './crud-handlers.js';
import { currentTab } from './config.js';

let generateUuidButton, generatedUuidResult, dbInitButton, dbClearButton;
let configStatusButton, configStatusResult, configInitButton, configInitResult;
let migrationStatusButton, migrationStatusResult, executeMigrationButton;
let assetUrlInput, batchSizeInput, validateMigrationButton, validationResult;

// Initialize DOM elements for tools
export function initializeToolElements() {
    // Tool Zone elements
    generateUuidButton = document.getElementById('generate-uuid-button');
    generatedUuidResult = document.getElementById('generated-uuid-result');
    dbInitButton = document.getElementById('db-init-button');
    dbClearButton = document.getElementById('db-clear-button');

    // Config management elements
    configStatusButton = document.getElementById('config-status-button');
    configStatusResult = document.getElementById('config-status-result');
    configInitButton = document.getElementById('config-init-button');
    configInitResult = document.getElementById('config-init-result');

    // Migration elements
    migrationStatusButton = document.getElementById('migration-status-button');
    migrationStatusResult = document.getElementById('migration-status-result');
    executeMigrationButton = document.getElementById('execute-migration-button');
    assetUrlInput = document.getElementById('asset-url-input');
    batchSizeInput = document.getElementById('batch-size-input');
    validateMigrationButton = document.getElementById('validate-migration-button');
    validationResult = document.getElementById('validation-result');
}

// --- UUID Generation ---
export function setupUuidGeneration() {
    if (generateUuidButton && generatedUuidResult) {
        generateUuidButton.addEventListener('click', () => {
            generatedUuidResult.value = crypto.randomUUID();
        });
    }
}

// --- Database Management ---
export function setupDatabaseManagement() {
    if (dbInitButton) {
        dbInitButton.addEventListener('click', async () => {
            if (!confirm('您确定要初始化数据库吗？这将创建所有表结构。')) {
                return;
            }
            try {
                await apiFetch(`/input/dbinit`, { method: 'POST', body: JSON.stringify({}) });
                alert('数据库初始化成功。');
            } catch (error) {
                alert(`数据库初始化失败: ${error.message}`);
            }
        });
    }

    if (dbClearButton) {
        dbClearButton.addEventListener('click', async () => {
            if (!confirm('您确定要清空数据库吗？这将删除所有用户数据表，此操作不可逆！')) {
                return;
            }
            try {
                await apiFetch(`/delete/dbclear`, { method: 'POST', body: JSON.stringify({}) });
                alert('数据库已清空。请刷新页面查看更改。');
                loadContent(currentTab); // Refresh view
            } catch (error) {
                alert(`清空数据库失败: ${error.message}`);
            }
        });
    }
}

// --- Config Management ---
export function setupConfigManagement() {
    // Check config status
    if (configStatusButton) {
        configStatusButton.addEventListener('click', async () => {
            try {
                configStatusResult.className = 'config-status-result';
                configStatusResult.innerHTML = '正在检查配置状态...';
                configStatusResult.classList.add('show');

                const response = await apiFetch('/config/status', { method: 'GET' });
                displayResult(configStatusResult, response, true);
            } catch (error) {
                displayResult(configStatusResult, { error: error.message }, false);
            }
        });
    }

    // Initialize config
    if (configInitButton) {
        configInitButton.addEventListener('click', async () => {
            if (!confirm('确定要初始化站点配置吗？\\n\\n此操作将创建配置表并初始化默认配置。如果配置已存在，将更新缺失的配置项。')) {
                return;
            }

            try {
                configInitResult.className = 'config-init-result';
                configInitResult.innerHTML = '正在初始化配置...';
                configInitResult.classList.add('show');

                const response = await apiFetch('/input/config-init', { method: 'POST' });

                displayResult(configInitResult, response, response.success !== false);

                if (response.success !== false) {
                    alert('配置初始化完成！');
                    // Refresh config status after successful init
                    configStatusButton.click();
                } else {
                    alert(`配置初始化失败: ${response.error || '未知错误'}`);
                }
            } catch (error) {
                displayResult(configInitResult, { error: error.message }, false);
                alert(`配置初始化失败: ${error.message}`);
            }
        });
    }
}

// --- Migration Management ---
export function setupMigrationManagement() {
    // Check migration status
    if (migrationStatusButton) {
        migrationStatusButton.addEventListener('click', async () => {
            try {
                migrationStatusResult.className = 'migration-status-result';
                migrationStatusResult.innerHTML = '正在检查迁移状态...';
                migrationStatusResult.classList.add('show');

                const response = await apiFetch('/input/migrate/status', { method: 'GET' });
                displayResult(migrationStatusResult, response, true);
            } catch (error) {
                displayResult(migrationStatusResult, { error: error.message }, false);
            }
        });
    }

    // Execute migration
    if (executeMigrationButton) {
        executeMigrationButton.addEventListener('click', async () => {
            const assetUrl = assetUrlInput.value.trim();
            const batchSize = parseInt(batchSizeInput.value) || 50;

            if (!assetUrl) {
                alert('请输入 ASSET_URL');
                return;
            }

            if (!confirm(`确定要执行外部存储迁移吗？\\n\\nASSET_URL: ${assetUrl}\\n批处理大小: ${batchSize}\\n\\n此操作将修改数据库结构，建议先备份数据！`)) {
                return;
            }

            try {
                // Clear previous results
                migrationStatusResult.className = 'migration-status-result';
                migrationStatusResult.innerHTML = '正在执行迁移...';
                migrationStatusResult.classList.add('show');

                const response = await apiFetch('/input/migrate/external-storage', {
                    method: 'POST',
                    body: JSON.stringify({
                        asset_url: assetUrl,
                        batch_size: batchSize
                    })
                });

                displayResult(migrationStatusResult, response, response.success !== false);

                if (response.success !== false) {
                    alert(`迁移完成！\\n\\n资产迁移: ${response.migratedAssets || 0} 个\\n媒体源迁移: ${response.migratedMediaSources || 0} 个`);
                } else {
                    alert(`迁移失败: ${response.message || '未知错误'}`);
                }
            } catch (error) {
                displayResult(migrationStatusResult, { error: error.message }, false);
                alert(`迁移失败: ${error.message}`);
            }
        });
    }

    // Validate migration
    if (validateMigrationButton) {
        validateMigrationButton.addEventListener('click', async () => {
            if (!confirm('确定要验证迁移完整性吗？这将检查数据一致性和完整性。')) {
                return;
            }

            try {
                validationResult.className = 'validation-result';
                validationResult.innerHTML = '正在验证迁移完整性...';
                validationResult.classList.add('show');

                const response = await apiFetch('/input/migrate/validate', { method: 'POST' });

                displayResult(validationResult, response, response.success !== false);

                if (response.success !== false) {
                    const summary = response.validationSummary || {};
                    alert(`验证完成！\\n\\n检查项目:\\n• 孤立外部对象: ${summary.orphanedExternalObjects || 0}\\n• 缺失源引用: ${summary.missingSourceReferences || 0}\\n• 关联错误: ${summary.associationErrors || 0}\\n\\n${response.validationDetails ? '详细信息请查看结果区域' : ''}`);
                } else {
                    alert(`验证失败: ${response.message || '未知错误'}`);
                }
            } catch (error) {
                displayResult(validationResult, { error: error.message }, false);
                alert(`验证失败: ${error.message}`);
            }
        });
    }
}

// Helper function to display results
function displayResult(element, data, isSuccess = true) {
    element.className = `${element.className.split(' ')[0]} show ${isSuccess ? 'success' : 'error'}`;
    element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
}