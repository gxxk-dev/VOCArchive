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
            // Check if clicked on tag/category chips or more button
            if (e.target.closest('.tag-chip') || e.target.closest('.category-chip') || e.target.closest('.tags-more')) {
                e.stopPropagation();
                handleTagCategoryClick(e);
                return;
            }
            
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

function handleTagCategoryClick(e) {
    const target = e.target.closest('.tag-chip, .category-chip, .tags-more');
    
    if (target.classList.contains('tag-chip')) {
        const tagUuid = target.dataset.tag;
        if (tagUuid) {
            window.location.href = \`/?tag=\${encodeURIComponent(tagUuid)}\`;
        }
    } else if (target.classList.contains('category-chip')) {
        const categoryUuid = target.dataset.category;
        if (categoryUuid) {
            window.location.href = \`/?category=\${encodeURIComponent(categoryUuid)}\`;
        }
    } else if (target.classList.contains('tags-more')) {
        expandTags(target);
    }
}

function expandTags(moreButton) {
    const workId = moreButton.dataset.work;
    const workItem = document.querySelector(\`[data-id="\${workId}"]\`);
    if (!workItem) return;
    
    const tagsContainer = workItem.querySelector('.work-tags');
    if (!tagsContainer) return;
    
    // Get all hidden tags from the works data
    const workData = ${JSON.stringify(props.works)};
    const work = workData.find(w => w.work_uuid === workId);
    if (!work || !work.tags) return;
    
    // Show all hidden tags
    const hiddenTags = work.tags.slice(3);
    const tagsHtml = hiddenTags.map(tag => 
        \`<span class="tag-chip" data-tag="\${tag.uuid}">\${tag.name}</span>\`
    ).join('');
    
    // Replace the "more" button with the hidden tags
    moreButton.outerHTML = tagsHtml;
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