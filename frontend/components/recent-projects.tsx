import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User } from "lucide-react";
import { useRecentProjects } from "@/hooks/use-recent-projects"; // Import the hook
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { useTranslations } from "next-intl";

export function RecentProjects() {
  const { projects, loading, error } = useRecentProjects();
  const t = useTranslations("Common");

  if (loading) {
    return (
      <div className="space-y-4">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
          <div key={id} className="flex flex-col p-3 border rounded-md">
            <div className="flex justify-between items-start mb-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/5" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 border rounded-md bg-red-50 text-red-700">
        {t("errors.loadingProjects")}: {error.message}
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="p-3 border rounded-md text-muted-foreground">
        {t("Dashboard.orders.noOrdersCreated")}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <div key={project.id} className="flex flex-col p-3 border rounded-md">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium">{project.title}</h3>
            <Badge
              variant={project.status === "Aktiv" ? "default" : "secondary"}
            >
              {project.status}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="h-3.5 w-3.5 mr-1" />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1" />
              <span>
                {t("messages.dueDate")}: {project.dueDate}
              </span>
            </div>
            <div className="flex items-center">
              <User className="h-3.5 w-3.5 mr-1" />
              <span>{project.contact}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
