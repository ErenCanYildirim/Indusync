import { useOrderActivityChart } from '@/lib/hooks/useOrderActivityChart';

export interface ChartDataItem {
  name: string;
  auftraege: number;
  anfragen: number;
}

export interface UseChartDataReturn {
  data: ChartDataItem[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isEmpty: boolean;
}

/**
 * Hook for dashboard chart data - bridges the gap between the new real API hook
 * and the existing chart component interface
 */
export function useChartData(): UseChartDataReturn {
  const {
    activityChart,
    isLoading,
    error,
    refresh
  } = useOrderActivityChart({
    initialDays: 30,
    enableAutoRefresh: true,
    showErrorToasts: false, // Let the chart component handle error display
    showSuccessToasts: false
  });

  // Debug the raw data from the hook
  console.log('useChartData - Raw Hook Data:', {
    activityChart,
    activityChartLength: activityChart?.length,
    isLoading,
    error,
    activityChartType: typeof activityChart
  });

  // Transform data to match the expected interface
  const transformedData: ChartDataItem[] = activityChart?.map(item => ({
    name: item.dateDisplay,
    auftraege: item.auftraege,
    anfragen: item.anfragen
  })) || [];

  // Debug logging to help troubleshoot
  console.log('useChartData - Transformed Data:', {
    totalItems: transformedData.length,
    sampleData: transformedData.slice(0, 5),
    hasActivity: transformedData.some(item => item.auftraege > 0 || item.anfragen > 0),
    isLoading,
    error,
    isEmpty: !isLoading && transformedData.length === 0
  });

  // Convert error string to Error object for compatibility
  const errorObject = error ? new Error(error) : null;

  // Only consider it empty if there's no data at all, not if there's just zero activity
  const isEmpty = !isLoading && transformedData.length === 0;

  return {
    data: transformedData,
    loading: isLoading,
    error: errorObject,
    refresh,
    isEmpty
  };
}