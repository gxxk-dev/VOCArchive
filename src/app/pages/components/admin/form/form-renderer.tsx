// 表单渲染组件
// Form Rendering Component

import { jsx } from 'hono/jsx';
import type { FormConfig, FormRenderData, FormOptions } from './form-field-types';
import { renderFormField } from './form-field-renderer';
import { MultiSelector } from './selectors';

export interface FormRendererProps {
    config: FormConfig;
    data?: FormRenderData;
    options?: FormOptions;
}

// 渲染标题列表项
function renderTitleRow(title?: any, index?: number) {
    const titleData = title || { title: '', language: 'ja', is_official: false, is_for_search: false };
    return (
        <div class="dynamic-list-item" data-index={index}>
            <input type="text" name="title_text[]" placeholder="Title" required value={titleData.title || ''} />
            <input type="text" name="title_lang[]" placeholder="Lang" required value={titleData.language || 'ja'} />
            <label><input type="checkbox" name="title_is_official[]" checked={titleData.is_official ? true : undefined} /> 官方标题</label>
            <label><input type="checkbox" name="title_is_for_search[]" checked={titleData.is_for_search ? true : undefined} /> 仅用于搜索</label>
            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
        </div>
    );
}

// 渲染创作者列表项
function renderCreatorRow(creator?: any, allCreators?: any[], index?: number) {
    const creatorData = creator || { creator_uuid: '', role: '' };
    const creator_uuid = creatorData.creator_uuid || creatorData.creator?.uuid || creatorData.uuid || '';
    const creatorRole = creatorData.role || '';

    return (
        <div class="dynamic-list-item" data-index={index}>
            <div class="md3-select-field">
                <select name="creator_uuid[]" required>
                    <option value="">Select Creator</option>
                    {allCreators?.map(c => (
                        <option value={c.uuid} selected={creator_uuid === c.uuid ? true : undefined}>
                            {c.name}
                        </option>
                    ))}
                </select>
                <label class="md3-label">Creator</label>
                <div class="md3-state-layer"></div>
            </div>
            <input type="text" name="creator_role[]" placeholder="Role" required value={creatorRole} />
            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
        </div>
    );
}

// 渲染Wiki列表项
function renderWikiRow(wiki?: any, index?: number) {
    const wikiData = wiki || { platform: '', identifier: '' };
    return (
        <div class="dynamic-list-item" data-index={index}>
            <input type="text" name="wiki_platform[]" placeholder="Wiki Platform" required value={wikiData.platform || ''} />
            <input type="text" name="wiki_id[]" placeholder="Wiki ID" required value={wikiData.identifier || ''} />
            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
        </div>
    );
}

// 渲染媒体源列表项（只读显示）
function renderMediaSourceRow(mediaSource?: any, index?: number) {
    if (!mediaSource) return null;

    return (
        <div class="dynamic-list-item media-source-item" data-index={index}>
            <div class="media-source-info">
                <strong>文件名:</strong> {mediaSource.file_name}<br/>
                <strong>类型:</strong> {mediaSource.is_music ? '音频' : '视频'}<br/>
                <strong>MIME:</strong> {mediaSource.mime_type}<br/>
                <strong>信息:</strong> {mediaSource.info || 'N/A'}
            </div>
            <button
                type="button"
                class="edit-link-button"
                onclick={`window.parent.postMessage({type: 'load-editor', data: {itemType: 'media', uuid: '${mediaSource.uuid}'}}, '*')`}
            >
                编辑
            </button>
        </div>
    );
}

// 渲染资产列表项（只读显示）
function renderAssetRow(asset?: any, index?: number) {
    if (!asset) return null;

    return (
        <div class="dynamic-list-item asset-item" data-index={index}>
            <div class="asset-info">
                <strong>文件名:</strong> {asset.file_name}<br/>
                <strong>类型:</strong> {asset.asset_type === 'lyrics' ? '歌词' : '图片'}<br/>
                {asset.is_previewpic && <span class="badge">预览图</span>}
                {asset.language && <><strong>语言:</strong> {asset.language}<br/></>}
                {asset.creator && asset.creator.length > 0 && (
                    <><strong>创作者:</strong> {asset.creator.map((c: any) => c.creator_name).join(', ')}</>
                )}
            </div>
            <button
                type="button"
                class="edit-link-button"
                onclick={`window.parent.postMessage({type: 'load-editor', data: {itemType: 'asset', uuid: '${asset.uuid}'}}, '*')`}
            >
                编辑
            </button>
        </div>
    );
}

// 渲染作品关系列表项（只读显示）
function renderWorkRelationRow(relation?: any, index?: number) {
    if (!relation) return null;

    // 关系类型中文映射
    const relationTypeMap: Record<string, string> = {
        'original': '原曲',
        'remix': '混音/重制',
        'cover': '翻唱',
        'remake': '重编曲',
        'picture': 'PV/插画',
        'lyrics': '歌词'
    };

    // 获取标题显示
    const getWorkTitle = (titles?: Array<{ language: string; title: string }>) => {
        if (!titles || titles.length === 0) return '未知作品';
        // 优先显示中文标题，否则显示第一个标题
        const zhTitle = titles.find(t => t.language === 'zh-cn' || t.language === 'zh');
        return zhTitle ? zhTitle.title : titles[0].title;
    };

    const fromTitle = getWorkTitle(relation.related_work_titles?.from_work_titles);
    const toTitle = getWorkTitle(relation.related_work_titles?.to_work_titles);

    return (
        <div class="dynamic-list-item relation-item" data-index={index}>
            <div class="relation-info">
                <div class="relation-chain">
                    <span class="work-title">{fromTitle}</span>
                    <span class="relation-arrow">→</span>
                    <span class="relation-type">{relationTypeMap[relation.relation_type] || relation.relation_type}</span>
                    <span class="relation-arrow">→</span>
                    <span class="work-title">{toTitle}</span>
                </div>
                <div class="relation-details">
                    <small>From: {relation.from_work_uuid.substring(0, 8)}... → To: {relation.to_work_uuid.substring(0, 8)}...</small>
                </div>
            </div>
            <button
                type="button"
                class="edit-link-button"
                onclick={`window.parent.postMessage({type: 'load-editor', data: {itemType: 'relation', uuid: '${relation.uuid}'}}, '*')`}
            >
                编辑
            </button>
        </div>
    );
}

// 渲染外部对象选择器
function renderExternalObjectsSelector(externalSources?: any[], selectedObjects?: any[], allExternalObjects?: any[]) {
    if (!allExternalObjects || allExternalObjects.length === 0) {
        return <p>No external objects available</p>;
    }

    const selectedUuids = new Set(selectedObjects?.map(obj => obj.uuid) || []);

    return (
        <div class="external-objects-selector">
            <div class="external-objects-filter">
                <input
                    type="text"
                    placeholder="Filter external objects..."
                    class="external-object-filter"
                    oninput="filterCheckboxes(this, '.external-object-item')"
                />
            </div>
            <div class="external-objects-list">
                {allExternalObjects.map(obj => {
                    const sourceName = obj.source?.name ||
                                     externalSources?.find(s => s.uuid === obj.external_source_uuid)?.name ||
                                     '未知源';
                    const isSelected = selectedUuids.has(obj.uuid);
                    const searchText = `${obj.file_id} ${sourceName} ${obj.mime_type}`.toLowerCase();

                    return (
                        <div class="external-object-item" data-name={searchText}>
                            <label>
                                <input type="checkbox" name="external_objects" value={obj.uuid} checked={isSelected ? true : undefined} />
                                <div class="external-object-details">
                                    <div class="external-object-info">
                                        <strong>文件ID:</strong> {obj.file_id}<br/>
                                        <strong>存储源:</strong> {sourceName}<br/>
                                        <strong>MIME类型:</strong> {obj.mime_type}
                                    </div>
                                </div>
                            </label>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function FormRenderer({ config, data, options }: FormRendererProps) {
    return (
        <>
            {config.sections.map(section => (
                <div class="form-section">
                    {section.title && <h4>{section.title}</h4>}

                    {section.fields?.map(field =>
                        renderFormField(field, data, options)
                    )}

                    {/* 动态列表渲染 */}
                    {section.type === 'dynamic-list' && (
                        <div class="dynamic-list-container">
                            {section.listType === 'work-titles' && (
                                <div>
                                    <div id="titles-list" class="dynamic-list">
                                        {data?.work?.titles?.map((title, index) =>
                                            renderTitleRow(title, index)
                                        )}
                                        {(!data?.work?.titles || data.work.titles.length === 0) &&
                                            renderTitleRow(undefined, 0)
                                        }
                                    </div>

                                    <template id="title-row-template">
                                        <div class="dynamic-list-item">
                                            <input type="text" name="title_text[]" placeholder="Title" required value="" />
                                            <input type="text" name="title_lang[]" placeholder="Lang" required value="ja" />
                                            <label><input type="checkbox" name="title_is_official[]" /> 官方标题</label>
                                            <label><input type="checkbox" name="title_is_for_search[]" /> 仅用于搜索</label>
                                            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
                                        </div>
                                    </template>

                                    <button
                                        type="button"
                                        id="add-title-button"
                                        class="add-row-button"
                                        onclick="addRowFromTemplate('title-row-template', 'titles-list')"
                                    >
                                        Add Title
                                    </button>
                                </div>
                            )}

                            {section.listType === 'work-creators' && (
                                <div>
                                    <div id="creator-list" class="dynamic-list">
                                        {data?.work?.creator?.map((creator, index) =>
                                            renderCreatorRow(creator, options?.creators, index)
                                        )}
                                        {(!data?.work?.creator || data.work.creator.length === 0) &&
                                            renderCreatorRow(undefined, options?.creators, 0)
                                        }
                                    </div>

                                    <template id="creator-row-template">
                                        <div class="dynamic-list-item">
                                            <div class="md3-select-field">
                                                <select name="creator_uuid[]" required>
                                                    <option value="">Select Creator</option>
                                                    {options?.creators?.map(c => (
                                                        <option value={c.uuid}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <label class="md3-label">Creator</label>
                                                <div class="md3-state-layer"></div>
                                            </div>
                                            <input type="text" name="creator_role[]" placeholder="Role" required value="" />
                                            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
                                        </div>
                                    </template>

                                    <button
                                        type="button"
                                        id="add-creator-button"
                                        class="add-row-button"
                                        onclick="addRowFromTemplate('creator-row-template', 'creator-list')"
                                    >
                                        Add Creator
                                    </button>
                                </div>
                            )}

                            {section.listType === 'asset-creators' && (
                                <div>
                                    <div id="asset-creator-list" class="dynamic-list">
                                        {data?.asset?.creator?.map((creator, index) =>
                                            renderCreatorRow(creator, options?.creators, index)
                                        )}
                                        {(!data?.asset?.creator || data.asset.creator.length === 0) &&
                                            renderCreatorRow(undefined, options?.creators, 0)
                                        }
                                    </div>

                                    <template id="asset-creator-row-template">
                                        <div class="dynamic-list-item">
                                            <div class="md3-select-field">
                                                <select name="creator_uuid[]" required>
                                                    <option value="">Select Creator</option>
                                                    {options?.creators?.map(c => (
                                                        <option value={c.uuid}>{c.name}</option>
                                                    ))}
                                                </select>
                                                <label class="md3-label">Creator</label>
                                                <div class="md3-state-layer"></div>
                                            </div>
                                            <input type="text" name="creator_role[]" placeholder="Role" required value="" />
                                            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
                                        </div>
                                    </template>

                                    <button
                                        type="button"
                                        id="add-asset-creator-button"
                                        class="add-row-button"
                                        onclick="addRowFromTemplate('asset-creator-row-template', 'asset-creator-list')"
                                    >
                                        Add Creator
                                    </button>
                                </div>
                            )}

                            {section.listType === 'work-relations' && (
                                <div>
                                    <div id="relations-list" class="relations-list">
                                        {data?.work?.relation && data.work.relation.length > 0 ? (
                                            data.work.relation.map((relation, index) =>
                                                renderWorkRelationRow(relation, index)
                                            )
                                        ) : (
                                            <p class="no-items">暂无作品关系，请在关系管理页面添加</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {section.listType === 'creator-wikis' && (
                                <div>
                                    <div id="wikis-list" class="dynamic-list">
                                        {data?.creator?.wikis?.map((wiki, index) =>
                                            renderWikiRow(wiki, index)
                                        )}
                                        {(!data?.creator?.wikis || data.creator.wikis.length === 0) &&
                                            renderWikiRow(undefined, 0)
                                        }
                                    </div>

                                    <template id="wiki-row-template">
                                        <div class="dynamic-list-item">
                                            <input type="text" name="wiki_platform[]" placeholder="Wiki Platform" required value="" />
                                            <input type="text" name="wiki_id[]" placeholder="Wiki ID" required value="" />
                                            <button type="button" class="remove-row-button" onclick="this.parentElement.remove()">Remove</button>
                                        </div>
                                    </template>

                                    <button
                                        type="button"
                                        id="add-wiki-button"
                                        class="add-row-button"
                                        onclick="addRowFromTemplate('wiki-row-template', 'wikis-list')"
                                    >
                                        Add Wiki
                                    </button>
                                </div>
                            )}

                            {section.listType === 'media-sources' && (
                                <div>
                                    <div id="media-sources-list" class="media-sources-list">
                                        {data?.work?.media_sources && data.work.media_sources.length > 0 ? (
                                            data.work.media_sources.map((media, index) =>
                                                renderMediaSourceRow(media, index)
                                            )
                                        ) : (
                                            <p class="no-items">暂无媒体源，请在媒体源管理页面添加</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {section.listType === 'assets' && (
                                <div>
                                    <div id="assets-list" class="assets-list">
                                        {data?.work?.asset && data.work.asset.length > 0 ? (
                                            data.work.asset.map((asset, index) =>
                                                renderAssetRow(asset, index)
                                            )
                                        ) : (
                                            <p class="no-items">暂无资产，请在资产管理页面添加</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {section.listType === 'external-objects' && (
                                <div>
                                    <div id="external-objects-selector" class="external-objects-selector">
                                        {renderExternalObjectsSelector(options?.allExternalSources,
                                            data?.asset?.external_objects || data?.media?.external_objects,
                                            options?.allExternalObjects)}
                                    </div>
                                </div>
                            )}

                            {!['work-titles', 'work-creators', 'asset-creators', 'work-relations', 'creator-wikis', 'external-objects', 'media-sources', 'assets'].includes(section.listType || '') && (
                                <div class="dynamic-list-placeholder">
                                    <p>动态列表: {section.listType}</p>
                                    <button type="button" class="add-row-button">Add Item</button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 信息展示渲染 */}
                    {section.type === 'info-display' && (
                        <div class="info-display-section">
                            {data?.work_tags && data.work_tags.length > 0 && (
                                <div class="info-item">
                                    <strong>标签:</strong>
                                    <div class="info-chips">
                                        {data.work_tags.map((tag: any) => (
                                            <span class="info-chip tag-chip">{tag.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {data?.work_categories && data.work_categories.length > 0 && (
                                <div class="info-item">
                                    <strong>分类:</strong>
                                    <div class="info-chips">
                                        {data.work_categories.map((category: any) => (
                                            <span class="info-chip category-chip">{category.name}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(!data?.work_tags || data.work_tags.length === 0) && (!data?.work_categories || data.work_categories.length === 0) && (
                                <p class="no-items">暂无标签和分类信息</p>
                            )}
                        </div>
                    )}

                    {/* 选择器渲染 */}
                    {section.type === 'selector' && (
                        <div class="selector-container">
                            {section.selectorType === 'tags' && (
                                <MultiSelector
                                    type="tags"
                                    data={options?.tags || []}
                                    selectedItems={data?.work?.tags || []}
                                    label="标签"
                                    placeholder="搜索标签..."
                                />
                            )}

                            {section.selectorType === 'categories' && (
                                <MultiSelector
                                    type="categories"
                                    data={options?.categories || []}
                                    selectedItems={data?.work?.categories || []}
                                    label="分类"
                                    placeholder="搜索分类..."
                                />
                            )}

                            {!['tags', 'categories'].includes(section.selectorType || '') && (
                                <div class="selector-placeholder">
                                    <p>选择器: {section.selectorType}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </>
    );
}
