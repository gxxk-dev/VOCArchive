import { jsx } from 'hono/jsx'

export interface DataTableProps {
    target: string
    data: any[]
    title?: string
}

// 渲染单元格内容的辅助函数
function renderCellContent(data: any): string {
    if (data === null || data === undefined) {
        return '<span class="null-value">NULL</span>';
    }
    if (typeof data === 'boolean') {
        return data ? '<span class="bool-true">Yes</span>' : '<span class="bool-false">No</span>';
    }
    if (typeof data === 'string') {
        // 截断长字符串如UUID
        if (data.length > 30 && data.includes('-')) {
             return `<span class="string-value uuid" title="${data}">${data.substring(0, 8)}...</span>`;
        }
        // 检查是否为URL
        if (data.startsWith('http')) {
            return `<a href="${data}" target="_blank" class="external-link">Link</a>`;
        }
        return `<span class="string-value">${data}</span>`;
    }
    if (typeof data === 'number') {
        return `<span class="number-value">${data}</span>`;
    }
    if (Array.isArray(data) || typeof data === 'object') {
        // 对于复杂对象/数组，显示摘要
        const summary = JSON.stringify(data, null, 2);
        if (summary.length > 100) {
            return `<pre>${summary.substring(0, 100)}...</pre>`;
        }
        return `<pre>${summary}</pre>`;
    }
    return data.toString();
}

// 获取UUID的辅助函数
function getUuid(row: any, target: string): string {
    return row.uuid || row.work_uuid || row.creator_uuid || row.media_uuid ||
           row.asset_uuid || row.relation_uuid || row.key ||
           (target === 'wiki_platform' ? row.platform_key : null);
}

export const DataTable = (props: DataTableProps) => {
    const { target, data, title } = props;

    if (!data || data.length === 0) {
        const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
        const displayTitle = title || capTarget;

        return (
            <div class="controls">
                <h2>{displayTitle}</h2>
                <button class="create-button" data-target={target}>Create New {capTarget}</button>
                <p>No {target} found.</p>
            </div>
        );
    }

    const headers = Object.keys(data[0]);
    const capTarget = target.charAt(0).toUpperCase() + target.slice(1);
    const displayTitle = title || capTarget;

    return (
        <div>
            <div class="controls">
                <h2>{displayTitle}</h2>
                <button class="create-button" data-target={target}>Create New {capTarget}</button>
            </div>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            {headers.map(h => <th>{h}</th>)}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(row => {
                            const uuid = getUuid(row, target);
                            return (
                                <tr data-uuid={uuid}>
                                    {headers.map(h => (
                                        <td dangerouslySetInnerHTML={{ __html: renderCellContent(row[h]) }}></td>
                                    ))}
                                    <td class="actions">
                                        <button class="edit-button" data-target={target} data-uuid={uuid}>Edit</button>
                                        <button class="delete-button" data-target={target}>Delete</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}