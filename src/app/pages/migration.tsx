import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { FooterSetting } from '../db/operations/admin'

export interface MigrationPageProps {
    footerSettings: FooterSetting[]
}

export const MigrationPage = (props: MigrationPageProps) => {
    return (
        <BaseLayout
            title="VOCArchive 管理后台 - 数据库迁移"
            footerSettings={props.footerSettings}
            cssFiles={['/css/common.css', '/css/migration.css']}
            additionalScripts={`
                // Global state
                let isAuthenticated = false;
                let authToken = null;
                let migrationStatus = null;

                // Initialize page
                document.addEventListener('DOMContentLoaded', function() {
                    initializeTheme();
                    loadPageTitle();
                    checkAuthAndLoadData();
                });

                // --- Theme Management ---
                function getTheme() {
                    return localStorage.getItem('theme') || 'light';
                }

                function setTheme(theme) {
                    localStorage.setItem('theme', theme);
                    document.documentElement.setAttribute('data-theme', theme);
                    updateThemeIcon(theme);
                }

                function updateThemeIcon(theme) {
                    const themeIcon = document.getElementById('theme-icon');
                    const themeToggle = document.getElementById('theme-toggle');
                    if (themeIcon && themeToggle) {
                        if (theme === 'dark') {
                            themeIcon.className = 'fas fa-sun';
                            themeToggle.title = '切换到浅色模式';
                        } else {
                            themeIcon.className = 'fas fa-moon';
                            themeToggle.title = '切换到深色模式';
                        }
                    }
                }

                function toggleTheme() {
                    const currentTheme = getTheme();
                    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                    setTheme(newTheme);
                }

                // Initialize theme on page load
                function initializeTheme() {
                    const savedTheme = getTheme();
                    setTheme(savedTheme);
                }

                // --- Page Title Management ---
                async function loadPageTitle() {
                    try {
                        const response = await fetch('/api/config/public');
                        if (response.ok) {
                            const config = await response.json();
                            if (config.migration_title) {
                                // Update document title
                                const titleElement = document.getElementById('pageTitle');
                                if (titleElement) {
                                    titleElement.textContent = config.migration_title;
                                }
                                document.title = config.migration_title;

                                // Update page header
                                const headerElement = document.getElementById('pageHeader');
                                if (headerElement) {
                                    headerElement.innerHTML = '<i class="fas fa-database"></i> ' + config.migration_title.replace('VOCArchive 管理后台 - ', '');
                                }
                            }
                        }
                    } catch (error) {
                        // Silently fail and use default title
                        console.warn('Failed to load page title configuration:', error);
                    }
                }

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

                            const authSection = document.getElementById('authSection');
                            const migrationControls = document.getElementById('migrationControls');

                            if (authSection) authSection.style.display = 'none';
                            if (migrationControls) migrationControls.style.display = 'block';

                            // Save token to localStorage with the same key as admin page for sharing
                            localStorage.setItem('jwtToken', data.token);

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
                    // Try to use existing token from localStorage (shared with admin page)
                    const savedToken = localStorage.getItem('jwtToken');
                    if (savedToken) {
                        authToken = savedToken;
                        isAuthenticated = true;

                        const authSection = document.getElementById('authSection');
                        const migrationControls = document.getElementById('migrationControls');

                        if (authSection) authSection.style.display = 'none';
                        if (migrationControls) migrationControls.style.display = 'block';

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
                        localStorage.removeItem('jwtToken');
                        document.getElementById('authSection').style.display = 'block';
                        document.getElementById('migrationControls').style.display = 'none';
                        throw new Error('认证已过期，请重新登录');
                    }

                    return response;
                }

                // Load migration status
                async function loadMigrationStatus() {
                    try {
                        const response = await apiCall('/api/migration/status');
                        const result = await response.json();

                        if (result.success) {
                            migrationStatus = result.data;
                            updateStatusDisplay();
                            updateMigrationsList();

                            // Auto-load parameter requirements if there are pending migrations
                            if (migrationStatus.needsMigration) {
                                await loadParameterRequirements(true); // silent mode
                            }

                            // Save token to localStorage for future use (shared with admin page)
                            if (authToken) {
                                localStorage.setItem('jwtToken', authToken);
                            }
                        } else {
                            showError('加载迁移状态失败：' + result.error);
                        }
                    } catch (error) {
                        showError('加载迁移状态失败：' + error.message);
                    }
                }

                // Update status display
                function updateStatusDisplay() {
                    if (!migrationStatus) return;

                    // Debug: log the migration status to see its structure
                    console.log('Migration status:', migrationStatus);

                    // Safely update status elements with null checks
                    const currentVersionEl = document.getElementById('currentVersion');
                    const latestVersionEl = document.getElementById('latestVersion');
                    const pendingCountEl = document.getElementById('pendingCount');

                    if (currentVersionEl) {
                        currentVersionEl.textContent = migrationStatus.currentVersion !== undefined
                            ? migrationStatus.currentVersion.toString()
                            : '-';
                    }
                    if (latestVersionEl) {
                        latestVersionEl.textContent = migrationStatus.latestVersion !== undefined
                            ? migrationStatus.latestVersion.toString()
                            : '-';
                    }
                    if (pendingCountEl) {
                        pendingCountEl.textContent = migrationStatus.pendingCount !== undefined
                            ? migrationStatus.pendingCount.toString()
                            : '-';
                    }

                    // Update button states
                    const executeBtn = document.getElementById('executeBtn');

                    if (executeBtn) {
                        const needsMigration = migrationStatus.needsMigration === true;
                        const pendingCount = migrationStatus.pendingCount || 0;

                        executeBtn.disabled = !needsMigration;

                        // Preserve button HTML structure when updating text
                        const icon = '<i class="fas fa-play"></i>';
                        const buttonText = needsMigration
                            ? \`\${icon} 执行迁移 (\${pendingCount})\`
                            : \`\${icon} 无待执行迁移\`;

                        executeBtn.innerHTML = buttonText;
                    }
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

                // Load parameter requirements for migrations
                async function loadParameterRequirements(silent = false) {
                    try {
                        if (!silent) setLoading('loadParamsBtn', true);
                        if (!silent) clearOutput();

                        const response = await apiCall('/api/migration/parameter-requirements');
                        const result = await response.json();

                        if (result.success) {
                            const requirements = result.data;
                            if (requirements.hasUnmetRequirements) {
                                generateParameterForms(requirements.requirementsWithParameters);
                                if (!silent) showSuccess(\`发现 \${requirements.requirementsWithParameters.length} 个迁移需要参数\`);
                            } else {
                                hideParameterForms();
                                if (!silent) showSuccess('未发现需要参数的迁移');
                            }
                            if (!silent) logOutput(JSON.stringify(result.data, null, 2));
                        } else {
                            showError('获取参数需求失败：' + result.error);
                        }
                    } catch (error) {
                        showError('获取参数需求失败：' + error.message);
                    } finally {
                        if (!silent) setLoading('loadParamsBtn', false);
                    }
                }

                // Generate parameter forms for migrations
                function generateParameterForms(requirements) {
                    const parametersSection = document.getElementById('parametersSection');
                    const parameterForms = document.getElementById('parameterForms');

                    parameterForms.innerHTML = '';

                    requirements.forEach(requirement => {
                        const migrationGroup = document.createElement('div');
                        migrationGroup.className = 'parameter-group';
                        migrationGroup.id = \`params-\${requirement.version}\`;

                        migrationGroup.innerHTML = \`
                            <div class="parameter-header">
                                版本 \${requirement.version}: \${requirement.description}
                            </div>
                        \`;

                        requirement.parameters.forEach(param => {
                            const paramItem = document.createElement('div');
                            paramItem.className = 'parameter-item';

                            const inputId = \`param-\${requirement.version}-\${param.name}\`;
                            const isRequired = param.required !== false;
                            const defaultValue = param.defaultValue || '';

                            let inputHtml = '';

                            if (param.type === 'boolean') {
                                inputHtml = \`
                                    <input type="checkbox" id="\${inputId}" class="parameter-input"
                                           data-param="\${param.name}" data-type="\${param.type}"
                                           \${defaultValue ? 'checked' : ''}>
                                \`;
                            } else if (param.validation?.enum) {
                                inputHtml = \`
                                    <select id="\${inputId}" class="parameter-input"
                                            data-param="\${param.name}" data-type="\${param.type}"
                                            \${isRequired ? 'required' : ''}>
                                        \${param.validation.enum.map(option =>
                                            \`<option value="\${option}" \${option === defaultValue ? 'selected' : ''}>\${option}</option>\`
                                        ).join('')}
                                    </select>
                                \`;
                            } else {
                                const inputType = param.type === 'number' ? 'number' : 'text';
                                let inputAttrs = '';

                                if (param.validation) {
                                    if (param.validation.min !== undefined) inputAttrs += \` min="\${param.validation.min}"\`;
                                    if (param.validation.max !== undefined) inputAttrs += \` max="\${param.validation.max}"\`;
                                    if (param.validation.pattern) inputAttrs += \` pattern="\${param.validation.pattern}"\`;
                                }

                                inputHtml = \`
                                    <input type="\${inputType}" id="\${inputId}" class="parameter-input"
                                           data-param="\${param.name}" data-type="\${param.type}"
                                           value="\${defaultValue}" \${inputAttrs}
                                           \${isRequired ? 'required' : ''}
                                           placeholder="\${param.description}">
                                \`;
                            }

                            let hintText = '';
                            if (param.validation) {
                                const hints = [];
                                if (param.validation.min !== undefined) hints.push(\`最小: \${param.validation.min}\`);
                                if (param.validation.max !== undefined) hints.push(\`最大: \${param.validation.max}\`);
                                if (param.validation.pattern) hints.push(\`格式: \${param.validation.pattern}\`);
                                if (hints.length > 0) {
                                    hintText = \`<div class="parameter-hint">\${hints.join(', ')}</div>\`;
                                }
                            }

                            paramItem.innerHTML = \`
                                <label class="parameter-label" for="\${inputId}">
                                    \${param.name} \${isRequired ? '*' : ''}
                                </label>
                                <div class="parameter-description">\${param.description}</div>
                                \${inputHtml}
                                \${hintText}
                                <div class="parameter-error" id="\${inputId}-error"></div>
                            \`;

                            migrationGroup.appendChild(paramItem);
                        });

                        parameterForms.appendChild(migrationGroup);
                    });

                    parametersSection.style.display = 'block';
                }

                // Hide parameter forms
                function hideParameterForms() {
                    const parametersSection = document.getElementById('parametersSection');
                    parametersSection.style.display = 'none';
                }

                // Collect migration parameters from forms
                function collectMigrationParameters() {
                    const parameters = {};
                    const parameterForms = document.getElementById('parameterForms');

                    if (!parameterForms || parameterForms.style.display === 'none') {
                        return parameters;
                    }

                    const migrationGroups = parameterForms.querySelectorAll('.parameter-group');

                    migrationGroups.forEach(group => {
                        const versionMatch = group.id.match(/params-(\\d+)/);
                        if (!versionMatch) return;

                        const version = parseInt(versionMatch[1]);
                        parameters[version] = {};

                        const inputs = group.querySelectorAll('.parameter-input');
                        inputs.forEach(input => {
                            const paramName = input.dataset.param;
                            const paramType = input.dataset.type;

                            let value;
                            if (paramType === 'boolean') {
                                value = input.checked;
                            } else if (paramType === 'number') {
                                value = input.value ? parseFloat(input.value) : undefined;
                            } else {
                                value = input.value || undefined;
                            }

                            if (value !== undefined && value !== '') {
                                parameters[version][paramName] = value;
                            }
                        });
                    });

                    return parameters;
                }

                // Execute migrations
                async function executeMigrations() {
                    const dryRun = document.getElementById('dryRunCheck').checked;
                    const force = document.getElementById('forceCheck').checked;
                    const parameters = collectMigrationParameters();

                    try {
                        setLoading('executeBtn', true);
                        clearOutput();

                        const requestBody = {
                            dryRun,
                            force
                        };

                        // Add parameters if any were collected
                        if (Object.keys(parameters).length > 0) {
                            requestBody.parameters = parameters;
                            logOutput('使用参数: ' + JSON.stringify(parameters, null, 2));
                        }

                        const response = await apiCall('/api/migration/execute', {
                            method: 'POST',
                            body: JSON.stringify(requestBody)
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
                    if (container) {
                        container.innerHTML = '<div class="error-message"><i class="fas fa-exclamation-triangle"></i> ' + message + '</div>';
                        setTimeout(() => container.innerHTML = '', 5000);
                    }
                }

                function showSuccess(message) {
                    const container = document.getElementById('messageContainer');
                    if (container) {
                        container.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i> ' + message + '</div>';
                        setTimeout(() => container.innerHTML = '', 5000);
                    }
                }

                function logOutput(text) {
                    const output = document.getElementById('logOutput');
                    if (output) {
                        const timestamp = new Date().toLocaleTimeString();
                        output.textContent += '[' + timestamp + '] ' + text + '\\n\\n';
                        output.scrollTop = output.scrollHeight;
                    }
                }

                function clearOutput() {
                    const output = document.getElementById('logOutput');
                    if (output) {
                        output.textContent = '';
                    }
                }

                function setLoading(elementId, loading) {
                    const element = document.getElementById(elementId);
                    if (!element) return; // Safe exit if element doesn't exist

                    if (loading) {
                        element.disabled = true;
                        const originalHTML = element.innerHTML;
                        element.dataset.originalHTML = originalHTML;
                        element.innerHTML = '<span class="loading"><span class="spinner"></span>处理中...</span>';
                    } else {
                        element.disabled = false;
                        element.innerHTML = element.dataset.originalHTML || element.innerHTML;
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
            `}
        >
            <div class="migration-container">
                <div class="migration-header">
                    <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()" title="切换到深色模式">
                        <i id="theme-icon" class="fas fa-moon"></i>
                    </button>
                    <h1 id="pageHeader"><i class="fas fa-database"></i> 数据库迁移管理</h1>
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
                            maxLength="6"
                        />
                        <button class="btn btn-primary" onclick="authenticate()">
                            <i class="fas fa-sign-in-alt"></i> 登录
                        </button>
                    </div>
                </div>

                <div id="migrationControls" style="display: block;">
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
                                <button class="btn btn-secondary" id="loadParamsBtn" onclick="loadParameterRequirements()">
                                    <i class="fas fa-cog"></i> 检查参数需求
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

                        <div class="info-notice">
                            <i class="fas fa-shield-alt"></i>
                            <strong>自动回滚保护：</strong>如果迁移失败，系统将自动回滚已执行的迁移，确保数据库一致性。
                        </div>

                        {/* 迁移参数表单 */}
                        <div id="parametersSection" style="display: none;">
                            <div class="section-title">
                                <i class="fas fa-sliders-h"></i> 迁移参数
                            </div>
                            <div id="parameterForms"></div>
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
    )
}