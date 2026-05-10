"use client";

import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/projects-service";
import { Clock } from "lucide-react";
import React from "react";
import { useTranslations } from "next-intl";

export interface ProjectItemProps {
  project: Project;
  getProjectColor: (status: string) => string;
  getBadgeVariant: (
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
  onProjectClick: (project: Project) => void;
}

const ProjectItem: React.FC<ProjectItemProps> = ({
  project,
  getProjectColor,
  getBadgeVariant,
  onProjectClick,
}) => {
  const t = useTranslations("Dashboard.calendar.projectItem");
  
  // Track if the event has been handled to prevent multiple rapid triggers
  const isHandlingRef = React.useRef(false);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault(); // Prevent default space scroll

      // Prevent multiple rapid triggers
      if (isHandlingRef.current) return;
      isHandlingRef.current = true;

      onProjectClick(project);

      // Reset after a short delay
      setTimeout(() => {
        isHandlingRef.current = false;
      }, 300);
    }
  };

  return (
    <button
      className={`mb-1 p-1 rounded text-xs truncate border-l-2 ${getProjectColor(
        project.status
      )} cursor-pointer hover:opacity-80 focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-opacity w-full text-left`}
      onClick={() => onProjectClick(project)}
      onKeyDown={handleKeyDown}
      aria-label={`${t("viewProject")}: ${project.title}`}
      tabIndex={0}
    >
      <div className="font-medium truncate">{project.title}</div>
      <div className="flex justify-between items-center mt-0.5 text-[10px]">
        <div className="flex items-center text-muted-foreground">
          <Clock className="h-2 w-2 mr-1" />
          {/* Extract time from startDate if present, otherwise show translated 'All day' */}
          {project.startDate?.split(" ")?.[1] || t("allDay")}
        </div>
        <Badge
          variant={getBadgeVariant(project.status)}
          className="text-[8px] h-3 px-1"
        >
          {project.status}
        </Badge>
      </div>
    </button>
  );
};

export default ProjectItem;
