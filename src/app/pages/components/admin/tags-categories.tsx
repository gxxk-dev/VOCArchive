import { jsx } from 'hono/jsx'
import { TagApi, CategoryApi } from '../../../db/types'

export interface TagsTableProps {
    tags: TagApi[]
}

export const TagsTable = (props: TagsTableProps) => {
    const { tags } = props;

    if (!tags || tags.length === 0) {
        return (
            <div>
                <div class="controls">
                    <h2>标签 (Tags)</h2>
                    <button class="create-button" data-target="tag">创建新标签</button>
                </div>
                <p>暂无标签。</p>
            </div>
        );
    }

    return (
        <div>
            <div class="controls">
                <h2>标签 (Tags)</h2>
                <button class="create-button" data-target="tag">创建新标签</button>
            </div>
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
                                <td>
                                    <span class="uuid" title={tag.uuid}>
                                        {tag.uuid.substring(0, 8)}...
                                    </span>
                                </td>
                                <td class="tag-name">{tag.name}</td>
                                <td>
                                    <button class="edit-button" data-uuid={tag.uuid} data-target="tag">编辑</button>
                                    <button class="delete-button" data-uuid={tag.uuid} data-target="tag">删除</button>
                                </td>
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
            <div>
                <div class="controls">
                    <h2>分类 (Categories)</h2>
                    <button class="create-button" data-target="category">创建新分类</button>
                </div>
                <p class="error-message">无法加载分类数据。</p>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div>
                <div class="controls">
                    <h2>分类 (Categories)</h2>
                    <button class="create-button" data-target="category">创建新分类</button>
                </div>
                <p>暂无分类。</p>
            </div>
        );
    }

    return (
        <div>
            <div class="controls">
                <h2>分类 (Categories)</h2>
                <button class="create-button" data-target="category">创建新分类</button>
            </div>
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
                                <td>
                                    <span class="uuid" title={category.uuid}>
                                        {category.uuid.substring(0, 8)}...
                                    </span>
                                </td>
                                <td class="category-name">{category.name}</td>
                                <td class="parent-category">
                                    {category.parent_uuid ? (
                                        <span class="uuid" title={category.parent_uuid}>
                                            {category.parent_uuid.substring(0, 8)}...
                                        </span>
                                    ) : (
                                        <span class="null-value">NULL</span>
                                    )}
                                </td>
                                <td>
                                    <button class="edit-button" data-uuid={category.uuid} data-target="category">编辑</button>
                                    <button class="delete-button" data-uuid={category.uuid} data-target="category">删除</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}