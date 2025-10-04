import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { FooterSetting } from '../db/operations/admin'

export interface TestToolsPageProps {
    footerSettings: FooterSetting[]
}

export const TestToolsPage = (props: TestToolsPageProps) => {
    return (
        <BaseLayout
            title="测试工具 - VOCArchive"
            footerSettings={props.footerSettings}
            cssFiles={['/css/common.css', '/css/test-tools.css']}
            additionalScripts={`
                // 测试工具全局状态
                let testResults = {};
                let cacheData = null;
                let swRegistration = null;

                // 页面初始化
                document.addEventListener('DOMContentLoaded', function() {
                    initializeTabs();
                    loadInitialData();
                });

                // 标签页管理
                function initializeTabs() {
                    const tabButtons = document.querySelectorAll('.tab-button');
                    const tabContents = document.querySelectorAll('.tab-content');

                    tabButtons.forEach(button => {
                        button.addEventListener('click', () => {
                            const targetTab = button.getAttribute('data-tab');

                            // 更新按钮状态
                            tabButtons.forEach(btn => btn.classList.remove('active'));
                            button.classList.add('active');

                            // 更新内容显示
                            tabContents.forEach(content => {
                                if (content.id === targetTab) {
                                    content.classList.add('active');
                                } else {
                                    content.classList.remove('active');
                                }
                            });

                            // 根据标签页加载对应数据
                            if (targetTab === 'cache-tab') {
                                loadCacheData();
                            } else if (targetTab === 'sw-test-tab') {
                                checkServiceWorker();
                            }
                        });
                    });
                }

                // 初始数据加载
                function loadInitialData() {
                    checkServiceWorker();
                }

                // ============ Service Worker 测试功能 ============

                // 日志功能
                function log(message, type = 'info') {
                    const timestamp = new Date().toLocaleTimeString();
                    const logEl = document.getElementById('log');
                    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
                    logEl.textContent += \`[\${timestamp}] \${prefix} \${message}\\n\`;
                    logEl.scrollTop = logEl.scrollHeight;
                }

                function clearLog() {
                    document.getElementById('log').textContent = '等待日志输出...\\n';
                }

                // 更新状态显示
                function updateStatus(elementId, message, type) {
                    const el = document.getElementById(elementId);
                    el.textContent = message;
                    el.className = \`status \${type}\`;
                }

                // 运行所有测试
                async function runAllTests() {
                    log('开始运行所有测试...', 'info');

                    await checkServiceWorker();

                    if (testResults.serviceWorker) {
                        await testConfigEndpoint();
                        await checkExternalHosts();
                        await testFileRedirect();
                        await testCaching();
                    }

                    log('所有测试完成', 'success');
                }

                // 重置所有测试状态
                function resetAllTests() {
                    testResults = {};

                    updateStatus('sw-status', '检查中...', 'info');
                    updateStatus('config-status', '未测试', 'info');
                    updateStatus('external-hosts', '未检测', 'info');
                    updateStatus('redirect-status', '未测试', 'info');
                    updateStatus('cache-status', '未测试', 'info');

                    const hostsList = document.getElementById('hosts-list');
                    if (hostsList) {
                        hostsList.innerHTML = '';
                    }

                    clearLog();
                    log('所有测试状态已重置', 'success');
                }

                // 导出日志
                function exportLog() {
                    const logContent = document.getElementById('log').textContent;
                    const blob = new Blob([logContent], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);

                    const a = document.createElement('a');
                    a.href = url;
                    a.download = \`sw-test-log-\${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt\`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    log('日志已导出', 'success');
                }

                // 检查 Service Worker 状态
                async function checkServiceWorker() {
                    log('检查 Service Worker 状态...');

                    if (!('serviceWorker' in navigator)) {
                        updateStatus('sw-status', '❌ 浏览器不支持 Service Worker', 'error');
                        log('浏览器不支持 Service Worker', 'error');
                        return false;
                    }

                    try {
                        const registration = await navigator.serviceWorker.getRegistration();

                        if (registration && registration.active) {
                            updateStatus('sw-status', '✅ Service Worker 已激活', 'success');
                            log('Service Worker 已激活: ' + registration.scope, 'success');

                            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

                            testResults.serviceWorker = true;
                            return true;
                        } else {
                            updateStatus('sw-status', '⚠️ Service Worker 未激活', 'error');
                            log('Service Worker 未激活，请刷新页面', 'error');
                            testResults.serviceWorker = false;
                            return false;
                        }
                    } catch (error) {
                        updateStatus('sw-status', '❌ Service Worker 检查失败', 'error');
                        log('Service Worker 检查失败: ' + error.message, 'error');
                        testResults.serviceWorker = false;
                        return false;
                    }
                }

                // 测试配置端点
                async function testConfigEndpoint() {
                    log('测试配置端点...');

                    try {
                        const response = await fetch('/api/sw_config.js');

                        if (response.ok) {
                            const configText = await response.text();

                            if (configText.includes('EXTERNAL_HOSTS') && configText.includes('CACHE_CONFIG')) {
                                updateStatus('config-status', '✅ 配置端点正常', 'success');
                                log('配置端点返回正常，包含必要的配置项', 'success');
                                testResults.configEndpoint = true;
                            } else {
                                updateStatus('config-status', '⚠️ 配置内容不完整', 'error');
                                log('配置端点返回的内容不完整', 'error');
                                testResults.configEndpoint = false;
                            }
                        } else {
                            updateStatus('config-status', '❌ 配置端点访问失败', 'error');
                            log(\`配置端点访问失败: \${response.status}\`, 'error');
                            testResults.configEndpoint = false;
                        }
                    } catch (error) {
                        updateStatus('config-status', '❌ 配置端点请求失败', 'error');
                        log('配置端点请求失败: ' + error.message, 'error');
                        testResults.configEndpoint = false;
                    }
                }

                // 检查外部主机
                async function checkExternalHosts() {
                    log('检查外部存储主机配置...');

                    try {
                        const response = await fetch('/api/sw_config.js');
                        if (response.ok) {
                            const configText = await response.text();
                            const hostsMatch = configText.match(/const EXTERNAL_HOSTS = (\\[.*?\\]);/);
                            if (hostsMatch) {
                                const hosts = JSON.parse(hostsMatch[1]);
                                testResults.externalHosts = hosts;
                                updateStatus('external-hosts', \`✅ 检测到 \${hosts.length} 个外部主机\`, 'success');
                                log(\`外部主机列表: \${hosts.join(', ')}\`, 'success');

                                const hostsList = document.getElementById('hosts-list');
                                let hostsHtml = '<h4>外部存储主机列表:</h4>';
                                hosts.forEach(host => {
                                    hostsHtml += \`<div class="test-url">🌐 \${host}</div>\`;
                                });
                                hostsList.innerHTML = hostsHtml;
                            }
                        }
                    } catch (error) {
                        log('外部主机检测失败: ' + error.message, 'error');
                    }
                }

                // 测试文件重定向
                async function testFileRedirect() {
                    log('测试文件重定向功能...');

                    try {
                        const testUuid = '00000000-0000-0000-0000-000000000001';
                        const redirectResponse = await fetch(\`/api/get/file/\${testUuid}\`, {
                            method: 'HEAD',
                            redirect: 'manual'
                        });

                        if (redirectResponse.status === 302 || redirectResponse.status === 404) {
                            updateStatus('redirect-status', '✅ 重定向API正常', 'success');
                            log('文件重定向API工作正常', 'success');
                            testResults.fileRedirect = true;
                        } else {
                            updateStatus('redirect-status', '❌ 文件重定向失败', 'error');
                            log(\`重定向失败，状态码: \${redirectResponse.status}\`, 'error');
                            testResults.fileRedirect = false;
                        }
                    } catch (error) {
                        updateStatus('redirect-status', '❌ 重定向请求失败', 'error');
                        log('重定向请求失败: ' + error.message, 'error');
                        testResults.fileRedirect = false;
                    }
                }

                // 测试缓存功能
                async function testCaching() {
                    log('测试缓存功能...');

                    if (!testResults.serviceWorker) {
                        updateStatus('cache-status', '❌ Service Worker 未激活', 'error');
                        log('Service Worker 未激活，无法测试缓存', 'error');
                        return;
                    }

                    try {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'list_cache'
                        });

                        navigator.serviceWorker.controller.postMessage({
                            type: 'get_cache_stats'
                        });

                        log('已发送缓存测试请求，等待响应...', 'info');
                        updateStatus('cache-status', '⏳ 等待缓存响应...', 'info');

                        setTimeout(() => {
                            if (!testResults.cacheResponse) {
                                updateStatus('cache-status', '⚠️ 缓存响应超时', 'error');
                                log('缓存功能测试超时', 'error');
                            }
                        }, 5000);

                    } catch (error) {
                        updateStatus('cache-status', '❌ 缓存测试失败', 'error');
                        log('缓存测试失败: ' + error.message, 'error');
                    }
                }

                // 处理 Service Worker 消息
                function handleServiceWorkerMessage(event) {
                    const { type, payload, stats } = event.data;

                    switch (type) {
                        case 'cache_list':
                            log(\`收到缓存列表: \${payload ? payload.length : 0} 项\`, 'success');
                            if (payload && payload.length > 0) {
                                updateStatus('cache-status', \`✅ 缓存功能正常 (\${payload.length} 项)\`, 'success');
                            } else {
                                updateStatus('cache-status', '✅ 缓存功能正常 (空缓存)', 'success');
                            }
                            testResults.cacheResponse = true;

                            // 如果当前在缓存标签页，显示缓存数据
                            if (document.getElementById('cache-tab').classList.contains('active')) {
                                displayCacheData(payload);
                            }
                            break;

                        case 'cache_stats':
                            log('收到缓存统计信息', 'success');
                            if (document.getElementById('cache-tab').classList.contains('active')) {
                                displayCacheStats(stats);
                            }
                            break;

                        case 'cache_cleared':
                            log('缓存已清理', 'success');
                            showMessage('缓存清理完成', 'success');
                            if (document.getElementById('cache-tab').classList.contains('active')) {
                                loadCacheData();
                            }
                            break;

                        case 'cache_error':
                            log('缓存操作错误: ' + event.data.error, 'error');
                            break;
                    }
                }

                // ============ 缓存管理功能 ============

                // 显示消息
                function showMessage(text, type = 'info') {
                    const messageEl = document.getElementById('cache-message');
                    messageEl.textContent = text;
                    messageEl.className = \`message \${type}\`;
                    messageEl.style.display = 'block';

                    setTimeout(() => {
                        messageEl.style.display = 'none';
                    }, 5000);
                }

                // 格式化文件大小
                function formatSize(bytes) {
                    if (bytes === -1) return '未知';
                    if (bytes === 0) return '0 B';
                    const k = 1024;
                    const sizes = ['B', 'KB', 'MB', 'GB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                }

                // 格式化数字
                function formatNumber(num) {
                    return num.toLocaleString();
                }

                // 获取文件名
                function getFileName(url) {
                    try {
                        const urlObj = new URL(url);
                        const pathSegments = urlObj.pathname.split('/');
                        return pathSegments[pathSegments.length - 1] || urlObj.hostname;
                    } catch {
                        return url;
                    }
                }

                // 检查 Service Worker 状态（缓存管理用）
                async function checkServiceWorkerStatus() {
                    if (!('serviceWorker' in navigator)) {
                        document.getElementById('cache-sw-status').textContent = '不支持';
                        return false;
                    }

                    try {
                        swRegistration = await navigator.serviceWorker.getRegistration();
                        if (swRegistration && swRegistration.active) {
                            document.getElementById('cache-sw-status').textContent = '运行中';
                            return true;
                        } else {
                            document.getElementById('cache-sw-status').textContent = '未激活';
                            return false;
                        }
                    } catch (error) {
                        document.getElementById('cache-sw-status').textContent = '错误';
                        return false;
                    }
                }

                // 加载缓存数据
                async function loadCacheData() {
                    document.getElementById('cache-loading').style.display = 'block';
                    document.getElementById('cache-content').style.display = 'none';

                    const swActive = await checkServiceWorkerStatus();

                    if (!swActive) {
                        document.getElementById('cache-loading').style.display = 'none';
                        showMessage('Service Worker 未激活，请刷新页面重试', 'error');
                        return;
                    }

                    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

                    navigator.serviceWorker.controller.postMessage({
                        type: 'list_cache'
                    });

                    navigator.serviceWorker.controller.postMessage({
                        type: 'get_cache_stats'
                    });
                }

                // 显示缓存统计
                function displayCacheStats(stats) {
                    let totalSize = 0;
                    let totalFiles = 0;
                    let hostCount = 0;

                    if (stats && stats.length > 0) {
                        stats.forEach(cacheStat => {
                            totalSize += cacheStat.totalSize;
                            totalFiles += cacheStat.fileCount;
                            hostCount += Object.keys(cacheStat.hostStats).length;
                        });
                    }

                    document.getElementById('total-size').textContent = (totalSize / (1024 * 1024)).toFixed(1);
                    document.getElementById('total-files').textContent = formatNumber(totalFiles);
                    document.getElementById('host-count').textContent = formatNumber(hostCount);
                }

                // 显示缓存数据
                function displayCacheData(cacheItems) {
                    cacheData = cacheItems;

                    document.getElementById('cache-loading').style.display = 'none';
                    document.getElementById('cache-content').style.display = 'block';

                    if (!cacheItems || cacheItems.length === 0) {
                        document.getElementById('cache-content').innerHTML =
                            '<div class="loading">📭 没有缓存内容</div>';
                        return;
                    }

                    // 按主机分组
                    const groupedByHost = {};
                    cacheItems.forEach(item => {
                        if (!groupedByHost[item.host]) {
                            groupedByHost[item.host] = [];
                        }
                        groupedByHost[item.host].push(item);
                    });

                    let html = '';
                    Object.keys(groupedByHost).forEach(host => {
                        const items = groupedByHost[host];
                        const totalSize = items.reduce((sum, item) => {
                            return sum + (item.size > 0 ? item.size : 0);
                        }, 0);
                        const unknownCount = items.filter(item => item.size === -1).length;

                        let sizeText = formatSize(totalSize);
                        if (unknownCount > 0) {
                            sizeText += \` (\${unknownCount} 未知)\`;
                        }

                        html += \`
                            <div class="host-group">
                                <div class="host-header" onclick="toggleHost('\${host}')">
                                    <div class="host-name">🌐 \${host}</div>
                                    <div class="host-stats">\${items.length} 文件 • \${sizeText}</div>
                                </div>
                                <div class="host-content" id="host-\${host.replace(/[^a-zA-Z0-9]/g, '')}">
                        \`;

                        items.forEach(item => {
                            html += \`
                                <div class="cache-item">
                                    <div class="file-info">
                                        <div class="file-name">\${getFileName(item.url)}</div>
                                        <div class="file-meta">
                                            <span class="file-type \${item.type}">\${item.type}</span>
                                            <span>\${formatSize(item.size)}</span>
                                            <span>\${new URL(item.url).pathname}</span>
                                        </div>
                                    </div>
                                    <button class="delete-btn" onclick="deleteCacheItem('\${item.url}')">
                                        🗑️ 删除
                                    </button>
                                </div>
                            \`;
                        });

                        html += \`
                                </div>
                            </div>
                        \`;
                    });

                    document.getElementById('cache-content').innerHTML = html;
                }

                // 切换主机展开状态
                function toggleHost(host) {
                    const hostId = 'host-' + host.replace(/[^a-zA-Z0-9]/g, '');
                    const element = document.getElementById(hostId);
                    element.classList.toggle('expanded');
                }

                // 删除缓存项
                function deleteCacheItem(url) {
                    if (confirm('确定要删除这个缓存项吗？')) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'delete_cache_item',
                            url: url
                        });
                    }
                }

                // 清空所有缓存
                function clearAllCache() {
                    if (confirm('确定要清空所有缓存吗？这将删除所有离线内容。')) {
                        navigator.serviceWorker.controller.postMessage({
                            type: 'clear_cache'
                        });
                    }
                }

                // 检查更新
                async function checkForUpdates() {
                    if (swRegistration) {
                        try {
                            await swRegistration.update();
                            showMessage('已检查更新', 'success');
                        } catch (error) {
                            showMessage('检查更新失败: ' + error.message, 'error');
                        }
                    }
                }
            `}
        >
            <div class="test-tools-container">
                <div class="header">
                    <h1>🛠️ 测试工具</h1>
                    <p>VOCArchive 系统测试和诊断工具</p>
                </div>

                {/* 标签页导航 */}
                <div class="tabs-nav">
                    <button class="tab-button active" data-tab="sw-test-tab">
                        🔧 Service Worker 测试
                    </button>
                    <button class="tab-button" data-tab="cache-tab">
                        🗄️ 缓存管理
                    </button>
                </div>

                {/* Service Worker 测试标签页 */}
                <div id="sw-test-tab" class="tab-content active">
                    <div class="sw-test-container">
                        {/* 全局操作 */}
                        <div class="global-actions">
                            <div class="control-group">
                                <button onclick="runAllTests()" class="btn btn-success">
                                    🔄 运行所有测试
                                </button>
                                <button onclick="resetAllTests()" class="btn btn-secondary">
                                    🗑️ 重置状态
                                </button>
                                <button onclick="exportLog()" class="btn btn-info">
                                    📄 导出日志
                                </button>
                            </div>
                        </div>

                        {/* 测试项目 */}
                        <div class="test-section">
                            <h2>1. Service Worker 状态检查</h2>
                            <div id="sw-status" class="status info">检查中...</div>
                            <button onclick="checkServiceWorker()">重新检查</button>
                        </div>

                        <div class="test-section">
                            <h2>2. 配置端点测试</h2>
                            <div id="config-status" class="status info">未测试</div>
                            <button onclick="testConfigEndpoint()">测试配置端点</button>
                            <div class="test-url">/api/sw_config.js</div>
                        </div>

                        <div class="test-section">
                            <h2>3. 外部存储主机检测</h2>
                            <div id="external-hosts" class="status info">未检测</div>
                            <div id="hosts-list"></div>
                            <button onclick="checkExternalHosts()">检测外部主机</button>
                        </div>

                        <div class="test-section">
                            <h2>4. 文件重定向测试</h2>
                            <div id="redirect-status" class="status info">未测试</div>
                            <button onclick="testFileRedirect()">测试文件重定向</button>
                            <div class="test-url">/api/get/file/{uuid}</div>
                        </div>

                        <div class="test-section">
                            <h2>5. 缓存功能测试</h2>
                            <div id="cache-status" class="status info">未测试</div>
                            <button onclick="testCaching()">测试缓存功能</button>
                        </div>

                        {/* 实时日志 */}
                        <div class="test-section">
                            <h2>6. 实时日志</h2>
                            <div style="margin-bottom: 10px;">
                                <button onclick="clearLog()" class="btn btn-secondary small">
                                    🗑️ 清空日志
                                </button>
                                <button onclick="exportLog()" class="btn btn-info small">
                                    📄 导出日志
                                </button>
                            </div>
                            <div id="log" class="log">等待日志输出...
</div>
                        </div>
                    </div>
                </div>

                {/* 缓存管理标签页 */}
                <div id="cache-tab" class="tab-content">
                    <div class="cache-container">
                        <div id="cache-message" class="message" style="display: none;"></div>

                        {/* 统计信息 */}
                        <div class="stats-grid">
                            <div class="stat-card">
                                <h3>缓存总大小</h3>
                                <div class="value" id="total-size">-</div>
                                <div class="unit">MB</div>
                            </div>
                            <div class="stat-card">
                                <h3>文件总数</h3>
                                <div class="value" id="total-files">-</div>
                                <div class="unit">个文件</div>
                            </div>
                            <div class="stat-card">
                                <h3>存储源数量</h3>
                                <div class="value" id="host-count">-</div>
                                <div class="unit">个域名</div>
                            </div>
                            <div class="stat-card">
                                <h3>缓存状态</h3>
                                <div class="value" id="cache-sw-status" style="font-size: 1.5em;">-</div>
                                <div class="unit">Service Worker</div>
                            </div>
                        </div>

                        {/* 操作按钮 */}
                        <div class="actions">
                            <button onclick="loadCacheData()" class="btn btn-primary">
                                🔄 刷新数据
                            </button>
                            <button onclick="clearAllCache()" class="btn btn-danger">
                                🗑️ 清空所有缓存
                            </button>
                            <button onclick="checkForUpdates()" class="btn btn-success">
                                ⬇️ 检查更新
                            </button>
                        </div>

                        {/* 缓存内容 */}
                        <div class="cache-section">
                            <h2>📦 缓存内容</h2>
                            <div id="cache-loading" class="loading">
                                <div class="spinner"></div>
                                正在加载缓存数据...
                            </div>
                            <div id="cache-content" style="display: none;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </BaseLayout>
    )
}