import { jsx } from 'hono/jsx'

export interface WikiSectionProps {
    workInfo: any
}

export const WikiSection = (props: WikiSectionProps) => {
    const { workInfo } = props;

    const hasWikis = (workInfo.wikis && workInfo.wikis.length > 0) ||
                    (workInfo.creator && workInfo.creator.some((c: any) => c.wikis && c.wikis.length > 0));

    if (!hasWikis) {
        return null;
    }

    return (
        <div class="section">
            <div class="section-header" onclick="toggleSection('wiki')">
                <span class="material-symbols-outlined">menu_book</span>&nbsp;
                Wiki页面
            </div>
            <div class="content-box" id="wikiContent" style="">
                <div class="search-terms">
                    {workInfo.wikis && workInfo.wikis.map((wiki: any) => (
                        <a href={wiki.url || '#'} class="search-term" target="_blank" rel="noopener noreferrer">
                            {wiki.icon_class ? (
                                <i class={wiki.icon_class}></i>
                            ) : (
                                <span class="material-symbols-outlined">public</span>
                            )}
                            作品WIKI - {wiki.platform_name || wiki.platform}: {wiki.identifier}
                        </a>
                    ))}
                    {workInfo.creator && workInfo.creator.map((c: any) => (
                        c.wikis && c.wikis.map((wiki: any) => (
                            <a href={wiki.url || '#'} class="search-term" target="_blank" rel="noopener noreferrer">
                                {wiki.icon_class ? (
                                    <i class={wiki.icon_class}></i>
                                ) : (
                                    <span class="material-symbols-outlined">person</span>
                                )}
                                作者WIKI - [{c.role}] {c.creator_name} ({wiki.platform_name || wiki.platform})
                            </a>
                        ))
                    ))}
                </div>
            </div>
        </div>
    );
}