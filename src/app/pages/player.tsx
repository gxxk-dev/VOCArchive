import { jsx } from 'hono/jsx'
import { Footer } from './footer'
import { FooterSetting } from '../database'

export const PlayerPage = (props: { workInfo: any, asset_url: string, footerSettings: FooterSetting[] }) => {
    const { workInfo, asset_url, footerSettings } = props;

    const userLang = "zh-cn";
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

    const audioSources = workInfo.media_sources.filter((ms: any) => ms.is_music);
    const videoSources = workInfo.media_sources.filter((ms: any) => !ms.is_music);

    let copyrightStatus = 'unclear';
    let licenseInfo = '';
    if (workInfo.work.copyright_basis === 'license') {
        copyrightStatus = 'license';
        licenseInfo = workInfo.license || '';
    } else if (workInfo.work.copyright_basis === 'accept') {
        copyrightStatus = 'authorized';
    }

    const copyrightStates = {
        authorized: {
            icon: 'verified',
            title: '已获得授权',
            description: '本作品已获得版权方正式授权，可以合法使用和分发.',
            className: 'authorized'
        },
        license: {
            icon: 'rule',
            title: '基于协议自动获得授权',
            description: `本作品基于 ${licenseInfo} 进行二次分发.`,
            className: 'license'
        },
        unclear: {
            icon: 'help',
            title: '尚不明确',
            description: '本作品的版权状态尚不明确.',
            className: 'unclear'
        }
    };
    const copyrightInfo = copyrightStates[copyrightStatus as keyof typeof copyrightStates];

    const wikiURLMap = {
        "moegirl": "https://zh.moegirl.org.cn/{}",
        "baidu": "https://baike.baidu.com/item/{}",
    }

    const creatorNames = workInfo.creator ? workInfo.creator.map((c: any) => c.creator_name).join(', ') : '';
    
    return (
        <html>
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>VOCArchive - 作品页面</title>
                <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
                <style>
                    {`
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
        
        :root {
            /* Material Design 3 Color Tokens */
            --md-sys-color-primary: #6750A4;
            --md-sys-color-on-primary: #FFFFFF;
            --md-sys-color-primary-container: #EADDFF;
            --md-sys-color-on-primary-container: #21005D;
            
            --md-sys-color-secondary: #625B71;
            --md-sys-color-on-secondary: #FFFFFF;
            --md-sys-color-secondary-container: #E8DEF8;
            --md-sys-color-on-secondary-container: #1D192B;
            
            --md-sys-color-tertiary: #7D5260;
            --md-sys-color-on-tertiary: #FFFFFF;
            --md-sys-color-tertiary-container: #FFD8E4;
            --md-sys-color-on-tertiary-container: #31111D;
            
            --md-sys-color-surface: #1C1B1F;
            --md-sys-color-surface-container-lowest: #0F0D13;
            --md-sys-color-surface-container-low: #1D1B20;
            --md-sys-color-surface-container: #211F26;
            --md-sys-color-surface-container-high: #2B2930;
            --md-sys-color-surface-container-highest: #36343B;
            --md-sys-color-on-surface: #E6E0E9;
            --md-sys-color-on-surface-variant: #CAC4D0;
            
            --md-sys-color-outline: #938F99;
            --md-sys-color-outline-variant: #49454F;
            
            /* Elevation */
            --md-sys-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
            --md-sys-elevation-level3: 0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3);
            
            /* Shape */
            --md-sys-shape-corner-small: 8px;
            --md-sys-shape-corner-medium: 12px;
            --md-sys-shape-corner-large: 16px;
            --md-sys-shape-corner-extra-large: 28px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Roboto', sans-serif;
            background-color: var(--md-sys-color-surface);
            color: var(--md-sys-color-on-surface);
            min-height: 100vh;
            padding: 24px;
            display: flex;
            flex-direction: column;
            align-items: center;
            background-image: 
                radial-gradient(circle at 20% 50%, rgba(103, 80, 164, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(125, 82, 96, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(98, 91, 113, 0.1) 0%, transparent 50%);
        }

        /* Main Container */
        .player-container {
            max-width: 900px;
            width: 100%;
            margin: 0 auto;
            background-color: var(--md-sys-color-surface-container);
            border-radius: var(--md-sys-shape-corner-extra-large);
            padding: 32px;
            box-shadow: var(--md-sys-elevation-level3);
            border: 1px solid var(--md-sys-color-outline-variant);
            animation: fadeInUp 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
        }

        /* Song Header */
        .work-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .work-title {
            font-size: 2.75rem;
            font-weight: 400;
            line-height: 3.25rem;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            color: var(--md-sys-color-on-surface);
        }

        .work-creator {
            font-size: 1rem;
            line-height: 1.5rem;
            letter-spacing: 0.5px;
            color: var(--md-sys-color-on-surface-variant);
            font-weight: 400;
        }

        /* Version Cards Container */
        .versions-container {
            display: flex;
            gap: 24px;
            width: 100%;
            margin-bottom: 32px;
            flex-wrap: wrap;
        }

        .version-card {
            flex: 1;
            min-width: 280px;
            background: var(--md-sys-color-surface-container-low);
            border-radius: var(--md-sys-shape-corner-large);
            padding: 24px;
            display: flex;
            align-items: center;
            gap: 16px;
            border: 1px solid var(--md-sys-color-outline-variant);
            transition: all 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
            cursor: pointer;
        }

        .version-card.active {
            border-color: var(--md-sys-color-primary);
            background: var(--md-sys-color-primary-container);
        }

        .version-card.active .version-icon {
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
        }

        .version-icon {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: var(--md-sys-color-surface-container-high);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
        }

        .version-details {
            flex: 1;
        }

        .version-details h3 {
            font-size: 1.25rem;
            margin-bottom: 4px;
            color: var(--md-sys-color-on-surface);
        }

        .version-details p {
            font-size: 0.875rem;
            color: var(--md-sys-color-on-surface-variant);
            margin-bottom: 2px;
        }

        .download-btn {
            padding: 10px 20px;
            background: var(--md-sys-color-tertiary-container);
            color: var(--md-sys-color-on-tertiary-container);
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
        }

        .download-btn:hover {
            transform: translateY(-2px);
            box-shadow: var(--md-sys-elevation-level1);
        }

        /* asset Section */
        .asset-section {
            background-color: var(--md-sys-color-surface-container-low);
            border-radius: var(--md-sys-shape-corner-large);
            padding: 24px;
            margin-bottom: 16px;
            border: 1px solid var(--md-sys-color-outline-variant);
        }

        .setting-label {
            font-size: 0.875rem;
            font-weight: 500;
            line-height: 1.25rem;
            letter-spacing: 0.1px;
            color: var(--md-sys-color-on-surface);
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .asset-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 16px;
        }

        .asset-card {
            background: var(--md-sys-color-surface-container-high);
            border-radius: var(--md-sys-shape-corner-medium);
            padding: 16px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
            border: 1px solid var(--md-sys-color-outline-variant);
        }

        .asset-card:hover {
            border-color: var(--md-sys-color-primary);
            box-shadow: var(--md-sys-elevation-level1);
        }

        .asset-card .material-symbols-outlined {
            font-size: 32px;
            margin-bottom: 12px;
            color: var(--md-sys-color-primary);
        }

        .asset-details h4 {
            font-size: 1rem;
            margin-bottom: 4px;
            color: var(--md-sys-color-on-surface);
        }

        .asset-details p {
            font-size: 0.75rem;
            color: var(--md-sys-color-on-surface-variant);
        }

        /* Sections */
        .section {
            margin-bottom: 16px;
            animation: fadeInUp 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
            animation-delay: 0.1s;
            animation-fill-mode: both;
            align-self: center;
            text-align: left; /* 嗯对我觉得应该不会有使用RLO的用户用这个东西 */
        }

        .section-header {
            display: flex;
            align-items: center;
            margin-bottom: 16px;
            font-size: 1.25rem;
            font-weight: 400;
            line-height: 1.75rem;
            color: var(--md-sys-color-on-surface);
            cursor: pointer;
            transition: color 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
            padding: 8px;
            border-radius: var(--md-sys-shape-corner-small);
        }

        .section-header:hover {
            background-color: var(--md-sys-color-surface-container-highest);
            color: var(--md-sys-color-primary);
        }

        .section-arrow {
            margin-left: 12px;
            color: var(--md-sys-color-on-surface-variant);
            transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
            font-size: 1.25rem;
        }

        .section-header:hover .section-arrow {
            color: var(--md-sys-color-primary);
            transform: rotate(180deg);
        }

        .content-box {
            background-color: var(--md-sys-color-surface-container-low);
            border-radius: var(--md-sys-shape-corner-large);
            padding: 24px;
            border: 1px solid var(--md-sys-color-outline-variant);
        }

        .search-terms, .related-work {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .search-term, .related-work {
            color: var(--md-sys-color-on-surface);
            padding: 16px;
            background-color: var(--md-sys-color-surface-container);
            border-radius: var(--md-sys-shape-corner-medium);
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
            border: 1px solid var(--md-sys-color-outline-variant);
            font-weight: 400;
            font-size: 0.875rem;
            line-height: 1.25rem;
            letter-spacing: 0.25px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .search-term:hover, .related-work:hover {
            background-color: var(--md-sys-color-surface-container-high);
            border-color: var(--md-sys-color-outline);
            box-shadow: var(--md-sys-elevation-level1);
        }

        a {
            text-decoration: none;
            background-color: transparent;
            color: inherit; 
        }

        /* Material Icons */
        .material-symbols-outlined {
            font-size: 1.25rem;
            vertical-align: middle;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 16px;
            }
            
            .player-container {
                padding: 24px;
            }
            
            .work-title {
                font-size: 2rem;
                line-height: 2.5rem;
            }
            
            .versions-container {
                flex-direction: column;
            }
            
            .version-card {
                min-width: auto;
            }
            
            .asset-grid {
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            }
        }

        /* Animations */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(16px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* Copyright Section */
        .copyright-section {
            background-color: var(--md-sys-color-surface-container-low);
            border-radius: var(--md-sys-shape-corner-large);
            padding: 24px;
            margin-bottom: 32px;
            border: 1px solid var(--md-sys-color-outline-variant);
        }

        .copyright-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
            font-size: 1.125rem;
            font-weight: 500;
            color: var(--md-sys-color-on-surface);
        }

        .copyright-status {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 16px 20px;
            border-radius: var(--md-sys-shape-corner-medium);
            border: 2px solid;
            transition: all 0.2s cubic-bezier(0.2, 0.0, 0, 1.0);
        }

        .copyright-status.authorized {
            background-color: rgba(76, 175, 80, 0.1);
            border-color: #4CAF50;
            color: #2E7D32;
        }

        .copyright-status.license {
            background-color: rgba(255, 193, 7, 0.1);
            border-color: #FFC107;
            color: #F57F17;
        }

        .copyright-status.unclear {
            background-color: rgba(158, 158, 158, 0.1);
            border-color: #9E9E9E;
            color: #bebebe;
        }

        .copyright-icon {
            font-size: 24px;
        }

        .copyright-text {
            flex: 1;
        }

        .copyright-text h4 {
            font-size: 1rem;
            font-weight: 500;
            margin-bottom: 4px;
        }

        .copyright-text p {
            font-size: 0.875rem;
            opacity: 0.8;
            line-height: 1.4;
        }

        .info-icon {
            position: relative;
            display: inline-flex;
            cursor: pointer;
        }

        .info-icon .material-symbols-outlined {
            color: #938f99;
            font-size: 22px;
            transition: color 0.2s ease;
        }

        .info-icon:hover .material-symbols-outlined {
            color: #d0bcff;
        }

        .tooltip {
            position: absolute;
            top: calc(100% + 12px);
            left: 50%;
            transform: translateX(-50%);
            background: #e8def8;
            color: #1d192b;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 0.9rem;
            width: 260px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            z-index: 10;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s cubic-bezier(0.2, 0.0, 0, 1.0);
            pointer-events: none;
            text-align: left;
            line-height: 1.5;
        }

        .info-icon:hover .tooltip {
            opacity: 1;
            visibility: visible;
        }

        .tooltip::after {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            border-width: 6px;
            border-style: solid;
            border-color: transparent transparent #e8def8 transparent;
        }

        /* Footer */
        .site-footer {
            text-align: center;
            padding: 24px 16px;
            margin-top: 32px;
            color: var(--md-sys-color-on-surface-variant);
            font-size: 0.9rem;
            border-top: 1px solid var(--md-sys-color-outline-variant);
            width: 100%;
            max-width: 900px;
            margin-left: auto;
            margin-right: auto;
        }

        .footer-content {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 16px;
        }

        .footer-links {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .footer-links a {
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .footer-links a:hover {
            text-decoration: underline;
        }

        .footer-social {
            display: flex;
            gap: 24px;
        }

        .footer-social a {
            font-size: 1.4rem;
            transition: color 0.3s ease, transform 0.3s ease;
            display: inline-block;
        }

        .footer-social a:hover {
            transform: translateY(-2px);
        }

        .footer-copyright p {
            margin: 0;
            font-size: 0.85rem;
        }
                    `}
                </style>
            </head>
            <body>
                <div class="player-container">
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

                    <div class="versions-container">
                        {audioSources.length > 0 && (
                            <div class="version-card" data-type="audio">
                                <div class="version-icon">
                                    <span class="material-symbols-outlined">audiotrack</span>
                                </div>
                                <div class="version-details">
                                    <h3>音频版本</h3>
                                    <p>{audioSources[0].info}</p>
                                </div>
                                <a href={audioSources[0].url} download={audioSources[0].file_name} class="download-btn">下载</a>
                            </div>
                        )}
                        {videoSources.length > 0 && (
                            <div class="version-card" data-type="video">
                                <div class="version-icon">
                                    <span class="material-symbols-outlined">movie</span>
                                </div>
                                <div class="version-details">
                                    <h3>视频版本</h3>
                                    <p>{videoSources[0].info}</p>
                                </div>
                                <a href={videoSources[0].url} download={videoSources[0].file_name} class="download-btn">下载</a>
                            </div>
                        )}
                    </div>

                    <div class="copyright-section">
                        <div class="copyright-header">
                            <span class="material-symbols-outlined">gavel</span>
                            版权声明
                        </div>
                        <div class={`copyright-status ${copyrightInfo.className}`} id="copyrightStatus">
                            <span class="material-symbols-outlined copyright-icon">{copyrightInfo.icon}</span>
                            <div class="copyright-text">
                                <h4>{copyrightInfo.title}</h4>
                                <p>{copyrightInfo.description}</p>
                            </div>
                        </div>
                    </div>

                    {workInfo.asset && workInfo.asset.length > 0 && (
                        <div class="asset-section">
                            <div class="setting-label">
                                <span class="material-symbols-outlined">folder</span>
                                作品资产
                            </div>
                            <div class="asset-grid">
                                {workInfo.asset.map((asset: any) => {
                                    const icon = asset.asset_type === 'lyrics' ? 'description' : 'image';
                                    const creatorInfo = asset.creator.length > 0
                                        ? asset.creator.map((c: any) => `${c.role}: ${c.creator_name}`).join(', ')
                                        : '';
                                    const langInfo = asset.language ? ` · ${asset.language}` : '';
                                    const asset_card = (
                                        <a href={`${asset_url}/${asset.file_id}`} class="asset-card">
                                            <span class="material-symbols-outlined">{icon}</span>
                                            <div class="asset-details">
                                                <h4>{asset.file_name}</h4>
                                                <p>{creatorInfo}{langInfo}</p>
                                            </div>
                                        </a>
                                    )
                                    return asset_card;
                                })}
                            </div>
                        </div>
                    )}

                    {workInfo.wikis && workInfo.wikis.length > 0 && workInfo.creator && workInfo.creator.some((c: any) => c.wikis && c.wikis.length > 0) && (
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
                    )}

                    {workInfo.relation && workInfo.relation.length > 0 && (
                        <div class="section">
                            <div class="section-header" onclick="toggleSection('related')">
                                <span class="material-symbols-outlined">local_movies</span>
                                相关作品
                            </div>
                            <div class="content-box" id="relatedContent" style="">
                                <div class="related-work">
                                    {workInfo.relation.map((relation: any) => {
                                        const isFromWork = workInfo.work.uuid === relation.from_work_uuid;
                                        const otherWorkUUID = isFromWork ? relation.to_work_uuid : relation.from_work_uuid;
                                        const titles = isFromWork
                                            ? relation.related_work_titles?.to_work_titles || []
                                            : relation.related_work_titles?.from_work_titles || [];
                                        let otherWorkTitle = "";
                                        if (titles.length > 0) {
                                            const userLangTitle = titles.find((t: any) => t.language === userLang);
                                            if (userLangTitle) {
                                                otherWorkTitle = userLangTitle.title;
                                            } else {
                                                otherWorkTitle = titles[0].title;
                                            }
                                        }
                                        let relationType = "";
                                        switch (relation.relation_type) {
                                            case 'original':
                                                relationType = isFromWork ? "衍生自" : "原作品";
                                                break;
                                            case 'cover':
                                                relationType = isFromWork ? "翻唱自" : "翻唱作品";
                                                break;
                                            case 'remix':
                                                relationType = isFromWork ? "混音自" : "混音作品";
                                                break;
                                            default:
                                                relationType = relation.relation_type;
                                        }
                                        return (
                                            <a href={`/player?uuid=${otherWorkUUID}`} class="related-work">
                                                <span class="material-symbols-outlined">music_note</span>
                                                {relationType}: {otherWorkTitle}
                                            </a>    
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                    
                </div>
                <Footer settings={props.footerSettings} />
            </body>
        </html>
    )
}
