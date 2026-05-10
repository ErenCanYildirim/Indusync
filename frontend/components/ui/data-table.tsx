import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Download,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StatusBadge,
  StatusBadgeVariant,
  getStatusVariant,
} from "@/components/ui/status-badge";
import { TableActions, ActionConfig } from "@/components/ui/table-actions";
import {
  ResponsiveTableWrapper,
  MobileCard,
  useResponsiveTable,
  ResponsiveConfig,
} from "@/components/ui/table-responsive";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";

// Core interfaces
export interface ColumnDef<TData = any> {
  id: string;
  header: string | ((props: HeaderProps) => React.ReactNode);
  accessorKey?: keyof TData;
  accessorFn?: (row: TData) => any;

  // Rendering
  cell?: (props: CellProps<TData>) => React.ReactNode;

  // Features
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;

  // Styling
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  align?: "left" | "center" | "right";
  className?: string;

  // Mobile behavior
  hideOnMobile?: boolean;
  mobileRender?: (props: CellProps<TData>) => React.ReactNode;
}

export interface HeaderProps {
  column: ColumnDef;
  sortDirection?: "asc" | "desc" | null;
  onSort?: (direction: "asc" | "desc") => void;
}

export interface CellProps<TData = any> {
  getValue: () => any;
  row: TData;
  column: ColumnDef<TData>;
}

export interface SortConfig {
  column: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  [key: string]: any;
}

export interface DataTableProps<TData = any> {
  // Data and columns
  data: TData[];
  columns: ColumnDef<TData>[];

  // Features
  enableSorting?: boolean;
  enableFiltering?: boolean;
  enablePagination?: boolean;
  enableSelection?: boolean;
  enableSearch?: boolean;

  // Pagination
  pageSize?: number;
  pageSizeOptions?: number[];

  // Loading and error states
  loading?: boolean;
  error?: string | null;

  // Customization
  emptyMessage?: string;
  className?: string;
  tableClassName?: string;

  // Callbacks
  onRowClick?: (row: TData) => void;
  onSelectionChange?: (selectedRows: TData[]) => void;

  // Server-side support
  serverSide?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (sort: SortConfig) => void;
  onFilterChange?: (filters: FilterConfig) => void;

  // Responsive
  responsiveConfig?: Partial<ResponsiveConfig>;
  mobileCardPrimaryField?: string;
  mobileCardSecondaryFields?: string[];

  // Abgeschlossen design format props
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  enableExport?: boolean;
  onExport?: () => void;
  exportLabel?: string;
  customFilters?: React.ReactNode;
  cardLayout?: boolean;
}

// Built-in column creators
export function createStatusColumn<TData = any>(
  accessorKey: keyof TData,
  statusMap?: Record<string, StatusBadgeVariant>,
  options?: {
    header?: string;
    className?: string;
  }
): ColumnDef<TData> {
  return {
    id: `status-${String(accessorKey)}`,
    header: options?.header || "Status",
    accessorKey,
    cell: ({ getValue }) => {
      const value = getValue();
      const variant = statusMap
        ? statusMap[value] || "aktiv"
        : getStatusVariant(value);

      return <StatusBadge variant={variant} />;
    },
    align: "center",
    className: options?.className,
  };
}

export function createActionsColumn<TData = any>(
  actions: ActionConfig<TData>[],
  options?: {
    header?: string;
    className?: string;
    align?: "start" | "center" | "end";
  }
): ColumnDef<TData> {
  return {
    id: "actions",
    header: options?.header || "Actions",
    cell: ({ row }) => (
      <TableActions row={row} actions={actions} align={options?.align} />
    ),
    align: "right",
    className: options?.className,
    sortable: false,
    filterable: false,
    searchable: false,
  };
}

export function createDateColumn<TData = any>(
  accessorKey: keyof TData,
  options?: {
    header?: string;
    format?: "short" | "medium" | "long";
    className?: string;
  }
): ColumnDef<TData> {
  return {
    id: `date-${String(accessorKey)}`,
    header: options?.header || "Date",
    accessorKey,
    cell: ({ getValue }) => {
      const value = getValue();
      if (!value) return "-";

      const date = new Date(value);

      // Use locale-aware formatting based on format option
      const formatOptions = {
        short: {
          year: "numeric" as const,
          month: "short" as const,
          day: "numeric" as const,
        },
        medium: {
          year: "numeric" as const,
          month: "long" as const,
          day: "numeric" as const,
        },
        long: {
          year: "numeric" as const,
          month: "long" as const,
          day: "numeric" as const,
          weekday: "long" as const,
        },
      };

      const format = options?.format || "short";
      return date.toLocaleDateString(undefined, formatOptions[format]);
    },
    sortable: true,
    className: options?.className,
  };
}

export function createCurrencyColumn<TData = any>(
  accessorKey: keyof TData,
  options?: {
    header?: string;
    currency?: string;
    className?: string;
  }
): ColumnDef<TData> {
  return {
    id: `currency-${String(accessorKey)}`,
    header: options?.header || "Amount",
    accessorKey,
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return "-";

      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return "-";

      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: options?.currency || "EUR",
      }).format(numValue);
    },
    align: "right",
    sortable: true,
    className: options?.className,
  };
}

export function createNumberColumn<TData = any>(
  accessorKey: keyof TData,
  options?: {
    header?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    className?: string;
  }
): ColumnDef<TData> {
  return {
    id: `number-${String(accessorKey)}`,
    header: options?.header || "Number",
    accessorKey,
    cell: ({ getValue }) => {
      const value = getValue();
      if (value === null || value === undefined) return "-";

      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue)) return "-";

      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: options?.minimumFractionDigits,
        maximumFractionDigits: options?.maximumFractionDigits,
      }).format(numValue);
    },
    align: "right",
    sortable: true,
    className: options?.className,
  };
}

// Loading skeleton component
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Empty state component
export function EmptyState({
  message,
  action,
}: {
  message?: string;
  action?: React.ReactNode;
}) {
  const t = useTranslations("Common.table");

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-muted-foreground mb-4">
        {message || t("noDataFound")}
      </div>
      {action}
    </div>
  );
}

// Error state component
export function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry?: () => void;
}) {
  const t = useTranslations("Common.table");

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="text-destructive mb-4">{error}</div>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          {t("retry")}
        </Button>
      )}
    </div>
  );
}

// Error boundary for DataTable
interface DataTableErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface DataTableErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class DataTableErrorBoundary extends React.Component<
  DataTableErrorBoundaryProps,
  DataTableErrorBoundaryState
> {
  constructor(props: DataTableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DataTableErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      "DataTable Error Boundary caught an error:",
      error,
      errorInfo
    );
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <ErrorState
          error={this.state.error.message || "An unexpected error occurred"}
          onRetry={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Main DataTable component
export function DataTable<TData = any>({
  data,
  columns,
  enableSorting = true,
  enableFiltering = false,
  enablePagination = true,
  enableSelection = false,
  enableSearch = true,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50, 100],
  loading = false,
  error = null,
  emptyMessage,
  className,
  tableClassName,
  onRowClick,
  onSelectionChange,
  serverSide = false,
  totalCount,
  onPageChange,
  onSortChange,
  onFilterChange,
  responsiveConfig,
  mobileCardPrimaryField,
  mobileCardSecondaryFields,
  // Abgeschlossen design format props
  title,
  description,
  icon,
  enableExport = false,
  onExport,
  exportLabel,
  customFilters,
  cardLayout = true,
}: DataTableProps<TData>) {
  const t = useTranslations("Common");
  const { isMobile } = useResponsiveTable(responsiveConfig);

  // Local state for client-side operations
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortConfig, setSortConfig] = React.useState<SortConfig | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRows, setSelectedRows] = React.useState<TData[]>([]);
  const [filters, setFilters] = React.useState<FilterConfig>({});

  // Handle sorting
  const handleSort = React.useCallback(
    (columnId: string, direction: "asc" | "desc") => {
      const newSortConfig = { column: columnId, direction };
      setSortConfig(newSortConfig);

      if (serverSide && onSortChange) {
        onSortChange(newSortConfig);
      }
    },
    [serverSide, onSortChange]
  );

  // Handle search
  const handleSearch = React.useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  // Handle filtering
  const handleFilter = React.useCallback(
    (columnId: string, value: any) => {
      const newFilters = { ...filters, [columnId]: value };
      setFilters(newFilters);
      setCurrentPage(1); // Reset to first page when filtering

      if (serverSide && onFilterChange) {
        onFilterChange(newFilters);
      }
    },
    [filters, serverSide, onFilterChange]
  );

  // Clear all filters
  const clearFilters = React.useCallback(() => {
    setFilters({});
    setCurrentPage(1);

    if (serverSide && onFilterChange) {
      onFilterChange({});
    }
  }, [serverSide, onFilterChange]);

  // Filter and sort data (client-side only)
  const processedData = React.useMemo(() => {
    if (serverSide) return data;

    let filtered = data;

    // Apply column filters
    if (enableFiltering && Object.keys(filters).length > 0) {
      filtered = filtered.filter((row) => {
        return Object.entries(filters).every(([columnId, filterValue]) => {
          if (!filterValue) return true; // Skip empty filters

          const column = columns.find((col) => col.id === columnId);
          if (!column || !column.filterable) return true;

          let value: any;
          if (column.accessorFn) {
            value = column.accessorFn(row);
          } else if (column.accessorKey) {
            value = (row as any)[column.accessorKey];
          }

          // Handle different filter types
          if (typeof filterValue === "string") {
            return String(value || "")
              .toLowerCase()
              .includes(filterValue.toLowerCase());
          } else if (Array.isArray(filterValue)) {
            return filterValue.includes(value);
          } else {
            return value === filterValue;
          }
        });
      });
    }

    // Apply search filter
    if (searchQuery && enableSearch) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((row) => {
        return columns.some((column) => {
          if (!column.searchable && column.searchable !== undefined)
            return false;

          let value: any;
          if (column.accessorFn) {
            value = column.accessorFn(row);
          } else if (column.accessorKey) {
            value = (row as any)[column.accessorKey];
          }

          return String(value || "")
            .toLowerCase()
            .includes(query);
        });
      });
    }

    // Apply sorting
    if (sortConfig && enableSorting) {
      const column = columns.find((col) => col.id === sortConfig.column);
      if (column) {
        filtered = [...filtered].sort((a, b) => {
          let aValue: any;
          let bValue: any;

          if (column.accessorFn) {
            aValue = column.accessorFn(a);
            bValue = column.accessorFn(b);
          } else if (column.accessorKey) {
            aValue = (a as any)[column.accessorKey];
            bValue = (b as any)[column.accessorKey];
          }

          if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return filtered;
  }, [
    data,
    searchQuery,
    sortConfig,
    filters,
    columns,
    enableSearch,
    enableSorting,
    enableFiltering,
    serverSide,
  ]);

  // Pagination
  const paginatedData = React.useMemo(() => {
    if (serverSide || !enablePagination) return processedData;

    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize, enablePagination, serverSide]);

  const totalPages = Math.ceil(
    (serverSide ? totalCount || 0 : processedData.length) / pageSize
  );

  // Render table header
  const renderTableHeader = () => (
    <TableHeader>
      <TableRow>
        {enableSelection && (
          <TableHead className="w-12">
            <input
              type="checkbox"
              checked={
                selectedRows.length === paginatedData.length &&
                paginatedData.length > 0
              }
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedRows(paginatedData);
                  onSelectionChange?.(paginatedData);
                } else {
                  setSelectedRows([]);
                  onSelectionChange?.([]);
                }
              }}
              aria-label={t("table.selection.selectAll")}
            />
          </TableHead>
        )}
        {columns.map((column) => (
          <TableHead
            key={column.id}
            className={cn(
              column.align === "center" && "text-center",
              column.align === "right" && "text-right",
              column.className
            )}
            style={{
              width: column.width,
              minWidth: column.minWidth,
              maxWidth: column.maxWidth,
            }}
          >
            {column.sortable && enableSorting ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 font-medium"
                onClick={() => {
                  const currentDirection =
                    sortConfig?.column === column.id
                      ? sortConfig.direction
                      : null;
                  const newDirection =
                    currentDirection === "asc" ? "desc" : "asc";
                  handleSort(column.id, newDirection);
                }}
              >
                {typeof column.header === "string"
                  ? column.header
                  : column.header({
                      column,
                      sortDirection:
                        sortConfig?.column === column.id
                          ? sortConfig.direction
                          : null,
                      onSort: (direction) => handleSort(column.id, direction),
                    })}
                {sortConfig?.column === column.id &&
                  (sortConfig.direction === "asc" ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  ))}
              </Button>
            ) : typeof column.header === "string" ? (
              column.header
            ) : (
              column.header({
                column,
                sortDirection: null,
              })
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  // Render table body
  const renderTableBody = () => (
    <TableBody>
      {paginatedData.map((row, index) => (
        <TableRow
          key={index}
          className={cn(
            onRowClick && "cursor-pointer hover:bg-muted/50",
            selectedRows.includes(row) && "bg-muted"
          )}
          onClick={() => onRowClick?.(row)}
        >
          {enableSelection && (
            <TableCell>
              <input
                type="checkbox"
                checked={selectedRows.includes(row)}
                onChange={(e) => {
                  if (e.target.checked) {
                    const newSelection = [...selectedRows, row];
                    setSelectedRows(newSelection);
                    onSelectionChange?.(newSelection);
                  } else {
                    const newSelection = selectedRows.filter((r) => r !== row);
                    setSelectedRows(newSelection);
                    onSelectionChange?.(newSelection);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                aria-label={t("table.selection.selectRow")}
              />
            </TableCell>
          )}
          {columns.map((column) => (
            <TableCell
              key={column.id}
              className={cn(
                column.align === "center" && "text-center",
                column.align === "right" && "text-right",
                column.className
              )}
            >
              {column.cell
                ? column.cell({
                    getValue: () => {
                      if (column.accessorFn) {
                        return column.accessorFn(row);
                      }
                      if (column.accessorKey) {
                        return (row as any)[column.accessorKey];
                      }
                      return null;
                    },
                    row,
                    column,
                  })
                : column.accessorFn
                ? column.accessorFn(row)
                : column.accessorKey
                ? (row as any)[column.accessorKey]
                : null}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  // Render desktop table
  const renderTable = () => (
    <Table className={tableClassName}>
      {renderTableHeader()}
      {renderTableBody()}
    </Table>
  );

  // Render mobile card
  const renderMobileCard = (row: TData, index: number) => (
    <MobileCard
      key={index}
      row={row}
      columns={columns}
      primaryField={mobileCardPrimaryField}
      secondaryFields={mobileCardSecondaryFields}
      actions={columns
        .find((col) => col.id === "actions")
        ?.cell?.({
          getValue: () => null,
          row,
          column: columns.find((col) => col.id === "actions")!,
        })}
    />
  );

  // If using card layout (abgeschlossen design format)
  if (cardLayout) {
    return (
      <div className={cn("space-y-8", className)}>
        {/* Header Section */}
        {(title || description) && (
          <div className="flex flex-col space-y-4">
            <div>
              {title && (
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-gray-600 mt-2">{description}</p>
              )}
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle className="flex items-center gap-3 text-xl">
                {icon && (
                  <div className="bg-emerald-100 p-2 rounded-lg">{icon}</div>
                )}
                {title}
              </CardTitle>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {(enableFiltering || customFilters) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Filter className="h-4 w-4" />
                    <span>{t("table.filtering.filter")}:</span>
                  </div>
                )}

                {/* Custom filters */}
                {customFilters}

                {/* Search */}
                {enableSearch && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder={t("table.search")}
                      className="w-64 pl-9 border-gray-200"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Handle loading state */}
            {loading ? (
              <div className="p-6">
                <TableSkeleton rows={pageSize} columns={columns.length} />
              </div>
            ) : error ? (
              /* Handle error state */
              <div className="p-6">
                <ErrorState error={error} />
              </div>
            ) : paginatedData.length === 0 ? (
              /* Handle empty state */
              <div className="p-6">
                <EmptyState message={emptyMessage} />
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden lg:block">
                  <Table className={cn("border-0", tableClassName)}>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-gray-100">
                        {enableSelection && (
                          <TableHead className="w-12 font-semibold text-gray-700">
                            <input
                              type="checkbox"
                              checked={
                                selectedRows.length === paginatedData.length &&
                                paginatedData.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows(paginatedData);
                                  onSelectionChange?.(paginatedData);
                                } else {
                                  setSelectedRows([]);
                                  onSelectionChange?.([]);
                                }
                              }}
                              aria-label={t("table.selection.selectAll")}
                            />
                          </TableHead>
                        )}
                        {columns.map((column) => (
                          <TableHead
                            key={column.id}
                            className={cn(
                              "font-semibold text-gray-700",
                              column.align === "center" && "text-center",
                              column.align === "right" && "text-right",
                              column.className
                            )}
                            style={{
                              width: column.width,
                              minWidth: column.minWidth,
                              maxWidth: column.maxWidth,
                            }}
                          >
                            {column.sortable && enableSorting ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900"
                                onClick={() => {
                                  const currentDirection =
                                    sortConfig?.column === column.id
                                      ? sortConfig.direction
                                      : null;
                                  const newDirection =
                                    currentDirection === "asc" ? "desc" : "asc";
                                  handleSort(column.id, newDirection);
                                }}
                              >
                                {typeof column.header === "string"
                                  ? column.header
                                  : column.header({
                                      column,
                                      sortDirection:
                                        sortConfig?.column === column.id
                                          ? sortConfig.direction
                                          : null,
                                      onSort: (direction) =>
                                        handleSort(column.id, direction),
                                    })}
                                {sortConfig?.column === column.id &&
                                  (sortConfig.direction === "asc" ? (
                                    <ChevronUp className="ml-1 h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="ml-1 h-4 w-4" />
                                  ))}
                              </Button>
                            ) : typeof column.header === "string" ? (
                              column.header
                            ) : (
                              column.header({
                                column,
                                sortDirection: null,
                              })
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedData.map((row, index) => (
                        <TableRow
                          key={index}
                          className={cn(
                            "hover:bg-gray-50/50 border-b border-gray-50",
                            onRowClick && "cursor-pointer",
                            selectedRows.includes(row) && "bg-muted"
                          )}
                          onClick={() => onRowClick?.(row)}
                        >
                          {enableSelection && (
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedRows.includes(row)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    const newSelection = [...selectedRows, row];
                                    setSelectedRows(newSelection);
                                    onSelectionChange?.(newSelection);
                                  } else {
                                    const newSelection = selectedRows.filter(
                                      (r) => r !== row
                                    );
                                    setSelectedRows(newSelection);
                                    onSelectionChange?.(newSelection);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                aria-label={t("table.selection.selectRow")}
                              />
                            </TableCell>
                          )}
                          {columns.map((column) => (
                            <TableCell
                              key={column.id}
                              className={cn(
                                "py-4",
                                column.align === "center" && "text-center",
                                column.align === "right" && "text-right",
                                column.className
                              )}
                            >
                              {column.cell
                                ? column.cell({
                                    getValue: () => {
                                      if (column.accessorFn) {
                                        return column.accessorFn(row);
                                      }
                                      if (column.accessorKey) {
                                        return (row as any)[column.accessorKey];
                                      }
                                      return null;
                                    },
                                    row,
                                    column,
                                  })
                                : column.accessorFn
                                ? column.accessorFn(row)
                                : column.accessorKey
                                ? (row as any)[column.accessorKey]
                                : null}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden p-6 space-y-4">
                  {paginatedData.map((row, index) => (
                    <MobileCard
                      key={index}
                      row={row}
                      columns={columns}
                      primaryField={mobileCardPrimaryField}
                      secondaryFields={mobileCardSecondaryFields}
                      actions={columns
                        .find((col) => col.id === "actions")
                        ?.cell?.({
                          getValue: () => null,
                          row,
                          column: columns.find((col) => col.id === "actions")!,
                        })}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {enablePagination && totalPages > 1 && (
                  <div className="flex items-center justify-center py-6 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = currentPage - 1;
                          setCurrentPage(newPage);
                          if (serverSide && onPageChange) {
                            onPageChange(newPage);
                          }
                        }}
                        disabled={currentPage === 1}
                        className="hover:bg-gray-50"
                      >
                        {t("table.pagination.previous")}
                      </Button>

                      {/* Page numbers */}
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const page = i + 1;
                          return (
                            <Button
                              key={page}
                              variant={
                                currentPage === page ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => {
                                setCurrentPage(page);
                                if (serverSide && onPageChange) {
                                  onPageChange(page);
                                }
                              }}
                              className="hover:bg-gray-50"
                            >
                              {page}
                            </Button>
                          );
                        }
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newPage = currentPage + 1;
                          setCurrentPage(newPage);
                          if (serverSide && onPageChange) {
                            onPageChange(newPage);
                          }
                        }}
                        disabled={currentPage === totalPages}
                        className="hover:bg-gray-50"
                      >
                        {t("table.pagination.next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Original layout (non-card layout)
  // Handle loading state
  if (loading) {
    return (
      <div className={className}>
        <TableSkeleton rows={pageSize} columns={columns.length} />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <ErrorState error={error} />
      </div>
    );
  }

  // Handle empty state
  if (paginatedData.length === 0) {
    return (
      <div className={className}>
        <EmptyState message={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Selection indicator */}
      {enableSelection && selectedRows.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 rounded-md mb-4">
          <span className="text-sm text-muted-foreground">
            {t("table.selection.selectedCount", { count: selectedRows.length })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedRows([]);
              onSelectionChange?.([]);
            }}
            className="h-8 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear selection
          </Button>
        </div>
      )}

      {/* Search and filters */}
      {(enableSearch || enableFiltering) && (
        <div className="flex flex-col gap-4 mb-4">
          {/* Search bar */}
          {enableSearch && (
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("table.search")}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => handleSearch("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Filter bar */}
          {enableFiltering && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t("table.filtering.filter")}:
              </span>

              {/* Filter inputs for filterable columns */}
              {columns
                .filter((column) => column.filterable)
                .map((column) => (
                  <div key={column.id} className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {typeof column.header === "string"
                        ? column.header
                        : column.id}
                      :
                    </span>
                    <Input
                      placeholder="Filter..."
                      value={filters[column.id] || ""}
                      onChange={(e) => handleFilter(column.id, e.target.value)}
                      className="h-8 w-32 text-xs"
                    />
                  </div>
                ))}

              {/* Clear filters button */}
              {Object.keys(filters).length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-8 px-2 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("table.filtering.clearFilters")}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <ResponsiveTableWrapper
        data={paginatedData}
        columns={columns}
        renderTable={renderTable}
        renderMobileCard={renderMobileCard}
        config={responsiveConfig}
      />

      {/* Pagination */}
      {enablePagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            {t("table.pagination.showing", {
              start: (currentPage - 1) * pageSize + 1,
              end: Math.min(
                currentPage * pageSize,
                serverSide ? totalCount || 0 : processedData.length
              ),
              total: serverSide ? totalCount || 0 : processedData.length,
            })}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = currentPage - 1;
                setCurrentPage(newPage);
                if (serverSide && onPageChange) {
                  onPageChange(newPage);
                }
              }}
              disabled={currentPage === 1}
            >
              {t("table.pagination.previous")}
            </Button>
            <span className="text-sm">
              {t("table.pagination.page", {
                current: currentPage,
                total: totalPages,
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newPage = currentPage + 1;
                setCurrentPage(newPage);
                if (serverSide && onPageChange) {
                  onPageChange(newPage);
                }
              }}
              disabled={currentPage === totalPages}
            >
              {t("table.pagination.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
