"use client";

import React from "react";
import { format } from "date-fns";
import { de, enUS } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  MapPin,
  DollarSign,
  Play,
  Square,
  Pause,
  ExternalLink,
} from "lucide-react";
import {
  OrderCalendarItem,
  getOrderStatusColor,
  getOrderStatusBadgeVariant,
  getOrderUrgencyColor,
} from "@/lib/types/calendar";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

export interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  day: Date;
  orders: OrderCalendarItem[];
  visibleCount: number; // How many orders are already visible in the day cell
}

// Map status code to translated label
function getStatusLabel(status: string, t: any): string {
  switch (status) {
    case "DRAFT":
      return t("legend.draft");
    case "PUBLISHED":
      return t("legend.published");
    case "MATCHED":
      return t("legend.orderAssigned");
    case "IN_PROGRESS":
      return t("legend.active");
    case "COMPLETED":
      return t("legend.completed");
    case "CANCELLED":
      return t("legend.overdue");
    default:
      return status;
  }
}

const OrdersModal: React.FC<OrdersModalProps> = ({
  isOpen,
  onClose,
  day,
  orders,
  visibleCount,
}) => {
  const router = useRouter();
  const t = useTranslations("Dashboard.calendar");
  const currentLocale = useLocale();

  // Select appropriate date-fns locale
  const dateLocale = currentLocale === "de" ? de : enUS;

  // Get the hidden orders (orders not shown in the day cell)
  const hiddenOrders = orders.slice(visibleCount);
  const totalOrders = orders.length;

  const handleOrderClick = (order: OrderCalendarItem) => {
    onClose(); // Close modal first
    router.push(`/dashboard/auftraege/${order.id}`);
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch {
      return "";
    }
  };

  const getOrderDisplayInfo = (order: OrderCalendarItem) => {
    const orderStart = new Date(order.startDate);
    const orderEnd = new Date(order.deadline);
    const currentDayStart = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate()
    );
    const orderStartDate = new Date(
      orderStart.getFullYear(),
      orderStart.getMonth(),
      orderStart.getDate()
    );
    const orderEndDate = new Date(
      orderEnd.getFullYear(),
      orderEnd.getMonth(),
      orderEnd.getDate()
    );

    const isFirstDay = currentDayStart.getTime() === orderStartDate.getTime();
    const isLastDay = currentDayStart.getTime() === orderEndDate.getTime();
    const isMiddleDay = !isFirstDay && !isLastDay && order.isSpanning;

    if (!order.isSpanning) {
      const startTime = formatTime(order.startDate);
      const endTime = formatTime(order.deadline);
      return {
        title: order.title,
        timeInfo:
          startTime === endTime
            ? startTime || t("orderItem.allDay")
            : `${startTime} - ${endTime}`,
        icon: <Square className="h-3 w-3" />,
        type: "single",
      };
    }

    if (isFirstDay) {
      return {
        title: order.title,
        timeInfo: `${t("orderItem.start")} ${formatTime(order.startDate)}`,
        icon: <Play className="h-3 w-3" />,
        type: "start",
      };
    }

    if (isLastDay) {
      return {
        title: order.title,
        timeInfo: `${t("orderItem.end")} ${formatTime(order.deadline)}`,
        icon: <Square className="h-3 w-3" />,
        type: "end",
      };
    }

    // Middle day
    const dayNumber =
      Math.ceil(
        (currentDayStart.getTime() - orderStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
    const totalDays =
      Math.ceil(
        (orderEndDate.getTime() - orderStartDate.getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    return {
      title: order.title,
      timeInfo: `${t("orderItem.day")} ${dayNumber}/${totalDays}`,
      icon: <Pause className="h-3 w-3" />,
      type: "middle",
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("modal.title")}{" "}
            {format(day, "dd. MMMM yyyy", { locale: dateLocale })}
          </DialogTitle>
          <DialogDescription>
            {totalOrders} {totalOrders === 1 ? "order" : "orders"} on this day
            {visibleCount > 0 && ` (${visibleCount} already visible)`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-3">
            {/* Show all orders, but highlight which ones are hidden */}
            {orders.map((order, index) => {
              const displayInfo = getOrderDisplayInfo(order);
              const colorClass = getOrderStatusColor(order.status);
              const badgeVariant = getOrderStatusBadgeVariant(order.status);
              const urgencyColor = getOrderUrgencyColor(order.urgency);
              const isHidden = index >= visibleCount;

              return (
                <div
                  key={order.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                    isHidden ? "ring-2 ring-blue-200 bg-blue-50/50" : "bg-white"
                  }`}
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Header with title and status */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {displayInfo.icon}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {/* Urgency indicators */}
                          {order.urgency === "URGENT" && (
                            <span
                              className="text-red-500"
                              title={t("orderItem.urgent")}
                            >
                              🔥
                            </span>
                          )}
                          {order.urgency === "HIGH" && (
                            <span
                              className="text-orange-500"
                              title={t("orderItem.highPriority")}
                            >
                              ⚡
                            </span>
                          )}

                          <h3 className="font-medium text-sm truncate">
                            {displayInfo.title}
                          </h3>

                          {isHidden && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-blue-100 text-blue-700"
                            >
                              Hidden
                            </Badge>
                          )}
                        </div>

                        {order.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {order.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <Badge
                      variant={badgeVariant}
                      className="text-xs flex-shrink-0"
                    >
                      {getStatusLabel(order.status, t)}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      <span>{displayInfo.timeInfo}</span>
                    </div>

                    {order.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{order.city}</span>
                      </div>
                    )}

                    {order.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        <span className="text-green-600 font-medium">
                          {order.budget.toLocaleString()}€
                        </span>
                      </div>
                    )}

                    {/* Warning indicators */}
                    {order.isOverdue && (
                      <div className="flex items-center gap-2 text-red-500">
                        <span>⚠️</span>
                        <span>{t("orderItem.overdue")}</span>
                      </div>
                    )}
                  </div>

                  {/* Click hint */}
                  <div className="flex items-center justify-end mt-2 pt-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-6 px-2"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {t("modal.viewAll")}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Summary footer */}
        <div className="border-t pt-3 text-center">
          <p className="text-xs text-muted-foreground">
            Click on an order to view details
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrdersModal;
