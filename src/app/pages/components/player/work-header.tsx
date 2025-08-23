import { jsx } from 'hono/jsx'

export interface WorkHeaderProps {
    workInfo: any
    userLang: string
}

export const WorkHeader = (props: WorkHeaderProps) => {
    const { workInfo, userLang } = props;

    let displayTitle = "";
    let isOfficialTitle = true;

    if (workInfo.titles && workInfo.titles.length > 0) {
        const userLangTitle = workInfo.titles.find((t: any) => t.language === userLang);
        if (userLangTitle) {
            displayTitle = userLangTitle.title;
            isOfficialTitle = userLangTitle.is_official === 1;
        } else {
            const officialTitle = workInfo.titles.find((t: any) => t.is_official === 1);
            if (officialTitle) {
                displayTitle = officialTitle.title;
            } else {
                displayTitle = workInfo.titles[0].title;
                isOfficialTitle = false;
            }
        }
    }

    const officialTitles = workInfo.titles
        .filter((t: any) => t.is_official === 1)
        .map((t: any) => `${t.language} - ${t.title}`)
        .join('<br>');

    const creatorNames = workInfo.creator ? workInfo.creator.map((c: any) => c.creator_name).join(', ') : '';

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
        </div>
    );
}