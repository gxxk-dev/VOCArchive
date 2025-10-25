import { jsx } from 'hono/jsx'
import { AdminHeader } from './admin-header'
import { EmptyState } from './empty-state'
import { TableCell } from './table-cell'
import { TableActionButtons } from './action-buttons'

export interface AdminTableProps {
    title: string
    target: string
    data: any[]
    headers?: string[]
    createButtonText?: string
    emptyMessage?: string
    getUuidFromRow?: (row: any) => string
    renderCustomCell?: (data: any, columnName: string, row: any) => any
}

// 默认获取UUID的函数
function defaultGetUuid(row: any, target: string): string {
    return row.index || row.work_index || row.creator_index || row.media_index ||
           row.asset_index || row.relation_index || row.key ||
           (target === 'wiki_platform' ? row.platform_key : null);
}

export const AdminTable = (props: AdminTableProps) => {
    const {
        title,
        target,
        data,
        headers,
        createButtonText,
        emptyMessage,
        getUuidFromRow = (row) => defaultGetUuid(row, target),
        renderCustomCell
    } = props;

    if (!data || data.length === 0) {
        return (
            <EmptyState
                title={title}
                target={target}
                createButtonText={createButtonText}
                message={emptyMessage}
            />
        );
    }

    const tableHeaders = headers || Object.keys(data[0]);

    return (
        <div>
            <AdminHeader
                title={title}
                target={target}
                createButtonText={createButtonText}
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {tableHeaders.map(h => <th>{h}</th>)}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => {
                            const index = getUuidFromRow(row);
                            return (
                                <tr data-index={index}>
                                    {tableHeaders.map(h => {
                                        // 检查是否有自定义渲染器
                                        const customCell = renderCustomCell?.(row[h], h, row);
                                        if (customCell) {
                                            return customCell;
                                        }
                                        // 使用默认的TableCell
                                        return <TableCell data={row[h]} columnName={h} />;
                                    })}
                                    <TableActionButtons target={target} index={index} />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}