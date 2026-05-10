import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Users2 } from "lucide-react";
import {
  ColumnDef,
  createStatusColumn,
  createActionsColumn,
  createDateColumn,
  createCurrencyColumn,
} from "@/components/ui/data-table";
import {
  createViewAction,
  createEditAction,
  createDeleteAction,
  createDuplicateAction,
  ActionConfig,
  TableActions,
} from "@/components/ui/table-actions";
import { StatusBadge, statusMappings } from "@/components/ui/status-badge";
import { MapPin, Calendar } from "lucide-react";
import type { OrderListResponse, OrderStatus } from "@/lib/api/types";

// Order-specific column definitions
export function useOrderColumns(
  isAuftraggeber: boolean = true,
  onView?: (order: OrderListResponse) => void,
  onEdit?: (order: OrderListResponse) => void,
  onDelete?: (order: OrderListResponse) => void,
  onDuplicate?: (order: OrderListResponse) => void,
  onMatches?: (order: OrderListResponse) => void
): ColumnDef<OrderListResponse>[] {
  const t = useTranslations("Orders");
  const router = useRouter();

  // Default action handlers if not provided
  const defaultOnView = React.useCallback(
    (order: OrderListResponse) => {
      router.push(`/dashboard/auftraege/${order.id}`);
    },
    [router]
  );

  const defaultOnEdit = React.useCallback(
    (order: OrderListResponse) => {
      router.push(`/dashboard/auftraege/${order.id}/edit`);
    },
    [router]
  );

  const defaultOnMatches = React.useCallback(
    (order: OrderListResponse) => {
      router.push(`/dashboard/auftraege/${order.id}/matches`);
    },
    [router]
  );

  const handleView = onView || defaultOnView;
  const handleEdit = onEdit || defaultOnEdit;
  const handleMatches = onMatches || defaultOnMatches;

  // Create actions based on role and permissions
  const createOrderActions = React.useCallback(
    (order: OrderListResponse): ActionConfig<OrderListResponse>[] => {
      const actions: ActionConfig<OrderListResponse>[] = [];

      // View action - always available
      actions.push(createViewAction(handleView, t("actions.view") || "View"));

      // Edit action - only for drafts and for Auftraggeber
      if (isAuftraggeber && order.status === "DRAFT") {
        actions.push(
          createEditAction(
            handleEdit,
            (order) => order.status === "DRAFT",
            t("actions.edit") || "Edit"
          )
        );
      }

      // Matches action - only for Auftraggeber (clients) and only before a provider is selected
      if (isAuftraggeber && order.status === "PUBLISHED") {
        actions.push({
          id: "matches",
          label: t("actions.matches") || "View Matches",
          icon: Users2,
          onClick: handleMatches,
          variant: "ghost",
        });
      }

      // Duplicate action - only for Auftraggeber
      if (isAuftraggeber && onDuplicate) {
        actions.push(
          createDuplicateAction(
            onDuplicate,
            undefined,
            t("actions.duplicate") || "Duplicate"
          )
        );
      }

      // Delete action - only for drafts and cancelled orders
      if (
        onDelete &&
        (order.status === "DRAFT" || order.status === "CANCELLED")
      ) {
        actions.push(
          createDeleteAction(
            onDelete,
            (order) => order.status === "DRAFT" || order.status === "CANCELLED",
            t("actions.delete") || "Delete"
          )
        );
      }

      return actions;
    },
    [
      isAuftraggeber,
      handleView,
      handleEdit,
      handleMatches,
      onDuplicate,
      onDelete,
      t,
    ]
  );

  return React.useMemo(() => {
    const columns: ColumnDef<OrderListResponse>[] = [
      // Title column
      {
        id: "title",
        header: t("columns.title") || "Order",
        accessorKey: "title" as keyof OrderListResponse,
        cell: ({ getValue }) => (
          <div className="font-medium max-w-[200px] truncate">
            {getValue() as string}
          </div>
        ),
        sortable: true,
        searchable: true,
      },

      // Status column with proper badge variants
      {
        id: "status",
        header: t("columns.status") || "Status",
        accessorKey: "status" as keyof OrderListResponse,
        cell: ({ getValue }) => {
          const status = getValue() as OrderStatus;
          const variant = statusMappings.order[status] || "aktiv";
          // Let StatusBadge translate based on current locale
          return <StatusBadge variant={variant} />;
        },
        align: "center",
        sortable: true,
        filterable: true,
      },

      // Location column - hidden on mobile
      {
        id: "location",
        header: t("columns.location") || "Location",
        accessorFn: (row) =>
          row.fullAddress ||
          (row.city && row.postalCode
            ? `${row.postalCode} ${row.city}`
            : row.city) ||
          "Not specified",
        cell: ({ getValue }) => (
          <div className="flex items-center max-w-[150px]">
            <MapPin className="mr-1 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{getValue() as string}</span>
          </div>
        ),
        hideOnMobile: true,
        sortable: true,
        searchable: true,
      },

      // Timeline column - hidden on mobile
      {
        id: "timeline",
        header: t("columns.timeline") || "Timeline",
        accessorFn: (row) => {
          if (row.publishedAt) {
            return `${formatDate(row.publishedAt)} - ${
              t("ongoing") || "Ongoing"
            }`;
          }
          return `${t("created") || "Created"}: ${formatDate(row.createdAt)}`;
        },
        cell: ({ getValue }) => (
          <div className="flex items-center max-w-[150px]">
            <Calendar className="mr-1 h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="truncate text-sm">{getValue() as string}</span>
          </div>
        ),
        hideOnMobile: true,
        sortable: false,
      },

      // Budget column - optional, hidden on mobile
      //   ...(true
      //     ? [
      //         {
      //           id: "budget",
      //           header: t("columns.budget") || "Budget",
      //           accessorKey: "budget" as keyof OrderListResponse,
      //           cell: ({ getValue }: { getValue: () => any }) => {
      //             const budget = getValue() as number;
      //             if (!budget) return "-";

      //             return new Intl.NumberFormat("de-DE", {
      //               style: "currency",
      //               currency: "EUR",
      //             }).format(budget);
      //           },
      //           align: "right" as const,
      //           hideOnMobile: true,
      //           sortable: true,
      //         } as ColumnDef<OrderListResponse>,
      //       ]
      //     : []),

      // Applications count - only for Auftraggeber (clients) and only before assignment
      ...(isAuftraggeber
        ? [
            {
              id: "applicationsCount",
              header: t("columns.applications") || "Applications",
              accessorFn: (row: OrderListResponse) =>
                (row as any).applicationsCount || 0,
              cell: ({ row, getValue }: { row: any; getValue: () => any }) => {
                const status = (row.original?.status as OrderStatus) || "DRAFT";
                if (status !== "PUBLISHED")
                  return <span className="text-right">-</span>;
                return (
                  <div className="text-right font-medium">
                    {getValue() as number}
                  </div>
                );
              },
              align: "right" as const,
              sortable: true,
            } as ColumnDef<OrderListResponse>,
          ]
        : []),

      // Distance - only for Auftragnehmer
      ...(!isAuftraggeber
        ? [
            {
              id: "distance",
              header: t("columns.distance") || "Distance",
              accessorKey: "searchRadiusKm" as keyof OrderListResponse,
              cell: ({ getValue }: { getValue: () => any }) => {
                const distance = getValue() as number;
                if (!distance) return "-";

                return `${distance.toFixed(1)} km`;
              },
              align: "right" as const,
              hideOnMobile: true,
              sortable: true,
            } as ColumnDef<OrderListResponse>,
          ]
        : []),

      // Actions column
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const actions = createOrderActions(row);
          return <TableActions row={row} actions={actions} align="end" />;
        },
        sortable: false,
        filterable: false,
        searchable: false,
        width: 120,
      },
    ];

    return columns;
  }, [isAuftraggeber, createOrderActions, t]);
}

// Helper function to format dates
function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("de-DE");
  } catch {
    return dateString;
  }
}

// Helper function to get status display names
function getStatusDisplayName(status: OrderStatus): string {
  const statusNames: Record<OrderStatus, string> = {
    DRAFT: "Entwurf",
    PUBLISHED: "Veröffentlicht",
    MATCHED: "Zugeordnet",
    IN_PROGRESS: "In Bearbeitung",
    COMPLETED: "Abgeschlossen",
    CANCELLED: "Storniert",
  };

  return statusNames[status] || status;
}

// Predefined column configurations for different use cases
export const orderColumnPresets = {
  // Standard order list for Auftraggeber
  auftraggeber: (handlers: {
    onView?: (order: OrderListResponse) => void;
    onEdit?: (order: OrderListResponse) => void;
    onDelete?: (order: OrderListResponse) => void;
    onDuplicate?: (order: OrderListResponse) => void;
    onMatches?: (order: OrderListResponse) => void;
  }) => ({
    isAuftraggeber: true,
    ...handlers,
  }),

  // Standard order list for Auftragnehmer
  auftragnehmer: (handlers: {
    onView?: (order: OrderListResponse) => void;
  }) => ({
    isAuftraggeber: false,
    ...handlers,
  }),

  // Compact view for dashboard widgets
  compact: (handlers: { onView?: (order: OrderListResponse) => void }) => ({
    isAuftraggeber: true,
    showBudget: false,
    showApplications: false,
    ...handlers,
  }),
};
