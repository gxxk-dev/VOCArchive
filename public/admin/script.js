document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loginContainer = document.getElementById('login-container');
    const adminPanel = document.getElementById('admin-panel');
    const loginForm = document.getElementById('login-form');
    const authCodeInput = document.getElementById('auth-code');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const resetButton = document.getElementById('reset-button');
    const qrcodeContainer = document.getElementById('qrcode-container');
    const qrcodeDiv = document.getElementById('qrcode');
    const tabs = document.getElementById('tabs');
    const content = document.getElementById('content');
    const modal = document.getElementById('form-modal');
    const modalForm = document.getElementById('modal-form');
    const formTitle = document.getElementById('form-title');
    const formError = document.getElementById('form-error');
    const closeModalButton = document.querySelector('.close-button');
    const totpUrl = document.getElementById('totp-url');
    const copyUrlButton = document.getElementById('copy-url-button');

    // --- State ---
    const API_BASE_URL = '/api';
    let jwtToken = localStorage.getItem('jwtToken');
    let currentTab = 'works';
    let currentEditUUID = null; // To track the item being edited

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
        currentTab = activeTab ? activeTab.dataset.target : 'works';
        loadContent(currentTab);
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

    resetButton.addEventListener('click', async () => {
        if (!confirm('您确定要重置授权吗？这将使当前的所有登录失效，并生成一个新的二维码。')) {
            return;
        }
        try {
            loginError.textContent = '';
            qrcodeContainer.classList.add('hidden');

            const response = await fetch(`${API_BASE_URL}/auth/reset-secrets`, {
                method: 'POST',
                headers: {
                    // No JWT token is sent for reset
                    'Content-Type': 'application/json',
                },
                 body: JSON.stringify({}), // Empty body
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Reset request failed');
            }

            const data = await response.json();

            if (data.otpAuthUri) {
                qrcodeDiv.innerHTML = ''; // Clear previous QR code
                console.log(data.otpAuthUri)
                new QRCode(qrcodeDiv, {
                    text: data.otpAuthUri,
                    width: 256,
                    height: 256,
                    colorDark : "#000000",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
                qrcodeContainer.classList.remove('hidden');
                console.log(qrcodeContainer)
                totpUrl.textContent = data.otpAuthUri;
                alert('授权已重置。请扫描新的二维码。');
            } else {
                throw new Error('Reset response did not contain OTP URI.');
            }
        } catch (error) {
            loginError.textContent = `重置失败: ${error.message}`;
        }
    });

    copyUrlButton.addEventListener('click', () => {
        const url = totpUrl.textContent;
        if (url) {
            navigator.clipboard.writeText(url).then(() => {
                alert('URL已复制到剪贴板');
            }, (err) => {
                alert('无法复制URL: ', err);
            });
        }
    });

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
            addDynamicListItem('creators-list', createCreatorRow());
        }
        if (e.target.id === 'add-wiki-button') {
            addDynamicListItem('wikis-list', createWikiRow());
        }
        if (e.target.id === 'add-asset-creator-button') {
            addDynamicListItem('asset-creators-list', createAssetCreatorRow());
        }
    });

    // --- Content & Table Rendering ---
    async function loadContent(target) {
        content.innerHTML = '<h2>Loading...</h2>';
        try {
            const data = await apiFetch(`/list/${target}?page=1&pageSize=100`);
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
                 return `<span class="string-value" title="${data}">${data.substring(0, 8)}...</span>`;
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
        if (target === 'works') {
            renderWorksGrid(target, data);
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

    function renderWorksGrid(target, data) {
        const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
        content.innerHTML = `
            <div class="controls">
                <h2>${capTarget}</h2>
                <button class="create-button" data-target="${target}">Create New ${capTarget}</button>
            </div>
            ${!data || data.length === 0 ? `<p>No ${target} found.</p>` : `
            <div id="works-grid">
                ${data.map(work => {
                    const title = work.titles.find(t => t.is_official)?.title || work.titles[0]?.title || 'Untitled';
                    // The backend currently does not provide a direct URL for preview assets.
                    // The 'preview_asset' object has a 'file_id', but there is no '/file/:id' endpoint to resolve it.
                    // Using a placeholder until a file serving mechanism is implemented.
                    const imageUrl = 'https://via.placeholder.com/300x200.png?text=No+Image';
                    return `
                    <div class="work-card" data-uuid="${work.work_uuid}">
                        <div class="work-card-image">
                            <img src="${imageUrl}" alt="${title}" loading="lazy">
                        </div>
                        <div class="work-card-content">
                            <h3 class="work-card-title">${title}</h3>
                            <p class="work-card-uuid">${work.work_uuid}</p>
                        </div>
                        <div class="work-card-actions">
                            <button class="edit-button" data-target="works" data-uuid="${work.work_uuid}">Edit</button>
                            <button class="delete-button" data-target="works">Delete</button>
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
        const endpointMap = { authors: 'creator', works: 'work' };
        const getEndpoint = endpointMap[target] || target;
        try {
            const data = await apiFetch(`/get/${getEndpoint}?uuid=${uuid}`);
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

        const uuidKeyMap = {
            works: 'work_uuid',
            authors: 'creator_uuid',
            media: 'media_uuid',
            asset: 'asset_uuid',
            relation: 'relation_uuid'
        };
        const endpointMap = { authors: 'creator', works: 'work' };
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
    function showFormModal(target, data = null) {
        currentEditUUID = data ? (data.uuid || data.work?.uuid || data.creator?.uuid || data.asset?.uuid) : null;
        const mode = data ? 'Edit' : 'Create New';
        formTitle.textContent = `${mode} ${target.charAt(0).toUpperCase() + target.slice(1)}`;
        formError.textContent = '';
        modalForm.innerHTML = generateFormFields(target, data);
        modalForm.onsubmit = (e) => handleFormSubmit(e, target, !!data);
        modal.classList.remove('hidden');

        // Logic to toggle license field visibility for 'works'
        if (target === 'works') {
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

    function generateFormFields(target, data = null) {
        const s = (val) => JSON.stringify(val, null, 2);
        const fields = {
            authors: `
                <input type="hidden" name="creator_uuid" value="${data?.creator?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.creator?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''}>
                <label for="name">Name:</label><input type="text" id="name" name="name" required value="${data?.creator?.name || ''}">
                <label for="type">Type:</label><select id="type" name="type">
                    <option value="human" ${data?.creator?.type === 'human' ? 'selected' : ''}>Human</option>
                    <option value="virtual" ${data?.creator?.type === 'virtual' ? 'selected' : ''}>Virtual</option>
                </select>
                <label for="voicelib">Voice Library:</label><input type="text" id="voicelib" name="voicelib" value="${data?.creator?.voicelib || ''}">
                <div class="form-section">
                    <h4>Wikis</h4>
                    <div id="wikis-list" class="dynamic-list">
                        ${(data?.wikis || []).map(createWikiRow).join('')}
                    </div>
                    <button type="button" id="add-wiki-button" class="add-row-button">Add Wiki</button>
                </div>
            `,
            media: `
                <input type="hidden" name="media_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''}>
                <label for="work_uuid">Work UUID:</label><input type="text" id="work_uuid" name="work_uuid" required value="${data?.work_uuid || ''}">
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
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.asset?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''}>
                <label for="file_id">File ID:</label><input type="text" id="file_id" name="file_id" required value="${data?.asset?.file_id || ''}">
                <label for="work_uuid">Work UUID:</label><input type="text" id="work_uuid" name="work_uuid" required value="${data?.asset?.work_uuid || ''}">
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
                    <h4>Creators</h4>
                    <div id="asset-creators-list" class="dynamic-list">
                        ${(data?.creators || []).map(createAssetCreatorRow).join('')}
                    </div>
                    <button type="button" id="add-asset-creator-button" class="add-row-button">Add Creator</button>
                </div>
            `,
            relation: `
                <input type="hidden" name="relation_uuid" value="${data?.uuid || ''}">
                <label for="uuid">UUID:</label><input type="text" id="uuid" name="uuid" required value="${data?.uuid || crypto.randomUUID()}" ${data ? 'readonly' : ''}>
                <label for="from_work_uuid">From Work UUID:</label><input type="text" id="from_work_uuid" name="from_work_uuid" required value="${data?.from_work_uuid || ''}">
                <label for="to_work_uuid">To Work UUID:</label><input type="text" id="to_work_uuid" name="to_work_uuid" required value="${data?.to_work_uuid || ''}">
                <label for="relation_type">Relation Type:</label>
                <select id="relation_type" name="relation_type">
                    ${['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'].map(type => `<option value="${type}" ${data?.relation_type === type ? 'selected' : ''}>${type}</option>`).join('')}
                </select>
            `,
            works: `
                <div class="form-section">
                    <h4>Work Details</h4>
                    <input type="hidden" name="work_uuid" value="${data?.work?.uuid || ''}">
                    <label for="work-uuid">Work UUID:</label>
                    <input type="text" id="work-uuid" name="work_uuid_field" required value="${data?.work?.uuid || crypto.randomUUID()}" readonly>
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
                        ${(data?.titles || []).map(createTitleRow).join('')}
                    </div>
                    <button type="button" id="add-title-button" class="add-row-button">Add Title</button>
                </div>

                <div class="form-section">
                    <h4>Creators</h4>
                    <div id="creators-list" class="dynamic-list">
                        ${(data?.creators || []).map(createCreatorRow).join('')}
                    </div>
                    <button type="button" id="add-creator-button" class="add-row-button">Add Creator</button>
                </div>
                
                <div class="form-section">
                    <h4>Wikis</h4>
                    <div id="wikis-list" class="dynamic-list">
                        ${(data?.wikis || []).map(createWikiRow).join('')}
                    </div>
                    <button type="button" id="add-wiki-button" class="add-row-button">Add Wiki</button>
                </div>
            `
        };
        return (fields[target] || '<p>Form not implemented for this type.</p>') + '<button type="submit">Submit</button>';
    }

    function createTitleRow(title = { title: '', language: 'ja', is_official: false }) {
        console.log("[Edit UI] Show title:", title)
        return `
            <div class="dynamic-list-item">
                <input type="text" name="title_text" placeholder="Title" required value="${title.title || ''}">
                <input type="text" name="title_lang" placeholder="Lang" required value="${title.language || 'ja'}">
                <label><input type="checkbox" name="title_is_official" ${title.is_official ? 'checked' : ''}> 官方标题</label>
                <button type="button" class="remove-row-button">Remove</button>
            </div>
        `;
    }

    function createCreatorRow(creator = { creator_uuid: '', role: '', creator_name: '' }) {
        console.log("[Edit UI] Show creator:",creator)
        return `
            <div class="dynamic-list-item">
                <input type="text" name="creator_uuid" placeholder="Creator UUID" required value="${creator.creator_uuid || ''}">
                <input type="text" name="creator_role" placeholder="Role" required value="${creator.role || ''}">
                <input type="text" name="creator_name" placeholder="Creator Name" value="${creator.creator_name || ''}" readonly>
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
        const endpointMap = { authors: 'creator', works: 'work' };
        const apiTarget = endpointMap[target] || target;
        let wikis = [];
        let titles = [];
        let creators = [];
        try {
            // Construct the request body based on the target type
            switch (target) {
                case 'authors':
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
                            voicelib: formData.get('voicelib') || null,
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
                    creators = [];
                    document.querySelectorAll('#asset-creators-list .dynamic-list-item').forEach(item => {
                        creators.push({
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
                        creators: creators,
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
                case 'works':
                    titles = [];
                    document.querySelectorAll('#titles-list .dynamic-list-item').forEach((item, index) => {
                        titles.push({
                            title: item.querySelector('input[name="title_text"]').value,
                            language: item.querySelector('input[name="title_lang"]').value,
                            is_official: item.querySelector('input[name="title_is_official"]').checked,
                        });
                    });

                    creators = [];
                    document.querySelectorAll('#creators-list .dynamic-list-item').forEach(item => {
                        creators.push({
                            creator_uuid: item.querySelector('input[name="creator_uuid"]').value,
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

                    const work_uuid = formData.get('work_uuid_field');
                    body = {
                        work: {
                            uuid: work_uuid,
                            copyright_basis: formData.get('copyright_basis')
                        },
                        titles: titles,
                        license: formData.get('license') || null,
                        creators: creators,
                        wikis: wikis,
                    };

                    if (isUpdate) {
                        body.work_uuid = work_uuid;
                    }
                    console.log("Request Body:", JSON.stringify(body, null, 2));
                    break;
                default:
                    throw new Error('Invalid form target.');
            }

            const endpoint = isUpdate ? `/update/${apiTarget}` : `/input/${apiTarget}`;
            
            await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(body),
            });

            modal.classList.add('hidden');
            loadContent(currentTab); // Refresh the table
        } catch (error) {
            formError.textContent = `Failed to ${isUpdate ? 'update' : 'create'} item: ${error.message}. Check JSON format.`;
        }
    }

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
});

// Helper to get a value from a potentially nested object
function get(obj, path, defaultValue = null) {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
}
