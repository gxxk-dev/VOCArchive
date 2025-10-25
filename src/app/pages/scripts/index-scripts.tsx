export const IndexScripts = (props: { works: any[] }) => `
// MD3 Select Enhancement for Frontend
class MD3SelectFrontend {
    constructor() {
        this.init();
    }

    init() {
        this.initializeExistingFields();
        this.setupMutationObserver();
    }

    initializeExistingFields() {
        const selectFields = document.querySelectorAll('.md3-select-field');
        selectFields.forEach(field => this.enhanceSelectField(field));
    }

    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList && node.classList.contains('md3-select-field')) {
                        this.enhanceSelectField(node);
                    }
                });
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    enhanceSelectField(field) {
        const select = field.querySelector('select');
        if (!select || select.hasAttribute('data-md3-enhanced')) return;
        
        select.setAttribute('data-md3-enhanced', 'true');
        
        const updateFieldState = () => {
            const hasValue = select.value && select.value.trim() !== '';
            if (hasValue) {
                field.classList.add('has-value');
            } else {
                field.classList.remove('has-value');
            }
        };
        
        select.addEventListener('change', updateFieldState);
        select.addEventListener('focus', () => field.classList.add('focused'));
        select.addEventListener('blur', () => {
            field.classList.remove('focused');
            updateFieldState();
        });
        
        updateFieldState();
    }
}

const workList = document.getElementById('workList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchType = document.getElementById('searchType');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const paginationContainer = document.getElementById('pagination');
const languageSelectorBtn = document.getElementById('languageSelectorBtn');
const languageDropdown = document.getElementById('languageDropdown');

function setupEventListeners() {
    workList.addEventListener('click', function(e) {
        const workItem = e.target.closest('.work-item');
        if (workItem) {
            const songId = workItem.dataset.id;
            window.location.href = \`/player?index=\${songId}\`;
        }
        
        const playBtn = e.target.closest('.work-play-btn');
        if (playBtn) {
            e.stopPropagation();
            const workItem = playBtn.closest('.work-item');
            const songId = workItem.dataset.id;
            window.location.href = \`/player?index=\${songId}\`;
        }
    });
    
    paginationContainer.addEventListener('click', function(e) {
        const btn = e.target.closest('.pagination-btn');
        if (!btn || btn.disabled) return;
        
        if (btn.id === 'prevPage') {
            changePage(-1);
        } else if (btn.id === 'nextPage') {
            changePage(1);
        } else if (btn.dataset.page) {
            goToPage(parseInt(btn.dataset.page));
        }
    });

    searchButton.addEventListener('click', searchMusic);
    searchInput.addEventListener('keyup', function(e) {
        if (e.key === 'Enter') {
            searchMusic();
        }
    });

    // Language selector events
    if (languageSelectorBtn && languageDropdown) {
        languageSelectorBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            languageDropdown.classList.toggle('open');
        });

        languageDropdown.addEventListener('click', function(e) {
            const option = e.target.closest('.language-option');
            if (option) {
                const selectedLang = option.dataset.lang;
                changeLanguage(selectedLang);
            }
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.language-selector')) {
                languageDropdown.classList.remove('open');
            }
        });
    }
}

function changePage(direction) {
    const params = new URLSearchParams(window.location.search);
    let page = parseInt(params.get('page') || '1');
    page += direction;
    if (page > 0) {
        params.set('page', page.toString());
        window.location.search = params.toString();
    }
}

function goToPage(page) {
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    window.location.search = params.toString();
}

function searchMusic() {
    const query = searchInput.value.trim();
    const type = searchType.value;
    if (query) {
        // Clear any existing filters when searching
        window.location.href = \`/?search=\${encodeURIComponent(query)}&type=\${encodeURIComponent(type)}\`;
    }
}

function clearFilter() {
    // Remove tag and category parameters but preserve search and page
    const params = new URLSearchParams(window.location.search);
    params.delete('tag');
    params.delete('category');
    params.delete('page'); // Reset to first page when clearing filter
    
    const newUrl = params.toString() ? \`/?\${params.toString()}\` : '/';
    window.location.href = newUrl;
}

function clearSearch() {
    // Remove search parameters but preserve filter and reset page
    const params = new URLSearchParams(window.location.search);
    params.delete('search');
    params.delete('type');
    params.delete('page'); // Reset to first page when clearing search
    
    const newUrl = params.toString() ? \`/?\${params.toString()}\` : '/';
    window.location.href = newUrl;
}

function changeLanguage(language) {
    const params = new URLSearchParams(window.location.search);
    if (language === 'auto') {
        params.delete('lang');
    } else {
        params.set('lang', language);
    }
    
    const newUrl = params.toString() ? \`/?\${params.toString()}\` : '/';
    window.location.href = newUrl;
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize MD3 selects
    new MD3SelectFrontend();
    
    setupEventListeners();

    const params = new URLSearchParams(window.location.search);
    const currentPage = parseInt(params.get('page') || '1');
    const workCountOnPage = ${props.works.length};

    if (prevPageBtn) {
        prevPageBtn.disabled = currentPage <= 1;
    }
    if (nextPageBtn) {
        nextPageBtn.disabled = workCountOnPage < 10;
    }
});
`