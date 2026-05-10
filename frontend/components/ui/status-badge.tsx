import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// Standardized status variants based on current usage
export type StatusBadgeVariant =
  | "aktiv" // Blue - active/published
  | "auftrag_vergeben" // Green - matched/assigned
  | "abgeschlossen" // Gray - completed
  | "in_verzug" // Red - cancelled/overdue
  | "entwurf" // Light gray - draft
  | "ausgeschrieben" // Blue variant - published orders
  | "inaktiv"; // Gray variant - inactive

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        aktiv:
          "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950 dark:text-blue-300",
        auftrag_vergeben:
          "border-green-500 bg-green-50 text-green-700 dark:border-green-400 dark:bg-green-950 dark:text-green-300",
        abgeschlossen:
          "border-gray-500 bg-gray-50 text-gray-700 dark:border-gray-400 dark:bg-gray-950 dark:text-gray-300",
        in_verzug:
          "border-red-500 bg-red-50 text-red-700 dark:border-red-400 dark:bg-red-950 dark:text-red-300",
        entwurf:
          "border-gray-400 bg-gray-50 text-gray-500 dark:border-gray-500 dark:bg-gray-900 dark:text-gray-400",
        ausgeschrieben:
          "border-blue-600 bg-blue-100 text-blue-800 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-200",
        inaktiv:
          "border-gray-400 bg-gray-100 text-gray-600 dark:border-gray-500 dark:bg-gray-800 dark:text-gray-400",
      },
    },
    defaultVariants: {
      variant: "aktiv",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  variant: StatusBadgeVariant;
  children?: React.ReactNode;
  showTranslation?: boolean;
}

function StatusBadge({
  className,
  variant,
  children,
  showTranslation = true,
  ...props
}: StatusBadgeProps) {
  const t = useTranslations("Common.status");

  // If children is provided, use it; otherwise use translation
  const displayText =
    children || (showTranslation ? getStatusTranslation(variant, t) : variant);

  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {displayText}
    </div>
  );
}

// Status translation mapping
function getStatusTranslation(variant: StatusBadgeVariant, t: any): string {
  const statusMap: Record<StatusBadgeVariant, string> = {
    aktiv: t("active"),
    auftrag_vergeben: t("assigned", "Assigned"),
    abgeschlossen: t("completed"),
    in_verzug: t("overdue", "Overdue"),
    entwurf: t("draft"),
    ausgeschrieben: t("published", "Published"),
    inaktiv: t("inactive", "Inactive"),
  };

  return statusMap[variant] || variant;
}

// Status mapping utilities for different data types
export const statusMappings = {
  // Order status mapping
  order: {
    DRAFT: "entwurf" as StatusBadgeVariant,
    PUBLISHED: "ausgeschrieben" as StatusBadgeVariant,
    MATCHED: "auftrag_vergeben" as StatusBadgeVariant,
    IN_PROGRESS: "aktiv" as StatusBadgeVariant,
    ACTIVE: "aktiv" as StatusBadgeVariant,
    ASSIGNED: "auftrag_vergeben" as StatusBadgeVariant,
    COMPLETED: "abgeschlossen" as StatusBadgeVariant,
    CANCELLED: "in_verzug" as StatusBadgeVariant,
    OVERDUE: "in_verzug" as StatusBadgeVariant,
  },

  // Employee status mapping
  employee: {
    ACTIVE: "aktiv" as StatusBadgeVariant,
    INACTIVE: "inaktiv" as StatusBadgeVariant,
    DRAFT: "entwurf" as StatusBadgeVariant,
  },

  // Project status mapping
  project: {
    DRAFT: "entwurf" as StatusBadgeVariant,
    ACTIVE: "aktiv" as StatusBadgeVariant,
    COMPLETED: "abgeschlossen" as StatusBadgeVariant,
    CANCELLED: "in_verzug" as StatusBadgeVariant,
  },

  // Generic status mapping
  generic: {
    draft: "entwurf" as StatusBadgeVariant,
    active: "aktiv" as StatusBadgeVariant,
    published: "ausgeschrieben" as StatusBadgeVariant,
    assigned: "auftrag_vergeben" as StatusBadgeVariant,
    completed: "abgeschlossen" as StatusBadgeVariant,
    cancelled: "in_verzug" as StatusBadgeVariant,
    overdue: "in_verzug" as StatusBadgeVariant,
    inactive: "inaktiv" as StatusBadgeVariant,
  },
};

// Utility function to get status variant from raw status
export function getStatusVariant(
  status: string,
  type: keyof typeof statusMappings = "generic"
): StatusBadgeVariant {
  const mapping = statusMappings[type];
  const normalizedStatus = status?.toUpperCase() || status?.toLowerCase();

  return mapping[normalizedStatus as keyof typeof mapping] || "aktiv";
}

// Utility function to get all available status variants
export function getAvailableStatusVariants(): StatusBadgeVariant[] {
  return [
    "aktiv",
    "auftrag_vergeben",
    "abgeschlossen",
    "in_verzug",
    "entwurf",
    "ausgeschrieben",
    "inaktiv",
  ];
}

export { StatusBadge, statusBadgeVariants };
