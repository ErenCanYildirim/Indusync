"use client";

import Link from "next/link";
import { useCallback, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DashboardMetricCard } from "@/components/dashboard-metric-card";
import { DashboardChart } from "@/components/dashboard-chart";
import { DashboardShell } from "@/components/dashboard-shell";
import { DashboardHeader } from "@/components/dashboard-header";
import { RoleInfoBanner } from "@/components/ui/role-info-banner";
import { DashboardProjectList } from "@/components/dashboard/DashboardProjectList";
import { DashboardDeadlineList } from "@/components/dashboard/DashboardDeadlineList";
import { useDashboardStatistics } from "@/lib/hooks/useDashboardStatistics";
import { useDashboardProjects } from "@/lib/hooks/useDashboardProjects";
import { useDashboardDeadlines } from "@/lib/hooks/useDashboardDeadlines";
import { useTranslations } from "next-intl";
import { useDynamicContentTranslation } from "@/lib/utils/dynamic-content-translation";
import { useSafeTranslations } from "@/lib/utils/translation-fallback";
import { DashboardErrorBoundaryWrapper } from "@/components/dashboard-error-boundary";
import { DashboardSectionErrorBoundaryWrapper } from "@/components/dashboard/DashboardSectionErrorBoundary";
import { DashboardNavigationLoader } from "@/components/dashboard/DashboardNavigationLoader";
import { useDashboardNavigation } from "@/lib/hooks/useDashboardNavigation";
import { useRouter } from "next/navigation";
import {
  FileText,
  Briefcase,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // Enhanced navigation with loading states and focus management
  const {
    isNavigating,
    navigateToProject,
    navigateToDeadline,
    navigateToOrdersList,
    navigateToCalendar,
    setReturnContext,
    handleFocusReturn,
  } = useDashboardNavigation();

  // Initialize safe translations with fallback mechanisms
  const { t: safeT, translationSystemWorking } =
    useSafeTranslations("Dashboard");

  // Keep original translations as backup
  let t: any;
  try {
    t = useTranslations("Dashboard");
  } catch (translationError) {
    console.warn(
      "Translation system failed in DashboardPage, using safe fallbacks"
    );
  }

  const { translateRoleContextContent } = useDynamicContentTranslation();

  // Fetch real dashboard statistics
  const { statistics, isLoading, error, refresh } = useDashboardStatistics();

  // Fetch dashboard projects and deadlines
  const {
    projects,
    isLoading: isLoadingProjects,
    error: projectsError,
    refresh: refreshProjects,
  } = useDashboardProjects();

  const {
    deadlines,
    isLoading: isLoadingDeadlines,
    error: deadlinesError,
    refresh: refreshDeadlines,
  } = useDashboardDeadlines();

  // Helper function to calculate trend indicators - memoized to prevent recalculation
  const calculateTrend = useCallback(
    (current: number, previous: number = 0) => {
      if (previous === 0) return { change: "+0", trend: "neutral" as const };
      const diff = current - previous;
      const change = diff > 0 ? `+${diff}` : `${diff}`;
      const trend =
        diff > 0
          ? ("up" as const)
          : diff < 0
          ? ("down" as const)
          : ("neutral" as const);
      return { change, trend };
    },
    []
  );

  // Translate dynamic content from backend based on role context - memoized
  const translatedDynamicContent = useMemo(() => {
    return statistics?.roleContext
      ? translateRoleContextContent(
          statistics.roleContext,
          statistics.roleContext
        )
      : null;
  }, [statistics?.roleContext, translateRoleContextContent]);

  // Enhanced navigation handlers with loading states and focus management
  const handleProjectClick = useCallback(
    async (projectId: string) => {
      setReturnContext();
      await navigateToProject(projectId);
    },
    [navigateToProject, setReturnContext]
  );

  // Handle focus restoration when returning to dashboard
  useEffect(() => {
    // Check if we're returning from a navigation
    const urlParams = new URLSearchParams(window.location.search);
    const returnedFrom = urlParams.get("returned_from");

    if (returnedFrom) {
      handleFocusReturn();

      // Clean up URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("returned_from");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [handleFocusReturn]);

  const handleDeadlineClick = useCallback(
    async (deadlineId: string, orderId: string) => {
      setReturnContext();
      // Determine deadline type from the deadline data for better navigation
      const deadline = deadlines?.find((d) => d.id === deadlineId);
      await navigateToDeadline(deadlineId, orderId, deadline?.deadlineType);
    },
    [navigateToDeadline, setReturnContext, deadlines]
  );

  // Enhanced "View All" navigation handlers
  const handleViewAllProjects = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setReturnContext();
      await navigateToOrdersList();
    },
    [navigateToOrdersList, setReturnContext]
  );

  const handleViewAllDeadlines = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      setReturnContext();
      await navigateToCalendar();
    },
    [navigateToCalendar, setReturnContext]
  );

  return (
    <DashboardErrorBoundaryWrapper>
      {/* Navigation loading indicator */}
      <DashboardNavigationLoader isVisible={isNavigating} />

      <DashboardShell>
        <DashboardHeader
          heading={safeT("title", "Dashboard")}
          text={safeT(
            "welcome",
            "Welcome back! Here you'll find an overview of your activities."
          )}
        />

        {/* Role Information Banner */}
        {/* <RoleInfoBanner className="mb-6" /> */}

        {/* Company Role Indicator */}
        {/* {statistics?.roleContext && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-900">
                {safeT("roleContext.title", "Your Company Role")}
              </span>
            </div>
            <div className="text-sm text-blue-800">
              {statistics.roleContext.isDualRole
                ? safeT(
                    "roleContext.dualRole",
                    "You act as both client and service provider"
                  )
                : statistics.roleContext.isClient
                ? safeT("roleContext.clientOnly", "You act as a client")
                : statistics.roleContext.isProvider
                ? safeT(
                    "roleContext.providerOnly",
                    "You act as a service provider"
                  )
                : safeT(
                    "roleContext.determining",
                    "Role is being determined..."
                  )}
            </div>
          </div>
        )} */}

        {/* Metrics Row */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <DashboardMetricCard
            title={safeT("metrics.activeOrders.title", "Active Orders")}
            value={statistics ? statistics.activeOrders.toString() : "0"}
            change={
              statistics ? calculateTrend(statistics.activeOrders).change : "+0"
            }
            period={safeT("periods.currentStatus", "current status")}
            trend={
              statistics
                ? calculateTrend(statistics.activeOrders).trend
                : "neutral"
            }
            icon={<Briefcase className="h-5 w-5" />}
            isLoading={isLoading}
            error={error}
            onRetry={refresh}
            description={
              translatedDynamicContent?.activeOrdersDescription ||
              safeT(
                "metrics.activeOrders.description",
                "Overview of your running orders"
              )
            }
            tooltip={
              translatedDynamicContent?.activeOrdersTooltip ||
              safeT(
                "metrics.activeOrders.tooltip",
                "Number of currently active orders"
              )
            }
          />
          <DashboardMetricCard
            title={safeT("metrics.openApplications.title", "Open Applications")}
            value={statistics ? statistics.openApplications.toString() : "0"}
            change={
              statistics
                ? calculateTrend(statistics.openApplications).change
                : "+0"
            }
            period={safeT("periods.currentStatus", "current status")}
            trend={
              statistics
                ? calculateTrend(statistics.openApplications).trend
                : "neutral"
            }
            icon={<FileText className="h-5 w-5" />}
            isLoading={isLoading}
            error={error}
            onRetry={refresh}
            description={
              translatedDynamicContent?.openApplicationsDescription ||
              safeT(
                "metrics.openApplications.description",
                "Applications for your orders"
              )
            }
            tooltip={
              translatedDynamicContent?.openApplicationsTooltip ||
              safeT(
                "metrics.openApplications.tooltip",
                "Number of received applications"
              )
            }
          />
          <DashboardMetricCard
            title={safeT("metrics.completedOrders.title", "Completed Orders")}
            value={statistics ? statistics.completedOrders.toString() : "0"}
            change={
              statistics
                ? calculateTrend(statistics.completedOrders).change
                : "+0"
            }
            period={safeT("periods.total", "total")}
            trend={
              statistics
                ? calculateTrend(statistics.completedOrders).trend
                : "neutral"
            }
            icon={<CheckCircle className="h-5 w-5" />}
            isLoading={isLoading}
            error={error}
            onRetry={refresh}
            description={
              translatedDynamicContent?.completedOrdersDescription ||
              safeT(
                "metrics.completedOrders.description",
                "Successfully completed projects"
              )
            }
            tooltip={
              translatedDynamicContent?.completedOrdersTooltip ||
              safeT(
                "metrics.completedOrders.tooltip",
                "Number of completed orders"
              )
            }
          />
          <DashboardMetricCard
            title={safeT(
              "metrics.averageResponseTime.title",
              "Avg. Response Time"
            )}
            value={
              statistics
                ? statistics.averageResponseTimeDisplay
                : safeT("states.noData", "No Data")
            }
            change={
              statistics?.averageResponseTimeDays
                ? statistics.averageResponseTimeDays < 2
                  ? safeT("trends.fast", "Fast")
                  : statistics.averageResponseTimeDays < 5
                  ? safeT("trends.normal", "Normal")
                  : safeT("trends.slow", "Slow")
                : undefined
            }
            period={
              statistics?.averageResponseTimeDays
                ? safeT("periods.average", "average")
                : undefined
            }
            trend="neutral"
            isTrendDownGood={true}
            icon={<Clock className="h-5 w-5" />}
            isLoading={isLoading}
            error={error}
            onRetry={refresh}
            description={
              translatedDynamicContent?.responseTimeDescription ||
              safeT(
                "metrics.averageResponseTime.description",
                "Average response time"
              )
            }
            tooltip={
              translatedDynamicContent?.responseTimeTooltip ||
              safeT(
                "metrics.averageResponseTime.tooltip",
                "Average time to first response"
              )
            }
          />
        </div>

        {/* Row for Aktuelle Projekte and Anstehende Termine */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Aktuelle Projekte Card */}
          <Card className="lg:col-span-4 border-0 shadow-md">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-semibold truncate">
                    {safeT(
                      "sections.currentProjects.title",
                      "Current Projects"
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {safeT(
                      "sections.currentProjects.description",
                      "Overview of your running orders"
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleViewAllProjects}
                  disabled={isNavigating}
                >
                  <span className="hidden sm:inline">
                    {safeT("actions.viewAll", "View All")}
                  </span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <DashboardSectionErrorBoundaryWrapper
                sectionName="projects"
                onRetry={refreshProjects}
              >
                <DashboardProjectList
                  projects={projects}
                  isLoading={isLoadingProjects}
                  error={projectsError}
                  onRetry={refreshProjects}
                  onProjectClick={handleProjectClick}
                />
              </DashboardSectionErrorBoundaryWrapper>
            </CardContent>
          </Card>

          {/* Anstehende Termine Card */}
          <Card className="lg:col-span-3 border-0 shadow-md">
            <CardHeader className="pb-2 px-4 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base sm:text-lg font-semibold truncate">
                    {safeT(
                      "sections.upcomingDeadlines.title",
                      "Upcoming Deadlines"
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {safeT(
                      "sections.upcomingDeadlines.description",
                      "Your next important deadlines"
                    )}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex-shrink-0"
                  onClick={handleViewAllDeadlines}
                  disabled={isNavigating}
                >
                  <span className="hidden sm:inline">
                    {safeT("actions.viewAll", "View All")}
                  </span>
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <DashboardSectionErrorBoundaryWrapper
                sectionName="deadlines"
                onRetry={refreshDeadlines}
              >
                <DashboardDeadlineList
                  deadlines={deadlines}
                  isLoading={isLoadingDeadlines}
                  error={deadlinesError}
                  onRetry={refreshDeadlines}
                  onDeadlineClick={handleDeadlineClick}
                />
              </DashboardSectionErrorBoundaryWrapper>
            </CardContent>
          </Card>
        </div>

        {/* Row for Auftragsaktivität */}
        {/* <Card className="col-span-full border-0 shadow-md mt-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">
              {safeT("sections.orderActivity.title", "Order Activity")}
            </CardTitle>
            <CardDescription>
              {safeT(
                "sections.orderActivity.description",
                "Overview of order activities in the last 30 days"
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardChart />
          </CardContent>
        </Card> */}
      </DashboardShell>
    </DashboardErrorBoundaryWrapper>
  );
}
