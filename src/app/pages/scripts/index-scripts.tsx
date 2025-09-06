export const IndexScripts = (props: { works: any[] }) => `
const workList = document.getElementById('workList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const searchType = document.getElementById('searchType');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const paginationContainer = document.getElementById('pagination');

function setupEventListeners() {
    workList.addEventListener('click', function(e) {
        const workItem = e.target.closest('.work-item');
        if (workItem) {
            const songId = workItem.dataset.id;
            window.location.href = \`/player?uuid=\${songId}\`;
        }
        
        const playBtn = e.target.closest('.work-play-btn');
        if (playBtn) {
            e.stopPropagation();
            const workItem = playBtn.closest('.work-item');
            const songId = workItem.dataset.id;
            window.location.href = \`/player?uuid=\${songId}\`;
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
        window.location.href = \`/?search=\${encodeURIComponent(query)}&type=\${encodeURIComponent(type)}\`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
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