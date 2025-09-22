import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { WorkList } from './components/work-list'
import { FloatingSearch } from './components/floating-search'
import { Pagination } from './components/pagination'
import { LanguageSelector } from './components/language-selector'
import { FooterSetting } from '../db/operations/admin'
import { IndexScripts } from './scripts/index-scripts'
import { replacePlaceholders, PlaceholderContext } from '../utils/placeholder'

export const IndexPage = (props: { 
    works: any[], 
    footerSettings: FooterSetting[],
    siteConfig: Record<string, string>,
    currentPage: number,
    totalCount: number,
    pageSize: number,
    filterInfo?: {
        type: 'tag' | 'category',
        name: string,
        uuid: string
    } | null,
    searchQuery: string,
    preferredLanguage?: string,
    availableLanguages: string[]
}) => {
    // 构建占位符上下文
    const placeholderContext: PlaceholderContext = {
        tagName: props.filterInfo?.type === 'tag' ? props.filterInfo.name : undefined,
        categoryName: props.filterInfo?.type === 'category' ? props.filterInfo.name : undefined,
        searchQuery: props.searchQuery || undefined,
        pageNumber: props.currentPage,
        totalCount: props.totalCount
    };

    // 使用占位符替换功能处理页面标题
    const pageTitle = replacePlaceholders(
        props.siteConfig?.home_title || "VOCArchive - 作品选择",
        placeholderContext
    );

    // 使用占位符替换功能处理站点标题
    const siteTitle = replacePlaceholders(
        props.siteConfig?.site_title || "VOCArchive",
        placeholderContext
    );

    const cssFiles = ['/css/common.css', '/css/index.css'];

    const additionalScripts = IndexScripts(props);
    
    const pageContent = (
        <>
            <div class="background-container">
                <div class="background-overlay" id="backgroundOverlay"></div>
                <div class="background-pattern" id="backgroundPattern"></div>
            </div>

            {FloatingSearch()}
            
            <div class="language-selector-container">
                {LanguageSelector({ 
                    currentLanguage: props.preferredLanguage || 'auto',
                    availableLanguages: props.availableLanguages 
                })}
            </div>

            <div class="page-container" id="pageContainer">
                <header class="page-header">
                    <h1 class="page-title">{pageTitle}</h1>
                    {props.searchQuery && (
                        <div class="search-info">
                            <div class="search-indicator">
                                <i class="fas fa-search"></i>
                                <span class="search-text">
                                    搜索结果: "<strong>{props.searchQuery}</strong>"
                                </span>
                                <button class="clear-search-btn" onclick="clearSearch()">
                                    <i class="fas fa-times"></i> 清除搜索
                                </button>
                            </div>
                            <div class="search-stats">
                                找到 {props.totalCount} 个结果
                            </div>
                        </div>
                    )}
                </header>

                <section class="work-list-section">
                    <h2 class="section-title">
                        <i class="fas fa-list-music"></i> 歌曲列表
                        {props.filterInfo && (
                            <div class="filter-indicator-inline">
                                <i class={`fas ${props.filterInfo.type === 'tag' ? 'fa-tag' : 'fa-folder'}`}></i>
                                <span class="filter-name">{props.filterInfo.name}</span>
                                <button class="clear-filter-btn-inline" onclick="clearFilter()" title="清除筛选">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        )}
                    </h2>

                    <div class="work-list" id="workList">
                        {WorkList({ works: props.works, preferredLanguage: props.preferredLanguage })}
                    </div>

                    {Pagination({ 
                        currentPage: props.currentPage, 
                        totalCount: props.totalCount, 
                        pageSize: props.pageSize,
                        filterInfo: props.filterInfo,
                        searchQuery: props.searchQuery
                    })}
                </section>
            </div>
        </>
    );
    
    return BaseLayout({
        title: siteTitle,
        footerSettings: props.footerSettings,
        cssFiles: cssFiles,
        additionalScripts: additionalScripts,
        children: pageContent
    });
}
