import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { WorkHeader } from './components/player/work-header'
import { VersionCards } from './components/player/version-cards'
import { CopyrightSection } from './components/player/copyright-section'
import { AssetSection } from './components/player/asset-section'
import { WikiSection } from './components/player/wiki-section'
import { RelatedWorksSection } from './components/player/related-works-section'
import { FooterSetting } from '../db/operations/admin'
import { PlayerStyles } from './styles/player-styles'
import { CommonStyles } from './styles/common-styles'
import { PlayerScripts } from './scripts/player-scripts'
import { replacePlaceholders, getWorkDisplayTitle } from '../utils/placeholder'

export const PlayerPage = (props: { workInfo: any, footerSettings: FooterSetting[], siteConfig: Record<string, string> }) => {
    const { workInfo, footerSettings, siteConfig } = props;
    const userLang = "zh-cn";

    // 获取作品显示标题
    const workDisplayTitle = getWorkDisplayTitle(workInfo, userLang);

    // 使用占位符替换功能处理标题
    const pageTitle = replacePlaceholders(
        siteConfig?.player_title || "VOCArchive - {WORK_TITLE}",
        { workTitle: workDisplayTitle }
    );

    const additionalStyles = `${CommonStyles}${PlayerStyles}`;
    const additionalScripts = PlayerScripts(props);

    const pageContent = (
        <div class="player-container">
            {WorkHeader({ workInfo, userLang })}
            {VersionCards({ workInfo })}
            {CopyrightSection({ workInfo })}
            {AssetSection({ workInfo })}
            {WikiSection({ workInfo })}
            {RelatedWorksSection({ workInfo, userLang })}
        </div>
    );

    return BaseLayout({
        title: pageTitle,
        footerSettings: footerSettings,
        additionalStyles: additionalStyles,
        additionalScripts: additionalScripts,
        children: pageContent
    });
}
