import { jsx } from 'hono/jsx'

export interface RelatedWorksSectionProps {
    workInfo: any
    userLang: string
}

export const RelatedWorksSection = (props: RelatedWorksSectionProps) => {
    const { workInfo, userLang } = props;

    if (!workInfo.relation || workInfo.relation.length === 0) {
        return null;
    }

    return (
        <div class="section">
            <div class="section-header" onclick="toggleSection('related')">
                <span class="material-symbols-outlined">local_movies</span>
                相关作品
            </div>
            <div class="content-box" id="relatedContent" style="">
                <div class="related-works-grid">
                    {workInfo.relation.map((relation: any) => {
                        const isFromWork = workInfo.work.uuid === relation.from_work_uuid;
                        const otherWorkUUID = isFromWork ? relation.to_work_uuid : relation.from_work_uuid;
                        const titles = isFromWork
                            ? relation.related_work_titles?.to_work_titles || []
                            : relation.related_work_titles?.from_work_titles || [];
                        let otherWorkTitle = "[未知标题]";
                        if (titles.length > 0) {
                            const userLangTitle = titles.find((t: any) => t.language === userLang);
                            otherWorkTitle = userLangTitle ? userLangTitle.title : titles[0].title;
                        }
                        
                        let relationType = isFromWork ? relation.relation_type : "original";
                        
                        return (
                            <a href={`/player?uuid=${otherWorkUUID}`} class="related-work-chip">
                                <span class="relation-type-badge">{relationType}</span>
                                <span class="relation-title">{otherWorkTitle}</span>
                            </a>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}