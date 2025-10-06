// API communication layer module

import { API_BASE_URL, jwtToken } from '../core/config.js';

// --- API Utilities ---
export async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
    }
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (response.status === 401) {
        // Import showLogin function from auth module
        const { showLogin } = await import('../core/auth.js');
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