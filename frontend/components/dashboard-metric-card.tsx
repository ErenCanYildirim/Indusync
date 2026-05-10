import type React from "react";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown, AlertCircle, RefreshCw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { useSafeTranslations } from "@/lib/utils/translation-fallback";
import { DashboardErrorBoundaryWrapper } from "@/components/dashboard-error-boundary";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  change?: string;
  period?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
  isTrendDownGood?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  description?: string;
  tooltip?: string;
}

const getTrendColor = (
  trend: "up" | "down" | "neutral",
  isTrendDownGood?: boolean
) => {
  if (trend === "neutral") return "text-gray-600";
  if (trend === "up" || (trend === "down" && isTrendDownGood))
    return "text-emerald-600";
  return "text-red-600";
};

export function DashboardMetricCard({
  title,
  value,
  change,
  period,
  trend = "neutral",
  icon,
  className,
  isTrendDownGood,
  isLoading = false,
  error,
  onRetry,
  description,
  tooltip,
}: Readonly<DashboardMetricCardProps>) {
  // Use safe translations with fallback mechanisms
  const { t: safeT, translationSystemWorking } =
    useSafeTranslations("Dashboard");

  // Keep the original translation hook as backup
  let t: any;
  try {
    t = useTranslations("Dashboard");
  } catch (translationError) {
    console.warn(
      "Translation system failed in DashboardMetricCard, using safe fallbacks"
    );
  }
  // Loading state
  if (isLoading) {
    return (
      <DashboardErrorBoundaryWrapper>
        <div
          className={cn(
            "rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
          <div className="mt-3">
            <div className="h-9 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4"></div>
          </div>
        </div>
      </DashboardErrorBoundaryWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardErrorBoundaryWrapper>
        <div
          className={cn(
            "rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md border-red-200",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold text-red-600">--</div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-red-600 flex-1">
                {typeof error === "string" && error.trim()
                  ? error
                  : safeT("states.error", "Error occurred")}
              </span>
              {onRetry && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  {safeT("actions.retry", "Retry")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DashboardErrorBoundaryWrapper>
    );
  }

  // Normal state
  return (
    <DashboardErrorBoundaryWrapper>
      <TooltipProvider>
        <div
          className={cn(
            "rounded-lg border bg-white p-5 shadow-sm transition-all hover:shadow-md",
            className
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              {tooltip && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="text-xs">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-bold">{value}</div>
            {description && (
              <div className="mt-1 text-xs text-muted-foreground">
                {description}
              </div>
            )}
            {(change || period) && (
              <div className="mt-1 flex items-center text-xs">
                <span
                  className={cn(
                    "mr-1 flex items-center",
                    getTrendColor(trend, isTrendDownGood)
                  )}
                >
                  {trend === "up" && <ArrowUp className="mr-1 h-3 w-3" />}
                  {trend === "down" && <ArrowDown className="mr-1 h-3 w-3" />}
                  {change}
                </span>
                {period && (
                  <span className="text-muted-foreground">{period}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>
    </DashboardErrorBoundaryWrapper>
  );
}
