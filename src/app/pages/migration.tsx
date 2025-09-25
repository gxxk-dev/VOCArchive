import { jsx } from 'hono/jsx';
import { BaseLayout } from './layouts/base-layout';
import type { FooterSetting } from '../db/operations/admin';
import type { SiteConfig } from '../db/types';

export interface MigrationPageProps {
    footerSettings: FooterSetting[];
    siteConfig: Record<string, string>;
}

export const MigrationPage = (props: MigrationPageProps) => {
    const title = props.siteConfig.admin_title?.replace('{TAB_NAME}', '数据库迁移') || 'VOCArchive 管理后台 - 数据库迁移';

    const styles = `
        .migration-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .migration-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }

        .migration-header h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
            font-weight: 300;
        }

        .migration-header p {
            margin: 0;
            opacity: 0.9;
            font-size: 1.1em;
        }

        .status-section, .migration-section {
            background: white;
            border-radius: 12px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
            border: 1px solid #e1e8ed;
        }

        .section-title {
            font-size: 1.4em;
            margin-bottom: 20px;
            color: #2d3748;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 10px;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .status-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }

        .status-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .status-label {
            color: #64748b;
            font-size: 0.9em;
        }

        .status-current { color: #10b981; }
        .status-latest { color: #3b82f6; }
        .status-pending { color: #f59e0b; }

        .migrations-list {
            margin-top: 20px;
        }

        .migration-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .migration-info h4 {
            margin: 0 0 5px 0;
            color: #2d3748;
        }

        .migration-info p {
            margin: 0;
            color: #64748b;
            font-size: 0.9em;
        }

        .migration-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-applied { background: #d1fae5; color: #065f46; }
        .status-current { background: #dbeafe; color: #1e40af; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-available { background: #f3f4f6; color: #374151; }

        .control-group {
            display: flex;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 0.95em;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .btn-primary:hover:not(:disabled) {
            background: #2563eb;
        }

        .btn-secondary {
            background: #6b7280;
            color: white;
        }

        .btn-secondary:hover:not(:disabled) {
            background: #4b5563;
        }

        .btn-danger {
            background: #ef4444;
            color: white;
        }

        .btn-danger:hover:not(:disabled) {
            background: #dc2626;
        }

        .checkbox-group {
            display: flex;
            gap: 20px;
            margin-bottom: 15px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 16px;
            height: 16px;
        }

        .log-output {
            background: #1f2937;
            color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 20px;
            white-space: pre-wrap;
        }

        .loading {
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }

        .spinner {
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }

        .error-message {
            background: #fef2f2;
            color: #991b1b;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #fecaca;
            margin-bottom: 20px;
        }

        .success-message {
            background: #f0fdf4;
            color: #166534;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #bbf7d0;
            margin-bottom: 20px;
        }

        .auth-section {
            background: #fef9e7;
            border: 1px solid #f3e8a6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }

        .auth-form {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .auth-input {
            padding: 8px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 0.9em;
        }

        @media (max-width: 768px) {
            .migration-container {
                padding: 15px;
            }

            .migration-header {
                padding: 20px;
            }

            .status-grid {
                grid-template-columns: 1fr;
            }

            .migration-item {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }

            .control-group {
                flex-direction: column;
            }
        }
    `;

    const scripts = `
        // Global state
        let isAuthenticated = false;
        let authToken = null;
        let migrationStatus = null;

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            checkAuthAndLoadData();
        });

        // Authentication
        async function authenticate() {
            const code = document.getElementById('authCode').value.trim();
            if (!code) {
                showError('请输入认证代码');
                return;
            }

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ code })
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    authToken = data.token;
                    isAuthenticated = true;
                    document.getElementById('authSection').style.display = 'none';
                    document.getElementById('migrationControls').style.display = 'block';
                    await loadMigrationStatus();
                    showSuccess('认证成功');
                } else {
                    showError('认证失败：' + (data.error || '无效的认证代码'));
                }
            } catch (error) {
                showError('认证请求失败：' + error.message);
            }
        }

        function checkAuthAndLoadData() {
            // Try to use existing token from localStorage if available
            const savedToken = localStorage.getItem('authToken');
            if (savedToken) {
                authToken = savedToken;
                isAuthenticated = true;
                document.getElementById('authSection').style.display = 'none';
                document.getElementById('migrationControls').style.display = 'block';
                loadMigrationStatus();
            }
        }

        // API calls with authentication
        async function apiCall(endpoint, options = {}) {
            if (!authToken) {
                throw new Error('未认证');
            }

            const headers = {
                'Authorization': 'Bearer ' + authToken,
                'Content-Type': 'application/json',
                ...options.headers
            };

            const response = await fetch(endpoint, {
                ...options,
                headers
            });

            if (response.status === 401) {
                // Token expired, show auth section
                isAuthenticated = false;
                authToken = null;
                localStorage.removeItem('authToken');
                document.getElementById('authSection').style.display = 'block';
                document.getElementById('migrationControls').style.display = 'none';
                throw new Error('认证已过期，请重新登录');
            }

            return response;
        }

        // Load migration status
        async function loadMigrationStatus() {
            try {
                setLoading('statusSection', true);

                const response = await apiCall('/api/migration/status');
                const result = await response.json();

                if (result.success) {
                    migrationStatus = result.data;
                    updateStatusDisplay();
                    updateMigrationsList();

                    // Save token to localStorage for future use
                    if (authToken) {
                        localStorage.setItem('authToken', authToken);
                    }
                } else {
                    showError('加载迁移状态失败：' + result.error);
                }
            } catch (error) {
                showError('加载迁移状态失败：' + error.message);
            } finally {
                setLoading('statusSection', false);
            }
        }

        // Update status display
        function updateStatusDisplay() {
            if (!migrationStatus) return;

            document.getElementById('currentVersion').textContent = migrationStatus.currentVersion;
            document.getElementById('latestVersion').textContent = migrationStatus.latestVersion;
            document.getElementById('pendingCount').textContent = migrationStatus.pendingCount;

            // Update button states
            const executeBtn = document.getElementById('executeBtn');
            const validateBtn = document.getElementById('validateBtn');

            executeBtn.disabled = !migrationStatus.needsMigration;
            executeBtn.textContent = migrationStatus.needsMigration ?
                '执行迁移 (' + migrationStatus.pendingCount + ')' : '无待执行迁移';
        }

        // Update migrations list
        function updateMigrationsList() {
            if (!migrationStatus || !migrationStatus.migrations) return;

            const container = document.getElementById('migrationsList');
            container.innerHTML = '';

            migrationStatus.migrations.forEach(migration => {
                const item = document.createElement('div');
                item.className = 'migration-item';

                const statusClass = 'status-' + migration.status;
                const statusText = {
                    'applied': '已应用',
                    'current': '当前版本',
                    'pending': '待执行',
                    'available': '可用'
                }[migration.status] || migration.status;

                item.innerHTML = \`
                    <div class="migration-info">
                        <h4>版本 \${migration.version}: \${migration.description}</h4>
                        <p>文件: \${migration.fileName}</p>
                        \${migration.error ? '<p style="color: #ef4444;">错误: ' + migration.error + '</p>' : ''}
                    </div>
                    <div class="migration-status \${statusClass}">\${statusText}</div>
                \`;

                container.appendChild(item);
            });
        }

        // Execute migrations
        async function executeMigrations() {
            const dryRun = document.getElementById('dryRunCheck').checked;
            const force = document.getElementById('forceCheck').checked;

            try {
                setLoading('executeBtn', true);
                clearOutput();

                const response = await apiCall('/api/migration/execute', {
                    method: 'POST',
                    body: JSON.stringify({
                        dryRun,
                        force
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showSuccess(result.message || '迁移执行成功');
                    logOutput(JSON.stringify(result.data, null, 2));
                    await loadMigrationStatus(); // Reload status
                } else {
                    showError('迁移执行失败：' + result.error);
                    if (result.data) {
                        logOutput(JSON.stringify(result.data, null, 2));
                    }
                }
            } catch (error) {
                showError('迁移执行请求失败：' + error.message);
            } finally {
                setLoading('executeBtn', false);
            }
        }

        // Validate migrations
        async function validateMigrations() {
            try {
                setLoading('validateBtn', true);
                clearOutput();

                const response = await apiCall('/api/migration/validate', {
                    method: 'POST'
                });

                const result = await response.json();

                if (result.success) {
                    showSuccess('迁移系统验证通过');
                } else {
                    showError('迁移系统验证失败');
                }

                logOutput(JSON.stringify(result.data, null, 2));
            } catch (error) {
                showError('验证请求失败：' + error.message);
            } finally {
                setLoading('validateBtn', false);
            }
        }

        // Utility functions
        function showError(message) {
            const container = document.getElementById('messageContainer');
            container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> ' + message + '</div>';
            setTimeout(() => container.innerHTML = '', 5000);
        }

        function showSuccess(message) {
            const container = document.getElementById('messageContainer');
            container.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> ' + message + '</div>';
            setTimeout(() => container.innerHTML = '', 5000);
        }

        function logOutput(text) {
            const output = document.getElementById('logOutput');
            const timestamp = new Date().toLocaleTimeString();
            output.textContent += '[' + timestamp + '] ' + text + '\\n\\n';
            output.scrollTop = output.scrollHeight;
        }

        function clearOutput() {
            document.getElementById('logOutput').textContent = '';
        }

        function setLoading(elementId, loading) {
            const element = document.getElementById(elementId);
            if (loading) {
                element.disabled = true;
                const originalText = element.textContent;
                element.dataset.originalText = originalText;
                element.innerHTML = '<span class="loading"><span class="spinner"></span>处理中...</span>';
            } else {
                element.disabled = false;
                element.textContent = element.dataset.originalText || element.textContent;
            }
        }

        // Handle Enter key in auth input
        document.addEventListener('DOMContentLoaded', function() {
            const authInput = document.getElementById('authCode');
            if (authInput) {
                authInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        authenticate();
                    }
                });
            }
        });
    `;

    return (
        <BaseLayout
            title={title}
            footerSettings={props.footerSettings}
            cssFiles={['/css/common.css']}
            additionalStyles={styles}
            additionalScripts={scripts}
        >
            <div class="migration-container">
                <div class="migration-header">
                    <h1><i class="fas fa-database"></i> 数据库迁移管理</h1>
                    <p>管理和执行数据库版本迁移</p>
                </div>

                <div id="messageContainer"></div>

                <div id="authSection" class="auth-section">
                    <h3><i class="fas fa-lock"></i> 身份认证</h3>
                    <p>请输入管理员认证代码以访问迁移功能</p>
                    <div class="auth-form">
                        <input
                            type="text"
                            id="authCode"
                            class="auth-input"
                            placeholder="输入6位认证代码"
                            maxLength={6}
                        />
                        <button class="btn btn-primary" onclick="authenticate()">
                            <i class="fas fa-sign-in-alt"></i> 登录
                        </button>
                    </div>
                </div>

                <div id="migrationControls" style="display: none;">
                    <div class="status-section">
                        <div class="section-title">
                            <i class="fas fa-info-circle"></i> 系统状态
                        </div>
                        <div id="statusSection">
                            <div class="status-grid">
                                <div class="status-card">
                                    <div class="status-number status-current" id="currentVersion">-</div>
                                    <div class="status-label">当前版本</div>
                                </div>
                                <div class="status-card">
                                    <div class="status-number status-latest" id="latestVersion">-</div>
                                    <div class="status-label">最新版本</div>
                                </div>
                                <div class="status-card">
                                    <div class="status-number status-pending" id="pendingCount">-</div>
                                    <div class="status-label">待执行迁移</div>
                                </div>
                            </div>
                            <div class="control-group">
                                <button class="btn btn-secondary" onclick="loadMigrationStatus()">
                                    <i class="fas fa-sync-alt"></i> 刷新状态
                                </button>
                                <button class="btn btn-secondary" id="validateBtn" onclick="validateMigrations()">
                                    <i class="fas fa-check-double"></i> 验证系统
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="migration-section">
                        <div class="section-title">
                            <i class="fas fa-cogs"></i> 迁移控制
                        </div>
                        <div class="checkbox-group">
                            <div class="checkbox-item">
                                <input type="checkbox" id="dryRunCheck" />
                                <label for="dryRunCheck">干运行模式（不实际执行）</label>
                            </div>
                            <div class="checkbox-item">
                                <input type="checkbox" id="forceCheck" />
                                <label for="forceCheck">强制执行（忽略错误）</label>
                            </div>
                        </div>
                        <div class="control-group">
                            <button class="btn btn-primary" id="executeBtn" onclick="executeMigrations()">
                                <i class="fas fa-play"></i> 执行迁移
                            </button>
                        </div>
                        <div class="log-output" id="logOutput"></div>
                    </div>

                    <div class="migration-section">
                        <div class="section-title">
                            <i class="fas fa-list"></i> 迁移列表
                        </div>
                        <div class="migrations-list" id="migrationsList">
                            <p style="text-align: center; color: #64748b;">加载中...</p>
                        </div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    );
};