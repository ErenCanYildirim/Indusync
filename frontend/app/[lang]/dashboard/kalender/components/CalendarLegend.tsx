import React from "react";
import { useTranslations } from "next-intl";

interface LegendItemProps {
  colorClass: string;
  label: string;
}

const LegendItem: React.FC<LegendItemProps> = ({ colorClass, label }) => (
  <div className="flex items-center">
    <div className={`w-3 h-3 rounded-full ${colorClass} mr-2`}></div>
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

export interface CalendarLegendProps {
  statuses?: Array<{
    color: string;
    label: string;
  }>;
}

const CalendarLegend: React.FC<CalendarLegendProps> = ({ statuses }) => {
  const t = useTranslations("Dashboard.calendar.legend");

  const defaultStatuses = [
    { color: "bg-blue-500", label: t("published") },
    { color: "bg-yellow-500", label: t("providerSelection") },
    { color: "bg-green-500", label: t("orderAssigned") },
    { color: "bg-teal-500", label: t("active") },
    { color: "bg-gray-500", label: t("completed") },
    { color: "bg-red-500", label: t("overdue") },
    { color: "bg-gray-400", label: t("draft") },
  ];

  const displayStatuses = statuses || defaultStatuses;

  return (
    <div className="mt-6 flex gap-x-6 gap-y-2 flex-wrap border-t pt-4">
      {displayStatuses.map((status) => (
        <LegendItem
          key={status.label}
          colorClass={status.color}
          label={status.label}
        />
      ))}
    </div>
  );
};

export default CalendarLegend;
