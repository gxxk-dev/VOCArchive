import { jsx } from 'hono/jsx'
import { MediaSourceApi } from '../../../db/types'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface MediaSourcesTableProps {
    media: MediaSourceApi[]
}

export const MediaSourcesTable = (props: MediaSourcesTableProps) => {
    const { media } = props;

    if (!media || media.length === 0) {
        return (
            <EmptyState
                title="媒体源 (Media Sources)"
                target="media"
                createButtonText="创建新媒体源"
                message="暂无媒体源。"
            />
        );
    }

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
                title="媒体源 (Media Sources)"
                target="media"
                createButtonText="创建新媒体源"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>作品UUID</th>
                            <th>文件名</th>
                            <th>MIME类型</th>
                            <th>是否音乐</th>
                            <th>信息</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {media.map(mediaItem => (
                            <tr data-uuid={mediaItem.uuid}>
                                <UuidTableCell uuid={mediaItem.uuid} />
                                <td>
                                    <UuidTableCell uuid={mediaItem.work_uuid || ''} />
                                </td>
                                <td class="file-name">{mediaItem.file_name || ''}</td>
                                <td class="mime-type">{mediaItem.mime_type || ''}</td>
                                <td class="is-music">
                                    {formatBoolean(mediaItem.is_music)}
                                </td>
                                <td class="info">{mediaItem.info || ''}</td>
                                <TableActionButtons
                                    target="media"
                                    uuid={mediaItem.uuid}
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