// Form generation module

import { allExternalSources } from './config.js';
import {
    createQuickSelect,
    createCategoryQuickSelect,
    createTagSelector,
    createCategorySelector,
    createExternalObjectsSelector,
    createMD3Select
} from './form-generator-legacy.js';

// --- Main Form Generation ---
export function generateFormFields(target, data = null, options = {}) {
    console.log("Generate Form Fields", data);
    const data_wikis = (data?.wikis || []).map(createWikiRow).join('');
    const data_creators = (data?.creator && Array.isArray(data.creator))
                    ? data.creator.map(creator => createCreatorRow(creator, options.creators)).join('')
                    : (data?.creator ? createCreatorRow(data.creator, options.creators) : '');
    const data_relations = ['original', 'remix', 'cover', 'remake', 'picture', 'lyrics'].map(type => `<option value="${type}" ${data?.relation_type === type ? 'selected' : ''}>${type}</option>`).join('');
    const data_titles = (data?.titles || []).map(createTitleRow).join('');

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
            ${data ? '<div style="margin-top: 8px;"><small>配置键不可修改</small></div>' : ''}
            ${data?.key?.includes('title') ? `
                <div class="placeholder-help" style="margin: 10px 0; padding: 10px; border-radius: 4px; font-size: 0.9em;">
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
        `,
        wiki_platform: `
            <label for="platform_key">平台键 *:</label>
            <input type="text" id="platform_key" name="platform_key" required value="${data?.platform_key || ''}" placeholder="例如: wikipedia_zh, vocadb">
            <label for="platform_name">平台名称 *:</label>
            <input type="text" id="platform_name" name="platform_name" required value="${data?.platform_name || ''}" placeholder="例如: 维基百科(中文), VocaDB">
            <label for="url_template">URL模板 *:</label>
            <input type="text" id="url_template" name="url_template" required value="${data?.url_template || ''}" placeholder="例如: https://zh.wikipedia.org/wiki/{ENCODED_ID}">
            <div class="placeholder-help" style="margin: 10px 0; padding: 10px; border-radius: 4px; background: #f5f5f5; font-size: 0.9em;">
                <strong>💡 可用占位符：</strong><br>
                • {ID} - 直接替换为identifier<br>
                • {ENCODED_ID} - URL编码后的identifier<br>
                • {LANG} - 语言代码<br>
                • {TYPE} - 条目类型<br>
                <strong>示例：</strong><br>
                • Wikipedia: https://zh.wikipedia.org/wiki/{ENCODED_ID}<br>
                • VocaDB: https://vocadb.net/S/{ID}<br>
                • Bilibili: https://www.bilibili.com/video/{ID}
            </div>
            <label for="icon_class">图标样式 (可选):</label>
            <input type="text" id="icon_class" name="icon_class" value="${data?.icon_class || ''}" placeholder="例如: fa-wikipedia-w, fa-music">
        `
    };
    return (fields[target] || '<p>Form not implemented for this type.</p>') + '<button type="submit">Submit</button>';
}

// --- Dynamic Row Creators ---
export function createTitleRow(title = { title: '', language: 'ja', is_official: false, is_for_search: false }) {
    console.log("[Edit UI] Show title:", title);
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

export function createCreatorRow(creator = { creator_uuid: '', role: '' }, allCreators = []) {
    console.log("[Edit UI] Show creator:", creator);
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

export function createWikiRow(wiki = { platform: '', identifier: '' }) {
    console.log("[Edit UI] Show wiki:", wiki);
    return `
        <div class="dynamic-list-item">
            <input type="text" name="wiki_platform" placeholder="Wiki Platform" required value="${wiki.platform || ''}">
            <input type="text" name="wiki_id" placeholder="Wiki ID" required value="${wiki.identifier || ''}">
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

export function createAssetCreatorRow(creator = { creator_uuid: '', role: '' }) {
    return `
        <div class="dynamic-list-item">
            <input type="text" name="asset_creator_uuid" placeholder="Creator UUID" required value="${creator.creator_uuid || ''}">
            <input type="text" name="asset_creator_role" placeholder="Role" required value="${creator.role || ''}">
            <button type="button" class="remove-row-button">Remove</button>
        </div>
    `;
}

// --- Dynamic List Management ---
export function addDynamicListItem(listId, rowHtml) {
    const list = document.getElementById(listId);
    if (list) {
        list.insertAdjacentHTML('beforeend', rowHtml);
    }
}