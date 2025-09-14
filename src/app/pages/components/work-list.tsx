import { jsx } from 'hono/jsx'

export interface WorkListProps {
    works: any[]
    preferredLanguage?: string
}

export const WorkList = (props: WorkListProps) => {
    const getDisplayTitle = (item: any, userLang: string = 'auto') => {
        let mainTitle = '[Untitled]';
        if (!item.titles || item.titles.length === 0) return mainTitle;

        // Filter out ForSearch titles for display
        const displayTitles = item.titles.filter((t: any) => !t.is_for_search);
        if (displayTitles.length === 0) return mainTitle;

        // 如果是自动选择，使用原有逻辑
        if (userLang === 'auto') {
            const userLangTitle = displayTitles.find((t: any) => t.language === 'zh-cn');
            if (userLangTitle) {
                mainTitle = userLangTitle.title;
            } else {
                const officialTitle = displayTitles.find((t: any) => t.is_official);
                if (officialTitle) {
                    mainTitle = officialTitle.title;
                } else {
                    mainTitle = displayTitles[0].title;
                }
            }
        } else {
            // 优先查找指定语言的标题
            const specificLangTitle = displayTitles.find((t: any) => t.language === userLang);
            if (specificLangTitle) {
                mainTitle = specificLangTitle.title;
            } else {
                // 找不到指定语言，按优先级fallback
                const officialTitle = displayTitles.find((t: any) => t.is_official);
                if (officialTitle) {
                    mainTitle = officialTitle.title;
                } else {
                    mainTitle = displayTitles[0].title;
                }
            }
        }
        return mainTitle;
    };

    const renderWorkItem = (item: any) => {
        const userLang = props.preferredLanguage || 'auto';
        const mainTitle = getDisplayTitle(item, userLang);

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

        return (
            <div class="work-item" data-id={item.work_uuid}>
                <img class="work-preview" src={coverUrl} alt={mainTitle} />
                <div class="work-info">
                    <div class="work-title">{mainTitle}</div>
                    <div class="work-artist">{artistName}</div>
                </div>
                <button class="work-play-btn"><i class="fas fa-play"></i></button>
            </div>
        )
    }

    return props.works.length > 0 ? 
        props.works.map(renderWorkItem) : 
        <div class="no-results">未找到歌曲</div>
}