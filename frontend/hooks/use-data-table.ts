import * as React from "react"

// Table state interface
export interface TableState<TData = any> {
    // Data
    data: TData[]
    filteredData: TData[]
    originalData: TData[] // Keep original data for optimistic updates

    // Pagination
    currentPage: number
    pageSize: number
    totalCount: number
    totalPages: number

    // Sorting
    sortBy?: string
    sortDirection?: "asc" | "desc"

    // Filtering
    filters: Record<string, any>
    globalFilter: string

    // Selection
    selectedRows: TData[]

    // UI State
    loading: boolean
    error: string | null
    isRefreshing: boolean // Separate state for refresh operations
    lastFetch?: Date // Track when data was last fetched
}

// Table actions interface
export interface TableActions<TData = any> {
    setPage: (page: number) => void
    setPageSize: (size: number) => void
    setSorting: (column: string, direction: "asc" | "desc") => void
    setFilter: (column: string, value: any) => void
    setGlobalFilter: (value: string) => void
    setSelection: (rows: TData[]) => void
    resetFilters: () => void
    refresh: () => void
    // Optimistic update actions
    addItem: (item: TData) => void
    updateItem: (id: string | number, updates: Partial<TData>) => void
    removeItem: (id: string | number) => void
    // Batch operations
    addItems: (items: TData[]) => void
    updateItems: (updates: Array<{ id: string | number; data: Partial<TData> }>) => void
    removeItems: (ids: Array<string | number>) => void
    // Error recovery
    retryLastOperation: () => void
    clearError: () => void
}

// Table parameters for API calls
export interface TableParams {
    page: number
    size: number
    sort?: string
    filters?: Record<string, any>
    search?: string
}

// Paged response interface
export interface PagedResponse<TData = any> {
    data: TData[]
    totalCount: number
    page: number
    size: number
    totalPages: number
}

// Hook configuration
export interface UseDataTableProps<TData = any> {
    data?: TData[]
    fetchFn?: (params: TableParams) => Promise<PagedResponse<TData>>
    initialPageSize?: number
    enableServerSide?: boolean
    onError?: (error: Error) => void
    // Optimistic update configuration
    idField?: keyof TData // Field to use as unique identifier (default: 'id')
    enableOptimisticUpdates?: boolean
    // Mutation functions for optimistic updates
    createFn?: (item: Omit<TData, 'id'>) => Promise<TData>
    updateFn?: (id: string | number, updates: Partial<TData>) => Promise<TData>
    deleteFn?: (id: string | number) => Promise<void>
    // Cache configuration
    cacheTime?: number // Time in ms to cache data (default: 5 minutes)
    staleTime?: number // Time in ms before data is considered stale (default: 1 minute)
}

// Main hook
export function useDataTable<TData = any>({
    data: staticData,
    fetchFn,
    initialPageSize = 10,
    enableServerSide = false,
    onError,
    idField = 'id' as keyof TData,
    enableOptimisticUpdates = false,
    createFn,
    updateFn,
    deleteFn,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    staleTime = 60 * 1000, // 1 minute
}: UseDataTableProps<TData> = {}) {
    // State
    const [state, setState] = React.useState<TableState<TData>>({
        data: staticData || [],
        filteredData: staticData || [],
        originalData: staticData || [],
        currentPage: 1,
        pageSize: initialPageSize,
        totalCount: staticData?.length || 0,
        totalPages: Math.ceil((staticData?.length || 0) / initialPageSize),
        sortBy: undefined,
        sortDirection: undefined,
        filters: {},
        globalFilter: "",
        selectedRows: [],
        loading: false,
        error: null,
        isRefreshing: false,
        lastFetch: undefined,
    })

    // Keep track of pending operations for error recovery
    const [lastOperation, setLastOperation] = React.useState<{
        type: 'create' | 'update' | 'delete' | 'fetch'
        data?: any
        id?: string | number
    } | null>(null)

    // Check if data is stale
    const isDataStale = React.useCallback(() => {
        if (!state.lastFetch) return true
        return Date.now() - state.lastFetch.getTime() > staleTime
    }, [state.lastFetch, staleTime])

    // Fetch data function
    const fetchData = React.useCallback(async (isRefresh = false) => {
        if (!fetchFn || !enableServerSide) return

        setState(prev => ({
            ...prev,
            loading: !isRefresh,
            isRefreshing: isRefresh,
            error: null
        }))

        try {
            const params: TableParams = {
                page: state.currentPage,
                size: state.pageSize,
                sort: state.sortBy && state.sortDirection
                    ? `${state.sortBy},${state.sortDirection}`
                    : undefined,
                filters: Object.keys(state.filters).length > 0 ? state.filters : undefined,
                search: state.globalFilter || undefined,
            }

            setLastOperation({ type: 'fetch', data: params })
            const response = await fetchFn(params)

            setState(prev => ({
                ...prev,
                data: response.data,
                filteredData: response.data,
                originalData: response.data,
                totalCount: response.totalCount,
                totalPages: response.totalPages,
                loading: false,
                isRefreshing: false,
                lastFetch: new Date(),
            }))
            setLastOperation(null)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An error occurred'
            setState(prev => ({
                ...prev,
                loading: false,
                isRefreshing: false,
                error: errorMessage,
            }))
            onError?.(error instanceof Error ? error : new Error(errorMessage))
        }
    }, [fetchFn, enableServerSide, state.currentPage, state.pageSize, state.sortBy, state.sortDirection, state.filters, state.globalFilter, onError, staleTime])

    // Optimistic update helpers
    const getItemId = React.useCallback((item: TData): string | number => {
        return (item as any)[idField]
    }, [idField])

    const findItemIndex = React.useCallback((data: TData[], id: string | number): number => {
        return data.findIndex(item => getItemId(item) === id)
    }, [getItemId])

    // Optimistic create
    const optimisticCreate = React.useCallback(async (item: Omit<TData, 'id'>) => {
        if (!createFn || !enableOptimisticUpdates) return

        // Generate temporary ID for optimistic update
        const tempId = `temp_${Date.now()}`
        const optimisticItem = { ...item, [idField]: tempId } as TData

        // Optimistically add item
        setState(prev => ({
            ...prev,
            data: [optimisticItem, ...prev.data],
            originalData: prev.originalData, // Keep original data unchanged
            totalCount: prev.totalCount + 1,
        }))

        try {
            setLastOperation({ type: 'create', data: item })
            const createdItem = await createFn(item)

            // Replace optimistic item with real item
            setState(prev => ({
                ...prev,
                data: prev.data.map(i => getItemId(i) === tempId ? createdItem : i),
                originalData: [createdItem, ...prev.originalData],
            }))
            setLastOperation(null)
            return createdItem
        } catch (error) {
            // Revert optimistic update
            setState(prev => ({
                ...prev,
                data: prev.data.filter(i => getItemId(i) !== tempId),
                totalCount: prev.totalCount - 1,
                error: error instanceof Error ? error.message : 'Failed to create item',
            }))
            onError?.(error instanceof Error ? error : new Error('Failed to create item'))
            throw error
        }
    }, [createFn, enableOptimisticUpdates, idField, getItemId, onError])

    // Optimistic update
    const optimisticUpdate = React.useCallback(async (id: string | number, updates: Partial<TData>) => {
        if (!updateFn || !enableOptimisticUpdates) return

        const itemIndex = findItemIndex(state.data, id)
        if (itemIndex === -1) return

        const originalItem = state.data[itemIndex]
        const optimisticItem = { ...originalItem, ...updates }

        // Optimistically update item
        setState(prev => ({
            ...prev,
            data: prev.data.map((item, index) => index === itemIndex ? optimisticItem : item),
        }))

        try {
            setLastOperation({ type: 'update', data: updates, id })
            const updatedItem = await updateFn(id, updates)

            // Replace optimistic item with real item
            setState(prev => ({
                ...prev,
                data: prev.data.map(item => getItemId(item) === id ? updatedItem : item),
                originalData: prev.originalData.map(item => getItemId(item) === id ? updatedItem : item),
            }))
            setLastOperation(null)
            return updatedItem
        } catch (error) {
            // Revert optimistic update
            setState(prev => ({
                ...prev,
                data: prev.data.map((item, index) => index === itemIndex ? originalItem : item),
                error: error instanceof Error ? error.message : 'Failed to update item',
            }))
            onError?.(error instanceof Error ? error : new Error('Failed to update item'))
            throw error
        }
    }, [updateFn, enableOptimisticUpdates, state.data, findItemIndex, getItemId, onError])

    // Optimistic delete
    const optimisticDelete = React.useCallback(async (id: string | number) => {
        if (!deleteFn || !enableOptimisticUpdates) return

        const itemIndex = findItemIndex(state.data, id)
        if (itemIndex === -1) return

        const itemToDelete = state.data[itemIndex]

        // Optimistically remove item
        setState(prev => ({
            ...prev,
            data: prev.data.filter(item => getItemId(item) !== id),
            totalCount: prev.totalCount - 1,
        }))

        try {
            setLastOperation({ type: 'delete', id })
            await deleteFn(id)

            // Update original data
            setState(prev => ({
                ...prev,
                originalData: prev.originalData.filter(item => getItemId(item) !== id),
            }))
            setLastOperation(null)
        } catch (error) {
            // Revert optimistic delete
            setState(prev => ({
                ...prev,
                data: [...prev.data.slice(0, itemIndex), itemToDelete, ...prev.data.slice(itemIndex)],
                totalCount: prev.totalCount + 1,
                error: error instanceof Error ? error.message : 'Failed to delete item',
            }))
            onError?.(error instanceof Error ? error : new Error('Failed to delete item'))
            throw error
        }
    }, [deleteFn, enableOptimisticUpdates, state.data, findItemIndex, getItemId, onError])

    // Initial fetch
    React.useEffect(() => {
        if (enableServerSide && fetchFn) {
            fetchData()
        }
    }, [])

    // Update static data
    React.useEffect(() => {
        if (!enableServerSide && staticData) {
            setState(prev => ({
                ...prev,
                data: staticData,
                filteredData: staticData,
                totalCount: staticData.length,
                totalPages: Math.ceil(staticData.length / prev.pageSize),
            }))
        }
    }, [staticData, enableServerSide])

    // Client-side filtering and sorting
    React.useEffect(() => {
        if (enableServerSide) return

        let filtered = [...state.data]

        // Apply global filter
        if (state.globalFilter) {
            const query = state.globalFilter.toLowerCase()
            filtered = filtered.filter(row => {
                return Object.values(row as any).some(value =>
                    String(value || '').toLowerCase().includes(query)
                )
            })
        }

        // Apply column filters
        Object.entries(state.filters).forEach(([column, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                filtered = filtered.filter(row => {
                    const rowValue = (row as any)[column]
                    if (typeof value === 'string') {
                        return String(rowValue || '').toLowerCase().includes(value.toLowerCase())
                    }
                    return rowValue === value
                })
            }
        })

        // Apply sorting
        if (state.sortBy && state.sortDirection) {
            filtered.sort((a, b) => {
                const aValue = (a as any)[state.sortBy!]
                const bValue = (b as any)[state.sortBy!]

                if (aValue < bValue) return state.sortDirection === 'asc' ? -1 : 1
                if (aValue > bValue) return state.sortDirection === 'asc' ? 1 : -1
                return 0
            })
        }

        setState(prev => ({
            ...prev,
            filteredData: filtered,
            totalCount: filtered.length,
            totalPages: Math.ceil(filtered.length / prev.pageSize),
        }))
    }, [state.data, state.globalFilter, state.filters, state.sortBy, state.sortDirection, state.pageSize, enableServerSide])

    // Actions
    const actions: TableActions<TData> = React.useMemo(() => ({
        setPage: (page: number) => {
            setState(prev => ({ ...prev, currentPage: page }))
            if (enableServerSide) {
                // Trigger refetch with new page
                setTimeout(fetchData, 0)
            }
        },

        setPageSize: (size: number) => {
            setState(prev => ({
                ...prev,
                pageSize: size,
                currentPage: 1, // Reset to first page
                totalPages: Math.ceil(prev.totalCount / size),
            }))
            if (enableServerSide) {
                setTimeout(fetchData, 0)
            }
        },

        setSorting: (column: string, direction: "asc" | "desc") => {
            setState(prev => ({
                ...prev,
                sortBy: column,
                sortDirection: direction,
                currentPage: 1, // Reset to first page
            }))
            if (enableServerSide) {
                setTimeout(fetchData, 0)
            }
        },

        setFilter: (column: string, value: any) => {
            setState(prev => ({
                ...prev,
                filters: { ...prev.filters, [column]: value },
                currentPage: 1, // Reset to first page
            }))
            if (enableServerSide) {
                setTimeout(fetchData, 0)
            }
        },

        setGlobalFilter: (value: string) => {
            setState(prev => ({
                ...prev,
                globalFilter: value,
                currentPage: 1, // Reset to first page
            }))
            if (enableServerSide) {
                setTimeout(fetchData, 0)
            }
        },

        setSelection: (rows: TData[]) => {
            setState(prev => ({ ...prev, selectedRows: rows }))
        },

        resetFilters: () => {
            setState(prev => ({
                ...prev,
                filters: {},
                globalFilter: "",
                currentPage: 1,
            }))
            if (enableServerSide) {
                setTimeout(fetchData, 0)
            }
        },

        refresh: () => {
            if (enableServerSide) {
                fetchData(true) // Pass true to indicate this is a refresh
            } else {
                // For client-side, just reset selection and current page
                setState(prev => ({
                    ...prev,
                    selectedRows: [],
                    currentPage: 1,
                }))
            }
        },

        // Optimistic update actions
        addItem: (item: TData) => {
            if (enableOptimisticUpdates && createFn) {
                optimisticCreate(item as Omit<TData, 'id'>)
            } else {
                // Fallback for non-optimistic updates
                setState(prev => ({
                    ...prev,
                    data: [item, ...prev.data],
                    totalCount: prev.totalCount + 1,
                }))
            }
        },

        updateItem: (id: string | number, updates: Partial<TData>) => {
            if (enableOptimisticUpdates && updateFn) {
                optimisticUpdate(id, updates)
            } else {
                // Fallback for non-optimistic updates
                setState(prev => ({
                    ...prev,
                    data: prev.data.map(item => getItemId(item) === id ? { ...item, ...updates } : item),
                }))
            }
        },

        removeItem: (id: string | number) => {
            if (enableOptimisticUpdates && deleteFn) {
                optimisticDelete(id)
            } else {
                // Fallback for non-optimistic updates
                setState(prev => ({
                    ...prev,
                    data: prev.data.filter(item => getItemId(item) !== id),
                    totalCount: prev.totalCount - 1,
                }))
            }
        },

        // Batch operations
        addItems: (items: TData[]) => {
            setState(prev => ({
                ...prev,
                data: [...items, ...prev.data],
                totalCount: prev.totalCount + items.length,
            }))
        },

        updateItems: (updates: Array<{ id: string | number; data: Partial<TData> }>) => {
            setState(prev => ({
                ...prev,
                data: prev.data.map(item => {
                    const update = updates.find(u => u.id === getItemId(item))
                    return update ? { ...item, ...update.data } : item
                }),
            }))
        },

        removeItems: (ids: Array<string | number>) => {
            setState(prev => ({
                ...prev,
                data: prev.data.filter(item => !ids.includes(getItemId(item))),
                totalCount: prev.totalCount - ids.length,
            }))
        },

        // Error recovery
        retryLastOperation: async () => {
            if (!lastOperation) return

            setState(prev => ({ ...prev, error: null }))

            try {
                switch (lastOperation.type) {
                    case 'fetch':
                        await fetchData()
                        break
                    case 'create':
                        if (createFn && lastOperation.data) {
                            await optimisticCreate(lastOperation.data)
                        }
                        break
                    case 'update':
                        if (updateFn && lastOperation.id && lastOperation.data) {
                            await optimisticUpdate(lastOperation.id, lastOperation.data)
                        }
                        break
                    case 'delete':
                        if (deleteFn && lastOperation.id) {
                            await optimisticDelete(lastOperation.id)
                        }
                        break
                }
            } catch (error) {
                // Error handling is already done in the individual functions
            }
        },

        clearError: () => {
            setState(prev => ({ ...prev, error: null }))
            setLastOperation(null)
        },
    }), [
        enableServerSide,
        fetchData,
        enableOptimisticUpdates,
        createFn,
        updateFn,
        deleteFn,
        optimisticCreate,
        optimisticUpdate,
        optimisticDelete,
        getItemId,
        lastOperation
    ])

    // Get paginated data for client-side pagination
    const paginatedData = React.useMemo(() => {
        if (enableServerSide) return state.filteredData

        const startIndex = (state.currentPage - 1) * state.pageSize
        return state.filteredData.slice(startIndex, startIndex + state.pageSize)
    }, [state.filteredData, state.currentPage, state.pageSize, enableServerSide])

    return {
        // State
        tableState: state,

        // Actions
        tableActions: actions,

        // Computed values
        paginatedData,
        isLoading: state.loading,
        error: state.error,

        // Utilities
        hasData: state.data.length > 0,
        hasSelection: state.selectedRows.length > 0,
        isFiltered: state.globalFilter !== "" || Object.keys(state.filters).length > 0,
    }
}

// Utility hook for simple client-side tables
export function useClientTable<TData = any>(
    data: TData[],
    initialPageSize = 10
) {
    return useDataTable({
        data,
        initialPageSize,
        enableServerSide: false,
    })
}

// Utility hook for server-side tables
export function useServerTable<TData = any>(
    fetchFn: (params: TableParams) => Promise<PagedResponse<TData>>,
    initialPageSize = 10,
    onError?: (error: Error) => void
) {
    return useDataTable({
        fetchFn,
        initialPageSize,
        enableServerSide: true,
        onError,
    })
}

// Utility hook for optimistic updates with existing API patterns
export function useOptimisticTable<TData = any>(
    fetchFn: (params: TableParams) => Promise<PagedResponse<TData>>,
    createFn: (item: Omit<TData, 'id'>) => Promise<TData>,
    updateFn: (id: string | number, updates: Partial<TData>) => Promise<TData>,
    deleteFn: (id: string | number) => Promise<void>,
    options?: {
        initialPageSize?: number
        idField?: keyof TData
        onError?: (error: Error) => void
    }
) {
    return useDataTable({
        fetchFn,
        createFn,
        updateFn,
        deleteFn,
        enableServerSide: true,
        enableOptimisticUpdates: true,
        initialPageSize: options?.initialPageSize || 10,
        idField: options?.idField || ('id' as keyof TData),
        onError: options?.onError,
    })
}

// Integration helper for existing API hooks (like useOrders)
export function useTableWithExistingHook<TData = any>(
    existingHook: {
        data: TData[]
        loading: boolean
        error: string | null
        createItem?: (item: Partial<TData>) => Promise<TData>
        updateItem?: (id: string, updates: Partial<TData>) => Promise<TData>
        deleteItem?: (id: string) => Promise<void>
    },
    options?: {
        initialPageSize?: number
        idField?: keyof TData
        enableOptimisticUpdates?: boolean
    }
) {
    const { data, loading, error, createItem, updateItem, deleteItem } = existingHook

    // Wrap existing functions to match our interface
    const createFn = React.useCallback(async (item: Omit<TData, 'id'>) => {
        if (!createItem) throw new Error('Create function not available')
        return await createItem(item as Partial<TData>)
    }, [createItem])

    const updateFn = React.useCallback(async (id: string | number, updates: Partial<TData>) => {
        if (!updateItem) throw new Error('Update function not available')
        return await updateItem(String(id), updates)
    }, [updateItem])

    const deleteFn = React.useCallback(async (id: string | number) => {
        if (!deleteItem) throw new Error('Delete function not available')
        await deleteItem(String(id))
    }, [deleteItem])

    const tableHook = useDataTable({
        data,
        enableServerSide: false,
        enableOptimisticUpdates: options?.enableOptimisticUpdates && !!createItem && !!updateItem && !!deleteItem,
        createFn: createItem ? createFn : undefined,
        updateFn: updateItem ? updateFn : undefined,
        deleteFn: deleteItem ? deleteFn : undefined,
        initialPageSize: options?.initialPageSize || 10,
        idField: options?.idField || ('id' as keyof TData),
    })

    // Override loading and error states with the ones from existing hook
    return {
        ...tableHook,
        isLoading: loading,
        error: error,
        tableState: {
            ...tableHook.tableState,
            loading,
            error,
        }
    }
}

// Helper to create a fetch function from existing API patterns
export function createFetchFunction<TData = any>(
    apiCall: () => Promise<TData[]>
): (params: TableParams) => Promise<PagedResponse<TData>> {
    return async (params: TableParams) => {
        const allData = await apiCall()

        // Apply server-side filtering if search is provided
        let filteredData = allData
        if (params.search) {
            const query = params.search.toLowerCase()
            filteredData = allData.filter(item =>
                Object.values(item as any).some(value =>
                    String(value || '').toLowerCase().includes(query)
                )
            )
        }

        // Apply server-side sorting if sort is provided
        if (params.sort) {
            const [sortField, sortDirection] = params.sort.split(',')
            filteredData.sort((a, b) => {
                const aValue = (a as any)[sortField]
                const bValue = (b as any)[sortField]

                if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
                if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
                return 0
            })
        }

        // Apply pagination
        const startIndex = (params.page - 1) * params.size
        const paginatedData = filteredData.slice(startIndex, startIndex + params.size)

        return {
            data: paginatedData,
            totalCount: filteredData.length,
            page: params.page,
            size: params.size,
            totalPages: Math.ceil(filteredData.length / params.size),
        }
    }
}

// Type-safe column configuration helper
export function createTableConfig<TData = any>() {
    return {
        // Helper to create type-safe column definitions
        createColumn: <K extends keyof TData>(
            id: string,
            accessor: K,
            options?: {
                header?: string
                sortable?: boolean
                filterable?: boolean
                searchable?: boolean
            }
        ) => ({
            id,
            header: options?.header || String(accessor),
            accessorKey: accessor,
            sortable: options?.sortable ?? true,
            filterable: options?.filterable ?? false,
            searchable: options?.searchable ?? true,
        }),

        // Helper to create computed columns
        createComputedColumn: (
            id: string,
            accessor: (row: TData) => any,
            options?: {
                header?: string
                sortable?: boolean
            }
        ) => ({
            id,
            header: options?.header || id,
            accessorFn: accessor,
            sortable: options?.sortable ?? false,
            filterable: false,
            searchable: false,
        }),
    }
}

export default useDataTable