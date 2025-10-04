document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const authCodeInput = document.getElementById('auth-code');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const tabs = document.getElementById('tabs');
    const content = document.getElementById('content');
    const modal = document.getElementById('form-modal');
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('form-title');
    const formError = document.getElementById('form-error');
    const closeModalButton = document.querySelector('.close-button');

    // --- State ---
    const API_BASE_URL = '/api';
    let jwtToken = localStorage.getItem('jwtToken');
    let currentTab = 'work';
    let currentEditUUID = null; // To track the item being edited
    let allCreators = [];
    let allWorks = [];
    let allExternalSources = [];
    let allExternalObjects = [];
    
    // Admin title configuration
    let adminTitleTemplate = 'VOCArchive - 管理后台';
    const tabNames = {
        'work': '作品',
        'creator': '作者',
        'media': '媒体',
        'asset': '资产',
        'relation': '关系',
        'tag': '标签',
        'category': '分类',
        'external_source': '存储源',
        'external_object': '外部对象',
        'footer': '页脚',
        'site_config': '系统配置'
    };

    // Initialize theme
    initializeTheme();

    // Load initial page title configuration
    loadInitialPageTitle();

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
        if (themeIcon) {
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

    // Load initial page title configuration
    async function loadInitialPageTitle() {
        try {
            const config = await apiFetch('/config/public');
            if (config.admin_title) {
                adminTitleTemplate = config.admin_title;
                // Set initial title for the current tab (default is 'work')
                updatePageTitle(currentTab);
            }
        } catch (e) {
            console.warn('Failed to load initial title config:', e);
        }
    }

    // --- API & Helper Functions ---
    function showLogin() {
        loginContainer.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        localStorage.removeItem('jwtToken');
        jwtToken = null;
    }

    async function showAdminPanel() {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        const activeTab = document.querySelector('.tab-button.active');
        currentTab = activeTab ? activeTab.dataset.target : 'work';
        
        // Load external sources and objects for reference in other tables
        await loadExternalSources();
        await loadExternalObjects();
        
        // 获取配置的标题模板
        try {
            const config = await apiFetch('/config/public');
            if (config.admin_title) {
                adminTitleTemplate = config.admin_title;
            }
        } catch (e) {
            console.warn('Failed to load title config:', e);
        }

        // 加载配置后更新页面标题
        updatePageTitle(currentTab);

        loadContent(currentTab);
    }

    async function loadExternalSources() {
        try {
            allExternalSources = await apiFetch('/list/external_sources');
        } catch (error) {
            console.error('Failed to load external sources:', error);
            allExternalSources = [];
        }
    }

    async function loadExternalObjects() {
        try {
            allExternalObjects = await apiFetch('/list/external_objects');
        } catch (error) {
            console.error('Failed to load external objects:', error);
            allExternalObjects = [];
        }
    }

    // 更新页面标题函数
    function updatePageTitle(tabId) {
        let title = adminTitleTemplate;
        const tabName = tabNames[tabId] || tabId;

        title = title.replace(/{TAB_NAME}/g, tabName);
        title = title.replace(/{TAB_ID}/g, tabId);

        // 更新文档标题
        document.title = title;

        // 更新HTML title元素
        const titleElement = document.getElementById('pageTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }

        // 更新页面内的h1标题
        const headerTitle = document.getElementById('pageHeader');
        if (headerTitle) {
            headerTitle.textContent = title.replace(/^VOCArchive[^-]*-\s*/, '');
        }
    }

    async function apiFetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (jwtToken) {
            headers['Authorization'] = `Bearer ${jwtToken}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        if (response.status === 401) {
            showLogin();
            throw new Error('Unauthorized');
        }
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'API request failed');
        }
        if (response.status === 204 || response.headers.get('content-length') === '0' || (response.status === 200 && !response.headers.get('content-type')?.includes('application/json'))) {
            return null;
        }
        return response.json();
    }

    // --- Event Listeners ---
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';
        try {
            const response = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ code: authCodeInput.value }),
            });
            if (response.token) {   
                jwtToken = response.token;
                localStorage.setItem('jwtToken', jwtToken);
                showAdminPanel();
            } else {
                throw new Error('Login failed: No token received.');
            }
        } catch (error) {
            loginError.textContent = `登录失败: ${error.message}`;
        }
    });

    logoutButton.addEventListener('click', showLogin);

    // Theme toggle event listener
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    tabs.addEventListener('click', (e) => {
        if (e.target.classList.contains('tab-button')) {
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.target;
            loadContent(currentTab);
        }
    });

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

    closeModalButton.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
    
    modalForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row-button')) {
            e.target.closest('.dynamic-list-item').remove();
        }
        if (e.target.id === 'add-title-button') {
            addDynamicListItem('titles-list', createTitleRow());
        }
        if (e.target.id === 'add-creator-button') {
            addDynamicListItem('creator-list', createCreatorRow(undefined, allCreators));
        }
        if (e.target.id === 'add-wiki-button') {
            addDynamicListItem('wikis-list', createWikiRow());
        }
        if (e.target.id === 'add-asset-creator-button') {
            addDynamicListItem('asset-creator-list', createAssetCreatorRow());
        }
    });

    modalForm.addEventListener('change', (e) => {
        if (e.target.classList.contains('quick-select')) {
            const selectedValue = e.target.value;
            const targetInputId = e.target.dataset.targetInput;
            const targetInput = document.getElementById(targetInputId);
            if (targetInput && selectedValue) {
                targetInput.value = selectedValue;
            }
        }
    });

    // --- Content & Table Rendering ---
    async function loadContent(target) {
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
                console.log("Get Config:",data)
            } else {
                endpoint = `/list/${target}/1?pageSize=999`;
                data = await apiFetch(endpoint);
            }
            renderTable(target, data);
        } catch (error) {
            content.innerHTML = `<p class="error-message">Failed to load ${target}: ${error.message}</p>`;
        }
    }

    function renderCellContent(data) {
        if (data === null || data === undefined) {
            return '<span class="null-value">NULL</span>';
        }
        if (typeof data === 'boolean') {
            return data ? '<span class="bool-true">Yes</span>' : '<span class="bool-false">No</span>';
        }
        if (typeof data === 'string') {
            // Truncate long strings like UUIDs
            if (data.length > 30 && data.includes('-')) {
                 return `<span class="string-value uuid" title="${data}">${data.substring(0, 8)}...</span>`;
            }
            // Check if it's a URL
            if (data.startsWith('http')) {
                return `<a href="${data}" target="_blank" class="external-link">Link</a>`;
            }
            return `<span class="string-value">${data}</span>`;
        }
        if (typeof data === 'number') {
            return `<span class="number-value">${data}</span>`;
        }
        if (Array.isArray(data) || typeof data === 'object') {
            // For complex objects/arrays, show a summary or a button to view details
            const summary = JSON.stringify(data, null, 2);
            if (summary.length > 100) {
                return `<pre>${summary.substring(0, 100)}...</pre>`;
            }
            return `<pre>${summary}</pre>`;
        }
        return data.toString();
    }

    function renderTable(target, data) {
        if (target === 'work') {
            renderWorksGrid(target, data);
            return;
        }
        
        if (target === 'creator') {
            renderCreatorTable(data);
            return;
        }
        
        if (target === 'tag') {
            renderTagsTable(data);
            return;
        }
        
        if (target === 'category') {
            renderCategoriesTable(data);
            return;
        }
        
        if (target === 'external_source') {
            renderExternalSourcesTable(data);
            return;
        }
        
        if (target === 'external_object') {
            renderExternalObjectsTable(data);
            return;
        }
        
        if (target === 'asset') {
            renderAssetTable(data);
            return;
        }
        
        if (target === 'media') {
            renderMediaSourceTable(data);
            return;
        }
        
        const headers = data && data.length > 0 ? Object.keys(data[0]) : [];
        const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
        content.innerHTML = `
            <div class="controls">
                <h2>${capTarget}</h2>
                <button class="create-button" data-target="${target}">Create New ${capTarget}</button>
            </div>
            ${!data || data.length === 0 ? `<p>No ${target} found.</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            ${headers.map(h => `<th>${h}</th>`).join('')}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => {
                            const uuid = row.uuid || row.work_uuid || row.creator_uuid || row.media_uuid || row.asset_uuid || row.relation_uuid || row.key;
                            return `<tr data-uuid="${uuid}">
                                ${headers.map(h => `<td>${renderCellContent(row[h])}</td>`).join('')}
                                <td class="actions">
                                    <button class="edit-button" data-target="${target}" data-uuid="${uuid}">Edit</button>
                                    <button class="delete-button" data-target="${target}">Delete</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderTagsTable(data) {
        content.innerHTML = `
            <div class="controls">
                <h2>标签 (Tags)</h2>
                <button class="create-button" data-target="tag">创建新标签</button>
            </div>
            ${!data || data.length === 0 ? `<p>暂无标签。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(tag => `
                            <tr data-uuid="${tag.uuid}">
                                <td><span class="uuid" title="${tag.uuid}">${tag.uuid.substring(0, 8)}...</span></td>
                                <td class="tag-name">${tag.name}</td>
                                <td>
                                    <button class="edit-button" data-uuid="${tag.uuid}" data-target="tag">编辑</button>
                                    <button class="delete-button" data-uuid="${tag.uuid}" data-target="tag">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderCategoriesTable(data) {
        console.log('Rendering categories:', data); // Debug log
        
        if (!data) {
            content.innerHTML = `
                <div class="controls">
                    <h2>分类 (Categories)</h2>
                    <button class="create-button" data-target="category">创建新分类</button>
                </div>
                <p class="error-message">无法加载分类数据。</p>
            `;
            return;
        }
        
        content.innerHTML = `
            <div class="controls">
                <h2>分类 (Categories)</h2>
                <button class="create-button" data-target="category">创建新分类</button>
            </div>
            ${data.length === 0 ? `<p>暂无分类。</p>` : `
            <div class="category-tree">
                ${renderCategoryTree(data)}
            </div>`}
        `;
    }

    function renderCategoryTree(categories, level = 0) {
        return categories.map(category => {
            const hasChildren = category.children && category.children.length > 0;
            return `
                <div class="category-node indent-level-${Math.min(level, 10)}" data-uuid="${category.uuid}">
                    <div class="category-item">
                        <span class="category-name">${category.name}</span>
                        <span class="uuid" title="${category.uuid}">${category.uuid.substring(0, 8)}...</span>
                        <div class="category-actions">
                            <button class="edit-button" data-uuid="${category.uuid}" data-target="category">编辑</button>
                            <button class="delete-button" data-uuid="${category.uuid}" data-target="category">删除</button>
                        </div>
                    </div>
                    ${hasChildren ? renderCategoryTree(category.children, level + 1) : ''}
                </div>
            `;
        }).join('');
    }

    function renderCreatorTable(data) {
        content.innerHTML = `
            <div class="controls">
                <h2>作者 (Creators)</h2>
                <button class="create-button" data-target="creator">创建新作者</button>
            </div>
            ${!data || data.length === 0 ? `<p>暂无作者。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>类型</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(creator => {
                            // Handle empty or null names with a placeholder
                            const displayName = creator.name
                                ? creator.name 
                                : '<span class="null-value">NULL</span>';
                            
                            return `
                            <tr data-uuid="${creator.uuid}">
                                <td><span class="uuid" title="${creator.uuid}">${creator.uuid.substring(0, 8)}...</span></td>
                                <td class="creator-name">${displayName}</td>
                                <td class="creator-type">${creator.type}</td>
                                <td>
                                    <button class="edit-button" data-uuid="${creator.uuid}" data-target="creator">编辑</button>
                                    <button class="delete-button" data-uuid="${creator.uuid}" data-target="creator">删除</button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderExternalSourcesTable(data) {
        if (!data) {
            content.innerHTML = `<p class="error-message">无法加载存储源数据。</p>`;
            return;
        }
        
        content.innerHTML = `
            <div class="controls">
                <h2>存储源 (External Sources)</h2>
                <button class="create-button" data-target="external_source">创建新存储源</button>
            </div>
            ${data.length === 0 ? `<p>暂无存储源。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>类型</th>
                            <th>端点</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(source => `
                            <tr data-uuid="${source.uuid}">
                                <td><span class="uuid" title="${source.uuid}">${source.uuid.substring(0, 8)}...</span></td>
                                <td class="source-name">${source.name}</td>
                                <td><span class="storage-type-badge ${source.type}">${source.type === 'raw_url' ? '直接 URL' : 'IPFS'}</span></td>
                                <td class="endpoint-template">${source.endpoint}</td>
                                <td>
                                    <button class="edit-button" data-uuid="${source.uuid}" data-target="external_source">编辑</button>
                                    <button class="delete-button" data-uuid="${source.uuid}" data-target="external_source">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderExternalObjectsTable(data) {
        if (!data) {
            content.innerHTML = `<p class="error-message">无法加载外部对象数据。</p>`;
            return;
        }
        
        content.innerHTML = `
            <div class="controls">
                <h2>外部对象 (External Objects)</h2>
                <button class="create-button" data-target="external_object">创建新外部对象</button>
            </div>
            ${data.length === 0 ? `<p>暂无外部对象。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>存储源</th>
                            <th>MIME 类型</th>
                            <th>文件 ID</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(obj => `
                            <tr data-uuid="${obj.uuid}">
                                <td><span class="uuid" title="${obj.uuid}">${obj.uuid.substring(0, 8)}...</span></td>
                                <td>
                                    <span class="external-source-ref" title="${obj.source?.uuid || obj.external_source_uuid}">
                                        ${obj.source?.name || allExternalSources.find(s => s.uuid === obj.external_source_uuid)?.name || obj.external_source_uuid.substring(0, 8) + '...'}
                                    </span>
                                </td>
                                <td class="mime-type">${obj.mime_type}</td>
                                <td class="file-id">${obj.file_id}</td>
                                <td>
                                    <button class="edit-button" data-uuid="${obj.uuid}" data-target="external_object">编辑</button>
                                    <button class="delete-button" data-uuid="${obj.uuid}" data-target="external_object">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderAssetTable(data) {
        content.innerHTML = `
            <div class="controls">
                <h2>资产 (Assets)</h2>
                <button class="create-button" data-target="asset">创建新资产</button>
            </div>
            ${!data || data.length === 0 ? `<p>暂无资产。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>作品UUID</th>
                            <th>文件名</th>
                            <th>资产类型</th>
                            <th>是否预览图</th>
                            <th>语言</th>
                            <th>创作者</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(asset => {
                            const creators = asset.creator && Array.isArray(asset.creator) ? 
                                asset.creator.map(c => `${c.creator_name || c.name || ''}(${c.role || ''})`).join(', ') : 
                                (asset.creator ? `${asset.creator.creator_name || asset.creator.name || ''}(${asset.creator.role || ''})` : '');
                            
                            return `
                            <tr data-uuid="${asset.uuid}">
                                <td><span class="uuid" title="${asset.uuid}">${asset.uuid.substring(0, 8)}...</span></td>
                                <td>
                                    <span class="uuid" title="${asset.work_uuid || ''}">${asset.work_uuid ? asset.work_uuid.substring(0, 8) + '...' : ''}</span>
                                </td>
                                <td class="file-name">${asset.file_name || ''}</td>
                                <td class="asset-type">${asset.asset_type || ''}</td>
                                <td class="preview-pic">
                                    ${asset.is_previewpic === null || asset.is_previewpic === undefined ? 
                                        '<span class="null-value">NULL</span>' : 
                                        (asset.is_previewpic ? '<span class="bool-true">是</span>' : '<span class="bool-false">否</span>')
                                    }
                                </td>
                                <td class="language">${asset.language || '<span class="null-value">NULL</span>'}</td>
                                <td class="creators">${creators || '<span class="null-value">无</span>'}</td>
                                <td class="actions">
                                    <button class="edit-button" data-uuid="${asset.uuid}" data-target="asset">编辑</button>
                                    <button class="delete-button" data-uuid="${asset.uuid}" data-target="asset">删除</button>
                                </td>
                            </tr>
                        `;
                        }).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderMediaSourceTable(data) {
        content.innerHTML = `
            <div class="controls">
                <h2>媒体源 (Media Sources)</h2>
                <button class="create-button" data-target="media">创建新媒体源</button>
            </div>
            ${!data || data.length === 0 ? `<p>暂无媒体源。</p>` : `
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>作品UUID</th>
                            <th>文件名</th>
                            <th>MIME类型</th>
                            <th>是否音乐</th>
                            <th>信息</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(media => `
                            <tr data-uuid="${media.uuid}">
                                <td><span class="uuid" title="${media.uuid}">${media.uuid.substring(0, 8)}...</span></td>
                                <td>
                                    <span class="uuid" title="${media.work_uuid || ''}">${media.work_uuid ? media.work_uuid.substring(0, 8) + '...' : ''}</span>
                                </td>
                                <td class="file-name">${media.file_name || ''}</td>
                                <td class="mime-type">${media.mime_type || ''}</td>
                                <td class="is-music">
                                    ${media.is_music === null || media.is_music === undefined ? 
                                        '<span class="null-value">NULL</span>' : 
                                        (media.is_music ? '<span class="bool-true">是</span>' : '<span class="bool-false">否</span>')
                                    }
                                </td>
                                <td class="info">${media.info || ''}</td>
                                <td class="actions">
                                    <button class="edit-button" data-uuid="${media.uuid}" data-target="media">编辑</button>
                                    <button class="delete-button" data-uuid="${media.uuid}" data-target="media">删除</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`}
        `;
    }

    function renderWorksGrid(target, data) {
        const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
        content.innerHTML = `
            <div class="controls">
                <h2>${capTarget}</h2>
                <button class="create-button" data-target="${target}">Create New ${capTarget}</button>
            </div>
            ${!data || data.length === 0 ? `<p>No ${target} found.</p>` : `
            <div id="work-grid">
                ${data.map(work => {
                    const title = work.titles.find(t => t.is_official)?.title || work.titles[0]?.title || 'Untitled';
                    const imageUrl = work.preview_asset ? `/api/get/file/${work.preview_asset.uuid}` : 'https://via.placeholder.com/300x200.png?text=No+Image';
                    return `
                    <div class="work-card" data-uuid="${work.work_uuid}">
                        <div class="work-card-image">
                            <img src="${imageUrl}" alt="${title}" loading="lazy">
                        </div>
                        <div class="work-card-content">
                            <h3 class="work-card-title">${title}</h3>
                            <p class="work-card-uuid uuid">${work.work_uuid}</p>
                        </div>
                        <div class="work-card-actions">
                            <button class="edit-button" data-target="work" data-uuid="${work.work_uuid}">Edit</button>
                            <button class="delete-button" data-target="work">Delete</button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>`}
        `;
    }

    // --- Edit & Delete Logic ---
    async function handleEdit(e) {
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
                console.log(data)
                showFormModal(target, data);
            } catch (error) {
                alert(`Failed to fetch item details: ${error.message}`);
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
            console.log(data)
            showFormModal(target, data);
        } catch (error) {
            alert(`Failed to fetch item details: ${error.message}`);
        }
    }

    async function handleDelete(e) {
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

    // --- Form & Create/Update Logic ---
    async function showFormModal(target, data = null) {
        // Set currentEditUUID based on target type and data structure
        if (data) {
            switch (target) {
                case 'work':
                    currentEditUUID = data.work?.uuid;
                    break;
                case 'creator':
                case 'asset':
                case 'media':
                case 'relation':
                case 'tag':
                case 'category':
                case 'external_source':
                case 'external_object':
                case 'footer':
                    currentEditUUID = data.uuid;
                    break;
                case 'site_config':
                    currentEditUUID = data.key;
                    break;
                default:
                    currentEditUUID = data.uuid;
                    break;
            }
        } else {
            currentEditUUID = null;
        }
        
        const mode = data ? 'Edit' : 'Create New';
        formTitle.textContent = `${mode} ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        formError.textContent = '';

        // Pre-fetch data needed for selectors
        const options = {};
        try {
            if (['work', 'asset'].includes(target)) {
                allCreators = await apiFetch(`/list/creator/1?pageSize=999`);
            }
            if (['media', 'asset', 'relation'].includes(target)) {
                allWorks = await apiFetch(`/list/work/1?pageSize=999`);
            }
            if (target === 'category') {
                options.categories = await apiFetch(`/list/categories`);
            }
            if (target === 'work') {
                // Load tags and categories for work editing
                options.tags = await apiFetch(`/list/tags`);
                options.categories = await apiFetch(`/list/categories`);
            }
        } catch (error) {
            formError.textContent = `Failed to load selection data: ${error.message}`;
            // Decide if we should stop or continue with empty selectors
        }
        
        modalForm.innerHTML = generateFormFields(target, data, { creators: allCreators, works: allWorks, categories: options.categories, tags: options.tags });
        modalForm.onsubmit = (e) => handleFormSubmit(e, target, !!data);
        modal.classList.remove('hidden');

        // Initialize external objects list for asset and media forms
        if (target === 'asset' || target === 'media') {
            // Wait for DOM to be updated, then initialize external objects list
            setTimeout(() => {
                const container = document.getElementById('external-objects-container');
                if (container) {
                    renderExternalObjectsList(allExternalObjects, container, data?.external_objects || []);
                }
                
                // Initialize MD3 enhancement for the external object filter field
                const filterField = document.querySelector('.external-object-filter-field');
                if (filterField) {
                    enhanceExternalObjectFilter(filterField);
                }
            }, 100);
        }

        // Logic to toggle license field visibility for 'work'
        if (target === 'work') {
            const copyrightBasisSelect = document.getElementById('copyright_basis');
            const licenseContainer = document.getElementById('license-container');

            const toggleLicenseField = () => {
                if (copyrightBasisSelect.value === 'license') {
                    licenseContainer.classList.remove('hidden');
                } else {
                    licenseContainer.classList.add('hidden');
                }
            };

            // Set initial state when the form loads
            toggleLicenseField();

            // Add event listener for changes
            copyrightBasisSelect.addEventListener('change', toggleLicenseField);
        }
    }

    function generateFormFields(target, data = null, options = {}) {
        console.log("Generate Form Fields", data)
        const data_wikis = (data?.wikis || []).map(createWikiRow).join('');
        const data_creators = (data?.creator && Array.isArray(data.creator))
                        ? data.creator.map(creator => createCreatorRow(creator, options.creators)).join('')
                        : (data?.creator ? createCreatorRow(data.creator, options.creators) : '');
        const data_relations = ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'].map(type => `<option value="${type}" ${data?.relation_type === type ? 'selected' : ''}>${type}</option>`).join('');
        const data_titles = (data?.titles || []).map(createTitleRow).join('')
        
        const fields = {
            creator: `
                <input type="hidden" name="creator_uuid" value="${data?.creator?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.creator?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="name">Name:</label><input type="text" id="name" name="name" required value="${data?.creator?.name || ''}">
                ${createMD3Select('type', 'type', 'Type', [
                    { value: 'human', text: 'Human' },
                    { value: 'virtual', text: 'Virtual' }
                ], data?.type, false)}
                
                <div class="form-section">
                    <h4>Wikis</h4>
                    <div id="wikis-list" class="dynamic-list">
                        ${data_wikis}
                    </div>
                    <button type="button" id="add-wiki-button" class="add-row-button">Add Wiki</button>
                </div>
            `,
            media: `
                <input type="hidden" name="media_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="work_uuid">Work UUID:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="work_uuid" name="work_uuid" required value="${data?.work_uuid || ''}" class="uuid">
                    ${createQuickSelect('work-quick-select', 'work-quick-select-name', options.works, 'work_uuid', 'titles', data?.work_uuid, 'work_uuid')}
                </div>
                ${createMD3Select('is_music', 'is_music', 'Is Music', [
                    { value: 'true', text: 'Yes' },
                    { value: 'false', text: 'No' }
                ], data?.is_music ? 'true' : 'false', false)}
                <label for="file_name">File Name:</label><input type="text" id="file_name" name="file_name" required value="${data?.file_name || ''}">
                <!-- URL removed - using external objects for file management -->
                <label for="mime_type">MIME Type:</label><input type="text" id="mime_type" name="mime_type" required value="${data?.mime_type || ''}">
                <label for="info">Info:</label><input type="text" id="info" name="info" required value="${data?.info || ''}">
                
                <div class="form-section">
                    <h4>外部对象 (External Objects)</h4>
                    <div id="external-objects-selector" class="external-objects-selector">
                        ${createExternalObjectsSelector(allExternalSources, data?.external_objects)}
                    </div>
                </div>
            `,
            asset: `
                <input type="hidden" name="asset_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <!-- File ID removed - using external objects for file management -->
                <label for="work_uuid">Work UUID:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="work_uuid_asset" name="work_uuid" required value="${data?.work_uuid || ''}" class="uuid">
                    ${createQuickSelect('work-quick-select-asset', 'work-quick-select-asset-name', options.works, 'work_uuid', 'titles', data?.work_uuid, 'work_uuid_asset')}
                </div>
                ${createMD3Select('asset_type', 'asset_type', 'Asset Type', [
                    { value: 'lyrics', text: 'Lyrics' },
                    { value: 'picture', text: 'Picture' }
                ], data?.asset_type, false)}
                <label for="file_name">File Name:</label><input type="text" id="file_name" name="file_name" required value="${data?.file_name || ''}">
                ${createMD3Select('is_previewpic', 'is_previewpic', 'Is Preview Pic', [
                    { value: 'false', text: 'No' },
                    { value: 'true', text: 'Yes' }
                ], data?.is_previewpic ? 'true' : 'false', false)}
                <label for="language">Language:</label><input type="text" id="language" name="language" value="${data?.language || ''}">
                
                <div class="form-section">
                    <h4>外部对象 (External Objects)</h4>
                    <div id="external-objects-selector" class="external-objects-selector">
                        ${createExternalObjectsSelector(allExternalSources, data?.external_objects)}
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>创作者 (Creators)</h4>
                    <div id="asset-creator-list" class="dynamic-list">
                        ${data_creators}
                    </div>
                    <button type="button" id="add-asset-creator-button" class="add-row-button">Add Creator</button>
                </div>
            `,
            relation: `
                <input type="hidden" name="relation_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="from_work_uuid">From Work UUID:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="from_work_uuid" name="from_work_uuid" required value="${data?.from_work_uuid || ''}" class="uuid">
                    ${createQuickSelect('from-work-quick-select', 'from-work-quick-select-name', options.works, 'work_uuid', 'titles', data?.from_work_uuid, 'from_work_uuid')}
                </div>
                <label for="to_work_uuid">To Work UUID:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="to_work_uuid" name="to_work_uuid" required value="${data?.to_work_uuid || ''}" class="uuid">
                    ${createQuickSelect('to-work-quick-select', 'to-work-quick-select-name', options.works, 'work_uuid', 'titles', data?.to_work_uuid, 'to_work_uuid')}
                </div>
                <label for="relation_type">Relation Type:</label>
                <div class="md3-select-field">
                    <select id="relation_type" name="relation_type">
                        ${data_relations}
                    </select>
                    <label class="md3-label">Relation Type</label>
                    <div class="md3-state-layer"></div>
                </div>
            `,
            work: `
                <div class="form-section">
                    <h4>Work Details</h4>
                    <input type="hidden" name="work_uuid" value="${data?.work?.uuid || ''}">
                    <label for="work-uuid">Work UUID:</label>
                    <input type="text" id="work-uuid" name="work_uuid_field" required value="${data?.work?.uuid || crypto.randomUUID()}" readonly class="uuid">
                    <label for="work-copyright-basis">Copyright Basis:</label>
                    ${createMD3Select('copyright_basis', 'copyright_basis', 'Copyright Basis', [
                        { value: 'none', text: '未知/不明' },
                        { value: 'license', text: '按许可证授权' },
                        { value: 'accept', text: '已获授权' },
                        { value: 'onlymetadata', text: '仅元数据 (文件引用自外部源)' },
                        { value: 'arr', text: '版权保留 (如侵权请联系删除)' }
                    ], data?.work?.copyright_basis || 'none', false)}
                    <div id="license-container">
                        <label for="license">License:</label>
                        <input type="text" id="license" name="license" value="${data?.license || ''}">
                    </div>
                </div>

                <div class="form-section">
                    <h4>Titles</h4>
                    <div id="titles-list" class="dynamic-list">
                        ${data_titles}
                    </div>
                    <button type="button" id="add-title-button" class="add-row-button">Add Title</button>
                </div>

                <div class="form-section">
                    <h4>creator</h4>
                    <div id="creator-list" class="dynamic-list">
                        ${data_creators}
                    </div>
                    <button type="button" id="add-creator-button" class="add-row-button">Add Creator</button>
                </div>
                
                <div class="form-section">
                    <h4>Wikis</h4>
                    <div id="wikis-list" class="dynamic-list">
                        ${data_wikis}
                    </div>
                    <button type="button" id="add-wiki-button" class="add-row-button">Add Wiki</button>
                </div>
                
                <div class="form-section">
                    <h4>标签 (Tags)</h4>
                    <div id="tags-selector" class="tag-selector">
                        ${createTagSelector(options.tags, data?.tags)}
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>分类 (Categories)</h4>
                    <div id="categories-selector" class="category-selector">
                        ${createCategorySelector(options.categories, data?.categories)}
                    </div>
                </div>
            `,
            footer: `
                <input type="hidden" name="uuid" value="${data?.uuid || ''}">
                ${createMD3Select('item_type', 'item_type', 'Type', [
                    { value: 'link', text: 'Link' },
                    { value: 'social', text: 'Social' },
                    { value: 'copyright', text: 'Copyright' }
                ], data?.item_type, true)}
                <label for="text">Text:</label>
                <input type="text" id="text" name="text" required value="${data?.text || ''}">
                <label for="url">URL (optional):</label>
                <input type="text" id="url" name="url" value="${data?.url || ''}">
                <label for="icon_class">Icon Class (optional):</label>
                <input type="text" id="icon_class" name="icon_class" value="${data?.icon_class || ''}">
            `,
            tag: `
                <input type="hidden" name="tag_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="name">标签名称:</label><input type="text" id="name" name="name" required value="${data?.name || ''}" placeholder="例如: Rock, Ballad, Duet">
            `,
            category: `
                <input type="hidden" name="category_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="name">分类名称:</label><input type="text" id="name" name="name" required value="${data?.name || ''}" placeholder="例如: 原创歌曲, 摇滚音乐">
                <label for="parent_uuid">父分类 (可选):</label>
                <div class="input-with-quick-select">
                    <input type="text" id="parent_uuid" name="parent_uuid" value="${data?.parent_uuid || ''}" class="uuid" placeholder="留空表示顶级分类">
                    ${options.categories ? createCategoryQuickSelect('parent-category-quick-select', 'parent-category-quick-select-name', options.categories, data?.parent_uuid, 'parent_uuid') : ''}
                </div>
            `,
            external_source: `
                <input type="hidden" name="external_source_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                ${createMD3Select('type', 'type', '存储类型', [
                    { value: 'raw_url', text: '直接 URL' },
                    { value: 'ipfs', text: 'IPFS' }
                ], data?.type, true)}
                <label for="name">存储源名称:</label><input type="text" id="name" name="name" required value="${data?.name || ''}" placeholder="例如: 主要存储, 备份存储">
                <label for="endpoint">访问端点:</label><input type="text" id="endpoint" name="endpoint" required value="${data?.endpoint || ''}" placeholder="例如: https://example.com/{ID} 或 https://ipfs.io/ipfs/{ID}">
                <small>使用 {ID} 标记文件标识符位置</small>
            `,
            external_object: `
                <input type="hidden" name="external_object_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="external_source_uuid">存储源:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="external_source_uuid" name="external_source_uuid" required value="${data?.external_source_uuid || ''}" class="uuid">
                    ${createQuickSelect('source-quick-select', 'source-quick-select-name', allExternalSources, 'uuid', 'name', data?.external_source_uuid, 'external_source_uuid')}
                </div>
                <label for="mime_type">MIME 类型:</label><input type="text" id="mime_type" name="mime_type" required value="${data?.mime_type || ''}" placeholder="例如: image/jpeg, audio/mpeg, video/mp4">
                <label for="file_id">文件 ID:</label><input type="text" id="file_id" name="file_id" required value="${data?.file_id || ''}" placeholder="在存储源中的文件标识符">
            `,
            site_config: `
                <input type="hidden" name="config_key" value="${data?.key || ''}">
                <label for="key">配置键:</label>
                ${createMD3Select('key', 'key', '配置键', [
                    { value: 'site_title', text: '网站标题 (site_title)' },
                    { value: 'home_title', text: '主页标题 (home_title)' },
                    { value: 'player_title', text: '播放器页标题 (player_title)' },
                    { value: 'admin_title', text: '管理后台标题 (admin_title)' },
                    { value: 'tags_categories_title', text: '标签分类页标题 (tags_categories_title)' },
                    { value: 'migration_title', text: '迁移页面标题 (migration_title)' },
                    { value: 'totp_secret', text: 'TOTP 密钥 (totp_secret)' },
                    { value: 'jwt_secret', text: 'JWT 密钥 (jwt_secret)' },
                    { value: 'db_version', text: '数据库版本 (db_version)' },
                ], data?.key, true)}
                ${data ? '<div class="config-notice"><small>配置键不可修改</small></div>' : ''}
                ${data?.key?.includes('title') ? `
                    <div class="placeholder-help">
                        <strong>💡 可用占位符：</strong><br>
                        ${data.key === 'home_title' || data.key === 'site_title' ? 
                            '• {TAG_NAME} - 当前标签名称<br>• {CATEGORY_NAME} - 当前分类名称<br>• {SEARCH_QUERY} - 搜索关键词<br>• {PAGE_NUMBER} - 当前页码<br>• {TOTAL_COUNT} - 总数量<br><strong>条件占位符:</strong> {TAG_NAME? - 标签: {TAG_NAME}} (仅在有值时显示)' : 
                            data.key === 'player_title' ? 
                                '• {WORK_TITLE} - 当前作品标题' : 
                                data.key === 'admin_title' ? 
                                    '• {TAB_NAME} - 当前标签页名称(中文)<br>• {TAB_ID} - 当前标签页ID(英文)' : ''
                        }
                    </div>
                ` : ''}
                <label for="value">配置值:</label>
                <input type="text" id="value" name="value" required value="${data?.value || ''}" placeholder="请输入配置值">
                <label for="description">描述 (可选):</label>
                <input type="text" id="description" name="description" value="${data?.description || ''}" placeholder="配置项的描述信息">
                ${data?.key === 'totp_secret' || data?.key === 'jwt_secret' ? 
                    '<small class="security-warning">⚠️ 敏感配置，请妥善保管</small>' : 
                    '<small>配置修改后立即生效</small>'}
            `
        };
        return (fields[target] || '<p>Form not implemented for this type.</p>') + '<button type="submit">Submit</button>';
    }
    

    // Helper function to create MD3 select field
    function createMD3Select(id, name, labelText, options, selectedValue = '', required = false) {
        const requiredAttr = required ? 'required' : '';
        const optionsHtml = options.map(option => {
            const value = typeof option === 'object' ? option.value : option;
            const text = typeof option === 'object' ? option.text : option;
            const selected = value === selectedValue ? 'selected' : '';
            return `<option value="${value}" ${selected}>${text}</option>`;
        }).join('');
        
        return `
            <div class="md3-select-field">
                <select id="${id}" name="${name}" ${requiredAttr}>
                    ${optionsHtml}
                </select>
            </div>
        `;
    }

    function createQuickSelect(id, name, data, valueField, displayField, selectedValue, targetInputId) {
        if (!data || data.length === 0) return '';
    
        const getDisplayValue = (item) => {
            if (displayField === 'titles') {
                const officialTitle = item.titles.find(t => t.is_official);
                return officialTitle ? officialTitle.title : item.titles[0]?.title || 'Untitled';
            }
            return item[displayField] || 'Unnamed';
        };
    
        const options = data.map(item => {
            const value = item[valueField];
            const display = getDisplayValue(item);
            const isSelected = value === selectedValue ? 'selected' : '';
            return `<option value="${value}" ${isSelected}>${display} (${value.substring(0, 8)}...)</option>`;
        }).join('');
    
        return `
            <div class="quick-select-container">
                <span class="quick-select-hint">快速选择</span>
                <div class="md3-select-field quick-select-field">
                    <select id="${id}" name="${name}" class="quick-select" data-target-input="${targetInputId}">
                        <option value="">--选择项目--</option>
                        ${options}
                    </select>
                    <div class="md3-state-layer"></div>
                </div>
            </div>
        `;
    }

    function createCategoryQuickSelect(id, name, categories, selectedValue, targetInputId) {
        if (!categories || categories.length === 0) return '';

        const flattenCategories = (cats, level = 0) => {
            let result = [];
            cats.forEach(cat => {
                result.push({ ...cat, level });
                if (cat.children && cat.children.length > 0) {
                    result.push(...flattenCategories(cat.children, level + 1));
                }
            });
            return result;
        };

        const flatCategories = flattenCategories(categories);
        const options = flatCategories.map(cat => {
            const prefix = '　'.repeat(cat.level); // 使用全角空格缩进
            const isSelected = cat.uuid === selectedValue ? 'selected' : '';
            return `<option value="${cat.uuid}" ${isSelected}>${prefix}${cat.name} (${cat.uuid.substring(0, 8)}...)</option>`;
        }).join('');

        return `
            <div class="quick-select-container">
                <span class="quick-select-hint">选择父分类</span>
                <div class="md3-select-field quick-select-field">
                    <select id="${id}" name="${name}" class="quick-select" data-target-input="${targetInputId}">
                        <option value="">--选择父分类--</option>
                        ${options}
                    </select>
                    <div class="md3-state-layer"></div>
                </div>
            </div>
        `;
    }

    function createTagSelector(tags = [], selectedTags = []) {
        if (!tags || tags.length === 0) {
            return '<p>暂无可用标签</p>';
        }

        const selectedTagIds = selectedTags.map(tag => tag.uuid || tag.tag_uuid);
        const tagCheckboxes = tags.map(tag => {
            const isChecked = selectedTagIds.includes(tag.uuid) ? 'checked' : '';
            return `
                <label class="tag-checkbox">
                    <input type="checkbox" name="selected_tags" value="${tag.uuid}" ${isChecked}>
                    <span class="tag-chip ${isChecked ? 'selected' : ''}">${tag.name}</span>
                </label>
            `;
        }).join('');

        return `
            <div class="tag-list">
                <input type="text" id="tag-filter" placeholder="搜索标签..." oninput="filterTags(this.value)">
                <div id="tag-checkboxes">
                    ${tagCheckboxes}
                </div>
            </div>
        `;
    }

    function createCategorySelector(categories = [], selectedCategories = []) {
        if (!categories || categories.length === 0) {
            return '<p>暂无可用分类</p>';
        }

        const selectedCategoryIds = selectedCategories.map(cat => cat.uuid || cat.category_uuid);
        
        const flattenCategories = (cats, level = 0) => {
            let result = [];
            cats.forEach(cat => {
                result.push({ ...cat, level });
                if (cat.children && cat.children.length > 0) {
                    result.push(...flattenCategories(cat.children, level + 1));
                }
            });
            return result;
        };

        const flatCategories = flattenCategories(categories);
        const categoryCheckboxes = flatCategories.map(cat => {
            const isChecked = selectedCategoryIds.includes(cat.uuid) ? 'checked' : '';
            const prefix = '　'.repeat(cat.level);
            return `
                <label class="category-checkbox indent-level-${Math.min(cat.level, 10)}">
                    <input type="checkbox" name="selected_categories" value="${cat.uuid}" ${isChecked}>
                    <span class="category-name">${prefix}${cat.name}</span>
                </label>
            `;
        }).join('');

        return `
            <div class="category-list">
                <input type="text" id="category-filter" placeholder="搜索分类..." oninput="filterCategories(this.value)">
                <div id="category-checkboxes" class="category-tree">
                    ${categoryCheckboxes}
                </div>
            </div>
        `;
    }

    function createExternalObjectsSelector(externalSources = [], selectedExternalObjects = []) {
        if (!externalSources || externalSources.length === 0) {
            return '<p>暂无可用存储源</p>';
        }

        return `
            <div class="external-objects-list">
                <div class="external-object-filter-field">
                    <input type="text" id="external-object-filter" oninput="filterExternalObjects(this.value)">
                    <label class="md3-label">搜索外部对象...</label>
                    <div class="md3-state-layer"></div>
                </div>
                <div id="external-object-checkboxes">
                    <div class="external-objects-info">
                        <p>选择关联的外部对象。这些对象将用于在不同存储源中访问此资产的文件。</p>
                        <button type="button" id="refresh-external-objects" class="refresh-button">刷新外部对象列表</button>
                    </div>
                    <div id="external-objects-container">
                        <p>正在加载外部对象...</p>
                    </div>
                </div>
            </div>
        `;
    }

    function createTitleRow(title = { title: '', language: 'ja', is_official: false, is_for_search: false }) {
        console.log("[Edit UI] Show title:", title)
        return `
            <div class="dynamic-list-item">
                <input type="text" name="title_text" placeholder="Title" required value="${title.title || ''}">
                <input type="text" name="title_lang" placeholder="Lang" required value="${title.language || 'ja'}">
                <label><input type="checkbox" name="title_is_official" ${title.is_official ? 'checked' : ''}> 官方标题</label>
                <label><input type="checkbox" name="title_is_for_search" ${title.is_for_search ? 'checked' : ''}> 仅用于搜索</label>
                <button type="button" class="remove-row-button">Remove</button>
            </div>
        `;
    }

    function createCreatorRow(creator = { creator_uuid: '', role: '' }, allCreators = []) {
        console.log("[Edit UI] Show creator:", creator)
        // Handle different data structures:
        // 1. creator.creator_uuid (direct UUID field)
        // 2. creator.creator.uuid (nested creator object)
        // 3. creator.uuid (when creator data is the actual creator object)
        const creator_uuid = creator.creator_uuid || creator.creator?.uuid || creator.uuid || '';
        const creatorRole = creator.role || '';
        const creatorOptions = allCreators.map(c =>
            `<option value="${c.uuid}" ${creator_uuid === c.uuid ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        return `
            <div class="dynamic-list-item">
                <div class="md3-select-field">
                    <select name="creator_uuid" required>
                        <option value="">Select Creator</option>
                        ${creatorOptions}
                    </select>
                    <label class="md3-label">Creator</label>
                    <div class="md3-state-layer"></div>
                </div>
                <input type="text" name="creator_role" placeholder="Role" required value="${creatorRole}">
                <button type="button" class="remove-row-button">Remove</button>
            </div>
        `;
    }
    
    function createWikiRow(wiki = { platform: '', identifier: '' }) {
        console.log("[Edit UI] Show wiki:",wiki)
        return `
            <div class="dynamic-list-item">
                <input type="text" name="wiki_platform" placeholder="Wiki Platform" required value="${wiki.platform || ''}">
                <input type="text" name="wiki_id" placeholder="Wiki ID" required value="${wiki.identifier || ''}">
                <button type="button" class="remove-row-button">Remove</button>
            </div>
        `;
    }

    function createAssetCreatorRow(creator = { creator_uuid: '', role: '' }) {
        return `
            <div class="dynamic-list-item">
                <input type="text" name="asset_creator_uuid" placeholder="Creator UUID" required value="${creator.creator_uuid || ''}">
                <input type="text" name="asset_creator_role" placeholder="Role" required value="${creator.role || ''}">
                <button type="button" class="remove-row-button">Remove</button>
            </div>
        `;
    }

    function addDynamicListItem(listId, rowHtml) {
        const list = document.getElementById(listId);
        if (list) {
            list.insertAdjacentHTML('beforeend', rowHtml);
        }
    }


    async function handleFormSubmit(e, target, isUpdate) {
        e.preventDefault();
        formError.textContent = '';
        const formData = new FormData(e.target);
        let body;
        const endpointMap = { creator: 'creator', work: 'work' };
        const apiTarget = endpointMap[target] || target;
        let wikis = [];
        let titles = [];
        let creator = [];
        let selectedTags = [];
        let selectedCategories = [];
        let work_uuid = '';
        
        try {
            // Construct the request body based on the target type
            switch (target) {
                case 'creator':
                    wikis = [];
                    document.querySelectorAll('#wikis-list .dynamic-list-item').forEach(item => {
                        wikis.push({
                            platform: item.querySelector('input[name="wiki_platform"]').value,
                            identifier: item.querySelector('input[name="wiki_id"]').value,
                        });
                    });
                    body = {
                        creator_uuid: formData.get('creator_uuid'),
                        creator: {
                            uuid: formData.get('uuid'),
                            name: formData.get('name'),
                            type: formData.get('type'),
                            
                        },
                        wikis: wikis,
                    };
                    break;
                case 'media':
                    // Collect selected external objects
                    const selectedMediaExternalObjects = [];
                    document.querySelectorAll('input[name="external_objects"]:checked').forEach(checkbox => {
                        selectedMediaExternalObjects.push(checkbox.value);
                    });

                    body = {
                        media_uuid: formData.get('media_uuid'),
                        uuid: formData.get('uuid'),
                        work_uuid: formData.get('work_uuid'),
                        is_music: formData.get('is_music') === 'true',
                        file_name: formData.get('file_name'),
                        url: formData.get('url'),
                        mime_type: formData.get('mime_type'),
                        info: formData.get('info'),
                        external_objects: selectedMediaExternalObjects,
                    };
                    break;
                case 'asset':
                    creator = [];
                    document.querySelectorAll('#asset-creator-list .dynamic-list-item').forEach(item => {
                        creator.push({
                            creator_uuid: item.querySelector('input[name="asset_creator_uuid"]').value,
                            role: item.querySelector('input[name="asset_creator_role"]').value,
                        });
                    });

                    // Collect selected external objects
                    const selectedExternalObjects = [];
                    document.querySelectorAll('input[name="external_objects"]:checked').forEach(checkbox => {
                        selectedExternalObjects.push(checkbox.value);
                    });

                     body = {
                        asset_uuid: formData.get('asset_uuid'),
                        asset: {
                            uuid: formData.get('uuid'),
                            file_id: formData.get('file_id'),
                            work_uuid: formData.get('work_uuid'),
                            asset_type: formData.get('asset_type'),
                            file_name: formData.get('file_name'),
                            is_previewpic: formData.get('is_previewpic') === 'true',
                            language: formData.get('language') || null,
                        },
                        creator: creator,
                        external_objects: selectedExternalObjects,
                    };
                    break;
                case 'relation':
                    body = {
                        relation_uuid: formData.get('relation_uuid'),
                        uuid: formData.get('uuid'),
                        from_work_uuid: formData.get('from_work_uuid'),
                        to_work_uuid: formData.get('to_work_uuid'),
                        relation_type: formData.get('relation_type'),
                    };
                    break;
                case 'work':
                    titles = [];
                    document.querySelectorAll('#titles-list .dynamic-list-item').forEach((item) => {
                        titles.push({
                            title: item.querySelector('input[name="title_text"]').value,
                            language: item.querySelector('input[name="title_lang"]').value,
                            is_official: item.querySelector('input[name="title_is_official"]').checked,
                            is_for_search: item.querySelector('input[name="title_is_for_search"]').checked,
                        });
                    });

                    creator = [];
                    document.querySelectorAll('#creator-list .dynamic-list-item').forEach(item => {
                        creator.push({
                            creator_uuid: item.querySelector('select[name="creator_uuid"]').value,
                            role: item.querySelector('input[name="creator_role"]').value,
                        });
                    });

                    wikis = [];
                    document.querySelectorAll('#wikis-list .dynamic-list-item').forEach(item => {
                        wikis.push({
                            platform: item.querySelector('input[name="wiki_platform"]').value,
                            identifier: item.querySelector('input[name="wiki_id"]').value,
                        });
                    });

                    // Collect selected tags and categories
                    document.querySelectorAll('input[name="selected_tags"]:checked').forEach(checkbox => {
                        selectedTags.push(checkbox.value);
                    });

                    document.querySelectorAll('input[name="selected_categories"]:checked').forEach(checkbox => {
                        selectedCategories.push(checkbox.value);
                    });

                    work_uuid = formData.get('work_uuid_field');
                    body = {
                        work: {
                            uuid: work_uuid,
                            copyright_basis: formData.get('copyright_basis')
                        },
                        titles: titles,
                        license: formData.get('license') || null,
                        creator: creator,
                        wikis: wikis,
                    };

                    if (isUpdate) {
                        body.work_uuid = work_uuid;
                    }
                    console.log("Request Body:", JSON.stringify(body, null, 2));
                    break;
                case 'tag':
                    body = {
                        uuid: formData.get('uuid'),
                        name: formData.get('name'),
                    };
                    if (isUpdate) {
                        body.tag_uuid = formData.get('tag_uuid');
                    }
                    break;
                case 'category':
                    body = {
                        uuid: formData.get('uuid'),
                        name: formData.get('name'),
                        parent_uuid: formData.get('parent_uuid') || null,
                    };
                    if (isUpdate) {
                        body.category_uuid = formData.get('category_uuid');
                    }
                    break;
                case 'external_source':
                    body = {
                        uuid: formData.get('uuid'),
                        type: formData.get('type'),
                        name: formData.get('name'),
                        endpoint: formData.get('endpoint'),
                    };
                    if (isUpdate) {
                        body.external_source_uuid = formData.get('external_source_uuid');
                    }
                    break;
                case 'external_object':
                    body = {
                        uuid: formData.get('uuid'),
                        external_source_uuid: formData.get('external_source_uuid'),
                        mime_type: formData.get('mime_type'),
                        file_id: formData.get('file_id'),
                        ...(isUpdate && { external_object_uuid: formData.get('external_object_uuid') })
                    };
                    break;
                case 'footer':
                    body = {
                        item_type: formData.get('item_type'),
                        text: formData.get('text'),
                        url: formData.get('url') || null,
                        icon_class: formData.get('icon_class') || null,
                    };
                    break;
                case 'site_config':
                    body = {
                        key: formData.get('key'),
                        value: formData.get('value'),
                        description: formData.get('description') || null,
                    };
                    break;
                default:
                    throw new Error('Invalid form target.');
            }

            let endpoint;
            let method = 'POST';

            if (target === 'footer') {
                if (isUpdate) {
                    endpoint = `/footer/settings/${currentEditUUID}`;
                    method = 'PUT';
                } else {
                    endpoint = '/footer/settings';
                }
            } else if (target === 'site_config') {
                if (isUpdate) {
                    endpoint = `/config/${formData.get('config_key')}`;
                    method = 'PUT';
                } else {
                    endpoint = `/config/${formData.get('key')}`;
                    method = 'PUT'; // site_config always uses PUT for upsert
                }
            } else {
                endpoint = isUpdate ? `/update/${apiTarget}` : `/input/${apiTarget}`;
            }
            
            await apiFetch(endpoint, {
                method: method,
                body: JSON.stringify(body),
            });

            // Handle tags and categories for work
            if (target === 'work' && typeof selectedTags !== 'undefined' && typeof selectedCategories !== 'undefined') {
                try {
                    // For updates, first clear existing associations
                    if (isUpdate) {
                        // Remove all existing tags
                        await apiFetch('/delete/work-tags-all', {
                            method: 'POST',
                            body: JSON.stringify({
                                work_uuid: work_uuid
                            }),
                        });
                        
                        // Remove all existing categories
                        await apiFetch('/delete/work-categories-all', {
                            method: 'POST',
                            body: JSON.stringify({
                                work_uuid: work_uuid
                            }),
                        });
                    }
                    
                    // Add selected tags
                    if (selectedTags.length > 0) {
                        await apiFetch('/input/work-tags', {
                            method: 'POST',
                            body: JSON.stringify({
                                work_uuid: work_uuid,
                                tag_uuids: selectedTags
                            }),
                        });
                    }

                    // Add selected categories
                    if (selectedCategories.length > 0) {
                        await apiFetch('/input/work-categories', {
                            method: 'POST',
                            body: JSON.stringify({
                                work_uuid: work_uuid,
                                category_uuids: selectedCategories
                            }),
                        });
                    }
                } catch (tagCategoryError) {
                    console.warn('Tags/categories update failed:', tagCategoryError);
                    // Don't fail the entire operation for tag/category errors
                }
            }

            modal.classList.add('hidden');
            loadContent(currentTab); // Refresh the table
        } catch (error) {
            formError.textContent = `Failed to ${isUpdate ? 'update' : 'create'} item: ${error.message}. Check JSON format.`;
        }
    }

    // --- Tag and Category Filter Functions ---
    window.filterTags = function(searchTerm) {
        const checkboxes = document.querySelectorAll('#tag-checkboxes .tag-checkbox');
        checkboxes.forEach(checkbox => {
            const tagName = checkbox.querySelector('.tag-chip').textContent.toLowerCase();
            const matches = tagName.includes(searchTerm.toLowerCase());
            checkbox.classList.toggle('hidden', !matches);
        });
    };

    window.filterCategories = function(searchTerm) {
        const checkboxes = document.querySelectorAll('#category-checkboxes .category-checkbox');
        checkboxes.forEach(checkbox => {
            const categoryName = checkbox.querySelector('.category-name').textContent.toLowerCase();
            const matches = categoryName.includes(searchTerm.toLowerCase());
            checkbox.classList.toggle('hidden', !matches);
        });
    };

    // --- Initial Check ---
    if (jwtToken) {
        showAdminPanel();
    } else {
        showLogin();
    }

    // --- Tool Zone Logic ---
    const generateUuidButton = document.getElementById('generate-uuid-button');
    const generatedUuidResult = document.getElementById('generated-uuid-result');

    generateUuidButton.addEventListener('click', () => {
        generatedUuidResult.value = crypto.randomUUID();
    });

    // --- Danger Zone Logic ---
    const dbInitButton = document.getElementById('db-init-button');
    const dbClearButton = document.getElementById('db-clear-button');

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

    // --- Migration Logic ---
    // Config management buttons
    const configStatusButton = document.getElementById('config-status-button');
    const configStatusResult = document.getElementById('config-status-result');
    const configInitButton = document.getElementById('config-init-button');
    const configInitResult = document.getElementById('config-init-result');

    // Check config status
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

    // Initialize config
    configInitButton.addEventListener('click', async () => {
        if (!confirm('确定要初始化站点配置吗？\n\n此操作将创建配置表并初始化默认配置。如果配置已存在，将更新缺失的配置项。')) {
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

    // Migration buttons
    const migrationStatusButton = document.getElementById('migration-status-button');
    const migrationStatusResult = document.getElementById('migration-status-result');
    const executeMigrationButton = document.getElementById('execute-migration-button');
    const assetUrlInput = document.getElementById('asset-url-input');
    const batchSizeInput = document.getElementById('batch-size-input');
    const validateMigrationButton = document.getElementById('validate-migration-button');
    const validationResult = document.getElementById('validation-result');

    // Helper function to display results
    function displayResult(element, data, isSuccess = true) {
        element.className = `${element.className.split(' ')[0]} show ${isSuccess ? 'success' : 'error'}`;
        element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    // Check migration status
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

    // Execute migration
    executeMigrationButton.addEventListener('click', async () => {
        const assetUrl = assetUrlInput.value.trim();
        const batchSize = parseInt(batchSizeInput.value) || 50;

        if (!assetUrl) {
            alert('请输入 ASSET_URL');
            return;
        }

        if (!confirm(`确定要执行外部存储迁移吗？\n\nASSET_URL: ${assetUrl}\n批处理大小: ${batchSize}\n\n此操作将修改数据库结构，建议先备份数据！`)) {
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
                alert(`迁移完成！\n\n资产迁移: ${response.migratedAssets || 0} 个\n媒体源迁移: ${response.migratedMediaSources || 0} 个`);
            } else {
                alert(`迁移失败: ${response.message || '未知错误'}`);
            }
        } catch (error) {
            displayResult(migrationStatusResult, { error: error.message }, false);
            alert(`迁移失败: ${error.message}`);
        }
    });

    // Validate migration
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
                alert(`验证完成！\n\n检查项目:\n• 孤立外部对象: ${summary.orphanedExternalObjects || 0}\n• 缺失源引用: ${summary.missingSourceReferences || 0}\n• 关联错误: ${summary.associationErrors || 0}\n\n${response.validationDetails ? '详细信息请查看结果区域' : ''}`);
            } else {
                alert(`验证失败: ${response.message || '未知错误'}`);
            }
        } catch (error) {
            displayResult(validationResult, { error: error.message }, false);
            alert(`验证失败: ${error.message}`);
        }
    });

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
            } 
            else {
                textToCopy = target.textContent;
            }

            if (textToCopy) {
                copyToClipboard(textToCopy, target);
            }
        }
    });

    function copyToClipboard(text, element) {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Add a visual cue
            if (element) {
                element.classList.add('copied');
                setTimeout(() => {
                    element.classList.remove('copied');
                }, 1000);
            }
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }

    // External objects filtering function
    function filterExternalObjects(searchTerm) {
        const container = document.getElementById('external-objects-container');
        if (!container) return;

        // Get currently selected external objects
        const selectedCheckboxes = document.querySelectorAll('input[name="external_objects"]:checked');
        const currentSelectedObjects = Array.from(selectedCheckboxes).map(checkbox => ({
            uuid: checkbox.value
        }));

        const filteredObjects = allExternalObjects.filter(obj => {
            const sourceName = obj.source?.name || allExternalSources.find(s => s.uuid === obj.external_source_uuid)?.name || '';
            return (
                obj.file_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.mime_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.uuid.toLowerCase().includes(searchTerm.toLowerCase())
            );
        });

        renderExternalObjectsList(filteredObjects, container, currentSelectedObjects);
    }

    // Enhance external object filter with MD3 functionality  
    function enhanceExternalObjectFilter(field) {
        const input = field.querySelector('input[type="text"]');
        if (!input || input.hasAttribute('data-md3-enhanced')) return;
        
        input.setAttribute('data-md3-enhanced', 'true');
        
        const updateFieldState = () => {
            const hasValue = input.value && input.value.trim() !== '';
            if (hasValue) {
                field.classList.add('has-value');
            } else {
                field.classList.remove('has-value');
            }
        };
        
        input.addEventListener('input', updateFieldState);
        input.addEventListener('focus', () => field.classList.add('focused'));
        input.addEventListener('blur', () => {
            field.classList.remove('focused');
            updateFieldState();
        });
        
        updateFieldState();
    }

    // Render external objects list
    function renderExternalObjectsList(objects, container, selectedObjects = []) {
        if (!objects || objects.length === 0) {
            container.innerHTML = '<p>无可用的外部对象。</p>';
            return;
        }

        // Create a Set of selected UUIDs for faster lookup
        const selectedUuids = new Set(selectedObjects.map(obj => obj.uuid));

        container.innerHTML = objects.map(obj => {
            const sourceName = obj.source?.name || allExternalSources.find(s => s.uuid === obj.external_source_uuid)?.name || '未知源';
            const isSelected = selectedUuids.has(obj.uuid);
            
            return `
                <div class="external-object-item">
                    <label>
                        <input type="checkbox" name="external_objects" value="${obj.uuid}" ${isSelected ? 'checked' : ''}>
                        <div class="external-object-details">
                            <div class="external-object-info">
                                <strong>文件ID:</strong> ${obj.file_id}<br>
                                <strong>存储源:</strong> ${sourceName}<br>
                                <strong>MIME类型:</strong> ${obj.mime_type}
                            </div>
                            <div class="external-object-uuid">
                                <span class="uuid" title="${obj.uuid}">${obj.uuid.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </label>
                </div>
            `;
        }).join('');
    }
});

// Helper to get a value from a potentially nested object
function get(obj, path, defaultValue = null) {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
}
