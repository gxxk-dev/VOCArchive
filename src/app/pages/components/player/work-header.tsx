import { jsx } from 'hono/jsx'
import type { WorkTitleApi, TagApi, CategoryApi, WorkInfo, CreatorWithRole } from '../../../db/types'

export interface WorkHeaderProps {
    workInfo: WorkInfo
    userLang: string
}

const languageNames: Record<string, string> = {
    'zh-cn': '中文 (简体)',
    'zh-tw': '中文 (繁體)', 
    'ja': '日本語',
    'en': 'English',
    'ko': '한국어',
    'es': 'Español',
    'fr': 'Français',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский'
};

export const WorkHeader = (props: WorkHeaderProps) => {
    const { workInfo, userLang } = props;

    let displayTitle = "";
    let is_officialTitle = true;

    if (workInfo.titles && workInfo.titles.length > 0) {
        // Filter out ForSearch titles for display
        const displayTitles = workInfo.titles.filter((t: WorkTitleApi) => !t.is_for_search);
        
        if (displayTitles.length > 0) {
            const userLangTitle = displayTitles.find((t: WorkTitleApi) => t.language === userLang);
            if (userLangTitle) {
                displayTitle = userLangTitle.title;
                is_officialTitle = userLangTitle.is_official;
            } else {
                const officialTitle = displayTitles.find((t: WorkTitleApi) => t.is_official);
                if (officialTitle) {
                    displayTitle = officialTitle.title;
                    is_officialTitle = true;
                } else {
                    displayTitle = displayTitles[0].title;
                    is_officialTitle = false;
                }
            }
        }
    }

    const officialTitles = workInfo.titles
        .filter((t: WorkTitleApi) => t.is_official && !t.is_for_search)
        .map((t: WorkTitleApi) => `${languageNames[t.language]} - ${t.title}`)
        .join('<br>');

    const creatorNames = workInfo.creator ? workInfo.creator.map((c: CreatorWithRole) => c.creator_name || 'Unknown').join(', ') : '';

    // 处理标签显示
    const renderTags = () => {
        if (!workInfo.tags || workInfo.tags.length === 0) return null;
        
        const maxTags = 5;
        const visibleTags = workInfo.tags.slice(0, maxTags);
        const hiddenTags = workInfo.tags.slice(maxTags);
        
        return (
            <div class="work-meta-tags">
                <i class="fas fa-tags"></i>
                <span class="meta-label">标签:</span>
                <div class="tags-container">
                    {visibleTags.map((tag: TagApi) =>
                        <span class="tag-chip clickable" data-tag={tag.uuid}>{tag.name}</span>
                    )}
                    {hiddenTags.length > 0 && (
                        <span class="tags-expand" data-work={workInfo.work.uuid}>
                            +{hiddenTags.length} more
                        </span>
                    )}
                </div>
            </div>
        );
    };

    // 处理分类显示
    const renderCategories = () => {
        if (!workInfo.categories || workInfo.categories.length === 0) return null;
        
        return (
            <div class="work-meta-categories">
                <i class="fas fa-folder"></i>
                <span class="meta-label">分类:</span>
                <div class="categories-container">
                    {workInfo.categories.map((category: CategoryApi, index: number) => (
                        <>
                            {index > 0 && <span class="category-separator"> &gt; </span>}
                            <span class="category-chip clickable" data-category={category.uuid}>{category.name}</span>
                        </>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div class="work-header">
            <button id="ipfs-settings-btn" class="ipfs-settings-btn" title="IPFS网关设置" aria-label="IPFS网关设置">
                <i class="fas fa-cog"></i>
            </button>
            <div class="work-title">
                {displayTitle}
                {!is_officialTitle && (
                    <div class="info-icon">
                        <span class="material-symbols-outlined">info</span>
                        <div class="tooltip" dangerouslySetInnerHTML={{ __html: `<strong>非官方标题</strong><br>这是一个非官方标题译名，其官方名称为：<br>${officialTitles}` }}>
                        </div>
                    </div>
                )}
            </div>
            <div class="work-creator">{creatorNames}</div>
            <div class="work-meta">
                {renderTags()}
                {renderCategories()}
            </div>
        </div>
    );
}