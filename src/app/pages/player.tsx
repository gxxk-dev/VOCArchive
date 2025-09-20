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

export const PlayerPage = (props: { workInfo: any, footerSettings: FooterSetting[], siteConfig: Record<string, string> }) => {
    const { workInfo, footerSettings, siteConfig } = props;
    const userLang = "zh-cn";

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
        title: siteConfig?.player_title || "VOCArchive - 作品页面",
        footerSettings: footerSettings,
        additionalStyles: additionalStyles,
        additionalScripts: additionalScripts,
        children: pageContent
    });
}
