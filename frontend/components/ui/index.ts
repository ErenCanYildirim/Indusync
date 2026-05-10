// Core DataTable exports
export {
    DataTable,
    createStatusColumn,
    createActionsColumn,
    createDateColumn,
    TableSkeleton,
    EmptyState,
    ErrorState,
    type DataTableProps,
    type ColumnDef,
    type HeaderProps,
    type CellProps,
    type SortConfig,
    type FilterConfig,
} from './data-table'

// Status Badge exports
export {
    StatusBadge,
    statusBadgeVariants,
    statusMappings,
    getStatusVariant,
    getAvailableStatusVariants,
    type StatusBadgeVariant,
    type StatusBadgeProps,
} from './status-badge'

// Table Actions exports
export {
    TableActions,
    createViewAction,
    createEditAction,
    createDeleteAction,
    createDuplicateAction,
    createDownloadAction,
    createSettingsAction,
    createPermissionBasedAction,
    createActionGroup,
    createStandardActions,
    createOrderActions,
    createEmployeeActions,
    type ActionConfig,
    type TableActionsProps,
} from './table-actions'

// Responsive Table exports
export {
    ResponsiveTableWrapper,
    MobileCard,
    StackedMobileRow,
    ScrollableTable,
    ColumnVisibilityControls,
    useResponsiveTable,
    getOptimalMobileLayout,
    defaultResponsiveConfig,
    type ResponsiveConfig,
    type MobileCardProps,
    type StackedMobileRowProps,
    type ScrollableTableProps,
    type ColumnVisibilityControlsProps,
    type ResponsiveTableWrapperProps,
} from './table-responsive'

// Hook exports
export {
    useDataTable,
    useClientTable,
    useServerTable,
    type TableState,
    type TableActions as TableActionsHook,
    type TableParams,
    type PagedResponse,
    type UseDataTableProps,
} from '../../hooks/use-data-table'