/**
 * DashboardDeadlineItem Component
 *
 * Individual deadline card component for the dashboard "Upcoming Deadlines" section.
 * Displays deadline information including date, time remaining, urgency indicators, order title,
 * deadline type, and action required information.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import React, { memo, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Clock,
  AlertTriangle,
  Calendar,
  FileText,
  Users,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DashboardDeadline } from "@/lib/types/dashboard";
import { getUrgencyColorClasses } from "@/lib/types/dashboard";

interface DashboardDeadlineItemProps {
  deadline: DashboardDeadline;
  onClick?: (deadlineId: string, orderId: string) => void;
  className?: string;
  "aria-posinset"?: number;
  "aria-setsize"?: number;
}

/**
 * Individual deadline item component for dashboard display
 *
 * Features:
 * - Deadline date and time remaining display
 * - Urgency-based color coding and visual styling
 * - Order title and deadline type information
 * - Action required text with appropriate icons
 * - Click handler for navigation to relevant action page
 * - Accessibility attributes and keyboard navigation
 *
 * @param deadline - The dashboard deadline data
 * @param onClick - Optional click handler (defaults to navigation)
 * @param className - Additional CSS classes
 */
export const DashboardDeadlineItem = memo(
  ({
    deadline,
    onClick,
    className,
    ...ariaProps
  }: DashboardDeadlineItemProps) => {
    const router = useRouter();
    const t = useTranslations("Dashboard.deadlines");
    const tCommon = useTranslations("Common");

    // Memoize click handler to prevent unnecessary re-renders
    const handleClick = useCallback(async () => {
      if (onClick) {
        onClick(deadline.id, deadline.orderId);
      } else {
        // Default navigation based on deadline type
        switch (deadline.deadlineType) {
          case "completion":
            router.push(`/dashboard/auftraege/${deadline.orderId}`);
            break;
          case "milestone":
            router.push(`/dashboard/auftraege/${deadline.orderId}#milestones`);
            break;
          case "application_response":
            router.push(
              `/dashboard/auftraege/${deadline.orderId}/applications`
            );
            break;
          default:
            router.push(`/dashboard/auftraege/${deadline.orderId}`);
        }
      }
    }, [onClick, deadline.id, deadline.orderId, deadline.deadlineType, router]);

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

    // Memoize formatted deadline date to prevent recalculation
    const formattedDeadlineDate = useMemo(() => {
      return deadline.deadlineDate.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }, [deadline.deadlineDate]);

    // Memoize deadline type icon and label
    const deadlineTypeInfo = useMemo(() => {
      let icon: React.ComponentType<any>;
      let label: string;

      switch (deadline.deadlineType) {
        case "completion":
          icon = FileText;
          label = t("type.completion");
          break;
        case "milestone":
          icon = Calendar;
          label = t("type.milestone");
          break;
        case "application_response":
          icon = MessageSquare;
          label = t("type.applicationResponse");
          break;
        default:
          icon = Clock;
          label = t("type.general");
      }

      return { icon, label };
    }, [deadline.deadlineType, t]);

    // Memoize urgency icon and color classes
    const urgencyInfo = useMemo(() => {
      const icon =
        deadline.urgencyLevel === "critical" || deadline.urgencyLevel === "high"
          ? AlertTriangle
          : Clock;

      const iconColorClass = {
        critical: "text-red-600",
        high: "text-orange-600",
        medium: "text-blue-600",
        low: "text-gray-600",
      }[deadline.urgencyLevel];

      const badgeColorClasses = getUrgencyColorClasses(deadline.urgencyLevel);

      const dotColorClass = {
        critical: "bg-red-500",
        high: "bg-orange-500",
        medium: "bg-blue-500",
        low: "bg-gray-500",
      }[deadline.urgencyLevel];

      return { icon, iconColorClass, badgeColorClasses, dotColorClass };
    }, [deadline.urgencyLevel]);

    // Memoize card border styling based on urgency
    const cardBorderClass = useMemo(() => {
      if (deadline.urgencyLevel === "critical") {
        return "border-red-200 hover:border-red-300";
      }
      if (deadline.urgencyLevel === "high") {
        return "border-orange-200 hover:border-orange-300";
      }
      return "";
    }, [deadline.urgencyLevel]);

    const DeadlineTypeIcon = deadlineTypeInfo.icon;
    const UrgencyIcon = urgencyInfo.icon;

    return (
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/20",
          "focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
          "active:scale-[0.98] touch-manipulation", // Better mobile interaction
          cardBorderClass,
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={t("deadlineItemAriaLabel", {
          title: deadline.orderTitle,
          timeRemaining: deadline.timeRemaining,
        })}
        {...ariaProps}
      >
        <CardContent className="p-3 sm:p-4">
          {/* Header with urgency indicator and deadline date */}
          <div className="flex justify-between items-start mb-2 sm:mb-3 gap-3">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <UrgencyIcon
                className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0",
                  urgencyInfo.iconColorClass
                )}
              />
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-medium",
                  urgencyInfo.badgeColorClasses
                )}
              >
                {deadline.timeRemaining}
              </Badge>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                {formattedDeadlineDate}
              </div>
            </div>
          </div>

          {/* Order title and deadline type */}
          <div className="mb-2 sm:mb-3">
            <h3 className="font-semibold text-sm sm:text-base leading-tight truncate mb-1">
              {deadline.orderTitle}
            </h3>
            <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
              <DeadlineTypeIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
              <span className="truncate">{deadlineTypeInfo.label}</span>
            </div>
          </div>

          {/* Action required */}
          <div className="flex items-start space-x-1.5 sm:space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className={cn(
                  "w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full",
                  urgencyInfo.dotColorClass
                )}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                {deadline.actionRequired}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

DashboardDeadlineItem.displayName = "DashboardDeadlineItem";

export default DashboardDeadlineItem;