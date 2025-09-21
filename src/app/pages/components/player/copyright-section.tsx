import { jsx } from 'hono/jsx'

export interface CopyrightSectionProps {
    workInfo: any
}

export const CopyrightSection = (props: CopyrightSectionProps) => {
    const { workInfo } = props;

    let copyrightStatus = 'unclear';
    let licenseInfo = '';
    if (workInfo.work.copyright_basis === 'license') {
        copyrightStatus = 'license';
        licenseInfo = workInfo.license || '';
    } else if (workInfo.work.copyright_basis === 'accept') {
        copyrightStatus = 'authorized';
    } else if (workInfo.work.copyright_basis === 'onlymetadata') {
        copyrightStatus = 'onlymetadata';
    } else if (workInfo.work.copyright_basis === 'arr') {
        copyrightStatus = 'arr';
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
        onlymetadata: {
            icon: 'info',
            title: '仅收录元数据',
            description: '本站只收录了元数据信息，媒体/资产文件引用自其他存储源，具体版权请自行查询.',
            className: 'onlymetadata'
        },
        arr: {
            icon: 'warning',
            title: '版权保留',
            description: '本站不持有相关版权，如侵权请联系站长删除.',
            className: 'arr'
        },
        unclear: {
            icon: 'help',
            title: '尚不明确',
            description: '本作品的版权状态尚不明确.',
            className: 'unclear'
        }
    };
    const copyrightInfo = copyrightStates[copyrightStatus as keyof typeof copyrightStates];

    return (
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
    );
}