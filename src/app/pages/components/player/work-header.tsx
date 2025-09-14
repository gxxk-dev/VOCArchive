import { jsx } from 'hono/jsx'

export interface WorkTitle {
    work_uuid: string
    is_official: boolean
    language: string
    title: string
}

export interface WorkCreator {
    uuid: string
    creator_name: string
    role: string
}

export interface WorkTag {
    uuid: string
    name: string
}

export interface WorkCategory {
    uuid: string
    name: string
    parent_uuid?: string
}

export interface WorkInfo {
    work: {
        uuid: string
        copyright_basis: string
    }
    titles: WorkTitle[]
    creator: WorkCreator[]
    tags?: WorkTag[]
    categories?: WorkCategory[]
}

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
    let isOfficialTitle = true;

    if (workInfo.titles && workInfo.titles.length > 0) {
        const userLangTitle = workInfo.titles.find((t: WorkTitle) => t.language === userLang);
        if (userLangTitle) {
            displayTitle = userLangTitle.title;
            isOfficialTitle = userLangTitle.is_official;
        } else {
            const officialTitle = workInfo.titles.find((t: WorkTitle) => t.is_official);
            if (officialTitle) {
                displayTitle = officialTitle.title;
                isOfficialTitle = true;
            } else {
                displayTitle = workInfo.titles[0].title;
                isOfficialTitle = false;
            }
        }
    }

    const officialTitles = workInfo.titles
        .filter((t: WorkTitle) => t.is_official)
        .map((t: WorkTitle) => `${languageNames[t.language]} - ${t.title}`)
        .join('<br>');

    const creatorNames = workInfo.creator ? workInfo.creator.map((c: WorkCreator) => c.creator_name).join(', ') : '';

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
                    {visibleTags.map((tag: WorkTag) => 
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
                    {workInfo.categories.map((category: WorkCategory, index: number) => (
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
            <div class="work-title">
                {displayTitle}
                {!isOfficialTitle && (
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