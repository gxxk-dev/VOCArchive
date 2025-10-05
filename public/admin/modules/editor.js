// Editor module for handling iframe-based editing functionality

let currentEditType = null;
let currentEditUuid = null;
let isEditorMode = false;

// Editor DOM elements
let editorContainer = null;
let editorTitle = null;
let editorFormContainer = null;
let editorForm = null;
let editorSaveButton = null;
let editorCancelButton = null;
let editorLoading = null;
let editorError = null;
let editorErrorText = null;

/**
 * Initialize editor module
 * @param {string} type - Type of content to edit
 * @param {string} uuid - UUID of item to edit
 */
export function initializeEditor(type = null, uuid = null) {
    console.log('Initializing editor...', { type, uuid });

    // Get editor DOM elements
    editorContainer = document.getElementById('editor-container');
    editorTitle = document.getElementById('editor-title');
    editorFormContainer = document.getElementById('editor-form-container');
    editorForm = document.getElementById('editor-form');
    editorSaveButton = document.getElementById('editor-save');
    editorCancelButton = document.getElementById('editor-cancel');
    editorLoading = document.getElementById('editor-loading');
    editorError = document.getElementById('editor-error');
    editorErrorText = document.getElementById('editor-error-text');

    if (!editorContainer) {
        console.error('Editor container not found');
        return;
    }

    // Set up event listeners
    setupEditorEventListeners();

    // If type and uuid are provided, load the editor content
    if (type && uuid) {
        loadEditorContent(type, uuid);
    } else if (type) {
        // New item creation
        loadEditorContent(type, null);
    }

    console.log('Editor initialized successfully');
}

/**
 * Set up event listeners for editor
 */
function setupEditorEventListeners() {
    if (editorSaveButton) {
        editorSaveButton.addEventListener('click', handleEditorSave);
    }

    if (editorCancelButton) {
        editorCancelButton.addEventListener('click', handleEditorCancel);
    }

    if (editorForm) {
        editorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleEditorSave();
        });
    }
}

/**
 * Load editor content for specific type and item
 * @param {string} type - Content type
 * @param {string} uuid - Item UUID (null for new items)
 */
async function loadEditorContent(type, uuid) {
    console.log('Loading editor content...', { type, uuid });

    currentEditType = type;
    currentEditUuid = uuid;
    isEditorMode = true;

    showLoading();
    hideError();

    try {
        // Update editor title
        const isNewItem = !uuid;
        const actionText = isNewItem ? '新建' : '编辑';
        const typeDisplayName = getTypeDisplayName(type);

        if (editorTitle) {
            editorTitle.textContent = `${actionText}${typeDisplayName}`;
        }

        // Load form generator and create form
        const { generateFormFields } = await import('./form-generator.js');
        const { apiFetch } = await import('./api.js');

        let itemData = null;
        if (uuid) {
            // Load existing item data
            itemData = await apiFetch(`/get/${type}/${uuid}`);
        }

        // Generate form fields
        const formHtml = await generateFormFields(type, itemData);

        if (editorForm) {
            editorForm.innerHTML = formHtml;
        }

        // Initialize form elements (selectors, etc.)
        const { initializeFormElements } = await import('./form-handler.js');
        initializeFormElements();

        showFormContainer();
        hideLoading();

        console.log('Editor content loaded successfully');

    } catch (error) {
        console.error('Failed to load editor content:', error);
        showError(`加载编辑器内容失败: ${error.message}`);
        hideLoading();
    }
}

/**
 * Handle editor save action
 */
async function handleEditorSave() {
    console.log('Saving editor content...');

    if (!currentEditType || !editorForm) {
        console.error('Cannot save: missing type or form');
        return;
    }

    try {
        hideError();

        // Disable save button during save
        if (editorSaveButton) {
            editorSaveButton.disabled = true;
            editorSaveButton.textContent = '保存中...';
        }

        // Get form data
        const formData = new FormData(editorForm);
        const data = Object.fromEntries(formData.entries());

        const { apiFetch } = await import('./api.js');

        // Determine endpoint based on whether it's a new item or edit
        const isNewItem = !currentEditUuid;
        const endpoint = isNewItem ? `/input/${currentEditType}` : `/update/${currentEditType}`;

        // Add UUID for updates
        if (!isNewItem) {
            data.uuid = currentEditUuid;
        }

        // Send data to API
        const result = await apiFetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        console.log('Save successful:', result);

        // Notify parent window about successful save
        window.parent.postMessage({
            type: 'editor-save-success',
            data: {
                action: isNewItem ? 'create' : 'update',
                type: currentEditType,
                uuid: currentEditUuid || result.uuid,
                result: result
            }
        }, '*');

        // Close editor or reset form for new items
        if (isNewItem) {
            // Reset form for creating another item
            editorForm.reset();
            showSuccess('保存成功！可以继续创建新项目。');
        } else {
            // Close editor for updates
            handleEditorCancel();
        }

    } catch (error) {
        console.error('Save failed:', error);
        showError(`保存失败: ${error.message}`);
    } finally {
        // Re-enable save button
        if (editorSaveButton) {
            editorSaveButton.disabled = false;
            editorSaveButton.textContent = '保存';
        }
    }
}

/**
 * Handle editor cancel action
 */
function handleEditorCancel() {
    console.log('Cancelling editor...');

    // Notify parent window to close editor
    window.parent.postMessage({
        type: 'editor-cancel',
        data: {
            type: currentEditType,
            uuid: currentEditUuid
        }
    }, '*');

    // Reset editor state
    resetEditor();
}

/**
 * Reset editor to initial state
 */
function resetEditor() {
    currentEditType = null;
    currentEditUuid = null;
    isEditorMode = false;

    if (editorForm) {
        editorForm.innerHTML = '';
    }

    if (editorTitle) {
        editorTitle.textContent = '编辑器';
    }

    hideFormContainer();
    hideError();
    hideLoading();
}

/**
 * Show loading state
 */
function showLoading() {
    if (editorLoading) {
        editorLoading.classList.remove('hidden');
    }
}

/**
 * Hide loading state
 */
function hideLoading() {
    if (editorLoading) {
        editorLoading.classList.add('hidden');
    }
}

/**
 * Show form container
 */
function showFormContainer() {
    if (editorFormContainer) {
        editorFormContainer.classList.remove('hidden');
    }
}

/**
 * Hide form container
 */
function hideFormContainer() {
    if (editorFormContainer) {
        editorFormContainer.classList.add('hidden');
    }
}

/**
 * Show error message
 * @param {string} message - Error message to show
 */
function showError(message) {
    if (editorError && editorErrorText) {
        editorErrorText.textContent = message;
        editorError.classList.remove('hidden');
    }
}

/**
 * Hide error message
 */
function hideError() {
    if (editorError) {
        editorError.classList.add('hidden');
    }
}

/**
 * Show success message
 * @param {string} message - Success message to show
 */
function showSuccess(message) {
    // For now, just log success. Could be enhanced with a success notification
    console.log('Success:', message);

    // Could add a temporary success message display here
    if (editorErrorText && editorError) {
        editorErrorText.textContent = message;
        editorError.style.color = 'green';
        editorError.classList.remove('hidden');

        // Hide after 3 seconds
        setTimeout(() => {
            hideError();
            editorError.style.color = ''; // Reset color
        }, 3000);
    }
}

/**
 * Get display name for content type
 * @param {string} type - Content type
 * @returns {string} Display name
 */
function getTypeDisplayName(type) {
    const typeNames = {
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
        'wiki_platform': 'Wiki平台',
        'site_config': '系统配置'
    };

    return typeNames[type] || type;
}

/**
 * Get current editor state
 * @returns {object} Editor state
 */
export function getEditorState() {
    return {
        type: currentEditType,
        uuid: currentEditUuid,
        isEditorMode: isEditorMode
    };
}

/**
 * Check if editor is currently active
 * @returns {boolean} True if editor is active
 */
export function isEditorActive() {
    return isEditorMode;
}