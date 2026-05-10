"use client";

import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, DollarSign, Play, Square, Pause } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import {
  OrderCalendarItem,
  getOrderStatusColor,
  getOrderStatusBadgeVariant,
  getOrderUrgencyColor,
} from "@/lib/types/calendar";
import { format, differenceInDays, isSameDay } from "date-fns";
import { useTranslations } from "next-intl";

export interface OrderItemProps {
  order: OrderCalendarItem;
  currentDay: Date; // The day this item is being rendered for
  onOrderClick?: (order: OrderCalendarItem) => void;
  view: "month" | "week";
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

const OrderItem: React.FC<OrderItemProps> = ({
  order,
  currentDay,
  onOrderClick,
  view,
}) => {
  const router = useRouter();
  const t = useTranslations("Dashboard.calendar");

  // Track if the event has been handled to prevent multiple rapid triggers
  const isHandlingRef = React.useRef(false);

  const handleClick = () => {
    if (isHandlingRef.current) return;
    isHandlingRef.current = true;

    if (onOrderClick) {
      onOrderClick(order);
    } else {
      // Default behavior: navigate to order detail page
      router.push(`/dashboard/auftraege/${order.id}`);
    }

    // Reset after a short delay
    setTimeout(() => {
      isHandlingRef.current = false;
    }, 300);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // Prevent default space scroll
      handleClick();
    }
  };

  // Calculate day position within the order span
  const orderStart = new Date(order.startDate);
  const orderEnd = new Date(order.deadline);
  const currentDayStart = new Date(
    currentDay.getFullYear(),
    currentDay.getMonth(),
    currentDay.getDate()
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

  const isFirstDay = isSameDay(currentDayStart, orderStartDate);
  const isLastDay = isSameDay(currentDayStart, orderEndDate);
  const isMiddleDay = !isFirstDay && !isLastDay && order.isSpanning;
  const dayNumber = differenceInDays(currentDayStart, orderStartDate) + 1;
  const totalDays = differenceInDays(orderEndDate, orderStartDate) + 1;

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "HH:mm");
    } catch {
      return "";
    }
  };

  // Get display content based on day position
  const getDisplayContent = () => {
    if (!order.isSpanning) {
      // Single day order
      const startTime = formatTime(order.startDate);
      const endTime = formatTime(order.deadline);
      return {
        title: order.title,
        timeInfo:
          startTime === endTime
            ? startTime || t("orderItem.allDay")
            : `${startTime} - ${endTime}`,
        icon: <Square className="h-2 w-2" />,
      };
    }

    if (isFirstDay) {
      return {
        title: order.title,
        timeInfo: `${t("orderItem.start")} ${formatTime(order.startDate)}`,
        icon: <Play className="h-2 w-2" />,
      };
    }

    if (isLastDay) {
      return {
        title: order.title,
        timeInfo: `${t("orderItem.end")} ${formatTime(order.deadline)}`,
        icon: <Square className="h-2 w-2" />,
      };
    }

    // Middle day
    return {
      title: order.title,
      timeInfo: `${t("orderItem.day")} ${dayNumber}/${totalDays}`,
      icon: <Pause className="h-2 w-2" />,
    };
  };

  const displayContent = getDisplayContent();
  const colorClass = getOrderStatusColor(order.status);
  const badgeVariant = getOrderStatusBadgeVariant(order.status);
  const urgencyColor = getOrderUrgencyColor(order.urgency);

  // Visual styling based on day position
  const getSpanningStyles = () => {
    if (!order.isSpanning) return "";

    if (isFirstDay) {
      return "rounded-r-none border-r-0 bg-gradient-to-r from-current to-transparent";
    }

    if (isLastDay) {
      return "rounded-l-none border-l-0 bg-gradient-to-l from-current to-transparent";
    }

    if (isMiddleDay) {
      return "rounded-none border-l-0 border-r-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-75";
    }

    return "";
  };

  return (
    <button
      className={`mb-1 p-1 rounded text-xs border-l-2 ${colorClass} cursor-pointer hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all duration-200 w-full text-left relative ${
        order.isOverdue ? "ring-1 ring-red-300" : ""
      } ${getSpanningStyles()}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${t("orderItem.viewOrder")}: ${order.title} - ${displayContent.timeInfo}`}
      tabIndex={0}
    >
      {/* Order title with urgency and spanning indicators */}
      <div className="font-medium truncate flex items-center">
        {/* Day position icon */}
        <span className="mr-1 opacity-70">{displayContent.icon}</span>

        {/* Urgency indicator */}
        {order.urgency === "URGENT" && (
          <span className="text-red-500 mr-1" title={t("orderItem.urgent")}>
            🔥
          </span>
        )}
        {order.urgency === "HIGH" && (
          <span className="text-orange-500 mr-1" title={t("orderItem.highPriority")}>
            ⚡
          </span>
        )}

        {/* Title - truncated for middle days */}
        <span className="truncate">
          {isMiddleDay && view === "month"
            ? `${order.title.substring(0, 15)}...`
            : displayContent.title}
        </span>
      </div>

      {/* Order details row */}
      <div className="flex justify-between items-center mt-0.5 text-[10px]">
        <div className="flex items-center text-muted-foreground flex-1 min-w-0">
          <Clock className="h-2 w-2 mr-1 flex-shrink-0" />
          <span className="truncate">{displayContent.timeInfo}</span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Budget indicator - only show on first day to avoid clutter */}
          {order.budget && (isFirstDay || !order.isSpanning) && (
            <span className="text-green-600 flex items-center">
              <DollarSign className="h-2 w-2" />
              <span className="text-[8px]">
                {order.budget.toLocaleString()}€
              </span>
            </span>
          )}

          {/* Status badge - only show on first day or single day orders */}
          {(isFirstDay || !order.isSpanning) && (
            <Badge variant={badgeVariant} className="text-[8px] h-3 px-1">
              {getStatusLabel(order.status, t)}
            </Badge>
          )}

          {/* Progress indicator for spanning orders */}
          {order.isSpanning && isMiddleDay && (
            <span className="text-[8px] text-muted-foreground bg-muted px-1 rounded">
              {dayNumber}/{totalDays}
            </span>
          )}
        </div>
      </div>

      {/* Location info (only in week view and on first day for more space) */}
      {view === "week" && order.city && (isFirstDay || !order.isSpanning) && (
        <div className="flex items-center mt-0.5 text-[9px] text-muted-foreground">
          <MapPin className="h-2 w-2 mr-1" />
          <span className="truncate">{order.city}</span>
        </div>
      )}

      {/* Spanning continuation indicator */}
      {order.isSpanning && (
        <div className="absolute top-0 right-0 flex">
          {isFirstDay && (
            <div className="w-1 h-1 bg-blue-500 rounded-l-full"></div>
          )}
          {isMiddleDay && <div className="w-2 h-1 bg-blue-500"></div>}
          {isLastDay && (
            <div className="w-1 h-1 bg-blue-500 rounded-r-full"></div>
          )}
        </div>
      )}

      {/* Overdue indicator */}
      {order.isOverdue && (isLastDay || !order.isSpanning) && (
        <div
          className="absolute bottom-0 right-0 text-[8px] text-red-500"
          title={t("orderItem.overdue")}
        >
          ⚠️
        </div>
      )}

      {/* Today highlight */}
      {order.isToday && (
        <div className="absolute inset-0 border border-primary/30 rounded pointer-events-none"></div>
      )}
    </button>
  );
};

export default OrderItem;
