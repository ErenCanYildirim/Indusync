"use client";

import { useState, useCallback, useMemo } from "react";
import { Loader2, Calendar, Users, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { usePermissions } from "@/lib/hooks/usePermissions";
import {
  useCalendarOrders,
  useOrdersForDay,
} from "@/lib/hooks/useCalendarOrders";
import { OrderCalendarItem, CalendarOrderFilters } from "@/lib/types/calendar";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { useTranslations, useLocale } from "next-intl";

// Component Imports
import CalendarControls from "./components/CalendarControls";
import CalendarGrid from "./components/CalendarGrid";
import SelectedProjectDisplay from "./components/SelectedProjectDisplay";
import CalendarLegend from "./components/CalendarLegend";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function KalenderPage() {
  const t = useTranslations("Dashboard.calendar");
  const currentLocale = useLocale();

  const { user } = useAuth();
  const { canCreateOrders } = usePermissions();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");
  const [selectedOrder, setSelectedOrder] = useState<OrderCalendarItem | null>(
    null
  );

  // Calendar filters
  const [filters, setFilters] = useState<CalendarOrderFilters>({
    showCompletedOrders: true,
    showDraftOrders: true, // Changed to true to show draft orders
  });

  // Fetch calendar orders
  const { orders, isLoading, error, userContext, refetch } =
    useCalendarOrders(filters);

  // Calculate date range for current view
  const days = useMemo(() => {
    const start =
      view === "month"
        ? startOfMonth(currentDate)
        : startOfWeek(currentDate, { weekStartsOn: 1 });
    const end =
      view === "month"
        ? endOfMonth(currentDate)
        : endOfWeek(currentDate, { weekStartsOn: 1 });

    const firstDay = startOfWeek(start, { weekStartsOn: 1 });
    const lastDay = endOfWeek(end, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: firstDay, end: lastDay });
  }, [currentDate, view]);

  // Get orders for specific day
  const getOrdersForDay = useCallback(
    (day: Date): OrderCalendarItem[] => {
      const dayWithoutTime = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );

      return orders.filter((order) => {
        const startDate = new Date(order.startDate);
        const endDate = new Date(order.deadline);

        const startWithoutTime = new Date(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        );
        const endWithoutTime = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        );

        return (
          dayWithoutTime >= startWithoutTime && dayWithoutTime <= endWithoutTime
        );
      });
    },
    [orders]
  );

  // Navigation handlers
  const handlePrevPeriod = useCallback(() => {
    setCurrentDate((prevDate) =>
      view === "month"
        ? new Date(prevDate.getFullYear(), prevDate.getMonth() - 1, 1)
        : addDays(prevDate, -7)
    );
  }, [view]);

  const handleNextPeriod = useCallback(() => {
    setCurrentDate((prevDate) =>
      view === "month"
        ? new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1)
        : addDays(prevDate, 7)
    );
  }, [view]);

  const handleGoToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleSetView = useCallback((newView: "month" | "week") => {
    setView(newView);
  }, []);

  const handleOrderClick = useCallback((order: OrderCalendarItem) => {
    setSelectedOrder(order);
    // Navigation happens automatically in OrderItem component
  }, []);

  const handleAddNewProject = useCallback(() => {
    // Navigate to order creation page
    window.location.href = "/auftrag-erstellen";
  }, []);

  // Statistics
  const orderStats = useMemo(() => {
    const total = orders.length;
    const inProgress = orders.filter((o) => o.status === "IN_PROGRESS").length;
    const urgent = orders.filter((o) => o.urgency === "URGENT").length;
    const overdue = orders.filter((o) => o.isOverdue).length;

    return { total, inProgress, urgent, overdue };
  }, [orders]);

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("error.title")}: {error.message}
            <button
              onClick={() => refetch()}
              className="ml-2 underline hover:no-underline"
            >
              {t("error.retry")}
            </button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No company context
  if (!userContext.companyId) {
    return (
      <div className="container mx-auto p-4">
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>{t("noCompany.description")}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header with user context and stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            {t("title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userContext.isProvider
              ? t("subtitle.provider")
              : t("subtitle.client")}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="px-3 py-1">
            {orderStats.total} {t("stats.total")}
          </Badge>
          <Badge variant="default" className="px-3 py-1">
            {orderStats.inProgress} {t("stats.active")}
          </Badge>
          {orderStats.urgent > 0 && (
            <Badge variant="outline" className="px-3 py-1">
              {orderStats.urgent} {t("stats.urgent")}
            </Badge>
          )}
          {orderStats.overdue > 0 && (
            <Badge variant="default" className="px-3 py-1">
              {orderStats.overdue} {t("stats.overdue")}
            </Badge>
          )}
        </div>
      </div>

      {/* Calendar Controls */}
      <CalendarControls
        currentDate={currentDate}
        view={view}
        onPrevPeriod={handlePrevPeriod}
        onNextPeriod={handleNextPeriod}
        onGoToToday={handleGoToToday}
        onSetView={handleSetView}
        onAddNewProject={handleAddNewProject}
      />

      {/* Main Calendar Grid */}
      <Card>
        <CardContent className="p-0">
          <CalendarGrid
            currentDate={currentDate}
            days={days}
            view={view}
            getOrdersForDay={getOrdersForDay}
            onOrderClick={handleOrderClick}
          />
        </CardContent>
      </Card>

      {/* Calendar Legend */}
      <CalendarLegend />

      {/* Selected Order Display (if any) */}
      {selectedOrder && (
        <SelectedProjectDisplay
          selectedProject={selectedOrder as any}
          getBadgeVariant={(status) => {
            // Simple mapping for order status to badge variant
            switch (status) {
              case "DRAFT":
                return "entwurf";
              case "PUBLISHED":
                return "ausgeschrieben";
              case "MATCHED":
                return "auftrag_vergeben";
              case "IN_PROGRESS":
                return "aktiv";
              case "COMPLETED":
                return "abgeschlossen";
              case "CANCELLED":
                return "in_verzug";
              default:
                return "outline";
            }
          }}
        />
      )}

      {/* Empty state */}
      {orders.length === 0 && !isLoading && (
        <Card>
          <CardHeader>
            <CardTitle className="text-center">{t("empty.title")}</CardTitle>
            <CardDescription className="text-center">
              {userContext.isProvider && userContext.isClient
                ? t("empty.description.both")
                : userContext.isProvider
                ? t("empty.description.provider")
                : t("empty.description.client")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>{t("empty.requirements")}</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{t("empty.startDate")}</li>
                <li>{t("empty.deadline")}</li>
              </ul>
            </div>
            {/* Only show create order button for AG-only companies or companies with both roles */}
            {/* Hide for AN-only companies (as per requirement 4.2) */}
            {canCreateOrders && (
              <button
                onClick={handleAddNewProject}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {t("empty.createFirstOrder")}
              </button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
