import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { WorkList } from './components/work-list'
import { FloatingSearch } from './components/floating-search'
import { Pagination } from './components/pagination'
import { FooterSetting } from '../database'
import { CommonStyles } from './styles/common-styles'
import { IndexStyles } from './styles/index-styles'
import { IndexScripts } from './scripts/index-scripts'

export const IndexPage = (props: { 
    works: any[], 
    footerSettings: FooterSetting[],
    currentPage: number,
    totalCount: number,
    pageSize: number,
    filterInfo?: {
        type: 'tag' | 'category',
        name: string,
        uuid: string
    } | null,
    searchQuery: string
}) => {
    const additionalStyles = `${CommonStyles}${IndexStyles}`;
    
    const additionalScripts = IndexScripts(props);
    
    const pageContent = (
        <>
            <div class="background-container">
                <div class="background-overlay" id="backgroundOverlay"></div>
                <div class="background-pattern" id="backgroundPattern"></div>
            </div>

            {FloatingSearch()}

            <div class="page-container" id="pageContainer">
                <header class="page-header">
                    <h1 class="page-title">VOCArchive - 作品选择</h1>
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
                        {WorkList({ works: props.works })}
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
    
    const pageTitle = props.filterInfo 
        ? `VOCArchive - ${props.filterInfo.name} (${props.filterInfo.type === 'tag' ? '标签' : '分类'})`
        : props.searchQuery 
        ? `VOCArchive - 搜索: ${props.searchQuery}`
        : "VOCArchive - 作品选择";
    
    return BaseLayout({
        title: pageTitle,
        footerSettings: props.footerSettings,
        additionalStyles: additionalStyles,
        additionalScripts: additionalScripts,
        children: pageContent
    });
}
