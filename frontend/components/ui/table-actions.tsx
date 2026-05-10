import * as React from "react";
import { useTranslations } from "next-intl";
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Action configuration interface
export interface ActionConfig<TData = any> {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (row: TData) => void;
  variant?: "ghost" | "outline" | "destructive" | "default";
  disabled?: (row: TData) => boolean;
  hidden?: (row: TData) => boolean;
  permission?: string;
  shortcut?: string;
  separator?: boolean; // Add separator after this action
}

// Props for the TableActions component
export interface TableActionsProps<TData = any> {
  row: TData;
  actions: ActionConfig<TData>[];
  className?: string;
  triggerClassName?: string;
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
}

// Main TableActions component
export function TableActions<TData = any>({
  row,
  actions,
  className,
  triggerClassName,
  align = "end",
  side = "bottom",
}: TableActionsProps<TData>) {
  const t = useTranslations("Common.actions");

  // Filter out hidden actions
  const visibleActions = actions.filter(
    (action) => !action.hidden || !action.hidden(row)
  );

  // If no visible actions, don't render anything
  if (visibleActions.length === 0) {
    return null;
  }

  // If only one action, render as a button
  if (visibleActions.length === 1) {
    const action = visibleActions[0];
    const isDisabled = action.disabled ? action.disabled(row) : false;

    return (
      <Button
        variant={action.variant || "ghost"}
        size="sm"
        onClick={() => action.onClick(row)}
        disabled={isDisabled}
        className={cn("h-8 w-8 p-0", triggerClassName)}
      >
        <action.icon className="h-4 w-4" />
        <span className="sr-only">{action.label}</span>
      </Button>
    );
  }

  // Multiple actions - render dropdown
  return (
    <div className={cn("flex items-center justify-end", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-8 w-8 p-0", triggerClassName)}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{t('actions') || 'Actions'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} side={side} className="w-[160px]">
          {visibleActions.map((action, index) => {
            const isDisabled = action.disabled ? action.disabled(row) : false;

            return (
              <React.Fragment key={action.id}>
                <DropdownMenuItem
                  onClick={() => !isDisabled && action.onClick(row)}
                  disabled={isDisabled}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    action.variant === "destructive" &&
                      "text-destructive focus:text-destructive"
                  )}
                >
                  <action.icon className="h-4 w-4" />
                  <span>{action.label}</span>
                  {action.shortcut && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {action.shortcut}
                    </span>
                  )}
                </DropdownMenuItem>
                {action.separator && index < visibleActions.length - 1 && (
                  <DropdownMenuSeparator />
                )}
              </React.Fragment>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Built-in action creators
export function createViewAction<TData = any>(
  onView: (row: TData) => void,
  label?: string
): ActionConfig<TData> {
  return {
    id: "view",
    label: label || "View",
    icon: Eye,
    onClick: onView,
    variant: "ghost",
  };
}

export function createEditAction<TData = any>(
  onEdit: (row: TData) => void,
  canEdit?: (row: TData) => boolean,
  label?: string
): ActionConfig<TData> {
  return {
    id: "edit",
    label: label || "Edit",
    icon: Edit,
    onClick: onEdit,
    variant: "ghost",
    disabled: canEdit ? (row) => !canEdit(row) : undefined,
  };
}

export function createDeleteAction<TData = any>(
  onDelete: (row: TData) => void,
  canDelete?: (row: TData) => boolean,
  label?: string
): ActionConfig<TData> {
  return {
    id: "delete",
    label: label || "Delete",
    icon: Trash2,
    onClick: onDelete,
    variant: "destructive",
    disabled: canDelete ? (row) => !canDelete(row) : undefined,
    separator: true, // Add separator before destructive actions
  };
}

export function createDuplicateAction<TData = any>(
  onDuplicate: (row: TData) => void,
  canDuplicate?: (row: TData) => boolean,
  label?: string
): ActionConfig<TData> {
  return {
    id: "duplicate",
    label: label || "Duplicate",
    icon: Copy,
    onClick: onDuplicate,
    variant: "ghost",
    disabled: canDuplicate ? (row) => !canDuplicate(row) : undefined,
  };
}

export function createDownloadAction<TData = any>(
  onDownload: (row: TData) => void,
  canDownload?: (row: TData) => boolean,
  label?: string
): ActionConfig<TData> {
  return {
    id: "download",
    label: label || "Download",
    icon: Download,
    onClick: onDownload,
    variant: "ghost",
    disabled: canDownload ? (row) => !canDownload(row) : undefined,
  };
}

export function createSettingsAction<TData = any>(
  onSettings: (row: TData) => void,
  canAccess?: (row: TData) => boolean,
  label?: string
): ActionConfig<TData> {
  return {
    id: "settings",
    label: label || "Settings",
    icon: Settings,
    onClick: onSettings,
    variant: "ghost",
    disabled: canAccess ? (row) => !canAccess(row) : undefined,
  };
}

// Permission-based action visibility utility
export function createPermissionBasedAction<TData = any>(
  baseAction: ActionConfig<TData>,
  requiredPermission: string,
  userPermissions: string[]
): ActionConfig<TData> {
  return {
    ...baseAction,
    hidden: (row) => {
      const baseHidden = baseAction.hidden ? baseAction.hidden(row) : false;
      const hasPermission = userPermissions.includes(requiredPermission);
      return baseHidden || !hasPermission;
    },
  };
}

// Utility to create action groups with separators
export function createActionGroup<TData = any>(
  actions: ActionConfig<TData>[]
): ActionConfig<TData>[] {
  return actions.map((action, index) => ({
    ...action,
    separator: index === actions.length - 1, // Add separator after last action in group
  }));
}

// Common action combinations
export function createStandardActions<TData = any>(
  onView: (row: TData) => void,
  onEdit: (row: TData) => void,
  onDelete: (row: TData) => void,
  options?: {
    canEdit?: (row: TData) => boolean;
    canDelete?: (row: TData) => boolean;
    labels?: {
      view?: string;
      edit?: string;
      delete?: string;
    };
  }
): ActionConfig<TData>[] {
  return [
    createViewAction(onView, options?.labels?.view),
    createEditAction(onEdit, options?.canEdit, options?.labels?.edit),
    createDeleteAction(onDelete, options?.canDelete, options?.labels?.delete),
  ];
}

export function createOrderActions<TData = any>(
  onView: (row: TData) => void,
  onEdit: (row: TData) => void,
  onDuplicate: (row: TData) => void,
  onDelete: (row: TData) => void,
  options?: {
    canEdit?: (row: TData) => boolean;
    canDuplicate?: (row: TData) => boolean;
    canDelete?: (row: TData) => boolean;
  }
): ActionConfig<TData>[] {
  return [
    createViewAction(onView),
    createEditAction(onEdit, options?.canEdit),
    createDuplicateAction(onDuplicate, options?.canDuplicate),
    createDeleteAction(onDelete, options?.canDelete),
  ];
}

export function createEmployeeActions<TData = any>(
  onView: (row: TData) => void,
  onEdit: (row: TData) => void,
  onSettings: (row: TData) => void,
  options?: {
    canEdit?: (row: TData) => boolean;
    canAccessSettings?: (row: TData) => boolean;
  }
): ActionConfig<TData>[] {
  return [
    createViewAction(onView),
    createEditAction(onEdit, options?.canEdit),
    createSettingsAction(onSettings, options?.canAccessSettings),
  ];
}
