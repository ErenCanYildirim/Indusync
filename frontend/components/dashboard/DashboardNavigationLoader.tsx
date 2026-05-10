"use client";

import React, { memo } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardNavigationLoaderProps {
  isVisible: boolean;
  targetUrl?: string;
  className?: string;
}

/**
 * Navigation loading indicator for dashboard transitions
 *
 * Shows a subtle loading indicator when navigating between dashboard pages
 * to provide visual feedback during navigation transitions.
 */
export const DashboardNavigationLoader = memo(
  ({ isVisible, targetUrl, className }: DashboardNavigationLoaderProps) => {
    if (!isVisible) return null;

    // Extract page name from URL for better UX
    const getPageName = (url?: string) => {
      if (!url) return "page";

      if (url.includes("/auftraege")) {
        if (url.includes("/applications")) return "applications";
        if (url.includes("#milestones")) return "milestones";
        return "order details";
      }
      if (url.includes("/kalender")) return "calendar";

      return "page";
    };

    const pageName = getPageName(targetUrl);

    return (
      <div
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-primary/10 backdrop-blur-sm",
          "border-b border-primary/20",
          "transition-all duration-300 ease-in-out",
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={`Navigating to ${pageName}`}
      >
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-medium">Loading {pageName}...</span>
            <ArrowRight className="h-3 w-3 opacity-60" />
          </div>
        </div>

        {/* Progress bar animation */}
        <div className="h-0.5 bg-primary/20 overflow-hidden">
          <div
            className="h-full bg-primary animate-pulse"
            style={{
              animation: "loading-progress 1s ease-in-out infinite",
            }}
          />
        </div>

        <style jsx>{`
          @keyframes loading-progress {
            0% {
              transform: translateX(-100%);
              width: 0%;
            }
            50% {
              transform: translateX(-50%);
              width: 100%;
            }
            100% {
              transform: translateX(100%);
              width: 0%;
            }
          }
        `}</style>
      </div>
    );
  }
);

DashboardNavigationLoader.displayName = "DashboardNavigationLoader";

export default DashboardNavigationLoader;