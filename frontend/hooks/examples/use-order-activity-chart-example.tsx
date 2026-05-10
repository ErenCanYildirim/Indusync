/**
 * Order Activity Chart Hook Usage Examples
 *
 * This file demonstrates various ways to use the useOrderActivityChart hook
 * in different scenarios and components.
 *
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import React from "react";
import {
  useOrderActivityChart,
  useSimpleOrderActivityChart,
  useOrderActivityChartWithSkeleton,
  useManualOrderActivityChart,
} from "../use-order-activity-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertCircle } from "lucide-react";

/**
 * Example 1: Basic usage with default configuration
 *
 * This is the most common usage pattern for dashboard charts.
 * Provides automatic refresh, error handling, and loading states.
 */
export function BasicOrderActivityChartExample() {
  const { activityChart, isLoading, error, refresh, days, setDays } =
    useOrderActivityChart();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2 p-4 border border-red-200 rounded-md bg-red-50">
        <AlertCircle className="h-5 w-5 text-red-500" />
        <span className="text-red-700">{error}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          className="ml-auto"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aktivitätsdiagramm</h3>
        <div className="flex items-center space-x-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-1 border rounded-md"
          >
            <option value={7}>7 Tage</option>
            <option value={30}>30 Tage</option>
            <option value={90}>90 Tage</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refresh()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Your chart component would go here */}
      <div className="h-64 border rounded-md p-4">
        <p className="text-sm text-gray-500 mb-2">
          Daten für die letzten {days} Tage ({activityChart?.length || 0}{" "}
          Datenpunkte)
        </p>
        {/* Chart implementation */}
      </div>
    </div>
  );
}

/**
 * Example 2: Simplified usage for basic components
 *
 * Perfect for components that don't need advanced configuration
 * but still want real data and error handling.
 */
export function SimpleOrderActivityChartExample() {
  const { activityChart, isLoading, error, refresh, hasData, hasError } =
    useSimpleOrderActivityChart(30);

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (hasError) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline">
          Erneut laden
        </Button>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>Keine Aktivitätsdaten verfügbar</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Einfaches Aktivitätsdiagramm</h3>
      <div className="h-64 border rounded-md p-4">
        {/* Simple chart implementation */}
        <p className="text-sm text-gray-500">
          {activityChart?.length} Datenpunkte geladen
        </p>
      </div>
    </div>
  );
}

/**
 * Example 3: Skeleton UI support for better UX
 *
 * Provides granular loading states for skeleton UI components
 * and better user experience during data loading.
 */
export function SkeletonOrderActivityChartExample() {
  const {
    activityChart,
    error,
    refresh,
    showSkeleton,
    showRefreshIndicator,
    isEmpty,
    hasPartialData,
  } = useOrderActivityChartWithSkeleton(30);

  if (showSkeleton) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="flex space-x-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => refresh()} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Erneut versuchen
        </Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center p-8">
        <div className="h-64 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center">
          <div className="text-gray-500">
            <p className="text-lg mb-2">Keine Aktivitätsdaten</p>
            <p className="text-sm">
              Es sind noch keine Daten für den ausgewählten Zeitraum verfügbar.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Aktivitätsdiagramm mit Skeleton UI
          {showRefreshIndicator && (
            <RefreshCw className="inline h-4 w-4 ml-2 animate-spin" />
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={showRefreshIndicator}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="h-64 border rounded-md p-4">
        {hasPartialData && (
          <p className="text-sm text-gray-500 mb-2">
            {activityChart?.length} Datenpunkte geladen
          </p>
        )}
        {/* Chart with data */}
      </div>
    </div>
  );
}

/**
 * Example 4: Manual refresh control
 *
 * For components that need full control over when data is fetched
 * and refreshed, without automatic background updates.
 */
export function ManualOrderActivityChartExample() {
  const {
    activityChart,
    isLoading,
    error,
    refresh,
    lastUpdated,
    days,
    setDays,
  } = useManualOrderActivityChart(7);

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.error("Failed to refresh chart data:", error);
    }
  };

  const handleDaysChange = (newDays: number) => {
    setDays(newDays);
    // Data will automatically refresh when days changes
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Manuelles Aktivitätsdiagramm</h3>
        <div className="flex items-center space-x-2">
          <select
            value={days}
            onChange={(e) => handleDaysChange(Number(e.target.value))}
            className="px-3 py-1 border rounded-md"
            disabled={isLoading}
          >
            <option value={7}>7 Tage</option>
            <option value={14}>14 Tage</option>
            <option value={30}>30 Tage</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isLoading ? "Lädt..." : "Aktualisieren"}
          </Button>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500">
          Zuletzt aktualisiert: {lastUpdated.toLocaleString("de-DE")}
        </p>
      )}

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="h-64 border rounded-md p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : activityChart && activityChart.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              {activityChart.length} Datenpunkte für die letzten {days} Tage
            </p>
            {/* Chart implementation */}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Keine Daten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 5: Custom configuration with error handling
 *
 * Shows how to use advanced configuration options for specific
 * use cases like custom refresh intervals and error handling.
 */
export function CustomConfigOrderActivityChartExample() {
  const { activityChart, isLoading, error, refresh, isStale, lastUpdated } =
    useOrderActivityChart({
      initialDays: 14,
      enableAutoRefresh: true,
      refreshIntervalMs: 2 * 60 * 1000, // 2 minutes
      staleTimeMs: 1 * 60 * 1000, // 1 minute
      showErrorToasts: false, // Handle errors manually
      showSuccessToasts: true,
      onError: (error) => {
        console.error("Chart data error:", error);
        // Custom error handling logic
      },
      onSuccess: (data) => {
        console.log("Chart data loaded:", data.length, "items");
        // Custom success handling logic
      },
    });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            Benutzerdefinierte Konfiguration
          </h3>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>Auto-Refresh: 2min</span>
            <span>Stale Time: 1min</span>
            {isStale && <span className="text-orange-500">Daten veraltet</span>}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-500">
          Zuletzt aktualisiert: {lastUpdated.toLocaleString("de-DE")}
        </p>
      )}

      {error && (
        <div className="p-4 border border-red-200 rounded-md bg-red-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-red-700 font-medium">
                Fehler beim Laden der Daten
              </p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="h-64 border rounded-md p-4">
        {isLoading && !activityChart ? (
          <Skeleton className="h-full w-full" />
        ) : activityChart && activityChart.length > 0 ? (
          <div>
            <p className="text-sm text-gray-500 mb-2">
              {activityChart.length} Datenpunkte geladen
              {isLoading && (
                <span className="ml-2 text-blue-500">(Aktualisiert...)</span>
              )}
            </p>
            {/* Chart implementation */}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Keine Daten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example 6: Integration with existing chart component
 *
 * Shows how to integrate the hook with the existing DashboardChart component
 * or similar chart components.
 */
export function IntegratedChartExample() {
  const { activityChart, isLoading, error } = useOrderActivityChart({
    initialDays: 30,
    enableAutoRefresh: true,
    showErrorToasts: true,
  });

  // Transform data to match existing chart component expectations
  const chartData =
    activityChart?.map((item) => ({
      name: item.dateDisplay, // Chart expects 'name' field
      auftraege: item.auftraege,
      anfragen: item.anfragen,
    })) || [];

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-md">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-red-50 rounded-md border border-red-200">
        <p className="text-sm text-red-600">
          Fehler beim Laden der Diagrammdaten: {error}
        </p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center bg-gray-50 rounded-md">
        <p className="text-sm text-muted-foreground">Keine Daten verfügbar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Integriertes Diagramm</h3>
      {/* Use your existing chart component here */}
      <div className="h-[300px] w-full border rounded-md p-4">
        <p className="text-sm text-gray-500 mb-4">
          Diagramm mit {chartData.length} Datenpunkten
        </p>
        {/* Your chart component would render here with chartData */}
      </div>
    </div>
  );
}