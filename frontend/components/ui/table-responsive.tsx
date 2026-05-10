import * as React from "react";
import { useIsMobile } from "@/components/ui/use-mobile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Responsive configuration interface
export interface ResponsiveConfig {
  // Breakpoints (in pixels)
  mobile: number; // 768px
  tablet: number; // 1024px
  desktop: number; // 1280px

  // Mobile behavior
  mobileLayout: "stack" | "scroll" | "cards";
  stackedColumns?: string[]; // Column IDs to show in stacked mobile view

  // Column visibility by breakpoint
  hideOnMobile?: string[];
  hideOnTablet?: string[];
  showOnlyOnDesktop?: string[];
}

// Default responsive configuration
export const defaultResponsiveConfig: ResponsiveConfig = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  mobileLayout: "cards",
  stackedColumns: [],
  hideOnMobile: [],
  hideOnTablet: [],
  showOnlyOnDesktop: [],
};

// Hook for responsive table behavior
export function useResponsiveTable(config: Partial<ResponsiveConfig> = {}) {
  const fullConfig = { ...defaultResponsiveConfig, ...config };
  const [screenSize, setScreenSize] = React.useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  React.useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      if (width < fullConfig.mobile) {
        setScreenSize("mobile");
      } else if (width < fullConfig.tablet) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    updateScreenSize();
    window.addEventListener("resize", updateScreenSize);
    return () => window.removeEventListener("resize", updateScreenSize);
  }, [fullConfig.mobile, fullConfig.tablet]);

  const shouldHideColumn = React.useCallback(
    (columnId: string) => {
      switch (screenSize) {
        case "mobile":
          return (
            fullConfig.hideOnMobile?.includes(columnId) ||
            fullConfig.showOnlyOnDesktop?.includes(columnId)
          );
        case "tablet":
          return (
            fullConfig.hideOnTablet?.includes(columnId) ||
            fullConfig.showOnlyOnDesktop?.includes(columnId)
          );
        case "desktop":
          return false;
        default:
          return false;
      }
    },
    [screenSize, fullConfig]
  );

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktop = screenSize === "desktop";

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    shouldHideColumn,
    config: fullConfig,
  };
}

// Mobile card component for complex data
export interface MobileCardProps<TData = any> {
  row: TData;
  columns: Array<{
    id: string;
    header: string | ((props: any) => React.ReactNode);
    accessorKey?: keyof TData;
    accessorFn?: (row: TData) => any;
    cell?: (props: {
      getValue: () => any;
      row: TData;
      column: any;
    }) => React.ReactNode;
  }>;
  actions?: React.ReactNode;
  className?: string;
  primaryField?: string; // Field to highlight as primary
  secondaryFields?: string[]; // Fields to show as secondary info
}

export function MobileCard<TData = any>({
  row,
  columns,
  actions,
  className,
  primaryField,
  secondaryFields = [],
}: MobileCardProps<TData>) {
  const primaryColumn = primaryField
    ? columns.find((col) => col.id === primaryField)
    : columns[0];
  const secondaryColumns =
    secondaryFields.length > 0
      ? columns.filter((col) => secondaryFields.includes(col.id))
      : columns.slice(1, 4); // Show first 3 non-primary columns by default

  const otherColumns = columns.filter(
    (col) =>
      col.id !== primaryColumn?.id &&
      !secondaryColumns.some((secCol) => secCol.id === col.id)
  );

  const getCellValue = (column: (typeof columns)[0]) => {
    if (column.cell) {
      const getValue = () => {
        if (column.accessorFn) {
          return column.accessorFn(row);
        }
        if (column.accessorKey) {
          return (row as any)[column.accessorKey];
        }
        return null;
      };
      return column.cell({ getValue, row, column });
    }

    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return (row as any)[column.accessorKey];
    }
    return null;
  };

  return (
    <Card className={cn("mb-3", className)}>
      <CardContent className="p-4">
        {/* Primary field - larger, prominent */}
        {primaryColumn && (
          <div className="mb-3">
            <div className="font-semibold text-base leading-tight">
              {getCellValue(primaryColumn)}
            </div>
          </div>
        )}

        {/* Secondary fields - smaller, in a grid */}
        {secondaryColumns.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
            {secondaryColumns.map((column) => (
              <div key={column.id}>
                <div className="text-muted-foreground text-xs font-medium mb-1">
                  {typeof column.header === "string"
                    ? column.header
                    : column.id}
                </div>
                <div className="truncate">{getCellValue(column)}</div>
              </div>
            ))}
          </div>
        )}

        {/* Other fields - collapsible or hidden */}
        {otherColumns.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground mb-2">
              More details
            </summary>
            <div className="space-y-2 pl-2 border-l-2 border-muted">
              {otherColumns.map((column) => (
                <div
                  key={column.id}
                  className="flex justify-between items-start gap-2"
                >
                  <span className="text-muted-foreground text-xs font-medium min-w-0 flex-shrink-0">
                    {typeof column.header === "string"
                      ? column.header
                      : column.id}
                    :
                  </span>
                  <span className="text-right min-w-0 flex-1">
                    {getCellValue(column)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Actions */}
        {actions && (
          <div className="flex justify-end pt-3 border-t border-muted mt-3">
            {actions}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stacked mobile layout component
export interface StackedMobileRowProps<TData = any> {
  row: TData;
  columns: Array<{
    id: string;
    header: string;
    accessorKey?: keyof TData;
    accessorFn?: (row: TData) => any;
    cell?: (props: {
      getValue: () => any;
      row: TData;
      column: any;
    }) => React.ReactNode;
  }>;
  stackedColumns: string[];
  actions?: React.ReactNode;
  className?: string;
}

export function StackedMobileRow<TData = any>({
  row,
  columns,
  stackedColumns,
  actions,
  className,
}: StackedMobileRowProps<TData>) {
  const visibleColumns = columns.filter((col) =>
    stackedColumns.includes(col.id)
  );

  const getCellValue = (column: (typeof columns)[0]) => {
    if (column.cell) {
      const getValue = () => {
        if (column.accessorFn) {
          return column.accessorFn(row);
        }
        if (column.accessorKey) {
          return (row as any)[column.accessorKey];
        }
        return null;
      };
      return column.cell({ getValue, row, column });
    }

    if (column.accessorFn) {
      return column.accessorFn(row);
    }
    if (column.accessorKey) {
      return (row as any)[column.accessorKey];
    }
    return null;
  };

  return (
    <div className={cn("border-b border-muted py-3 space-y-2", className)}>
      {visibleColumns.map((column) => (
        <div key={column.id} className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">
            {column.header}
          </span>
          <span className="text-sm text-right">{getCellValue(column)}</span>
        </div>
      ))}
      {actions && <div className="flex justify-end pt-2">{actions}</div>}
    </div>
  );
}

// Horizontal scroll wrapper for wide tables
export interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
  showScrollIndicators?: boolean;
}

export function ScrollableTable({
  children,
  className,
  showScrollIndicators = true,
}: ScrollableTableProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const checkScrollability = React.useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  React.useEffect(() => {
    checkScrollability();
    const element = scrollRef.current;
    if (element) {
      element.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
      return () => {
        element.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [checkScrollability]);

  return (
    <div className={cn("relative", className)}>
      {/* Left scroll indicator */}
      {showScrollIndicators && canScrollLeft && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* Right scroll indicator */}
      {showScrollIndicators && canScrollRight && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
      >
        {children}
      </div>
    </div>
  );
}

// Column visibility controls
export interface ColumnVisibilityControlsProps {
  columns: Array<{ id: string; header: string }>;
  visibleColumns: string[];
  onVisibilityChange: (columnId: string, visible: boolean) => void;
  className?: string;
}

export function ColumnVisibilityControls({
  columns,
  visibleColumns,
  onVisibilityChange,
  className,
}: ColumnVisibilityControlsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {columns.map((column) => (
        <label
          key={column.id}
          className="flex items-center space-x-2 text-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={visibleColumns.includes(column.id)}
            onChange={(e) => onVisibilityChange(column.id, e.target.checked)}
            className="rounded border-muted"
          />
          <span>{column.header}</span>
        </label>
      ))}
    </div>
  );
}

// Utility function to determine optimal mobile layout
export function getOptimalMobileLayout<TData = any>(
  data: TData[],
  columns: Array<{ id: string; header: string }>,
  complexity: "simple" | "medium" | "complex" = "medium"
): ResponsiveConfig["mobileLayout"] {
  const columnCount = columns.length;
  const hasComplexData = data.some((row) =>
    Object.values(row as any).some(
      (value) =>
        typeof value === "object" ||
        (typeof value === "string" && value.length > 50)
    )
  );

  if (complexity === "simple" || columnCount <= 3) {
    return "stack";
  }

  if (complexity === "complex" || columnCount > 6 || hasComplexData) {
    return "cards";
  }

  return "scroll";
}

// Responsive table wrapper that handles layout switching
export interface ResponsiveTableWrapperProps<TData = any> {
  data: TData[];
  columns: Array<{
    id: string;
    header: string | ((props: any) => React.ReactNode);
    accessorKey?: keyof TData;
    accessorFn?: (row: TData) => any;
    cell?: (props: {
      getValue: () => any;
      row: TData;
      column: any;
    }) => React.ReactNode;
  }>;
  renderTable: () => React.ReactNode;
  renderMobileCard?: (row: TData, index: number) => React.ReactNode;
  config?: Partial<ResponsiveConfig>;
  className?: string;
}

export function ResponsiveTableWrapper<TData = any>({
  data,
  columns,
  renderTable,
  renderMobileCard,
  config,
  className,
}: ResponsiveTableWrapperProps<TData>) {
  const { isMobile, config: fullConfig } = useResponsiveTable(config);

  if (isMobile && fullConfig.mobileLayout === "cards") {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((row, index) =>
          renderMobileCard ? (
            renderMobileCard(row, index)
          ) : (
            <MobileCard key={index} row={row} columns={columns} />
          )
        )}
      </div>
    );
  }

  if (isMobile && fullConfig.mobileLayout === "scroll") {
    return (
      <ScrollableTable className={className}>{renderTable()}</ScrollableTable>
    );
  }

  return <div className={className}>{renderTable()}</div>;
}
