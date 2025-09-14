document.addEventListener('DOMContentLoaded', async () => {
    // --- Config ---
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Config fetch failed');
        const config = await response.json();
        window.ASSET_URL = config.asset_url || 'https://assets.vocarchive.com';
    } catch (error) {
        console.error('Could not fetch config:', error);
        window.ASSET_URL = 'https://assets.vocarchive.com';
    }

    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const authCodeInput = document.getElementById('auth-code');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
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

    // --- API & Helper Functions ---
    function showLogin() {
        loginContainer.classList.remove('hidden');
        adminPanel.classList.add('hidden');
        localStorage.removeItem('jwtToken');
        jwtToken = null;
    }

    function showAdminPanel() {
        loginContainer.classList.add('hidden');
        adminPanel.classList.remove('hidden');
        const activeTab = document.querySelector('.tab-button.active');
        currentTab = activeTab ? activeTab.dataset.target : 'work';
        loadContent(currentTab);
    }

    async function apiFetch(endpoint, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (jwtToken) {
            headers['Authorization'] = `Bearer ${jwtToken}`;
        }
        const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        console.log("API交互：",response)
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
        
        if (target === 'tag') {
            renderTagsTable(data);
            return;
        }
        
        if (target === 'category') {
            renderCategoriesTable(data);
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
                            const uuid = row.uuid || row.work_uuid || row.creator_uuid || row.media_uuid || row.asset_uuid || row.relation_uuid;
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
        content.innerHTML = `
            <div class="controls">
                <h2>分类 (Categories)</h2>
                <button class="create-button" data-target="category">创建新分类</button>
            </div>
            ${!data || data.length === 0 ? `<p>暂无分类。</p>` : `
            <div class="category-tree">
                ${renderCategoryTree(data)}
            </div>`}
        `;
    }

    function renderCategoryTree(categories, level = 0) {
        return categories.map(category => {
            const hasChildren = category.children && category.children.length > 0;
            return `
                <div class="category-node" style="margin-left: ${level * 20}px;" data-uuid="${category.uuid}">
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
                    const imageUrl = work.preview_asset ? `${window.ASSET_URL}/${work.preview_asset.file_id}` : 'https://via.placeholder.com/300x200.png?text=No+Image';
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

        const endpointMap = { creator: 'creator', work: 'work' };
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
            category: 'category_uuid'
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
        currentEditUUID = data ? (data.uuid || data.work?.uuid || data.creator?.uuid || data.asset?.uuid) : null;
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

        // Logic to toggle license field visibility for 'work'
        if (target === 'work') {
            const copyrightBasisSelect = document.getElementById('copyright_basis');
            const licenseContainer = document.getElementById('license-container');

            const toggleLicenseField = () => {
                if (copyrightBasisSelect.value === 'license') {
                    licenseContainer.style.display = ''; // Or 'block', depending on CSS
                } else {
                    licenseContainer.style.display = 'none';
                }
            };

            // Set initial state when the form loads
            toggleLicenseField();

            // Add event listener for changes
            copyrightBasisSelect.addEventListener('change', toggleLicenseField);
        }
    }

    function generateFormFields(target, data = null, options = {}) {
        const s = (val) => JSON.stringify(val, null, 2);
        
        const data_wikis = (data?.wikis || []).map(createWikiRow).join('');
        console.log(data)
        const data_creators = (data?.creator instanceof Array)
                        // 兼容创作者修改
                        ? (data?.creator || []).map(creator => createCreatorRow(creator, options.creators)).join('')
                        : (data?.creator ? createCreatorRow(data.creator, options.creators) : '');
        const data_relations = ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'].map(type => `<option value="${type}" ${data?.relation_type === type ? 'selected' : ''}>${type}</option>`).join('');
        const data_titles = (data?.titles || []).map(createTitleRow).join('')
        
        const fields = {
            creator: `
                <input type="hidden" name="creator_uuid" value="${data?.creator?.uuid || data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.creator?.uuid || data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="name">Name:</label><input type="text" id="name" name="name" required value="${data?.creator?.name || data?.name || ''}">
                <label for="type">Type:</label><select id="type" name="type">
                    <option value="human" ${(data?.creator?.type || data?.type) === 'human' ? 'selected' : ''}>Human</option>
                    <option value="virtual" ${(data?.creator?.type || data?.type) === 'virtual' ? 'selected' : ''}>Virtual</option>
                </select>
                
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
                <label for="is_music">Is Music:</label><select id="is_music" name="is_music">
                    <option value="true" ${data?.is_music ? 'selected' : ''}>Yes</option>
                    <option value="false" ${!data?.is_music ? 'selected' : ''}>No</option>
                </select>
                <label for="file_name">File Name:</label><input type="text" id="file_name" name="file_name" required value="${data?.file_name || ''}">
                <label for="url">URL:</label><input type="url" id="url" name="url" required value="${data?.url || ''}">
                <label for="mime_type">MIME Type:</label><input type="text" id="mime_type" name="mime_type" required value="${data?.mime_type || ''}">
                <label for="info">Info:</label><input type="text" id="info" name="info" required value="${data?.info || ''}">
            `,
            asset: `
                <input type="hidden" name="asset_uuid" value="${data?.asset?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.asset?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''} class="uuid">
                <label for="file_id">File ID:</label><input type="text" id="file_id" name="file_id" required value="${data?.asset?.file_id || ''}">
                <label for="work_uuid">Work UUID:</label>
                <div class="input-with-quick-select">
                    <input type="text" id="work_uuid_asset" name="work_uuid" required value="${data?.asset?.work_uuid || ''}" class="uuid">
                    ${createQuickSelect('work-quick-select-asset', 'work-quick-select-asset-name', options.works, 'work_uuid', 'titles', data?.asset?.work_uuid, 'work_uuid_asset')}
                </div>
                <label for="asset_type">Asset Type:</label><select id="asset_type" name="asset_type">
                    <option value="lyrics" ${data?.asset?.asset_type === 'lyrics' ? 'selected' : ''}>Lyrics</option>
                    <option value="picture" ${data?.asset?.asset_type === 'picture' ? 'selected' : ''}>Picture</option>
                </select>
                <label for="file_name">File Name:</label><input type="text" id="file_name" name="file_name" required value="${data?.asset?.file_name || ''}">
                <label for="is_previewpic">Is Preview Pic:</label><select id="is_previewpic" name="is_previewpic">
                    <option value="false" ${!data?.asset?.is_previewpic ? 'selected' : ''}>No</option>
                    <option value="true" ${data?.asset?.is_previewpic ? 'selected' : ''}>Yes</option>
                </select>
                <label for="language">Language:</label><input type="text" id="language" name="language" value="${data?.asset?.language || ''}">
                <div class="form-section">
                    <h4>creator</h4>
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
                <select id="relation_type" name="relation_type">
                    ${data_relations}
                </select>
            `,
            work: `
                <div class="form-section">
                    <h4>Work Details</h4>
                    <input type="hidden" name="work_uuid" value="${data?.work?.uuid || ''}">
                    <label for="work-uuid">Work UUID:</label>
                    <input type="text" id="work-uuid" name="work_uuid_field" required value="${data?.work?.uuid || crypto.randomUUID()}" readonly class="uuid">
                    <label for="work-copyright-basis">Copyright Basis:</label>
                    <select id="copyright_basis" name="copyright_basis">
                        <option value="none" ${(data?.work?.copyright_basis || 'none') === 'none' ? 'selected' : ''}>未知/不明</option>
                        <option value="license" ${(data?.work?.copyright_basis || 'license') === 'license' ? 'selected' : ''}>按许可证授权</option>
                        <option value="accept" ${(data?.work?.copyright_basis || 'accept') === 'accept' ? 'selected' : ''}>已获授权</option>
                    </select>
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
                <label for="item_type">Type:</label>
                <select id="item_type" name="item_type" required>
                    <option value="link" ${data?.item_type === 'link' ? 'selected' : ''}>Link</option>
                    <option value="social" ${data?.item_type === 'social' ? 'selected' : ''}>Social</option>
                    <option value="copyright" ${data?.item_type === 'copyright' ? 'selected' : ''}>Copyright</option>
                </select>
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
            `
        };
        return (fields[target] || '<p>Form not implemented for this type.</p>') + '<button type="submit">Submit</button>';
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
            <select id="${id}" name="${name}" class="quick-select" data-target-input="${targetInputId}">
                <option value="">--快速选择--</option>
                ${options}
            </select>
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
            <select id="${id}" name="${name}" class="quick-select" data-target-input="${targetInputId}">
                <option value="">--选择父分类--</option>
                ${options}
            </select>
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
                <label class="category-checkbox" style="margin-left: ${cat.level * 20}px;">
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
        const creatorUuid = creator.creator?.uuid || creator.creator_uuid;
        const creatorRole = creator.role || '';
        const creatorOptions = allCreators.map(c => 
            `<option value="${c.uuid}" ${creatorUuid === c.uuid ? 'selected' : ''}>${c.name}</option>`
        ).join('');

        return `
            <div class="dynamic-list-item">
                <select name="creator_uuid" required>
                    <option value="">Select Creator</option>
                    ${creatorOptions}
                </select>
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
                    body = {
                        media_uuid: formData.get('media_uuid'),
                        uuid: formData.get('uuid'),
                        work_uuid: formData.get('work_uuid'),
                        is_music: formData.get('is_music') === 'true',
                        file_name: formData.get('file_name'),
                        url: formData.get('url'),
                        mime_type: formData.get('mime_type'),
                        info: formData.get('info'),
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
                    document.querySelectorAll('#titles-list .dynamic-list-item').forEach((item, index) => {
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
                case 'footer':
                    body = {
                        item_type: formData.get('item_type'),
                        text: formData.get('text'),
                        url: formData.get('url') || null,
                        icon_class: formData.get('icon_class') || null,
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
            checkbox.style.display = matches ? 'flex' : 'none';
        });
    };

    window.filterCategories = function(searchTerm) {
        const checkboxes = document.querySelectorAll('#category-checkboxes .category-checkbox');
        checkboxes.forEach(checkbox => {
            const categoryName = checkbox.querySelector('.category-name').textContent.toLowerCase();
            const matches = categoryName.includes(searchTerm.toLowerCase());
            checkbox.style.display = matches ? 'flex' : 'none';
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

    document.addEventListener('click', (e) => {
        const target = e.target;
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
                const originalClass = element.className;
                element.classList.add('copied');
                setTimeout(() => {
                    element.classList.remove('copied');
                }, 1000);
            }
        }).catch(err => {
            console.error('Failed to copy: ', err);
        });
    }
});

// Helper to get a value from a potentially nested object
function get(obj, path, defaultValue = null) {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
}
