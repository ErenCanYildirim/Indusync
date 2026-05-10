/**
 * Examples demonstrating the enhanced useDataTable hook functionality
 * This file shows how to integrate with existing API patterns and use optimistic updates
 */

import React from "react";
import {
  useDataTable,
  useTableWithExistingHook,
  createFetchFunction,
  useOptimisticTable,
} from "@/hooks/use-data-table";
import { useOrders } from "@/hooks/use-orders";
import { api, type Order } from "@/lib/api";
import {
  DataTable,
  createActionsColumn,
  createStatusColumn,
  createDateColumn,
} from "@/components/ui/data-table";
import {
  createViewAction,
  createEditAction,
  createDeleteAction,
} from "@/components/ui/table-actions";

// Example 1: Basic client-side table with static data
export function BasicClientTableExample() {
  const mockOrders: Order[] = [
    {
      id: "1",
      title: "Test Order 1",
      description: "Description 1",
      category: "elektrotechnik",
      projectType: "einmalig",
      budget: 5000,
      location: "Berlin",
      startDate: new Date(),
      endDate: new Date(),
      status: "published",
      createdBy: "1",
      createdAt: new Date(),
      requirements: [],
      skills: [],
      documents: [],
    },
  ];

  const { tableState, tableActions, paginatedData, isLoading, error } =
    useDataTable({
      data: mockOrders,
      initialPageSize: 10,
      enableServerSide: false,
    });

  const columns = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title" as keyof Order,
      sortable: true,
      searchable: true,
    },
    createStatusColumn("status", {
      published: "aktiv",
      draft: "entwurf",
      completed: "abgeschlossen",
      cancelled: "in_verzug",
    }),
    createDateColumn("createdAt", { header: "Created", format: "short" }),
    createActionsColumn([
      createViewAction((row: Order) => console.log("View", row)),
      createEditAction((row: Order) => console.log("Edit", row)),
      createDeleteAction((row: Order) => console.log("Delete", row)),
    ]),
  ];

  return (
    <div>
      <h2>Basic Client-side Table</h2>
      <DataTable
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        error={error}
        enableSorting
        enableSearch
        enablePagination
        onSortChange={(sort) =>
          tableActions.setSorting(sort.column, sort.direction)
        }
      />
    </div>
  );
}

// Example 2: Integration with existing useOrders hook
export function ExistingHookIntegrationExample() {
  const ordersHook = useOrders();

  const { tableState, tableActions, paginatedData, isLoading, error } =
    useTableWithExistingHook(
      {
        data: ordersHook.orders,
        loading: ordersHook.loading,
        error: ordersHook.error,
        createItem: ordersHook.createOrder,
        updateItem: ordersHook.updateOrder,
        deleteItem: ordersHook.deleteOrder,
      },
      {
        initialPageSize: 10,
        enableOptimisticUpdates: true,
      }
    );

  const handleCreateOrder = async () => {
    try {
      await tableActions.addItem({
        title: "New Order",
        description: "New order description",
        category: "elektrotechnik",
        projectType: "einmalig",
        budget: 1000,
        location: "Munich",
        startDate: new Date(),
        endDate: new Date(),
        status: "draft",
        createdBy: "1",
        createdAt: new Date(),
        requirements: [],
        skills: [],
        documents: [],
      } as Order);
    } catch (error) {
      console.error("Failed to create order:", error);
    }
  };

  const columns = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title" as keyof Order,
      sortable: true,
      searchable: true,
    },
    {
      id: "budget",
      header: "Budget",
      accessorKey: "budget" as keyof Order,
      cell: ({ getValue }: { getValue: () => any }) =>
        `€${getValue().toLocaleString()}`,
      sortable: true,
    },
    createStatusColumn("status"),
    createActionsColumn([
      createViewAction((row: Order) => console.log("View", row)),
      createEditAction(
        (row: Order) =>
          tableActions.updateItem(row.id, { title: `${row.title} (Updated)` }),
        (row: Order) => row.status === "draft"
      ),
      createDeleteAction(
        (row: Order) => tableActions.removeItem(row.id),
        (row: Order) => row.status === "draft"
      ),
    ]),
  ];

  return (
    <div>
      <h2>Integration with Existing Hook (Optimistic Updates)</h2>
      <button onClick={handleCreateOrder} disabled={isLoading}>
        Create New Order
      </button>
      {error && (
        <div className="error">
          Error: {error}
          <button onClick={tableActions.retryLastOperation}>Retry</button>
          <button onClick={tableActions.clearError}>Clear</button>
        </div>
      )}
      <DataTable
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        error={error}
        enableSorting
        enableSearch
        enablePagination
        enableSelection
        onSelectionChange={(rows) => tableActions.setSelection(rows)}
      />
    </div>
  );
}

// Example 3: Server-side table with optimistic updates
export function ServerSideOptimisticExample() {
  // Create fetch function from existing API
  const fetchOrders = createFetchFunction(() => api.getOrders());

  const { tableState, tableActions, paginatedData, isLoading, error } =
    useOptimisticTable(
      fetchOrders,
      (orderData) => api.createOrder(orderData),
      (id, updates) => api.updateOrder(String(id), updates),
      (id) => api.deleteOrder(String(id)),
      {
        initialPageSize: 20,
        onError: (error) => console.error("Table error:", error),
      }
    );

  const columns = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title" as keyof Order,
      sortable: true,
      searchable: true,
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location" as keyof Order,
      sortable: true,
      filterable: true,
    },
    {
      id: "budget",
      header: "Budget",
      accessorKey: "budget" as keyof Order,
      cell: ({ getValue }: { getValue: () => any }) =>
        `€${getValue().toLocaleString()}`,
      sortable: true,
    },
    createStatusColumn("status"),
    createDateColumn("startDate", { header: "Start Date" }),
    createActionsColumn([
      createViewAction((row: Order) => console.log("View", row)),
      createEditAction((row: Order) => {
        tableActions.updateItem(row.id, {
          title: `${row.title} (Edited)`,
          budget: row.budget + 100,
        });
      }),
      createDeleteAction((row: Order) => tableActions.removeItem(row.id)),
    ]),
  ];

  return (
    <div>
      <h2>Server-side Table with Optimistic Updates</h2>

      {/* Table controls */}
      <div className="table-controls">
        <button
          onClick={() => tableActions.refresh()}
          disabled={tableState.isRefreshing}
        >
          {tableState.isRefreshing ? "Refreshing..." : "Refresh"}
        </button>

        {tableState.selectedRows.length > 0 && (
          <button
            onClick={() =>
              tableActions.removeItems(
                tableState.selectedRows.map((row) => row.id)
              )
            }
          >
            Delete Selected ({tableState.selectedRows.length})
          </button>
        )}
      </div>

      {/* Error handling */}
      {error && (
        <div className="error-banner">
          <span>Error: {error}</span>
          <button onClick={tableActions.retryLastOperation}>Retry</button>
          <button onClick={tableActions.clearError}>Dismiss</button>
        </div>
      )}

      {/* Data freshness indicator */}
      {tableState.lastFetch && (
        <div className="data-freshness">
          Last updated: {tableState.lastFetch.toLocaleTimeString()}
        </div>
      )}

      <DataTable
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        error={error}
        enableSorting
        enableFiltering
        enableSearch
        enablePagination
        enableSelection
        serverSide
        totalCount={tableState.totalCount}
        onPageChange={(page) => tableActions.setPage(page)}
        onSortChange={(sort) =>
          tableActions.setSorting(sort.column, sort.direction)
        }
        onFilterChange={(filters) => {
          Object.entries(filters).forEach(([column, value]) => {
            tableActions.setFilter(column, value);
          });
        }}
        onSelectionChange={(rows) => tableActions.setSelection(rows)}
      />
    </div>
  );
}

// Example 4: Advanced usage with custom configuration
export function AdvancedConfigurationExample() {
  const {
    tableState,
    tableActions,
    paginatedData,
    isLoading,
    error,
    hasData,
    hasSelection,
    isFiltered,
  } = useDataTable({
    data: [],
    initialPageSize: 25,
    enableServerSide: false,
    enableOptimisticUpdates: false,
    cacheTime: 10 * 60 * 1000, // 10 minutes
    staleTime: 2 * 60 * 1000, // 2 minutes
    onError: (error) => {
      console.error("Table error:", error);
      // Could integrate with toast notifications here
    },
  });

  return (
    <div>
      <h2>Advanced Configuration</h2>

      {/* Status indicators */}
      <div className="status-indicators">
        <span>Has Data: {hasData ? "Yes" : "No"}</span>
        <span>Has Selection: {hasSelection ? "Yes" : "No"}</span>
        <span>Is Filtered: {isFiltered ? "Yes" : "No"}</span>
        <span>Total Items: {tableState.totalCount}</span>
        <span>
          Current Page: {tableState.currentPage} of {tableState.totalPages}
        </span>
      </div>

      {/* Batch operations */}
      {hasSelection && (
        <div className="batch-operations">
          <button
            onClick={() => {
              const updates = tableState.selectedRows.map((row) => ({
                id: row.id,
                data: { status: "completed" },
              }));
              tableActions.updateItems(updates);
            }}
          >
            Mark Selected as Completed
          </button>

          <button
            onClick={() => {
              const ids = tableState.selectedRows.map((row) => row.id);
              tableActions.removeItems(ids);
            }}
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Filter management */}
      {isFiltered && (
        <div className="filter-management">
          <span>Active filters applied</span>
          <button onClick={tableActions.resetFilters}>Clear All Filters</button>
        </div>
      )}
    </div>
  );
}
