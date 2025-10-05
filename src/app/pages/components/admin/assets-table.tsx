import { jsx } from 'hono/jsx'
import { AssetApi } from '../../../db/types'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface AssetsTableProps {
    assets: AssetApi[]
}

export const AssetsTable = (props: AssetsTableProps) => {
    const { assets } = props;

    if (!assets || assets.length === 0) {
        return (
            <EmptyState
                title="资产 (Assets)"
                target="asset"
                createButtonText="创建新资产"
                message="暂无资产。"
            />
        );
    }

    // Helper function to format creators
    const formatCreators = (asset: AssetApi) => {
        if (!asset.creator) {
            return <span class="null-value">无</span>;
        }

        if (Array.isArray(asset.creator)) {
            const creatorStrings = asset.creator.map(c =>
                `${c.creator_name || c.name || ''}(${c.role || ''})`
            );
            return creatorStrings.join(', ');
        } else {
            return `${asset.creator.creator_name || asset.creator.name || ''}(${asset.creator.role || ''})`;
        }
    };

    // Helper function to format boolean values
    const formatBoolean = (value: boolean | null | undefined) => {
        if (value === null || value === undefined) {
            return <span class="null-value">NULL</span>;
        }
        return value ?
            <span class="bool-true">是</span> :
            <span class="bool-false">否</span>;
    };

    return (
        <div>
            <AdminHeader
                title="资产 (Assets)"
                target="asset"
                createButtonText="创建新资产"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>作品UUID</th>
                            <th>文件名</th>
                            <th>资产类型</th>
                            <th>是否预览图</th>
                            <th>语言</th>
                            <th>创作者</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets.map(asset => (
                            <tr data-uuid={asset.uuid}>
                                <UuidTableCell uuid={asset.uuid} />
                                <td>
                                    <UuidTableCell uuid={asset.work_uuid || ''} />
                                </td>
                                <td class="file-name">{asset.file_name || ''}</td>
                                <td class="asset-type">{asset.asset_type || ''}</td>
                                <td class="preview-pic">
                                    {formatBoolean(asset.is_previewpic)}
                                </td>
                                <td class="language">
                                    {asset.language || <span class="null-value">NULL</span>}
                                </td>
                                <td class="creators">
                                    {formatCreators(asset)}
                                </td>
                                <TableActionButtons
                                    target="asset"
                                    uuid={asset.uuid}
                                    editText="编辑"
                                    deleteText="删除"
                                />
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}