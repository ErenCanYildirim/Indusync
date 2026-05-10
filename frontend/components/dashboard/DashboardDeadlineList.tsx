/**
 * DashboardDeadlineList Component
 *
 * Container component that renders a list of dashboard deadline items with loading,
 * error, and empty states for the "Upcoming Deadlines" section.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RefreshCw, AlertCircle, Calendar, CheckCircle } from "lucide-react";
import {
  handleDashboardItemKeyNavigation,
  announceToScreenReader,
} from "@/lib/utils/focus-management";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DashboardDeadlineItem } from "./DashboardDeadlineItem";
import type { DashboardDeadline } from "@/lib/types/dashboard";

interface DashboardDeadlineListProps {
  deadlines: DashboardDeadline[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  onDeadlineClick?: (deadlineId: string, orderId: string) => void;
  className?: string;
}

/**
 * Loading skeleton component for deadline items
 * Responsive design with optimized spacing for mobile and desktop
 * Memoized to prevent unnecessary re-renders
 */
const DeadlineItemSkeleton = memo(() => {
  return (
    <div className="p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          <Skeleton className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
          <Skeleton className="h-5 sm:h-6 w-12 sm:w-16" />
        </div>
        <div className="text-right">
          <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
        </div>
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <Skeleton className="h-4 sm:h-5 w-3/4" />
        <div className="flex items-center">
          <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
        </div>
      </div>
      <div className="flex items-start space-x-1.5 sm:space-x-2">
        <Skeleton className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full mt-1 flex-shrink-0" />
        <Skeleton className="h-3 sm:h-4 w-full" />
      </div>
    </div>
  );
});

DeadlineItemSkeleton.displayName = "DeadlineItemSkeleton";

/**
 * Empty state component when no deadlines are available
 * Responsive design with optimized spacing and typography
 * Memoized to prevent unnecessary re-renders
 */
const EmptyDeadlinesState = memo(() => {
  const t = useTranslations("Dashboard.deadlines");

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4 text-center">
      <div className="bg-green-50 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
        <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
      </div>
      <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">
        {t("empty.title")}
      </h3>
      <p className="text-muted-foreground text-xs sm:text-sm max-w-xs sm:max-w-sm leading-relaxed mb-2 sm:mb-3">
        {t("empty.description")}
      </p>
      <Badge
        variant="outline"
        className="text-xs text-green-600 border-green-200"
      >
        {t("empty.badge")}
      </Badge>
    </div>
  );
});

EmptyDeadlinesState.displayName = "EmptyDeadlinesState";

/**
 * Error state component with retry functionality and actionable guidance
 * Memoized to prevent unnecessary re-renders
 */
const ErrorState = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => {
    const t = useTranslations("Dashboard.deadlines");
    const locale = useLocale();

    // Determine error type for better user guidance
    const isNetworkError =
      error.includes("fetch") ||
      error.includes("network") ||
      error.includes("timeout") ||
      error.includes("connection");

    const isAuthError =
      error.includes("401") ||
      error.includes("403") ||
      error.includes("unauthorized");

    const isServerError =
      error.includes("500") ||
      error.includes("502") ||
      error.includes("503") ||
      error.includes("504");

    // Get user-friendly error message
    const getUserFriendlyMessage = () => {
      if (isNetworkError) {
        return locale === "en"
          ? "Connection problem. Please check your internet connection."
          : "Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung.";
      }
      if (isAuthError) {
        return locale === "en"
          ? "Authentication required. Please refresh the page or log in again."
          : "Authentifizierung erforderlich. Bitte aktualisieren Sie die Seite oder melden Sie sich erneut an.";
      }
      if (isServerError) {
        return locale === "en"
          ? "Server temporarily unavailable. Please try again in a moment."
          : "Server vorübergehend nicht verfügbar. Bitte versuchen Sie es in einem Moment erneut.";
      }
      return locale === "en"
        ? "Unable to load deadlines. Please try again."
        : "Termine können nicht geladen werden. Bitte versuchen Sie es erneut.";
    };

    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-3">
            <div>
              <p className="font-medium mb-1">{t("error.loadingFailed")}</p>
              <p className="text-sm">{getUserFriendlyMessage()}</p>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === "development" && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all bg-muted p-2 rounded">
                  {error}
                </pre>
              </details>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              {t("error.retry")}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }
);

ErrorState.displayName = "ErrorState";

/**
 * Main dashboard deadline list component
 *
 * Features:
 * - Renders list of deadline items using DashboardDeadlineItem
 * - Loading skeleton states for better UX
 * - Error state with retry functionality
 * - Empty state with positive messaging
 * - Responsive layout for different screen sizes
 * - Accessibility attributes and keyboard navigation
 * - Optimized spacing and typography for mobile and desktop
 *
 * @param deadlines - Array of dashboard deadlines to display
 * @param isLoading - Loading state indicator
 * @param error - Error message if loading failed
 * @param onRetry - Function to retry loading deadlines
 * @param onDeadlineClick - Optional click handler for deadline items
 * @param className - Additional CSS classes
 */
export const DashboardDeadlineList = memo(
  ({
    deadlines,
    isLoading,
    error,
    onRetry,
    onDeadlineClick,
    className,
  }: DashboardDeadlineListProps) => {
    const t = useTranslations("Dashboard.deadlines");
    const containerRef = useRef<HTMLDivElement>(null);

    // Memoize skeleton array to prevent recreation on each render
    const skeletonItems = useMemo(
      () =>
        Array.from({ length: 3 }, (_, index) => (
          <DeadlineItemSkeleton key={`skeleton-${index}`} />
        )),
      []
    );

    // Memoize deadline click handler to prevent child re-renders
    const handleDeadlineClick = useCallback(
      (deadlineId: string, orderId: string) => {
        onDeadlineClick?.(deadlineId, orderId);
      },
      [onDeadlineClick]
    );

    // Enhanced keyboard navigation handler
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (!containerRef.current) return;

      handleDashboardItemKeyNavigation(event.nativeEvent, containerRef.current);
    }, []);

    // Announce content changes to screen readers
    useEffect(() => {
      if (!isLoading && !error) {
        if (deadlines && deadlines.length > 0) {
          const criticalCount = deadlines.filter(
            (d) => d.urgencyLevel === "critical"
          ).length;
          const message =
            criticalCount > 0
              ? `${deadlines.length} deadlines loaded, ${criticalCount} critical`
              : `${deadlines.length} deadlines loaded`;
          announceToScreenReader(message);
        } else {
          announceToScreenReader("No upcoming deadlines");
        }
      }
    }, [deadlines, isLoading, error]);

    // Memoize sorted deadlines to prevent unnecessary sorting
    const sortedDeadlines = useMemo(() => {
      if (!deadlines || deadlines.length === 0) return [];

      return [...deadlines].sort((a, b) => {
        // First sort by urgency level
        const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        const urgencyDiff =
          urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];

        if (urgencyDiff !== 0) return urgencyDiff;

        // Then sort by deadline date (earliest first)
        return a.deadlineDate.getTime() - b.deadlineDate.getTime();
      });
    }, [deadlines]);

    // Memoize urgency breakdown to prevent recalculation
    const urgencyBreakdown = useMemo(() => {
      if (!deadlines || deadlines.length === 0) return null;

      const urgencyLevels = ["critical", "high", "medium", "low"] as const;
      const badges = urgencyLevels
        .map((urgency) => {
          const count = deadlines.filter(
            (d) => d.urgencyLevel === urgency
          ).length;
          if (count === 0) return null;

          const colorClasses = {
            critical: "text-red-600 border-red-200",
            high: "text-orange-600 border-orange-200",
            medium: "text-blue-600 border-blue-200",
            low: "text-gray-600 border-gray-200",
          };

          return (
            <Badge
              key={urgency}
              variant="outline"
              className={`text-xs ${colorClasses[urgency]}`}
            >
              {t(`urgency.${urgency}`)}: {count}
            </Badge>
          );
        })
        .filter(Boolean);

      return badges.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {badges}
        </div>
      ) : null;
    }, [deadlines, t]);

    // Memoize count display
    const countDisplay = useMemo(() => {
      if (!deadlines || deadlines.length === 0) return null;

      return (
        <div className="mt-3 sm:mt-4 text-center space-y-1.5 sm:space-y-2">
          <p className="text-xs text-muted-foreground">
            {t("showingCount", {
              count: deadlines.length,
              total: deadlines.length,
            })}
          </p>
          {urgencyBreakdown}
        </div>
      );
    }, [deadlines?.length, t, urgencyBreakdown]);

    // Show loading skeletons
    if (isLoading) {
      return (
        <div className={className}>
          <div className="space-y-3 sm:space-y-4">{skeletonItems}</div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className={className}>
          <ErrorState error={error} onRetry={onRetry} />
        </div>
      );
    }

    // Show empty state
    if (!deadlines || deadlines.length === 0) {
      return (
        <div className={className}>
          <EmptyDeadlinesState />
        </div>
      );
    }

    // Show deadline list
    return (
      <div
        className={className}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Upcoming deadlines list"
      >
        <div className="space-y-3 sm:space-y-4">
          {sortedDeadlines.map((deadline, index) => (
            <DashboardDeadlineItem
              key={deadline.id}
              deadline={deadline}
              onClick={handleDeadlineClick}
              className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              aria-posinset={index + 1}
              aria-setsize={sortedDeadlines.length}
            />
          ))}
        </div>

        {countDisplay}
      </div>
    );
  }
);

DashboardDeadlineList.displayName = "DashboardDeadlineList";

export default DashboardDeadlineList;