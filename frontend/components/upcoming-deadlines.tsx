import { CalendarDays, Clock } from "lucide-react";
import { useUpcomingDeadlines } from "@/hooks/use-upcoming-deadlines"; // Import the hook
import { Skeleton } from "@/components/ui/skeleton"; // For loading state
import { useTranslations } from "next-intl";

export function UpcomingDeadlines() {
  const { deadlines, loading, error } = useUpcomingDeadlines();
  const t = useTranslations("Common");

  if (loading) {
    return (
      <div className="space-y-4">
        {["skeleton-1", "skeleton-2", "skeleton-3"].map((id) => (
          <div
            key={id}
            className="flex items-start space-x-3 p-2 border-b last:border-0"
          >
            <Skeleton className="h-8 w-8 rounded-md bg-primary/10" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 border rounded-md bg-red-50 text-red-700">
        {t("errors.loadingDeadlines")}: {error.message}
      </div>
    );
  }

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="p-3 border rounded-md text-muted-foreground">
        {t("messages.noUpcomingDeadlines")}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {deadlines.map((deadline) => (
        <div
          key={deadline.id}
          className="flex items-start space-x-3 p-2 border-b last:border-0"
        >
          <div className="bg-primary/10 p-2 rounded-md">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">{deadline.title}</p>
            <div className="flex items-center mt-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>
                {deadline.date}, {deadline.time} Uhr
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
