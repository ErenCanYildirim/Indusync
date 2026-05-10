"use client";

import type * as React from "react";
import { DayPicker } from "react-day-picker";
import { de } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  bare?: boolean;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  bare = false,
  ...props
}: CalendarProps) {
  const calendarElement = (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-0 bg-transparent shadow-none border-none", className)}
      locale={de}
      classNames={{
        months: "flex flex-col space-y-2",
        month: "space-y-2",
        caption:
          "flex justify-center items-center relative py-1 mb-1 bg-transparent",
        caption_label:
          "text-base font-medium text-gray-800 text-center p-0 m-0",
        nav: "absolute left-0 right-0 flex justify-between items-center px-1 top-1/2 -translate-y-1/2",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-6 w-6 bg-white border border-gray-200 shadow-sm p-0 opacity-70 hover:opacity-100 transition-all duration-150"
        ),
        nav_button_previous: "",
        nav_button_next: "",
        table: "w-full border-collapse",
        head_row: "flex bg-transparent rounded-none m-0 p-0",
        head_cell:
          "text-gray-400 w-7 font-normal text-[11px] text-center p-0 m-0",
        row: "flex w-full mt-0 mb-0 p-0",
        cell: "h-7 w-7 text-center text-xs p-0 m-0 relative transition-all duration-150",
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 font-normal rounded-full transition-all duration-150 hover:bg-blue-100 hover:text-blue-700"
        ),
        day_range_end: "day-range-end",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white rounded-full",
        day_today: "border-2 border-blue-400 bg-blue-50 text-blue-700",
        day_outside:
          "day-outside text-gray-300 bg-gray-50 opacity-70 aria-selected:bg-blue-100 aria-selected:text-gray-400 aria-selected:opacity-30",
        day_disabled: "text-gray-300 opacity-50",
        day_range_middle:
          "aria-selected:bg-blue-100 aria-selected:text-blue-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      {...props}
    />
  );
  if (bare) return calendarElement;
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-fit">
      {calendarElement}
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
