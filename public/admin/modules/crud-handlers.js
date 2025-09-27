// CRUD operations handling module

import { apiFetch } from './api.js';
import { updatePageTitle } from './utils.js';
import { renderTable } from './render-tables.js';
import { showFormModal } from './form-handler.js';

let content; // Global reference to content element

// Initialize DOM elements for CRUD operations
export function initializeCrudElements() {
    content = document.getElementById('content');
}

// --- Content Loading ---
export async function loadContent(target) {
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
            console.log("Get Config:", data);
        } else {
            endpoint = `/list/${target}/1?pageSize=999`;
            data = await apiFetch(endpoint);
        }
        renderTable(target, data);
    } catch (error) {
        content.innerHTML = `<p class="error-message">Failed to load ${target}: ${error.message}</p>`;
    }
}

// --- Edit & Delete Logic ---
export async function handleEdit(e) {
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
            console.log(data);
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
        console.log(data);
        showFormModal(target, data);
    } catch (error) {
        alert(`Failed to fetch item details: ${error.message}`);
    }
}

export async function handleDelete(e) {
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