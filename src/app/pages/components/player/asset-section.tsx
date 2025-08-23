import { jsx } from 'hono/jsx'

export interface AssetSectionProps {
    workInfo: any
    asset_url: string
}

export const AssetSection = (props: AssetSectionProps) => {
    const { workInfo, asset_url } = props;

    if (!workInfo.asset || workInfo.asset.length === 0) {
        return null;
    }

    return (
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
                    return (
                        <a href={`${asset_url}/${asset.file_id}`} class="asset-card">
                            <span class="material-symbols-outlined">{icon}</span>
                            <div class="asset-details">
                                <h4>{asset.file_name}</h4>
                                <p>{creatorInfo}{langInfo}</p>
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}