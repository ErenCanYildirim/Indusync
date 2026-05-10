/**
 * DashboardProjectList Component
 *
 * Container component that renders a list of dashboard project items with loading,
 * error, and empty states for the "Current Projects" section.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { RefreshCw, AlertCircle, FolderOpen } from "lucide-react";
import {
  handleDashboardItemKeyNavigation,
  announceToScreenReader,
} from "@/lib/utils/focus-management";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DashboardProjectItem } from "./DashboardProjectItem";
import type { DashboardProject } from "@/lib/types/dashboard";

interface DashboardProjectListProps {
  projects: DashboardProject[];
  isLoading: boolean;
  error?: string;
  onRetry: () => void;
  onProjectClick?: (projectId: string) => void;
  className?: string;
}

/**
 * Loading skeleton component for project items
 * Responsive design with optimized spacing for mobile and desktop
 * Memoized to prevent unnecessary re-renders
 */
const ProjectItemSkeleton = memo(() => {
  return (
    <div className="p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-3">
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
          <Skeleton className="h-4 sm:h-5 w-3/4" />
          <Skeleton className="h-3 sm:h-4 w-full" />
        </div>
        <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 flex-shrink-0" />
      </div>
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center">
          <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 mr-2 flex-shrink-0" />
          <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-3 sm:h-4 w-3 sm:w-4 mr-2 flex-shrink-0" />
          <Skeleton className="h-3 sm:h-4 w-24 sm:w-32" />
        </div>
        <div className="flex items-center">
          <Skeleton className="h-2.5 sm:h-3 w-2.5 sm:w-3 mr-1 flex-shrink-0" />
          <Skeleton className="h-2.5 sm:h-3 w-12 sm:w-16" />
        </div>
      </div>
    </div>
  );
});

ProjectItemSkeleton.displayName = "ProjectItemSkeleton";

/**
 * Empty state component when no projects are available
 * Responsive design with optimized spacing and typography
 * Memoized to prevent unnecessary re-renders
 */
const EmptyProjectsState = memo(() => {
  const t = useTranslations("Dashboard.projects");

  return (
    <div className="flex flex-col items-center justify-center py-6 sm:py-8 px-3 sm:px-4 text-center">
      <div className="bg-muted/50 rounded-full p-3 sm:p-4 mb-3 sm:mb-4">
        <FolderOpen className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-base sm:text-lg mb-1.5 sm:mb-2">
        {t("empty.title")}
      </h3>
      <p className="text-muted-foreground text-xs sm:text-sm max-w-xs sm:max-w-sm leading-relaxed">
        {t("empty.description")}
      </p>
    </div>
  );
});

EmptyProjectsState.displayName = "EmptyProjectsState";

/**
 * Error state component with retry functionality and actionable guidance
 * Memoized to prevent unnecessary re-renders
 */
const ErrorState = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => {
    const t = useTranslations("Dashboard.projects");
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
        ? "Unable to load projects. Please try again."
        : "Projekte können nicht geladen werden. Bitte versuchen Sie es erneut.";
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
 * Main dashboard project list component
 *
 * Features:
 * - Renders list of project items using DashboardProjectItem
 * - Loading skeleton states for better UX
 * - Error state with retry functionality
 * - Empty state with appropriate messaging
 * - Responsive layout and accessibility
 * - Optimized spacing for mobile and desktop
 *
 * @param projects - Array of dashboard projects to display
 * @param isLoading - Loading state indicator
 * @param error - Error message if loading failed
 * @param onRetry - Function to retry loading projects
 * @param onProjectClick - Optional click handler for project items
 * @param className - Additional CSS classes
 */
export const DashboardProjectList = memo(
  ({
    projects,
    isLoading,
    error,
    onRetry,
    onProjectClick,
    className,
  }: DashboardProjectListProps) => {
    const t = useTranslations("Dashboard.projects");
    const containerRef = useRef<HTMLDivElement>(null);

    // Memoize skeleton array to prevent recreation on each render
    const skeletonItems = useMemo(
      () =>
        Array.from({ length: 3 }, (_, index) => (
          <ProjectItemSkeleton key={`skeleton-${index}`} />
        )),
      []
    );

    // Memoize project click handler to prevent child re-renders
    const handleProjectClick = useCallback(
      (projectId: string) => {
        onProjectClick?.(projectId);
      },
      [onProjectClick]
    );

    // Enhanced keyboard navigation handler
    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (!containerRef.current) return;

      handleDashboardItemKeyNavigation(event.nativeEvent, containerRef.current);
    }, []);

    // Announce content changes to screen readers
    useEffect(() => {
      if (!isLoading && !error) {
        if (projects && projects.length > 0) {
          announceToScreenReader(`${projects.length} projects loaded`);
        } else {
          announceToScreenReader("No projects available");
        }
      }
    }, [projects, isLoading, error]);

    // Memoize count display to prevent unnecessary recalculations
    const countDisplay = useMemo(() => {
      if (!projects || projects.length === 0) return null;

      return (
        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            {t("showingCount", {
              count: projects.length,
              total: projects.length,
            })}
          </p>
        </div>
      );
    }, [projects?.length, t]);

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
    if (!projects || projects.length === 0) {
      return (
        <div className={className}>
          <EmptyProjectsState />
        </div>
      );
    }

    // Show project list
    return (
      <div
        className={className}
        ref={containerRef}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Current projects list"
      >
        <div className="space-y-3 sm:space-y-4">
          {projects.map((project, index) => (
            <DashboardProjectItem
              key={project.id}
              project={project}
              onClick={handleProjectClick}
              className="transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              aria-posinset={index + 1}
              aria-setsize={projects.length}
            />
          ))}
        </div>

        {countDisplay}
      </div>
    );
  }
);

DashboardProjectList.displayName = "DashboardProjectList";

export default DashboardProjectList;