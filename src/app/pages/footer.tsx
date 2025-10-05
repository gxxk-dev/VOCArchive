import { jsx } from 'hono/jsx'
import { FooterSetting } from '../db/operations/admin'
import { getVersionString, getFullVersionString, isDevelopment, isProduction } from '../utils/version-info'

export const Footer = (props: { settings: FooterSetting[] }) => {
    const links = props.settings.filter(s => s.item_type === 'link');
    const socials = props.settings.filter(s => s.item_type === 'social');
    const copyright = props.settings.find(s => s.item_type === 'copyright');

    return (
        <footer class="site-footer">
            <div class="footer-content">
                <div class="footer-links">
                    {links.map(link => (
                        <a href={link.url}>{link.text}</a>
                    ))}
                </div>
                <div class="footer-social">
                    {socials.map(social => (
                        <a href={social.url} title={social.text}>
                            <i class={social.icon_class}></i>
                        </a>
                    ))}
                </div>
            </div>
            <div class="footer-copyright">
                <p>{copyright ? copyright.text : ''}</p>
                <div class="footer-version" onclick="window.location.href='https://vocarchive.com'">
                    <span class="version-info" title={getFullVersionString()}>
                        Powered By VOCArchive {getVersionString()}
                        {isDevelopment() && <span class="dev-indicator">• DEV</span>}
                        {isProduction() && <span class="prod-indicator">• PROD</span>}
                    </span>
                </div>
            </div>
        </footer>
    )
}
