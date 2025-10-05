import { jsx } from 'hono/jsx'
import { ExternalSourceApi } from '../../../db/types'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface ExternalSourcesTableProps {
    sources: ExternalSourceApi[]
}

export const ExternalSourcesTable = (props: ExternalSourcesTableProps) => {
    const { sources } = props;

    if (!sources) {
        return (
            <EmptyState
                title="存储源 (External Sources)"
                target="external_source"
                createButtonText="创建新存储源"
                message="无法加载存储源数据。"
                isError={true}
            />
        );
    }

    if (sources.length === 0) {
        return (
            <EmptyState
                title="存储源 (External Sources)"
                target="external_source"
                createButtonText="创建新存储源"
                message="暂无存储源。"
            />
        );
    }

    return (
        <div>
            <AdminHeader
                title="存储源 (External Sources)"
                target="external_source"
                createButtonText="创建新存储源"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>类型</th>
                            <th>端点</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sources.map(source => (
                            <tr data-uuid={source.uuid}>
                                <UuidTableCell uuid={source.uuid} />
                                <td class="source-name">{source.name}</td>
                                <td>
                                    <span class={`storage-type-badge ${source.type}`}>
                                        {source.type === 'raw_url' ? '直接 URL' : 'IPFS'}
                                    </span>
                                </td>
                                <td class="endpoint-template">{source.endpoint}</td>
                                <TableActionButtons
                                    target="external_source"
                                    uuid={source.uuid}
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