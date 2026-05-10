"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { useTranslations, useLocale } from "next-intl";
import { usePermissions } from "@/lib/hooks/usePermissions";

export interface CalendarControlsProps {
  currentDate: Date;
  view: "month" | "week";
  onPrevPeriod: () => void;
  onNextPeriod: () => void;
  onGoToToday: () => void;
  onSetView: (view: "month" | "week") => void;
  onAddNewProject: () => void; // Placeholder for new project functionality
}

const CalendarControls: React.FC<CalendarControlsProps> = ({
  currentDate,
  view,
  onPrevPeriod,
  onNextPeriod,
  onGoToToday,
  onSetView,
  onAddNewProject,
}) => {
  const t = useTranslations("Dashboard.calendar.controls");
  const currentLocale = useLocale();
  const { canCreateOrders } = usePermissions();

  // Select appropriate date-fns locale
  const dateLocale = currentLocale === "de" ? de : enUS;

  const handleAddNewProject = () => {
    // Placeholder function - implement actual navigation or modal opening here
    console.log("Neues Projekt erstellen geklickt");
    alert(
      "Funktion zum Hinzufügen eines neuen Projekts ist noch nicht implementiert."
    );
    // onAddNewProject(); // Call this if you have a function to handle it in the parent
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex items-center space-x-2 flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onGoToToday}>
          {t("today")}
        </Button>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevPeriod}
            aria-label={t("previousPeriod")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-[9rem] max-w-[14rem] px-3 text-center font-medium tabular-nums">
            {view === "month"
              ? format(currentDate, "MMMM yyyy", { locale: dateLocale })
              : `${format(
                  startOfWeek(currentDate, { weekStartsOn: 1 }),
                  "d. MMM",
                  { locale: dateLocale }
                )} - ${format(
                  endOfWeek(currentDate, { weekStartsOn: 1 }),
                  "d. MMM",
                  { locale: dateLocale }
                )}`}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onNextPeriod}
            aria-label={t("nextPeriod")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex rounded-md overflow-hidden border">
          <Button
            variant={view === "month" ? "default" : "outline"}
            className="rounded-none"
            size="sm"
            onClick={() => onSetView("month")}
            aria-pressed={view === "month"}
          >
            {t("month")}
          </Button>
          <Button
            variant={view === "week" ? "default" : "outline"}
            className="rounded-none"
            size="sm"
            onClick={() => onSetView("week")}
            aria-pressed={view === "week"}
          >
            {t("week")}
          </Button>
        </div>

        {/* Only show create order button for AG-only companies or companies with both roles */}
        {/* Hide for AN-only companies (as per requirement 4.2) */}
        {canCreateOrders && (
          <Button size="sm" onClick={onAddNewProject}>
            <Plus className="h-4 w-4 mr-1" />
            {t("newProject")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CalendarControls;
