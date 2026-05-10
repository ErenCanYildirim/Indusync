"use client";

import * as React from "react";
import {
  DataTable,
  createStatusColumn,
  createActionsColumn,
  createDateColumn,
  createViewAction,
  createEditAction,
  createDeleteAction,
  useClientTable,
  type ColumnDef,
} from "@/components/ui";

// Example data type
interface ExampleOrder {
  id: string;
  title: string;
  status: "draft" | "published" | "active" | "completed" | "cancelled";
  budget: number;
  deadline: string;
  location: string;
  createdAt: string;
}

// Example data
const exampleData: ExampleOrder[] = [
  {
    id: "1",
    title: "Factory Automation Project",
    status: "active",
    budget: 15000,
    deadline: "2024-03-15",
    location: "Berlin",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "PLC Programming",
    status: "completed",
    budget: 8500,
    deadline: "2024-02-28",
    location: "Munich",
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    title: "Sensor Installation",
    status: "published",
    budget: 5200,
    deadline: "2024-04-10",
    location: "Hamburg",
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    title: "MQTT Integration",
    status: "draft",
    budget: 3800,
    deadline: "2024-03-30",
    location: "Frankfurt",
    createdAt: "2024-01-25",
  },
  {
    id: "5",
    title: "Quality Control System",
    status: "cancelled",
    budget: 12000,
    deadline: "2024-02-15",
    location: "Stuttgart",
    createdAt: "2024-01-05",
  },
];

export function DataTableExample() {
  // Use the client table hook
  const { tableState, tableActions, paginatedData, isLoading, error } =
    useClientTable(exampleData, 10);

  // Handle actions
  const handleView = (order: ExampleOrder) => {
    console.log("View order:", order);
    alert(`Viewing order: ${order.title}`);
  };

  const handleEdit = (order: ExampleOrder) => {
    console.log("Edit order:", order);
    alert(`Editing order: ${order.title}`);
  };

  const handleDelete = (order: ExampleOrder) => {
    console.log("Delete order:", order);
    if (confirm(`Are you sure you want to delete "${order.title}"?`)) {
      alert(`Deleted order: ${order.title}`);
    }
  };

  // Define columns
  const columns: ColumnDef<ExampleOrder>[] = [
    {
      id: "title",
      header: "Order Title",
      accessorKey: "title",
      sortable: true,
      searchable: true,
    },
    createStatusColumn<ExampleOrder>("status", {
      draft: "entwurf",
      published: "ausgeschrieben",
      active: "aktiv",
      completed: "abgeschlossen",
      cancelled: "in_verzug",
    }),
    {
      id: "budget",
      header: "Budget",
      accessorKey: "budget",
      cell: ({ getValue }) => {
        const value = getValue() as number;
        return new Intl.NumberFormat("de-DE", {
          style: "currency",
          currency: "EUR",
        }).format(value);
      },
      align: "right",
      sortable: true,
    },
    {
      id: "location",
      header: "Location",
      accessorKey: "location",
      sortable: true,
      searchable: true,
    },
    createDateColumn<ExampleOrder>("deadline", {
      header: "Deadline",
    }),
    createDateColumn<ExampleOrder>("createdAt", {
      header: "Created",
    }),
    createActionsColumn([
      createViewAction(handleView),
      createEditAction(handleEdit, (order) => order.status !== "completed"),
      createDeleteAction(handleDelete, (order) => order.status === "draft"),
    ]),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">DataTable Example</h2>
        <p className="text-muted-foreground">
          A comprehensive example showing the DataTable component with sorting,
          searching, and actions.
        </p>
      </div>

      <DataTable
        data={paginatedData}
        columns={columns}
        loading={isLoading}
        error={error}
        enableSorting={true}
        enableSearch={true}
        enablePagination={true}
        pageSize={10}
        emptyMessage="No orders found"
        mobileCardPrimaryField="title"
        mobileCardSecondaryFields={["status", "budget", "location"]}
        onRowClick={(order) => console.log("Row clicked:", order)}
      />

      {/* Debug info */}
      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information</h3>
        <div className="text-sm space-y-1">
          <div>Total records: {tableState.totalCount}</div>
          <div>Current page: {tableState.currentPage}</div>
          <div>Page size: {tableState.pageSize}</div>
          <div>Total pages: {tableState.totalPages}</div>
          <div>Global filter: "{tableState.globalFilter}"</div>
          <div>Selected rows: {tableState.selectedRows.length}</div>
        </div>
      </div>
    </div>
  );
}

export default DataTableExample;