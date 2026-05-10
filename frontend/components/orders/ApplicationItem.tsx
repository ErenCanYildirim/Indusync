/**
 * ApplicationItem Component
 * Displays individual application information following DocumentItem patterns
 *
 * @author IndusSync Frontend Team
 * @since Order Applications Display Implementation
 */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderApplicationDto, ApplicationStatus } from "@/lib/api/types";

// Types

/**
 * Props for ApplicationItem component
 */
export interface ApplicationItemProps {
    application: OrderApplicationDto;
    //Wether this is being viewed by the client (order owner)
    isClientView: boolean;
    // additional css classes
    className?: string;
}

/**
 * Display data for application with formatted values
 */
export interface ApplicationDisplayData {
  id: string;
  companyId: string;
  companyName: string;
  appliedAt: string;
  status: ApplicationStatus;
  message?: string;
  isCurrentUserApplication?: boolean;
  formattedDate: string;
  statusColor: string;
  statusText: string;
  isCurrentUser: boolean;
}

// Utility functions


/**
 * Format application date for display
 * @param isoString - ISO date string from backend
 * @returns Formatted date string in German format
 */
function formatApplicationDate(isoString: string): string {
  try {
    const date = new Date(isoString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Ungültiges Datum";
    }

    return date.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Berlin",
    });
  } catch (error) {
    console.error("Error formatting application date:", error);
    return "Ungültiges Datum";
  }
}

/**
 * Get status badge color for application status
 * @param status - Application status
 * @returns CSS classes for status badge
 */
function getApplicationStatusColor(status: ApplicationStatus): string {
  const statusColors = {
    APPLIED: "bg-blue-100 text-blue-800 border-blue-200",
    WITHDRAWN: "bg-gray-100 text-gray-800 border-gray-200",
    ACCEPTED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  } as const;

  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

/**
 * Get localized status text
 * @param status - Application status
 * @param t - Translation function
 * @returns Localized status text
 */
function getApplicationStatusText(status: ApplicationStatus, t: any): string {
  const statusMap = {
    APPLIED: t("status.applied") || "Beworben",
    WITHDRAWN: t("status.withdrawn") || "Zurückgezogen",
    ACCEPTED: t("status.accepted") || "Angenommen",
    REJECTED: t("status.rejected") || "Abgelehnt",
  } as const;

  return statusMap[status] || status;
}

// Component


/**
 * ApplicationItem component for displaying individual application information
 */
export function ApplicationItem({
  application,
  isClientView,
  className,
}: ApplicationItemProps) {
  // Translation hook
  const t = useTranslations("Dashboard.orders.orderDetail.applications");

  // Transform application data for display
  const displayData: ApplicationDisplayData = React.useMemo(
    () => ({
      ...application,
      formattedDate: formatApplicationDate(application.appliedAt),
      statusColor: getApplicationStatusColor(application.status),
      statusText: getApplicationStatusText(application.status, t),
      isCurrentUser: application.isCurrentUserApplication || false,
    }),
    [application, t]
  );

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        displayData.isCurrentUser && "ring-2 ring-primary/20 bg-primary/5",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Company Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              displayData.isCurrentUser ? "bg-primary/10" : "bg-muted"
            )}
            aria-hidden="true"
          >
            <Building2
              className={cn(
                "w-5 h-5",
                displayData.isCurrentUser
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            />
          </div>

          {/* Application Information */}
          <div className="flex-1 min-w-0">
            {/* Company Name and Status */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h4
                  className="text-sm font-medium text-foreground truncate"
                  title={displayData.companyName}
                >
                  {displayData.companyName}
                  {displayData.isCurrentUser && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({t("labels.yourApplication") || "Ihre Bewerbung"})
                    </span>
                  )}
                </h4>
              </div>

              {/* Status Badge */}
              <Badge
                variant="outline"
                className={cn("text-xs", displayData.statusColor)}
              >
                {displayData.statusText}
              </Badge>
            </div>

            {/* Application Message (if available) */}
            {displayData.message && (
              <div className="mb-2">
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p
                    className="text-xs text-muted-foreground line-clamp-2"
                    title={displayData.message}
                  >
                    {displayData.message}
                  </p>
                </div>
              </div>
            )}

            {/* Application Metadata */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span
                className="flex items-center gap-1"
                aria-label={`${t("labels.appliedAt") || "Beworben am"}: ${
                  displayData.formattedDate
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{displayData.formattedDate}</span>
              </span>

              {isClientView && displayData.status === "APPLIED" && (
                <>
                  <span className="text-muted-foreground/60">•</span>
                  <span className="text-primary text-xs font-medium">
                    {t("labels.awaitingResponse") || "Wartet auf Antwort"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// DISPLAY NAME
// =============================================================================

ApplicationItem.displayName = "ApplicationItem";
