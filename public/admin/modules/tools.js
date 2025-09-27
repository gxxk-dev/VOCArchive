// Tools and utilities module

import { apiFetch } from './api.js';

let generateUuidButton, generatedUuidResult;

// Initialize DOM elements for tools
export function initializeToolElements() {
    // Tool Zone elements
    generateUuidButton = document.getElementById('generate-uuid-button');
    generatedUuidResult = document.getElementById('generated-uuid-result');
}

// --- UUID Generation ---
export function setupUuidGeneration() {
    if (generateUuidButton && generatedUuidResult) {
        generateUuidButton.addEventListener('click', () => {
            generatedUuidResult.value = crypto.randomUUID();
        });
    }
}