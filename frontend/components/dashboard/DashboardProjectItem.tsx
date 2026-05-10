/**
 * DashboardProjectItem Component
 *
 * Individual project card component for the dashboard "Current Projects" section.
 * Displays project information including title, description, status, deadline, and company context.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React, { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Clock, Building2, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge, getStatusVariant } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { DashboardProject } from "@/lib/types/dashboard";

interface DashboardProjectItemProps {
  project: DashboardProject;
  onClick?: (projectId: string) => void;
  className?: string;
  "aria-posinset"?: number;
  "aria-setsize"?: number;
}

/**
 * Individual project item component for dashboard display
 *
 * Features:
 * - Project title and description display
 * - Status badge with appropriate styling
 * - Deadline display with time-sensitive formatting
 * - Company information based on role context
 * - Click handler for navigation to order details
 * - Accessibility attributes and keyboard navigation
 *
 * @param project - The dashboard project data
 * @param onClick - Optional click handler (defaults to navigation)
 * @param className - Additional CSS classes
 */
export const DashboardProjectItem = memo(
  ({
    project,
    onClick,
    className,
    ...ariaProps
  }: DashboardProjectItemProps) => {
    const router = useRouter();
    const t = useTranslations("Dashboard.projects");
    const tCommon = useTranslations("Common");

    // Memoize click handler to prevent unnecessary re-renders
    const handleClick = useCallback(async () => {
      if (onClick) {
        onClick(project.id);
      } else {
        // Default navigation to order details
        router.push(`/dashboard/auftraege/${project.id}`);
      }
    }, [onClick, project.id, router]);

    // Memoize keyboard handler with async support
    const handleKeyDown = useCallback(
      async (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          await handleClick();
        }
      },
      [handleClick]
    );

    // Memoize deadline formatting to prevent recalculation on each render
    const deadlineInfo = useMemo(() => {
      if (!project.deadline) return null;

      const now = new Date();
      const timeDiff = project.deadline.getTime() - now.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

      let formattedDeadline: string;
      let urgencyClass: string;

      // Format deadline text
      if (daysRemaining < 0) {
        formattedDeadline = tCommon("deadline.overdue");
        urgencyClass = "text-red-600";
      } else if (daysRemaining === 0) {
        formattedDeadline = tCommon("deadline.today");
        urgencyClass = "text-red-600";
      } else if (daysRemaining === 1) {
        formattedDeadline = tCommon("deadline.tomorrow");
        urgencyClass = "text-red-600";
      } else if (daysRemaining <= 3) {
        formattedDeadline = tCommon("deadline.daysRemaining", {
          days: daysRemaining,
        });
        urgencyClass = "text-orange-600";
      } else if (daysRemaining <= 7) {
        formattedDeadline = tCommon("deadline.daysRemaining", {
          days: daysRemaining,
        });
        urgencyClass = "text-yellow-600";
      } else {
        formattedDeadline = project.deadline.toLocaleDateString("de-DE", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        urgencyClass = "text-muted-foreground";
      }

      return { formattedDeadline, urgencyClass };
    }, [project.deadline, tCommon]);

    // Memoize company display to prevent recalculation
    const companyDisplay = useMemo(() => {
      if (project.roleContext === "client") {
        return project.providerCompany
          ? `${t("assignedTo")}: ${project.providerCompany}`
          : t("notAssigned");
      } else {
        return project.clientCompany
          ? `${t("clientCompany")}: ${project.clientCompany}`
          : t("unknownClient");
      }
    }, [
      project.roleContext,
      project.providerCompany,
      project.clientCompany,
      t,
    ]);

    // Memoize status variant to prevent recalculation
    const statusVariant = useMemo(
      () => getStatusVariant(project.status, "order"),
      [project.status]
    );

    // Memoize role context label
    const roleContextLabel = useMemo(
      () =>
        project.roleContext === "client"
          ? t("roleContext.client")
          : t("roleContext.provider"),
      [project.roleContext, t]
    );

    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          "active:scale-[0.98] touch-manipulation", // Better mobile interaction
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={t("projectItemAriaLabel", { title: project.title })}
        {...ariaProps}
      >
        <CardContent className="p-3 sm:p-4">
          {/* Header with title and status */}
          <div className="flex justify-between items-start mb-2 sm:mb-3 gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base leading-tight truncate">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <StatusBadge variant={statusVariant} className="text-xs" />
            </div>
          </div>

          {/* Project details */}
          <div className="space-y-1.5 sm:space-y-2">
            {/* Deadline */}
            {deadlineInfo && (
              <div className="flex items-center text-xs sm:text-sm">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-muted-foreground flex-shrink-0" />
                <span
                  className={cn(
                    "font-medium truncate",
                    deadlineInfo.urgencyClass
                  )}
                >
                  {deadlineInfo.formattedDeadline}
                </span>
              </div>
            )}

            {/* Company information */}
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">{companyDisplay}</span>
            </div>

            {/* Role context indicator */}
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{roleContextLabel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DashboardProjectItem.displayName = "DashboardProjectItem";

export default DashboardProjectItem;