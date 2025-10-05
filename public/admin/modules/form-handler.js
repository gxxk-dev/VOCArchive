// Form handling module

import { apiFetch } from './api.js';
import {
    setCurrentEditUUID,
    currentEditUUID,
    setAllCreators,
    setAllWorks,
    allExternalObjects
} from './config.js';
import { generateFormFields, addDynamicListItem, createTitleRow, createCreatorRow, createWikiRow, createAssetCreatorRow } from './form-generator.js';
import { renderExternalObjectsList, enhanceExternalObjectFilter } from './utils.js';

let modal, modalForm, formTitle, formError;

// Initialize DOM elements for form handling
export function initializeFormElements() {
    modal = document.getElementById('form-modal');
    modalForm = document.getElementById('modal-form');
    formTitle = document.getElementById('form-title');
    formError = document.getElementById('form-error');
}

// --- Form Modal Management ---
export async function showFormModal(target, data = null) {
    // Set currentEditUUID based on target type and data structure
    if (data) {
        switch (target) {
            case 'work':
                setCurrentEditUUID(data.work_uuid || data.uuid);
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
                setCurrentEditUUID(data.uuid);
                break;
            case 'site_config':
                setCurrentEditUUID(data.key);
                break;
            default:
                setCurrentEditUUID(data.uuid);
                break;
        }
    } else {
        setCurrentEditUUID(null);
    }

    const mode = data ? 'Edit' : 'Create New';
    formTitle.textContent = `${mode} ${target.charAt(0).toUpperCase() + target.slice(1)}`;
    formError.textContent = '';

    // Pre-fetch data needed for selectors
    const options = {};
    try {
        if (['work', 'asset'].includes(target)) {
            const allCreators = await apiFetch(`/list/creator/1/999`);
            setAllCreators(allCreators);
            options.creators = allCreators;
        }
        if (['media', 'asset', 'relation'].includes(target)) {
            const allWorks = await apiFetch(`/list/work/1/999`);
            setAllWorks(allWorks);
            options.works = allWorks;
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

    modalForm.innerHTML = generateFormFields(target, data, options);
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

// --- Form Submission Handler ---
export async function handleFormSubmit(e, target, isUpdate) {
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
                    isIPFS: formData.get('isIPFS') === 'on' || false,
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
            case 'wiki_platform':
                body = {
                    platform_key: formData.get('platform_key'),
                    platform_name: formData.get('platform_name'),
                    url_template: formData.get('url_template'),
                    icon_class: formData.get('icon_class') || null
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
        } else if (target === 'wiki_platform') {
            if (isUpdate) {
                endpoint = `/update/wiki_platform`;
                method = 'POST';
            } else {
                endpoint = `/input/wiki_platform`;
                method = 'POST';
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
        // Refresh the table
        const { loadContent } = await import('./crud-handlers.js');
        const { currentTab } = await import('./config.js');
        loadContent(currentTab);
    } catch (error) {
        formError.textContent = `Failed to ${isUpdate ? 'update' : 'create'} item: ${error.message}. Check JSON format.`;
    }
}

// --- Modal Event Handlers (for dynamic lists) ---
export function setupModalEventListeners() {
    modalForm.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row-button')) {
            e.target.closest('.dynamic-list-item').remove();
        }
        if (e.target.id === 'add-title-button') {
            addDynamicListItem('titles-list', createTitleRow());
        }
        if (e.target.id === 'add-creator-button') {
            const { allCreators } = require('./config.js');
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
}