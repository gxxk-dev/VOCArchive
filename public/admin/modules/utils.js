// General utility functions module

import { adminTitleTemplate, tabNames, allExternalSources, allExternalObjects } from './config.js';

// --- Cell Content Rendering ---
export function renderCellContent(data) {
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

// --- Page Title Management ---
export function updatePageTitle(tabId) {
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

// --- Filter Functions ---
export function filterTags(searchTerm) {
    const checkboxes = document.querySelectorAll('#tag-checkboxes .tag-checkbox');
    checkboxes.forEach(checkbox => {
        const tagName = checkbox.querySelector('.tag-chip').textContent.toLowerCase();
        const matches = tagName.includes(searchTerm.toLowerCase());
        checkbox.style.display = matches ? 'flex' : 'none';
    });
}

export function filterCategories(searchTerm) {
    const checkboxes = document.querySelectorAll('#category-checkboxes .category-checkbox');
    checkboxes.forEach(checkbox => {
        const categoryName = checkbox.querySelector('.category-name').textContent.toLowerCase();
        const matches = categoryName.includes(searchTerm.toLowerCase());
        checkbox.style.display = matches ? 'flex' : 'none';
    });
}

export function filterExternalObjects(searchTerm) {
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

// --- External Objects Management ---
export function enhanceExternalObjectFilter(field) {
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

export function renderExternalObjectsList(objects, container, selectedObjects = []) {
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

// --- Clipboard Utils ---
export function copyToClipboard(text, element) {
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

// --- General Utilities ---
// Helper to get a value from a potentially nested object
export function get(obj, path, defaultValue = null) {
    const value = path.split('.').reduce((a, b) => (a ? a[b] : undefined), obj);
    return value !== undefined && value !== null ? value : defaultValue;
}