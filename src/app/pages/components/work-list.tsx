import { jsx } from 'hono/jsx'

export interface WorkListProps {
    works: any[]
}

export const WorkList = (props: WorkListProps) => {
    const renderWorkItem = (item: any) => {
        const userLang = "zh-cn"
        let mainTitle = '[Untitled]';
        if (item.titles && item.titles.length > 0) {
            const userLangTitle = item.titles.find((t: any) => t.language === userLang);
            if (userLangTitle) {
                mainTitle = userLangTitle.title;
            } else {
                const officialTitle = item.titles.find((t: any) => t.is_official);
                if (officialTitle) {
                    mainTitle = officialTitle.title;
                } else {
                    mainTitle = item.titles[0].title;
                }
            }
        }

        let artistName = '[Unknown Artist]';
        if (item.creator && item.creator.length > 0) {
            const humanCreator = item.creator.filter((c: any) => c.creator_type === 'human');
            if (humanCreator.length > 0) {
                artistName = humanCreator.map((c: any) => c.creator_name).join(' / ');
            } else {
                artistName = item.creator[0].creator_name;
            }
        }

        let coverUrl = '';
        if (item.preview_asset) {
            coverUrl = `/api/get/file/${item.preview_asset.uuid}`;
        } else if (item.non_preview_asset) {
            coverUrl = `/api/get/file/${item.non_preview_asset.uuid}`;
        } else {
            coverUrl = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745';
        }

        // 处理标签显示
        const renderTags = () => {
            if (!item.tags || item.tags.length === 0) return null;
            
            const maxTags = 3;
            const visibleTags = item.tags.slice(0, maxTags);
            const hiddenTags = item.tags.slice(maxTags);
            
            return (
                <div class="work-tags">
                    <i class="fas fa-tags"></i>
                    {visibleTags.map(tag => 
                        <span class="tag-chip" data-tag={tag.uuid}>{tag.name}</span>
                    )}
                    {hiddenTags.length > 0 && (
                        <span class="tags-more" data-work={item.work_uuid}>+{hiddenTags.length}</span>
                    )}
                </div>
            );
        };

        // 处理分类显示
        const renderCategories = () => {
            if (!item.categories || item.categories.length === 0) return null;
            
            return (
                <div class="work-categories">
                    <i class="fas fa-folder"></i>
                    {item.categories.map((category, index) => (
                        <>
                            {index > 0 && <span class="category-separator"> | </span>}
                            <span class="category-chip" data-category={category.uuid}>{category.name}</span>
                        </>
                    ))}
                </div>
            );
        };

        return (
            <div class="work-item" data-id={item.work_uuid}>
                <img class="work-preview" src={coverUrl} alt={mainTitle} />
                <div class="work-info">
                    <div class="work-title">{mainTitle}</div>
                    <div class="work-artist">{artistName}</div>
                    {renderTags()}
                    {renderCategories()}
                </div>
                <button class="work-play-btn"><i class="fas fa-play"></i></button>
            </div>
        )
    }

    return props.works.length > 0 ? 
        props.works.map(renderWorkItem) : 
        <div class="no-results">未找到歌曲</div>
}