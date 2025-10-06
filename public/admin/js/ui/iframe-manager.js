// UI > Iframe Manager

/**
 * Show editor modal
 * @param {HTMLElement} editorModal - The editor modal element
 */
export function showEditorModal(editorModal) {
    if (editorModal) {
        editorModal.classList.remove('hidden');
    }
}

/**
 * Hide editor modal
 * @param {HTMLElement} editorModal - The editor modal element
 */
export function hideEditorModal(editorModal) {
    if (editorModal) {
        editorModal.classList.add('hidden');
    }
}

/**
 * Load editor for creating new item
 * @param {HTMLIFrameElement} editor - The editor iframe element
 * @param {HTMLElement} editorModal - The editor modal element
 * @param {string} type - Item type to create
 */
export async function loadEditorForCreate(editor, editorModal, type) {
    console.log('Loading editor for create:', type);

    if (!editor || !editorModal) {
        console.error('Editor iframe or modal not found');
        return;
    }

    // Get JWT token for editor authorization
    const { jwtToken } = await import('../core/config.js');
    const editorUrl = `/admin/editor?type=${encodeURIComponent(type)}&token=${encodeURIComponent(jwtToken)}`;

    editor.src = editorUrl;
    showEditorModal(editorModal);
}

/**
 * Load editor for editing existing item
 * @param {HTMLIFrameElement} editor - The editor iframe element
 * @param {HTMLElement} editorModal - The editor modal element
 * @param {string} type - Item type
 * @param {string} uuid - Item UUID
 */
export async function loadEditorForEdit(editor, editorModal, type, uuid) {
    console.log('Loading editor for edit:', { type, uuid });

    if (!editor || !editorModal) {
        console.error('Editor iframe or modal not found');
        return;
    }

    // Get JWT token for editor authorization
    const { jwtToken } = await import('../core/config.js');
    const editorUrl = `/admin/editor?type=${encodeURIComponent(type)}&uuid=${encodeURIComponent(uuid)}&token=${encodeURIComponent(jwtToken)}`;

    editor.src = editorUrl;
    showEditorModal(editorModal);
}

/**
 * Close editor modal
 * @param {HTMLIFrameElement} editor - The editor iframe element
 * @param {HTMLElement} editorModal - The editor modal element
 */
export function closeEditor(editor, editorModal) {
    console.log('Closing editor modal');
    hideEditorModal(editorModal);

    if (editor) {
        editor.src = '';
    }
}
