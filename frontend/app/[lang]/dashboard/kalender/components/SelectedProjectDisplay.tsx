"use client";

import React from "react";
import { Project } from "@/lib/projects-service";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

// Define the getBadgeVariant type directly to avoid circular dependencies
type GetBadgeVariantFn = (
  status: string
) =>
  | "default"
  | "outline"
  | "ausgeschrieben"
  | "auftrag_vergeben"
  | "aktiv"
  | "abgeschlossen"
  | "in_verzug"
  | "entwurf";

export interface SelectedProjectDisplayProps {
  selectedProject: Project | null;
  getBadgeVariant: GetBadgeVariantFn;
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

const SelectedProjectDisplay: React.FC<SelectedProjectDisplayProps> = ({
  selectedProject,
  getBadgeVariant,
}) => {
  const t = useTranslations("Dashboard.calendar");

  if (!selectedProject) return null;

  return (
    <div className="mt-6 border rounded-md bg-white shadow p-4">
      <div className="flex justify-between items-start">
        <h2 className="text-xl font-semibold">{selectedProject.title}</h2>
        {selectedProject.status && (
          <Badge
            variant={getBadgeVariant(selectedProject.status)}
            className="ml-2 shrink-0"
          >
            {getStatusLabel(selectedProject.status, t)}
          </Badge>
        )}
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {(selectedProject.startDate || selectedProject.endDate) && (
          <div>
            <p className="text-sm text-muted-foreground">
              {t("selectedProject.timeframe")}
            </p>
            <p className="font-medium">
              {selectedProject.startDate || ""}{" "}
              {selectedProject.startDate && selectedProject.endDate ? "- " : ""}
              {selectedProject.endDate || ""}
            </p>
          </div>
        )}
        {selectedProject.location && (
          <div>
            <p className="text-sm text-muted-foreground">
              {t("selectedProject.location")}
            </p>
            <p className="font-medium">{selectedProject.location}</p>
          </div>
        )}
        {typeof selectedProject.applications !== "undefined" && (
          <div>
            <p className="text-sm text-muted-foreground">
              {t("selectedProject.applications")}
            </p>
            <p className="font-medium">{selectedProject.applications}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedProjectDisplay;
