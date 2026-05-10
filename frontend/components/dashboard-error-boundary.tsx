"use client";

import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { paths } from "@/lib/navigation";

interface DashboardErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface DashboardErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    locale: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Dashboard-specific Error Boundary Component with Translation Support
 *
 * Catches JavaScript errors in dashboard components and displays
 * a localized fallback UI that maintains dashboard functionality.
 */
export class DashboardErrorBoundary extends React.Component<
  DashboardErrorBoundaryProps,
  DashboardErrorBoundaryState
> {
  constructor(props: DashboardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): DashboardErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("DashboardErrorBoundary caught an error:", error, errorInfo);

    // Store error info for debugging
    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log translation-related errors specifically
    if (
      error.message.includes("translation") ||
      error.message.includes("useTranslations")
    ) {
      console.error("Translation error detected in dashboard:", {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error!}
            resetError={this.resetError}
            locale="de" // Default to German as fallback
          />
        );
      }

      // Default dashboard error fallback UI
      return (
        <DashboardErrorFallback
          error={this.state.error!}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Dashboard Error Fallback Component
 * Uses safe translation fallbacks and maintains dashboard navigation
 */
interface DashboardErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

function DashboardErrorFallback({
  error,
  resetError,
}: DashboardErrorFallbackProps) {
  // Use safe translation access with fallbacks
  const locale = useLocale();
  let t: any;
  let tCommon: any;

  try {
    t = useTranslations("Dashboard");
    tCommon = useTranslations("Common");
  } catch (translationError) {
    // If translations fail, we'll use hardcoded fallbacks
    console.warn(
      "Translation system failed in error boundary, using hardcoded fallbacks"
    );
  }

  // Safe translation function with fallbacks
  const safeTranslate = (
    key: string,
    fallbackDe: string,
    fallbackEn: string
  ) => {
    try {
      if (t) {
        const translated = t(key);
        if (translated && translated !== key) {
          return translated;
        }
      }
    } catch (e) {
      // Translation failed, use locale-based fallback
    }

    // Use locale-based fallback
    return locale === "en" ? fallbackEn : fallbackDe;
  };

  const safeTranslateCommon = (
    key: string,
    fallbackDe: string,
    fallbackEn: string
  ) => {
    try {
      if (tCommon) {
        const translated = tCommon(key);
        if (translated && translated !== key) {
          return translated;
        }
      }
    } catch (e) {
      // Translation failed, use locale-based fallback
    }

    // Use locale-based fallback
    return locale === "en" ? fallbackEn : fallbackDe;
  };

  const isTranslationError =
    error.message.includes("translation") ||
    error.message.includes("useTranslations") ||
    error.message.includes("next-intl");

  return (
    <div className="w-full min-h-[400px] flex items-center justify-center p-6">
      <Card className="border-destructive max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />

          <h3 className="text-lg font-semibold mb-2">
            {safeTranslate(
              "states.error",
              "Dashboard Fehler",
              "Dashboard Error"
            )}
          </h3>

          <p className="text-muted-foreground text-center mb-4 max-w-md text-sm">
            {isTranslationError
              ? locale === "en"
                ? "A translation error occurred. The dashboard will continue to work, but some text may appear in German."
                : "Ein Übersetzungsfehler ist aufgetreten. Das Dashboard funktioniert weiterhin, aber einige Texte könnten auf Deutsch erscheinen."
              : locale === "en"
              ? "An unexpected error occurred in the dashboard. Please try again or return to the main dashboard."
              : "Ein unerwarteter Fehler ist im Dashboard aufgetreten. Bitte versuchen Sie es erneut oder kehren Sie zum Haupt-Dashboard zurück."}
          </p>

          {/* Error details for development */}
          {process.env.NODE_ENV === "development" && (
            <details className="mb-4 text-xs text-muted-foreground max-w-full">
              <summary className="cursor-pointer mb-2">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap break-all bg-muted p-2 rounded text-xs">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button onClick={resetError} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              {safeTranslateCommon(
                "actions.retry",
                "Erneut versuchen",
                "Try Again"
              )}
            </Button>

            <Button asChild variant="default" className="flex-1">
              <Link href={paths.dashboard(locale as "de" | "en")}>
                <Home className="h-4 w-4 mr-2" />
                {safeTranslate("title", "Dashboard", "Dashboard")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook-based Dashboard Error Boundary for functional components
 */
interface DashboardErrorBoundaryWrapperProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{
    error: Error;
    resetError: () => void;
    locale: string;
  }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export const DashboardErrorBoundaryWrapper: React.FC<
  DashboardErrorBoundaryWrapperProps
> = ({ children, fallback, onError }) => {
  return (
    <DashboardErrorBoundary fallback={fallback} onError={onError}>
      {children}
    </DashboardErrorBoundary>
  );
};

export default DashboardErrorBoundary;
