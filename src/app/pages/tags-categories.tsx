import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { FooterSetting } from '../db/operations/admin'
import { LanguageSelector } from './components/language-selector'
import { TagWithCount } from '../db/operations/tag'
import { CategoryWithCount } from '../db/operations/category'

export interface TagsCategoriesPageProps {
    tags: TagWithCount[]
    categories: CategoryWithCount[]
    footerSettings: FooterSetting[]
    siteConfig: Record<string, string>
    availableLanguages: string[]
    preferredLanguage?: string
}

const TagCard = ({ tag }: { tag: TagWithCount }) => (
    <a href={`/?tag=${tag.uuid}`} class="tag-card">
        <div class="tag-card-content">
            <div class="tag-icon">
                <i class="fas fa-tag"></i>
            </div>
            <div class="tag-info">
                <h3 class="tag-name">{tag.name}</h3>
                <span class="tag-count">{tag.work_count} 首歌曲</span>
            </div>
        </div>
    </a>
)

const CategoryTreeNode = ({ category, level = 0 }: { category: CategoryWithCount, level?: number }) => (
    <div class={`category-node level-${level}`}>
        <a href={`/?category=${category.uuid}`} class="category-link">
            <div class="category-content">
                <div class="category-icon">
                    <i class={`fas ${level === 0 ? 'fa-folder' : 'fa-folder-open'}`}></i>
                </div>
                <div class="category-info">
                    <span class="category-name">{category.name}</span>
                    <span class="category-count">({category.work_count})</span>
                </div>
            </div>
        </a>
        {category.children && category.children.length > 0 && (
            <div class="category-children">
                {category.children.map(child =>
                    <CategoryTreeNode category={child} level={level + 1} />
                )}
            </div>
        )}
    </div>
)

export const TagsCategoriesPage = (props: TagsCategoriesPageProps) => {
    const pageTitle = "标签与分类";
    const siteTitle = props.siteConfig?.site_title || "VOCArchive";

    const cssFiles = ['/css/common.css', '/css/tags-categories.css'];

    const pageContent = (
        <>
            <div class="background-container">
                <div class="background-overlay" id="backgroundOverlay"></div>
                <div class="background-pattern" id="backgroundPattern"></div>
            </div>

            {/*<div class="language-selector-container">
                {LanguageSelector({
                    currentLanguage: props.preferredLanguage || 'auto',
                    availableLanguages: props.availableLanguages
                })}
            </div>*/}

            <div class="page-container" id="pageContainer">
                <header class="page-header">
                    <div class="breadcrumb">
                        <a href="/" class="breadcrumb-link">
                            <i class="fas fa-home"></i> 首页
                        </a>
                        <span class="breadcrumb-separator">/</span>
                        <span class="breadcrumb-current">标签与分类</span>
                    </div>
                    <h1 class="page-title">{pageTitle}</h1>
                    <p class="page-description">
                        浏览所有标签和分类，发现更多感兴趣的作品
                    </p>
                </header>

                <div class="content-grid">
                    <section class="tags-section">
                        <h2 class="section-title">
                            <i class="fas fa-tags"></i> 标签
                            <span class="section-count">({props.tags.length})</span>
                        </h2>
                        <div class="tags-grid">
                            {props.tags.map(tag => <TagCard tag={tag} />)}
                        </div>
                        {props.tags.length === 0 && (
                            <div class="empty-state">
                                <i class="fas fa-tag"></i>
                                <p>暂无标签</p>
                            </div>
                        )}
                    </section>

                    <section class="categories-section">
                        <h2 class="section-title">
                            <i class="fas fa-folder-tree"></i> 分类
                            <span class="section-count">({props.categories.length})</span>
                        </h2>
                        <div class="categories-tree">
                            {props.categories.map(category =>
                                <CategoryTreeNode category={category} level={0} />
                            )}
                        </div>
                        {props.categories.length === 0 && (
                            <div class="empty-state">
                                <i class="fas fa-folder"></i>
                                <p>暂无分类</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </>
    );

    return BaseLayout({
        title: `${pageTitle}`,
        cssFiles,
        footerSettings: props.footerSettings,
        children: pageContent
    });
};