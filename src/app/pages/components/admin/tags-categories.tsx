import { jsx } from 'hono/jsx'
import { TagApi, CategoryApi } from '../../../db/types'
import { AdminHeader, EmptyState, UuidTableCell, TableActionButtons } from './base'

export interface TagsTableProps {
    tags: TagApi[]
}

export const TagsTable = (props: TagsTableProps) => {
    const { tags } = props;

    if (!tags || tags.length === 0) {
        return (
            <EmptyState
                title="标签 (Tags)"
                target="tag"
                createButtonText="创建新标签"
                message="暂无标签。"
            />
        );
    }

    return (
        <div>
            <AdminHeader
                title="标签 (Tags)"
                target="tag"
                createButtonText="创建新标签"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tags.map(tag => (
                            <tr data-uuid={tag.uuid}>
                                <UuidTableCell uuid={tag.uuid} />
                                <td class="tag-name">{tag.name}</td>
                                <TableActionButtons
                                    target="tag"
                                    uuid={tag.uuid}
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

export interface CategoriesTableProps {
    categories: CategoryApi[]
}

export const CategoriesTable = (props: CategoriesTableProps) => {
    const { categories } = props;

    if (!categories) {
        return (
            <EmptyState
                title="分类 (Categories)"
                target="category"
                createButtonText="创建新分类"
                message="无法加载分类数据。"
                isError={true}
            />
        );
    }

    if (categories.length === 0) {
        return (
            <EmptyState
                title="分类 (Categories)"
                target="category"
                createButtonText="创建新分类"
                message="暂无分类。"
            />
        );
    }

    return (
        <div>
            <AdminHeader
                title="分类 (Categories)"
                target="category"
                createButtonText="创建新分类"
            />
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>UUID</th>
                            <th>名称</th>
                            <th>父分类</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(category => (
                            <tr data-uuid={category.uuid}>
                                <UuidTableCell uuid={category.uuid} />
                                <td class="category-name">{category.name}</td>
                                <td class="parent-category">
                                    <UuidTableCell uuid={category.parent_uuid} />
                                </td>
                                <TableActionButtons
                                    target="category"
                                    uuid={category.uuid}
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