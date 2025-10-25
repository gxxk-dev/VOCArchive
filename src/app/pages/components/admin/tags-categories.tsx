import { jsx } from 'hono/jsx'
import { TagApi, CategoryApi } from '../../../db/types'
import { AdminHeader, EmptyState, IndexTableCell, TableActionButtons } from './base'

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
                            <tr data-index={tag.index}>
                                <IndexTableCell index={tag.index} />
                                <td class="tag-name">{tag.name}</td>
                                <TableActionButtons
                                    target="tag"
                                    index={tag.index}
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
                            <tr data-index={category.index}>
                                <IndexTableCell index={category.index} />
                                <td class="category-name">{category.name}</td>
                                <td class="parent-category">
                                    <IndexTableCell index={category.parent_index} />
                                </td>
                                <TableActionButtons
                                    target="category"
                                    index={category.index}
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