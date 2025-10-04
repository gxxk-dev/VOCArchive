import { jsx } from 'hono/jsx'
import { Creator } from '../../../db/types'

export interface CreatorTableProps {
    creators: Creator[]
}

export const CreatorTable = (props: CreatorTableProps) => {
    const { creators } = props;

    if (!creators || creators.length === 0) {
        return (
            <div>
                <div class="controls">
                    <h2>作者 (Creators)</h2>
                    <button class="create-button" data-target="creator">创建新作者</button>
                </div>
                <p>暂无作者。</p>
            </div>
        );
    }

    return (
        <div>
            <div class="controls">
                <h2>作者 (Creators)</h2>
                <button class="create-button" data-target="creator">创建新作者</button>
            </div>
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
                                    <td>
                                        <span class="uuid" title={creator.uuid}>
                                            {creator.uuid.substring(0, 8)}...
                                        </span>
                                    </td>
                                    <td class="creator-name">
                                        {creator.name ? (
                                            creator.name
                                        ) : (
                                            <span class="null-value">NULL</span>
                                        )}
                                    </td>
                                    <td class="creator-type">{creator.type}</td>
                                    <td>
                                        <button class="edit-button" data-uuid={creator.uuid} data-target="creator">编辑</button>
                                        <button class="delete-button" data-uuid={creator.uuid} data-target="creator">删除</button>
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