/**
 * EmptyDocumentsState Component
 * Displays professional empty state when no documents exist for an order
 *
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for EmptyDocumentsState component
 */
export interface EmptyDocumentsStateProps {
  /** Whether this is a backend order (true) or mock project (false) */
  isBackendOrder: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * EmptyDocumentsState component for displaying professional empty state
 * when no documents exist for an order
 */
export function EmptyDocumentsState({
  isBackendOrder,
  className,
}: EmptyDocumentsStateProps) {
  // Translation hook
  const t = useTranslations("Dashboard.orders.orderDetail.documents");

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Icon */}
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
            {isBackendOrder ? (
              <FileText className="w-8 h-8 text-muted-foreground" />
            ) : (
              <Folder className="w-8 h-8 text-muted-foreground" />
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-foreground">
              {t("emptyState.title")}
            </h3>

            {/* Description */}
            <p className="text-sm text-muted-foreground max-w-md">
              {isBackendOrder
                ? t("emptyState.backendOrderMessage")
                : t("emptyState.mockProjectMessage")}
            </p>
          </div>

          {/* Additional info for backend orders */}
          {isBackendOrder && (
            <div className="text-xs text-muted-foreground/80 bg-muted/30 px-3 py-2 rounded-md">
              {t("emptyState.supportedFormats")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

EmptyDocumentsState.displayName = "EmptyDocumentsState";
