// Theme management module

let themeToggle, themeIcon;

// Initialize DOM elements for theme management
export function initializeThemeElements() {
    themeToggle = document.getElementById('theme-toggle');
    themeIcon = document.getElementById('theme-icon');
}

// --- Theme Management Functions ---
export function getTheme() {
    return localStorage.getItem('theme') || 'light';
}

export function setTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeIcon(theme);

    // Notify iframe about theme change
    const iframe = document.getElementById('content');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'theme-change',
            theme: theme
        }, '*');
    }
}

export function updateThemeIcon(theme) {
    if (themeIcon) {
        if (theme === 'dark') {
            themeIcon.className = 'fas fa-sun';
            if (themeToggle) {
                themeToggle.title = '切换到浅色模式';
            }
        } else {
            themeIcon.className = 'fas fa-moon';
            if (themeToggle) {
                themeToggle.title = '切换到深色模式';
            }
        }
    }
}

export function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// Initialize theme on page load
export function initializeTheme() {
    const savedTheme = getTheme();
    setTheme(savedTheme);
}