import * as React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { ColumnDef } from "@/components/ui/data-table";
import {
  createViewAction,
  createEditAction,
  ActionConfig,
  TableActions,
} from "@/components/ui/table-actions";
import { StatusBadge, statusMappings } from "@/components/ui/status-badge";

// Employee interface - this should match your actual employee data structure
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "DRAFT";
  permissions?: string[];
  joinedAt: string;
  lastActive?: string;
}

// Employee-specific column definitions
export function useEmployeeColumns(
  onView?: (employee: Employee) => void,
  onEdit?: (employee: Employee) => void,
  onDeactivate?: (employee: Employee) => void,
  canEdit?: (employee: Employee) => boolean,
  canDeactivate?: (employee: Employee) => boolean
): ColumnDef<Employee>[] {
  const t = useTranslations("Employees");
  const router = useRouter();

  // Default action handlers if not provided
  const defaultOnView = React.useCallback(
    (employee: Employee) => {
      router.push(`/dashboard/mitarbeiter/${employee.id}`);
    },
    [router]
  );

  const defaultOnEdit = React.useCallback(
    (employee: Employee) => {
      router.push(`/dashboard/mitarbeiter/${employee.id}/edit`);
    },
    [router]
  );

  const handleView = onView || defaultOnView;
  const handleEdit = onEdit || defaultOnEdit;

  // Create actions based on permissions
  const createEmployeeActions = React.useCallback(
    (employee: Employee): ActionConfig<Employee>[] => {
      const actions: ActionConfig<Employee>[] = [];

      // View action - always available
      actions.push(createViewAction(handleView, t("actions.view") || "View"));

      // Edit action - based on permissions
      if (handleEdit && (!canEdit || canEdit(employee))) {
        actions.push(
          createEditAction(handleEdit, canEdit, t("actions.edit") || "Edit")
        );
      }

      // Deactivate action - only for active employees
      if (
        onDeactivate &&
        employee.status === "ACTIVE" &&
        (!canDeactivate || canDeactivate(employee))
      ) {
        actions.push({
          id: "deactivate",
          label: t("actions.deactivate") || "Deactivate",
          icon: Settings,
          onClick: onDeactivate,
          variant: "destructive",
          disabled: (emp) => emp.status !== "ACTIVE",
        });
      }

      return actions;
    },
    [handleView, handleEdit, onDeactivate, canEdit, canDeactivate, t]
  );

  return React.useMemo(() => {
    const columns: ColumnDef<Employee>[] = [
      // Name column
      {
        id: "name",
        header: t("columns.name") || "Name",
        accessorFn: (row) => `${row.firstName} ${row.lastName}`,
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue() as string}</div>
        ),
        sortable: true,
        searchable: true,
      },

      // Email column
      {
        id: "email",
        header: t("columns.email") || "Email",
        accessorKey: "email" as keyof Employee,
        cell: ({ getValue }) => (
          <div className="text-sm text-muted-foreground">
            {getValue() as string}
          </div>
        ),
        sortable: true,
        searchable: true,
      },

      // Role column
      {
        id: "role",
        header: t("columns.role") || "Role",
        accessorKey: "role" as keyof Employee,
        cell: ({ getValue }) => (
          <div className="font-medium">{getValue() as string}</div>
        ),
        sortable: true,
        filterable: true,
      },

      // Status column with proper badge variants
      {
        id: "status",
        header: t("columns.status") || "Status",
        accessorKey: "status" as keyof Employee,
        cell: ({ getValue }) => {
          const status = getValue() as Employee["status"];
          const variant = statusMappings.employee[status] || "aktiv";

          return (
            <StatusBadge variant={variant}>
              {getEmployeeStatusDisplayName(status)}
            </StatusBadge>
          );
        },
        align: "center",
        sortable: true,
        filterable: true,
      },

      // Joined date column - hidden on mobile
      {
        id: "joinedAt",
        header: t("columns.joinedAt") || "Joined",
        accessorKey: "joinedAt" as keyof Employee,
        cell: ({ getValue }) => {
          const date = getValue() as string;
          return formatDate(date);
        },
        hideOnMobile: true,
        sortable: true,
      },

      // Last active column - hidden on mobile
      {
        id: "lastActive",
        header: t("columns.lastActive") || "Last Active",
        accessorKey: "lastActive" as keyof Employee,
        cell: ({ getValue }) => {
          const date = getValue() as string;
          if (!date) return "-";
          return formatDate(date);
        },
        hideOnMobile: true,
        sortable: true,
      },

      // Actions column
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const actions = createEmployeeActions(row);
          return <TableActions row={row} actions={actions} align="end" />;
        },
        sortable: false,
        filterable: false,
        searchable: false,
        width: 120,
      },
    ];

    return columns;
  }, [createEmployeeActions, t]);
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

// Helper function to get employee status display names
function getEmployeeStatusDisplayName(status: Employee["status"]): string {
  const statusNames: Record<Employee["status"], string> = {
    ACTIVE: "Aktiv",
    INACTIVE: "Inaktiv",
    DRAFT: "Entwurf",
  };

  return statusNames[status] || status;
}

// Predefined column configurations for different use cases
export const employeeColumnPresets = {
  // Standard employee list
  standard: (handlers: {
    onView?: (employee: Employee) => void;
    onEdit?: (employee: Employee) => void;
    onDeactivate?: (employee: Employee) => void;
    canEdit?: (employee: Employee) => boolean;
    canDeactivate?: (employee: Employee) => boolean;
  }) => handlers,

  // Compact view for dashboard widgets
  compact: (handlers: { onView?: (employee: Employee) => void }) => ({
    ...handlers,
    showLastActive: false,
  }),
};
