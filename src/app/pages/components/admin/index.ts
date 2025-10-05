// Admin components for Server-Side Rendering
export { WorkCard } from './work-card'
export { DataTable } from './data-table'
export { TagsTable, CategoriesTable } from './tags-categories'
export { CreatorTable } from './creator-table'

// Base admin UI components
export {
    AdminHeader,
    EmptyState,
    ActionButtons,
    TableActionButtons,
    UuidCell,
    UuidTableCell,
    TableCell,
    AdminTable
} from './base'

// Export types
export type { WorkCardProps } from './work-card'
export type { DataTableProps } from './data-table'
export type { TagsTableProps, CategoriesTableProps } from './tags-categories'
export type { CreatorTableProps } from './creator-table'

// Base component types
export type {
    AdminHeaderProps,
    EmptyStateProps,
    ActionButtonsProps,
    UuidCellProps,
    TableCellProps,
    AdminTableProps
} from './base'