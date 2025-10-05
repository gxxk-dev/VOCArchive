import { jsx } from 'hono/jsx'
import { Creator } from '../../../db/types'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface CreatorTableProps {
    creators: Creator[]
}

export const CreatorTable = (props: CreatorTableProps) => {
    const { creators } = props;

    if (!creators || creators.length === 0) {
        return (
            <EmptyState
                title="作者 (Creators)"
                target="creator"
                createButtonText="创建新作者"
                message="暂无作者。"
            />
        );
    }

    return (
        <div>
            <AdminHeader
                title="作者 (Creators)"
                target="creator"
                createButtonText="创建新作者"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>类型</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {creators.map(creator => {
                            return (
                                <tr data-uuid={creator.uuid}>
                                    <UuidTableCell uuid={creator.uuid} />
                                    <td class="creator-name">
                                        {creator.name ? (
                                            creator.name
                                        ) : (
                                            <span class="null-value">NULL</span>
                                        )}
                                    </td>
                                    <td class="creator-type">{creator.type}</td>
                                    <TableActionButtons
                                        target="creator"
                                        uuid={creator.uuid}
                                        editText="编辑"
                                        deleteText="删除"
                                    />
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}