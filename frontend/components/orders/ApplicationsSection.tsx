/**
 * ApplicationsSection Component
 * Main applications section component for order detail pages
 * Handles application display with loading and empty states
 *
 * @author IndusSync Frontend Team
 * @since Order Applications Display Implementation
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  RefreshCw,
  AlertCircle,
  Loader2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApplicationItem } from "./ApplicationItem";
import type { OrderApplicationDto } from "@/lib/api/types";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Props for ApplicationsSection component
 */
export interface ApplicationsSectionProps {
  /** Array of applications to display */
  applications: OrderApplicationDto[];
  /** Whether applications are currently loading */
  isLoading?: boolean;
  /** Whether this is being viewed by the client (order owner) */
  isClientView: boolean;
  /** Error message if loading failed */
  error?: string | null;
  /** Callback for accepting an application (client only) */
  onAcceptApplication?: (applicationId: string) => void;
  /** Callback for rejecting an application (client only) */
  onRejectApplication?: (applicationId: string) => void;
  /** Callback for refreshing applications */
  onRefresh?: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * ApplicationsSection component for displaying order applications
 */
export function ApplicationsSection({
  applications,
  isLoading = false,
  isClientView,
  error = null,
  onAcceptApplication,
  onRejectApplication,
  onRefresh,
  isRefreshing = false,
  className,
}: ApplicationsSectionProps) {
  // Translation hooks
  const t = useTranslations("Dashboard.orders.orderDetail.applications");
  const tCommon = useTranslations("Common");

  // Handle retry action
  const handleRetry = React.useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render error state
  const renderErrorState = () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{error}</span>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={isRefreshing}
            className="ml-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1">{tCommon("actions.retry")}</span>
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );

  // Render applications list
  const renderApplicationsList = () => (
    <div className="space-y-3">
      {applications.map((application) => (
        <ApplicationItem
          key={application.id}
          application={application}
          isClientView={isClientView}
        />
      ))}
    </div>
  );

  // Render empty state
  const renderEmptyState = () => (
    <div className="text-center py-8">
      <div className="flex justify-center mb-4">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
          <Building2 className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {isClientView
          ? t("emptyState.noApplicationsClient") || "Noch keine Bewerbungen"
          : t("emptyState.noApplicationsProvider") || "Noch keine Bewerbungen"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        {isClientView
          ? t("emptyState.noApplicationsClientDescription") ||
            "Für diesen Auftrag sind noch keine Bewerbungen eingegangen. Dienstleister können sich über die Auftragsübersicht bewerben."
          : t("emptyState.noApplicationsProviderDescription") ||
            "Für diesen Auftrag sind noch keine Bewerbungen eingegangen."}
      </p>
    </div>
  );

  // Get section title based on user role
  const getSectionTitle = () => {
    if (isClientView) {
      return t("title.client") || "Bewerbungen";
    }
    return t("title.provider") || "Bewerbungen";
  };

  // Get applications count for display
  const applicationsCount = applications.length;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">{getSectionTitle()}</CardTitle>
            {applicationsCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({applicationsCount})
              </span>
            )}
          </div>

          {/* Refresh button - only show if not loading initially and has refresh callback */}
          {!isLoading && onRefresh && applicationsCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
              aria-label={t("actions.refresh") || "Aktualisieren"}
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Error state */}
        {error && <div className="mb-4">{renderErrorState()}</div>}

        {/* Loading state */}
        {isLoading && !error && renderLoadingSkeleton()}

        {/* Applications list */}
        {!isLoading &&
          !error &&
          applicationsCount > 0 &&
          renderApplicationsList()}

        {/* Empty state */}
        {!isLoading && !error && applicationsCount === 0 && renderEmptyState()}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

ApplicationsSection.displayName = "ApplicationsSection";
