import { jsx } from 'hono/jsx'

export interface WikiSectionProps {
    workInfo: any
}

export const WikiSection = (props: WikiSectionProps) => {
    const { workInfo } = props;

    const wikiURLMap = {
        "moegirl": "https://zh.moegirl.org.cn/{}",
        "baidu": "https://baike.baidu.com/item/{}",
        "thbwiki": "https://thwiki.cc/{}"
    };

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
                        <a href={wikiURLMap[wiki.platform as keyof typeof wikiURLMap] ? wikiURLMap[wiki.platform as keyof typeof wikiURLMap].replace('{}', wiki.identifier) : '#'} class="search-term">
                            <span class="material-symbols-outlined">public</span>
                            作品WIKI - {wiki.platform}: {wiki.identifier}
                        </a>
                    ))}
                    {workInfo.creator && workInfo.creator.map((c: any) => (
                        c.wikis && c.wikis.map((wiki: any) => (
                            <a href={wikiURLMap[wiki.platform as keyof typeof wikiURLMap] ? wikiURLMap[wiki.platform as keyof typeof wikiURLMap].replace('{}', wiki.identifier) : '#'} class="search-term">
                                <span class="material-symbols-outlined">person</span>
                                作者WIKI - [{c.role}] {c.creator_name} ({wiki.platform})
                            </a>
                        ))
                    ))}
                </div>
            </div>
        </div>
    );
}