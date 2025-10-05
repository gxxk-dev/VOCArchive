// Admin components for Server-Side Rendering
export { WorkCard } from './work-card'
export { DataTable } from './data-table'
export { TagsTable, CategoriesTable } from './tags-categories'
export { CreatorTable } from './creator-table'
export { ExternalSourcesTable } from './external-sources-table'
export { ExternalObjectsTable } from './external-objects-table'
export { AssetsTable } from './assets-table'
export { MediaSourcesTable } from './media-sources-table'

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
export type { ExternalSourcesTableProps } from './external-sources-table'
export type { ExternalObjectsTableProps } from './external-objects-table'
export type { AssetsTableProps } from './assets-table'
export type { MediaSourcesTableProps } from './media-sources-table'

// Base component types
export type {
    AdminHeaderProps,
    EmptyStateProps,
    ActionButtonsProps,
    UuidCellProps,
    TableCellProps,
    AdminTableProps
} from './base'