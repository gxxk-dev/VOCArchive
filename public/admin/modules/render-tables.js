// Table and grid rendering module

import { renderCellContent } from './utils.js';
import { allExternalSources } from './config.js';

let content; // Global reference to content element

// Initialize DOM elements for rendering
export function initializeRenderElements() {
    content = document.getElementById('content');
}

// --- Main Render Function ---
export function renderTable(target, data) {
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

    // Generic table rendering
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
                        const uuid = row.uuid || row.work_uuid || row.creator_uuid || row.media_uuid || row.asset_uuid || row.relation_uuid || row.key || (target === 'wiki_platform' ? row.platform_key : null);
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

// --- Specific Table Renderers ---
export function renderTagsTable(data) {
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

export function renderCategoriesTable(data) {
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

export function renderCategoryTree(categories, level = 0) {
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

export function renderCreatorTable(data) {
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

export function renderExternalSourcesTable(data) {
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

export function renderExternalObjectsTable(data) {
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

export function renderAssetTable(data) {
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

export function renderMediaSourceTable(data) {
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

export function renderWorksGrid(target, data) {
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