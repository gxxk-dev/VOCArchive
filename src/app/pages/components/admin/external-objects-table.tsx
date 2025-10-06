import { jsx } from 'hono/jsx'
import type { ExternalObjectWithSource } from '../../../db/operations/external_object'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface ExternalObjectsTableProps {
    objects: ExternalObjectWithSource[]
    sources?: any[]  // External sources for name resolution
}

export const ExternalObjectsTable = (props: ExternalObjectsTableProps) => {
    const { objects, sources = [] } = props;

    if (!objects) {
        return (
            <EmptyState
                title="外部对象 (External Objects)"
                target="external_object"
                createButtonText="创建新外部对象"
                message="无法加载外部对象数据。"
                isError={true}
            />
        );
    }

    if (objects.length === 0) {
        return (
            <EmptyState
                title="外部对象 (External Objects)"
                target="external_object"
                createButtonText="创建新外部对象"
                message="暂无外部对象。"
            />
        );
    }

    // Helper function to get source name
    const getSourceName = (obj: ExternalObjectWithSource) => {
        if (obj.source?.name) {
            return obj.source.name;
        }
        const source = sources.find(s => s.uuid === obj.external_source_id);
        if (source?.name) {
            return source.name;
        }
        return obj.uuid.substring(0, 8) + '...';
    };

    return (
        <div>
            <AdminHeader
                title="外部对象 (External Objects)"
                target="external_object"
                createButtonText="创建新外部对象"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>存储源</th>
                            <th>MIME 类型</th>
                            <th>文件 ID</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {objects.map(obj => (
                            <tr data-uuid={obj.uuid}>
                                <UuidTableCell uuid={obj.uuid} />
                                <td>
                                    <span
                                        class="external-source-ref"
                                        title={obj.source?.uuid || obj.uuid}
                                    >
                                        {getSourceName(obj)}
                                    </span>
                                </td>
                                <td class="mime-type">{obj.mime_type}</td>
                                <td class="file-id">{obj.file_id}</td>
                                <TableActionButtons
                                    target="external_object"
                                    uuid={obj.uuid}
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