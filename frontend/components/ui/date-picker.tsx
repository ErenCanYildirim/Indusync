"use client";

import dynamic from "next/dynamic";
// @ts-expect-error
const DatePicker = dynamic(() => import("react-datepicker"), { ssr: false });
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from "react-datepicker";
import { de } from "date-fns/locale/de";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

registerLocale("de", de);
setDefaultLocale("de");

export interface CommonDatePickerProps {
  value: Date | null | undefined;
  onChange: (date: Date | null) => void;
  id?: string;
  placeholder?: string;
  className?: string;
}

export function CommonDatePicker({
  value,
  onChange,
  id,
  placeholder = "Datum auswählen",
  className,
}: Readonly<CommonDatePickerProps>) {
  return (
    <div className="relative mt-1">
      <DatePicker
        id={id}
        selected={value as Date | null}
        onChange={onChange}
        dateFormat="P"
        className={cn(
          "w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm placeholder:text-gray-400",
          className
        )}
        placeholderText={placeholder}
        popperPlacement="bottom"
        showPopperArrow={false}
        autoComplete="off"
      />
      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
