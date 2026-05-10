"use client";

import React from "react";
import { AlertCircle, RefreshCw, FileText, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslations, useLocale } from "next-intl";

interface DashboardSectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface DashboardSectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: "projects" | "deadlines";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
}

/**
 * Section-specific Error Boundary for Dashboard Components
 *
 * Provides isolated error handling for individual dashboard sections
 * to prevent full page crashes when one section fails.
 */
export class DashboardSectionErrorBoundary extends React.Component<
  DashboardSectionErrorBoundaryProps,
  DashboardSectionErrorBoundaryState
> {
  constructor(props: DashboardSectionErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(
    error: Error
  ): DashboardSectionErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `DashboardSectionErrorBoundary caught an error in ${this.props.sectionName} section:`,
      error,
      errorInfo
    );

    // Store error info for debugging
    this.setState({ errorInfo });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log section-specific errors
    console.error(`Dashboard ${this.props.sectionName} section error:`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      section: this.props.sectionName,
    });
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });

    // Call optional retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <DashboardSectionErrorFallback
          error={this.state.error!}
          sectionName={this.props.sectionName}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Section-specific Error Fallback Component
 */
interface DashboardSectionErrorFallbackProps {
  error: Error;
  sectionName: "projects" | "deadlines";
  resetError: () => void;
}

function DashboardSectionErrorFallback({
  error,
  sectionName,
  resetError,
}: DashboardSectionErrorFallbackProps) {
  const locale = useLocale();
  let t: any;
  let tCommon: any;

  try {
    t = useTranslations("Dashboard");
    tCommon = useTranslations("Common");
  } catch (translationError) {
    console.warn(
      "Translation system failed in section error boundary, using hardcoded fallbacks"
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

    return locale === "en" ? fallbackEn : fallbackDe;
  };

  // Section-specific content
  const sectionConfig = {
    projects: {
      icon: FileText,
      title: safeTranslate(
        "sections.currentProjects.title",
        "Aktuelle Projekte",
        "Current Projects"
      ),
      errorMessage:
        locale === "en"
          ? "Unable to load your current projects. This might be due to a temporary connection issue or server problem."
          : "Ihre aktuellen Projekte können nicht geladen werden. Dies könnte an einem temporären Verbindungsproblem oder Serverproblem liegen.",
      actionGuidance:
        locale === "en"
          ? "You can try refreshing this section or check your internet connection."
          : "Sie können versuchen, diesen Bereich zu aktualisieren oder Ihre Internetverbindung zu überprüfen.",
    },
    deadlines: {
      icon: Calendar,
      title: safeTranslate(
        "sections.upcomingDeadlines.title",
        "Anstehende Termine",
        "Upcoming Deadlines"
      ),
      errorMessage:
        locale === "en"
          ? "Unable to load your upcoming deadlines. This might be due to a temporary connection issue or server problem."
          : "Ihre anstehenden Termine können nicht geladen werden. Dies könnte an einem temporären Verbindungsproblem oder Serverproblem liegen.",
      actionGuidance:
        locale === "en"
          ? "You can try refreshing this section or check your internet connection."
          : "Sie können versuchen, diesen Bereich zu aktualisieren oder Ihre Internetverbindung zu überprüfen.",
    },
  };

  const config = sectionConfig[sectionName];
  const IconComponent = config.icon;

  const isNetworkError =
    error.message.includes("fetch") ||
    error.message.includes("network") ||
    error.message.includes("timeout") ||
    error.message.includes("connection");

  const isDataError =
    error.message.includes("parse") ||
    error.message.includes("JSON") ||
    error.message.includes("transform");

  return (
    <Alert
      variant="destructive"
      className="border-destructive/20 bg-destructive/5"
    >
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <IconComponent className="h-4 w-4" />
            <span className="font-medium">{config.title}</span>
          </div>

          <div className="space-y-2">
            <p className="text-sm">{config.errorMessage}</p>
            <p className="text-xs text-muted-foreground">
              {config.actionGuidance}
            </p>
          </div>

          {/* Error type specific guidance */}
          {isNetworkError && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {locale === "en"
                ? "Network issue detected. Please check your internet connection."
                : "Netzwerkproblem erkannt. Bitte überprüfen Sie Ihre Internetverbindung."}
            </div>
          )}

          {isDataError && (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              {locale === "en"
                ? "Data processing issue detected. The server may be experiencing problems."
                : "Datenverarbeitungsproblem erkannt. Der Server könnte Probleme haben."}
            </div>
          )}

          {/* Error details for development */}
          {process.env.NODE_ENV === "development" && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer mb-1">
                Error Details (Development)
              </summary>
              <pre className="whitespace-pre-wrap break-all bg-muted p-2 rounded text-xs">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline" size="sm">
              <RefreshCw className="h-3 w-3 mr-1" />
              {safeTranslateCommon(
                "actions.retry",
                "Erneut versuchen",
                "Try Again"
              )}
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Hook-based wrapper for functional components
 */
interface DashboardSectionErrorBoundaryWrapperProps {
  children: React.ReactNode;
  sectionName: "projects" | "deadlines";
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRetry?: () => void;
}

export const DashboardSectionErrorBoundaryWrapper: React.FC<
  DashboardSectionErrorBoundaryWrapperProps
> = ({ children, sectionName, onError, onRetry }) => {
  return (
    <DashboardSectionErrorBoundary
      sectionName={sectionName}
      onError={onError}
      onRetry={onRetry}
    >
      {children}
    </DashboardSectionErrorBoundary>
  );
};

export default DashboardSectionErrorBoundary;