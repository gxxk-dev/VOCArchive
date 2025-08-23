import { jsx } from 'hono/jsx'

export const FloatingSearch = () => {
    return (
        <div class="floating-search">
            <select id="searchType" class="search-type-selector">
                <option value="all">全部</option>
                <option value="title">标题</option>
                <option value="creator">作者</option>
            </select>
            <input type="text" class="floating-search-input" placeholder="搜索歌曲、艺术家..." id="searchInput" />
            <button class="floating-search-btn" id="searchButton">
                <i class="fas fa-search"></i>
            </button>
        </div>
    )
}