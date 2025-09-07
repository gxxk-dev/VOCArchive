export const IndexStyles = `
body {
    padding: var(--spacing-md);
}

/* 主容器 */
.page-container {
    max-width: 100%;
    margin: 0 auto;
    background: var(--card-bg);
    backdrop-filter: blur(25px);
    border-radius: var(--card-radius);
    padding: var(--spacing-xl);
    box-shadow: 
        var(--shadow-md),
        0 0 0 1px rgba(255, 255, 255, 0.08);
    border: 1px solid var(--card-border);
    transition: all 0.5s ease;
    animation: fadeInUp 0.8s ease-out;
}

/* 浮动搜索 */
.floating-search {
    position: fixed;
    top: var(--spacing-md);
    right: var(--spacing-md);
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(20, 20, 20, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: var(--element-radius);
    padding: var(--spacing-sm) 16px;
    box-shadow: 
        var(--shadow-md),
        0 0 0 1px rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
    min-width: 280px;
    animation: slideInRight 0.6s ease-out;
}

.floating-search:hover {
    background: rgba(25, 25, 25, 0.9);
    border-color: rgba(120, 119, 198, 0.3);
    transform: translateY(-2px);
    box-shadow: 
        var(--shadow-lg),
        0 0 0 1px rgba(255, 255, 255, 0.08);
}

.floating-search-input {
    flex: 1;
    background: transparent;
    color: var(--text-primary);
    border: none;
    font-size: 0.95rem;
    font-weight: 400;
    outline: none;
    padding: 4px 0;
}

.search-type-selector {
    background: rgba(40, 40, 40, 0.8);
    color: var(--text-primary);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 6px 10px;
    font-size: 0.85rem;
    outline: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.search-type-selector:hover {
    background: rgba(50, 50, 50, 0.9);
    border-color: rgba(120, 119, 198, 0.3);
}

.search-type-selector:focus {
    border-color: rgba(120, 119, 198, 0.5);
}

.floating-search-input::placeholder {
    color: #666;
}

.floating-search-btn {
    background: var(--primary-gradient);
    border: none;
    border-radius: 10px;
    color: white;
    cursor: pointer;
    padding: 8px 12px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.floating-search-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(124, 119, 198, 0.4);
}

/* 头部区域 */
.page-header {
    text-align: center;
    margin-bottom: 50px;
    position: relative;
}

.page-header::before {
    content: '';
    position: absolute;
    top: -16px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, #7c77c6, #ff77c6, #77dbff);
    border-radius: 2px;
}

/* 筛选信息 */
.filter-info, .search-info {
    background: rgba(40, 40, 40, 0.8);
    border: 1px solid rgba(124, 119, 198, 0.3);
    border-radius: var(--element-radius);
    padding: var(--spacing-md);
    margin: var(--spacing-lg) auto;
    max-width: 600px;
    backdrop-filter: blur(10px);
}

.filter-indicator, .search-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-xs);
    flex-wrap: wrap;
}

.filter-text, .search-text {
    color: var(--text-primary);
    font-size: 0.95rem;
}

.clear-filter-btn, .clear-search-btn {
    background: rgba(255, 77, 77, 0.2);
    border: 1px solid rgba(255, 77, 77, 0.4);
    color: #ff6b6b;
    border-radius: 20px;
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
}

.clear-filter-btn:hover, .clear-search-btn:hover {
    background: rgba(255, 77, 77, 0.3);
    transform: translateY(-1px);
}

.filter-stats, .search-stats, .all-works-stats {
    color: var(--text-secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: var(--spacing-xs);
}

.page-title {
    font-size: clamp(2rem, 5vw, 2.8rem);
    font-weight: 700;
    margin-bottom: var(--spacing-sm);
    background: linear-gradient(135deg, #ffffff, #b0b0b0);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.02em;
}

.page-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.1rem);
    color: var(--text-secondary);
    font-weight: 400;
}

/* 歌曲列表区域 */
.work-list-section {
    background: rgba(25, 25, 25, 0.6);
    border-radius: var(--element-radius);
    padding: var(--spacing-lg);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

.section-title {
    font-size: clamp(1.2rem, 3.5vw, 1.5rem);
    font-weight: 600;
    color: #ddd;
    margin-bottom: var(--spacing-lg);
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    justify-content: center;
    flex-wrap: wrap;
}

.section-title i {
    color: #7c77c6;
    font-size: 0.9em;
}

/* 内联筛选指示器 */
.filter-indicator-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(124, 119, 198, 0.15);
    border: 1px solid rgba(124, 119, 198, 0.3);
    border-radius: 20px;
    padding: 4px 12px;
    margin-left: var(--spacing-sm);
    font-size: 0.8em;
    color: var(--text-primary);
}

.filter-indicator-inline i {
    color: #7c77c6;
    font-size: 0.9em;
}

.filter-name {
    color: var(--text-primary);
    font-weight: 500;
}

.clear-filter-btn-inline {
    background: rgba(255, 77, 77, 0.2);
    border: 1px solid rgba(255, 77, 77, 0.4);
    color: #ff6b6b;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.7em;
    margin-left: 2px;
}

.clear-filter-btn-inline:hover {
    background: rgba(255, 77, 77, 0.3);
    transform: scale(1.1);
}

.filter-stats-inline {
    color: var(--text-secondary);
    font-size: 0.85rem;
    text-align: center;
    margin-top: -var(--spacing-sm);
    margin-bottom: var(--spacing-lg);
}

.work-list {
    display: grid;
    gap: var(--spacing-sm);
    grid-template-columns: 1fr;
}

/* 宽屏布局 - 2列 */
@media (min-width: 1024px) {
    .work-list {
        grid-template-columns: 1fr 1fr;
        gap: var(--spacing-md);
    }
}

.work-item {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
    background: rgba(35, 35, 35, 0.6);
    border-radius: var(--element-radius);
    cursor: pointer;
    transition: all 0.4s ease;
    border: 1px solid rgba(255, 255, 255, 0.06);
    position: relative;
    overflow: hidden;
    animation: fadeInUp 0.5s ease-out;
    animation-fill-mode: both;
}

.work-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), transparent);
    transition: left 0.6s ease;
}

.work-item:hover::before {
    left: 100%;
}

.work-item:hover {
    background: rgba(50, 50, 50, 0.8);
    transform: translateY(-6px) scale(1.02);
    border-color: rgba(120, 119, 198, 0.3);
    box-shadow: var(--shadow-lg);
}

.work-preview {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    object-fit: cover;
    background: linear-gradient(135deg, #7c77c6, #6366f1);
}

.work-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
}

.work-title {
    font-size: clamp(1.05rem, 2.8vw, 1.2rem);
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
}

.work-artist {
    font-size: clamp(0.9rem, 2.2vw, 1rem);
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
}

/* 标签和分类样式 */
.work-tags, .work-categories {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 0.85rem;
    flex-wrap: wrap;
}

.work-tags i, .work-categories i {
    color: #999;
    font-size: 0.8rem;
}

.tag-chip, .category-chip {
    background: rgba(120, 119, 198, 0.2);
    color: #bbb;
    padding: 2px 6px;
    border-radius: 10px;
    font-size: 0.75rem;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(120, 119, 198, 0.3);
}

.tag-chip:hover, .category-chip:hover {
    background: rgba(120, 119, 198, 0.3);
    color: #ddd;
    transform: translateY(-1px);
}

.tags-more {
    color: #888;
    font-size: 0.75rem;
    cursor: pointer;
    font-style: italic;
    padding: 2px 4px;
    border-radius: 6px;
    transition: all 0.3s ease;
}

.tags-more:hover {
    color: #bbb;
    background: rgba(255, 255, 255, 0.05);
}

.category-separator {
    color: #666;
    font-size: 0.7rem;
}

.work-play-btn {
    width: 48px;
    height: 48px;
    background: var(--primary-gradient);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    opacity: 0;
    flex-shrink: 0;
}

.work-item:hover .work-play-btn {
    opacity: 1;
}

.work-play-btn:hover {
    transform: scale(1.15);
    box-shadow: 0 8px 25px rgba(124, 119, 198, 0.5);
}

/* 分页 */
.pagination {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    margin-top: var(--spacing-xl);
}

.pagination-info {
    color: var(--text-secondary);
    font-size: 0.9rem;
    margin-bottom: var(--spacing-xs);
}

.pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--spacing-sm);
    flex-wrap: wrap;
}

.pagination-current {
    color: var(--text-secondary);
    font-size: 0.9rem;
    padding: 0 var(--spacing-sm);
}

.pagination-btn {
    padding: var(--spacing-sm) 18px;
    background: rgba(40, 40, 40, 0.7);
    color: #ccc;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--element-radius);
    cursor: pointer;
    font-size: clamp(0.85rem, 2vw, 0.95rem);
    transition: all 0.3s ease;
    white-space: nowrap;
}

.pagination-btn:hover {
    background: rgba(60, 60, 60, 0.8);
    color: #fff;
    transform: translateY(-2px);
}

.pagination-btn.active {
    background: var(--primary-gradient);
    color: white;
    border-color: #7c77c6;
}

.pagination-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.no-results {
    text-align: center;
    color: var(--text-secondary);
    padding: var(--spacing-xl);
    font-size: 1.1rem;
}

/* 加载动画 */
.loader {
    display: flex;
    justify-content: center;
    padding: 40px 0;
}

.loader-dots {
    display: flex;
    gap: 8px;
}

.loader-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--primary-gradient);
    animation: pulse 1.2s infinite;
}

.loader-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.loader-dot:nth-child(3) {
    animation-delay: 0.4s;
}

/* 响应式设计 */
@media (max-width: 1023px) {
    .work-list {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    body {
        padding: 15px;
    }
    
    .page-container {
        padding: 24px;
        border-radius: 20px;
    }
    
    .work-list-section {
        padding: 24px;
    }
    
    .work-item {
        padding: 18px;
        gap: 16px;
    }
    
    .floating-search {
        position: relative;
        top: auto;
        right: auto;
        margin-bottom: 20px;
        min-width: auto;
        width: 100%;
    }
}

@media (max-width: 480px) {
    body {
        padding: 10px;
    }
    
    .page-container {
        padding: 20px;
        border-radius: 16px;
    }
    
    .work-list-section {
        padding: 20px;
    }
    
    .work-item {
        padding: 16px;
        gap: 12px;
    }
    
    .floating-search {
        padding: 10px 14px;
        border-radius: 12px;
    }
}

/* 大屏幕 */
@media (min-width: 1200px) {
    .page-container {
        max-width: 1100px;
        margin: 0 auto;
    }
}

@media (min-width: 1400px) {
    .page-container {
        max-width: 1200px;
    }
}
`