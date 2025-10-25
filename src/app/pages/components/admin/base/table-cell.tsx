import { jsx } from 'hono/jsx'

export interface TableCellProps {
    data: any
    columnName?: string
    className?: string
}

// 渲染单元格内容的辅助函数
function renderCellContent(data: any, columnName?: string): string {
    if (data === null || data === undefined) {
        return '<span class="null-value">NULL</span>';
    }
    if (typeof data === 'boolean') {
        return data ? '<span class="bool-true">Yes</span>' : '<span class="bool-false">No</span>';
    }
    if (typeof data === 'string') {
        // 特殊处理文件ID字段
        if (columnName === 'file_id' && data.length > 0) {
            const isLong = data.length > 30;
            const displayText = isLong ? data.substring(0, 25) + '...' : data;
            return `<span class="file-id-text long-text-collapsible ${isLong ? 'file-id-expandable' : ''}" title="${data}">${displayText}</span>`;
        }

        // 截断长字符串如UUID
        if (data.length > 30 && data.includes('-')) {
             return `<span class="string-value uuid" title="${data}">${data.substring(0, 8)}...</span>`;
        }

        // 检查是否为URL
        if (data.startsWith('http')) {
            return `<a href="${data}" target="_blank" class="external-link">Link</a>`;
        }

        // 处理其他长文本字段
        if (data.length > 30) {
            return `<span class="long-text-collapsible" title="${data}">${data.substring(0, 45)}...</span>`;
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

export const TableCell = (props: TableCellProps) => {
    const { data, columnName, className } = props;

    return (
        <td class={className} dangerouslySetInnerHTML={{
            __html: renderCellContent(data, columnName)
        }}></td>
    );
}