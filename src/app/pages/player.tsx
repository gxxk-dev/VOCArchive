import { jsx } from 'hono/jsx'
import { BaseLayout } from './layouts/base-layout'
import { WorkHeader } from './components/player/work-header'
import { VersionCards } from './components/player/version-cards'
import { CopyrightSection } from './components/player/copyright-section'
import { AssetSection } from './components/player/asset-section'
import { WikiSection } from './components/player/wiki-section'
import { RelatedWorksSection } from './components/player/related-works-section'
import { FooterSetting } from '../database'
import { PlayerStyles } from './styles/player-styles'

export const PlayerPage = (props: { workInfo: any, asset_url: string, footerSettings: FooterSetting[] }) => {
    const { workInfo, asset_url, footerSettings } = props;
    const userLang = "zh-cn";

    const additionalStyles = `${PlayerStyles}`;

    const pageContent = (
        <div class="player-container">
            {WorkHeader({ workInfo, userLang })}
            {VersionCards({ workInfo })}
            {CopyrightSection({ workInfo })}
            {AssetSection({ workInfo, asset_url })}
            {WikiSection({ workInfo })}
            {RelatedWorksSection({ workInfo, userLang })}
        </div>
    );

    return BaseLayout({
        title: "VOCArchive - 作品页面",
        footerSettings: footerSettings,
        additionalStyles: additionalStyles,
        children: pageContent
    });
}
