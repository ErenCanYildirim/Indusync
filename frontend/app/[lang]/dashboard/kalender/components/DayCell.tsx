"use client";

import { format, isToday } from "date-fns";
import OrderItem from "./OrderItem";
import OrdersModal from "./OrdersModal";
import React from "react";
import { OrderCalendarItem } from "@/lib/types/calendar";
import { useTranslations } from "next-intl";

export interface DayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  dayOrders: OrderCalendarItem[];
  onOrderClick?: (order: OrderCalendarItem) => void;
  view: "month" | "week";
  maxVisibleOrders?: number; // Make it configurable
}

const DayCell: React.FC<DayCellProps> = ({
  day,
  isCurrentMonth,
  dayOrders,
  onOrderClick,
  view,
  maxVisibleOrders = 2, // Default to 2 orders visible
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const t = useTranslations("Dashboard.calendar.dayCell");

  const isTodayClass = isToday(day) ? "bg-primary/5 font-bold" : "";
  const minHeightClass = view === "month" ? "min-h-[120px]" : "min-h-[150px]";

  // Sort orders by urgency and then by start time
  const sortedOrders = React.useMemo(() => {
    return [...dayOrders].sort((a, b) => {
      // First sort by urgency (URGENT > HIGH > MEDIUM > LOW)
      const urgencyOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const aUrgency = urgencyOrder[a.urgency || "LOW"] || 1;
      const bUrgency = urgencyOrder[b.urgency || "LOW"] || 1;

      if (aUrgency !== bUrgency) {
        return bUrgency - aUrgency; // Higher urgency first
      }

      // Then sort by start time
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [dayOrders]);

  const handleShowMoreOrders = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={`border relative group ${minHeightClass}
          ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
          ${sortedOrders.length > 0 ? "border-l-2 border-l-blue-300" : ""}
        `}
      >
        {/* Day number with order count indicator */}
        <div
          className={`p-1 text-right flex justify-between items-center ${isTodayClass}`}
        >
          <div className="text-left">
            {sortedOrders.length > 0 && (
              <span className="text-[8px] bg-blue-100 text-blue-600 px-1 rounded">
                {sortedOrders.length}
              </span>
            )}
          </div>
          <span>{format(day, "d")}</span>
        </div>

        {/* Orders list */}
        <div className="px-1 overflow-y-auto max-h-[calc(100%-24px)]">
          {sortedOrders.slice(0, maxVisibleOrders).map((order) => (
            <OrderItem
              key={order.id}
              order={order}
              currentDay={day}
              onOrderClick={onOrderClick}
              view={view}
            />
          ))}

          {/* Show more button */}
          {sortedOrders.length > maxVisibleOrders && (
            <button
              className="text-xs text-center text-muted-foreground hover:underline hover:text-primary w-full mt-1 py-1 rounded border border-dashed border-muted-foreground/30 transition-colors hover:bg-blue-50"
              onClick={handleShowMoreOrders}
              aria-label={`${t("showMoreFor")} ${format(day, "dd.MM.yyyy")}`}
            >
              +{sortedOrders.length - maxVisibleOrders} {t("showMore")}
            </button>
          )}

          {/* Empty state */}
          {sortedOrders.length === 0 && view === "week" && (
            <div className="text-center text-[10px] text-muted-foreground/50 mt-4">
              {t("noOrders")}
            </div>
          )}
        </div>

        {isToday(day) && (
          <div className="absolute top-1 left-1 w-2 h-2 bg-primary rounded-full"></div>
        )}
      </div>

      {/* Orders Modal */}
      <OrdersModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        day={day}
        orders={sortedOrders}
        visibleCount={maxVisibleOrders}
      />
    </>
  );
};

export default DayCell;
