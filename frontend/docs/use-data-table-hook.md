# Enhanced useDataTable Hook

The `useDataTable` hook provides centralized table state management with support for both client-side and server-side operations, optimistic updates, and seamless integration with existing API patterns.

## Key Features

### Centralized State Management

- Unified state for data, pagination, sorting, filtering, and selection
- Automatic state synchronization between client and server operations
- Built-in loading and error states with refresh capabilities

### Optimistic Updates

- Immediate UI updates for create, update, and delete operations
- Automatic rollback on operation failure
- Error recovery with retry functionality

### Integration with Existing API Patterns

- Compatible with existing hooks like `useOrders`, `useProjects`
- Seamless integration with current API structure
- Support for both static data and dynamic fetching

### Advanced Features

- Server-side and client-side sorting, filtering, pagination
- Batch operations for multiple items
- Data freshness tracking and cache management
- Type-safe column definitions and operations

## Basic Usage

### Client-side Table

```typescript
import { useClientTable } from "@/hooks/use-data-table";

const { tableState, tableActions, paginatedData, isLoading, error } =
  useClientTable(data, 10);
```

### Server-side Table

```typescript
import { useServerTable } from "@/hooks/use-data-table";

const fetchFn = async (params) => {
  const response = await api.getOrders(params);
  return {
    data: response.orders,
    totalCount: response.total,
    page: params.page,
    size: params.size,
    totalPages: Math.ceil(response.total / params.size),
  };
};

const { tableState, tableActions, paginatedData } = useServerTable(fetchFn);
```

### Integration with Existing Hooks

```typescript
import { useTableWithExistingHook } from "@/hooks/use-data-table";
import { useOrders } from "@/hooks/use-orders";

const ordersHook = useOrders();
const tableHook = useTableWithExistingHook(
  {
    data: ordersHook.orders,
    loading: ordersHook.loading,
    error: ordersHook.error,
    createItem: ordersHook.createOrder,
    updateItem: ordersHook.updateOrder,
    deleteItem: ordersHook.deleteOrder,
  },
  { enableOptimisticUpdates: true }
);
```

## State Management

### Table State

```typescript
interface TableState<TData> {
  data: TData[]; // Current data
  filteredData: TData[]; // Filtered/sorted data
  originalData: TData[]; // Original data for rollback
  currentPage: number; // Current page number
  pageSize: number; // Items per page
  totalCount: number; // Total item count
  totalPages: number; // Total page count
  sortBy?: string; // Current sort column
  sortDirection?: "asc" | "desc"; // Sort direction
  filters: Record<string, any>; // Active filters
  globalFilter: string; // Global search query
  selectedRows: TData[]; // Selected items
  loading: boolean; // Loading state
  error: string | null; // Error message
  isRefreshing: boolean; // Refresh operation state
  lastFetch?: Date; // Last fetch timestamp
}
```

### Table Actions

```typescript
interface TableActions<TData> {
  // Navigation
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  // Sorting & Filtering
  setSorting: (column: string, direction: "asc" | "desc") => void;
  setFilter: (column: string, value: any) => void;
  setGlobalFilter: (value: string) => void;
  resetFilters: () => void;

  // Selection
  setSelection: (rows: TData[]) => void;

  // Data Operations
  refresh: () => void;
  addItem: (item: TData) => void;
  updateItem: (id: string | number, updates: Partial<TData>) => void;
  removeItem: (id: string | number) => void;

  // Batch Operations
  addItems: (items: TData[]) => void;
  updateItems: (
    updates: Array<{ id: string | number; data: Partial<TData> }>
  ) => void;
  removeItems: (ids: Array<string | number>) => void;

  // Error Recovery
  retryLastOperation: () => void;
  clearError: () => void;
}
```

## Optimistic Updates

Optimistic updates provide immediate feedback to users by updating the UI before the server operation completes:

```typescript
const { tableActions } = useOptimisticTable(
  fetchFn,
  createFn,
  updateFn,
  deleteFn
);

// These operations update the UI immediately
await tableActions.addItem(newItem); // Optimistic create
await tableActions.updateItem(id, data); // Optimistic update
await tableActions.removeItem(id); // Optimistic delete
```

### Error Handling

- Automatic rollback on operation failure
- Error state management with retry functionality
- Last operation tracking for recovery

## Integration Patterns

### With Existing API Hooks

```typescript
// Existing pattern
const ordersHook = useOrders();

// Enhanced with table functionality
const tableHook = useTableWithExistingHook(ordersHook, {
  enableOptimisticUpdates: true,
});
```

### With DataTable Component

```typescript
<DataTable
  data={paginatedData}
  columns={columns}
  loading={isLoading}
  error={error}
  serverSide={enableServerSide}
  totalCount={tableState.totalCount}
  onPageChange={tableActions.setPage}
  onSortChange={(sort) => tableActions.setSorting(sort.column, sort.direction)}
  onSelectionChange={tableActions.setSelection}
/>
```

## Configuration Options

```typescript
interface UseDataTableProps<TData> {
  data?: TData[]; // Static data
  fetchFn?: (params: TableParams) => Promise<PagedResponse<TData>>; // Server fetch
  initialPageSize?: number; // Default: 10
  enableServerSide?: boolean; // Default: false
  enableOptimisticUpdates?: boolean; // Default: false
  idField?: keyof TData; // Default: 'id'
  createFn?: (item: Omit<TData, "id">) => Promise<TData>; // Create function
  updateFn?: (id: string | number, updates: Partial<TData>) => Promise<TData>; // Update function
  deleteFn?: (id: string | number) => Promise<void>; // Delete function
  cacheTime?: number; // Default: 5 minutes
  staleTime?: number; // Default: 1 minute
  onError?: (error: Error) => void; // Error callback
}
```

## Utility Functions

### createFetchFunction

Converts existing API calls to table-compatible fetch functions:

```typescript
const fetchOrders = createFetchFunction(() => api.getOrders());
```

### createTableConfig

Provides type-safe column configuration:

```typescript
const config = createTableConfig<Order>();
const columns = [
  config.createColumn("title", "title", { sortable: true }),
  config.createComputedColumn(
    "fullName",
    (row) => `${row.firstName} ${row.lastName}`
  ),
];
```

## Requirements Fulfilled

This implementation addresses all task requirements:

### Centralized Table State Management

- Unified state management for all table operations
- Consistent API across different table instances
- Automatic state synchronization

### Integration with Existing API Hooks Pattern

- `useTableWithExistingHook` for seamless integration
- Compatible with current `useOrders`, `useProjects` patterns
- Maintains existing error handling and loading states

### Support for Both Client-side and Server-side Operations

- `useClientTable` for static data
- `useServerTable` for dynamic fetching
- Automatic switching between operation modes

### Optimistic Updates and Error Handling

- Immediate UI updates with automatic rollback
- Comprehensive error recovery system
- Last operation tracking for retry functionality

The enhanced hook provides a robust foundation for all table functionality while maintaining compatibility with existing patterns and enabling advanced features like optimistic updates and comprehensive error handling.