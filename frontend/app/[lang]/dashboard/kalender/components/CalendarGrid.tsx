"use client";

import React from "react";
import { isSameMonth, format } from "date-fns";
import DayCell, { DayCellProps } from "./DayCell";
import { OrderCalendarItem } from "@/lib/types/calendar";
import { useLocale } from "next-intl";

export interface CalendarGridProps {
  currentDate: Date;
  days: Date[];
  view: "month" | "week";
  getOrdersForDay: (day: Date) => OrderCalendarItem[];
  onOrderClick?: (order: OrderCalendarItem) => void;
  maxVisibleOrdersPerDay?: number; // Allow configuring max visible orders per day
}

const CalendarGrid: React.FC<CalendarGridProps> = ({
  currentDate,
  days,
  view,
  getOrdersForDay,
  onOrderClick,
  maxVisibleOrdersPerDay = 3, // Default to 3 orders visible
}) => {
  const currentLocale = useLocale();

  // Define weekday arrays based on locale
  const weekdaysShort =
    currentLocale === "de"
      ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
      : ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  const weekdaysLong =
    currentLocale === "de"
      ? [
          "Montag",
          "Dienstag",
          "Mittwoch",
          "Donnerstag",
          "Freitag",
          "Samstag",
          "Sonntag",
        ]
      : [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];

  const renderCalendarHeader = () => (
    <div className="grid grid-cols-7 border-b text-sm sticky top-0 bg-white z-10">
      {(view === "month" ? weekdaysShort : weekdaysLong).map((day) => (
        <div key={day} className="p-2 text-center font-medium">
          {day}
        </div>
      ))}
    </div>
  );

  const renderCalendarCells = () => (
    <div
      className={`grid grid-cols-7 ${
        view === "month"
          ? "auto-rows-[minmax(120px,_1fr)]"
          : "auto-rows-[minmax(150px,_1fr)]"
      }`}
    >
      {days.map((day, i) => {
        const dayOrders = getOrdersForDay(day);
        const isCurrentMonth = isSameMonth(day, currentDate);

        return (
          <DayCell
            key={format(day, "yyyy-MM-dd")}
            day={day}
            isCurrentMonth={isCurrentMonth}
            dayOrders={dayOrders}
            onOrderClick={onOrderClick}
            view={view}
            maxVisibleOrders={maxVisibleOrdersPerDay}
          />
        );
      })}
    </div>
  );

  return (
    <div className="w-full overflow-auto relative">
      {renderCalendarHeader()}
      {renderCalendarCells()}
    </div>
  );
};

export default CalendarGrid;
