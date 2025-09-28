import { jsx } from 'hono/jsx'

export const FloatingSearch = () => {
    return (
        <div class="floating-search">
            <div class="md3-select-field search-select-field">
                <select id="searchType" class="search-type-selector">
                    <option value="all">全部</option>
                    <option value="title">标题</option>
                    <option value="creator">作者</option>
                </select>
                <label class="md3-label">搜索类型</label>
                <div class="md3-state-layer"></div>
            </div>
            <input type="text" class="floating-search-input" placeholder="查找作品..." id="searchInput" />
            <button class="floating-search-btn" id="searchButton">
                <i class="fas fa-search"></i>
            </button>
        </div>
    )
}