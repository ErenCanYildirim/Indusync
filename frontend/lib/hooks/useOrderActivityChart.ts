/**
 * Order Activity Chart Hook
 * 
 * React hook for fetching and managing order activity chart data with configurable
 * days parameter, loading states, error handling, retry mechanisms, and caching.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { dashboardApi, dashboardQueryKeys, DashboardApiError } from '@/lib/api/dashboard'
import type { OrderActivityData, UseOrderActivityChartReturn } from '@/lib/types/dashboard'
import { DASHBOARD_DEFAULTS, DASHBOARD_ERROR_MESSAGES } from '@/lib/types/dashboard'
import { toast } from 'sonner'

/**
 * Configuration options for the order activity chart hook
 */
interface UseOrderActivityChartOptions {
    /**
     * Initial number of days for chart data
     * @default 30
     */
    initialDays?: number

    /**
     * Enable automatic data refresh at regular intervals
     * @default true
     */
    enableAutoRefresh?: boolean

    /**
     * Refresh interval in milliseconds
     * @default 300000 (5 minutes)
     */
    refreshIntervalMs?: number

    /**
     * Time in milliseconds after which data is considered stale
     * @default 120000 (2 minutes)
     */
    staleTimeMs?: number

    /**
     * Time in milliseconds to keep data in cache
     * @default 600000 (10 minutes)
     */
    cacheTimeMs?: number

    /**
     * Show toast notifications for errors
     * @default true
     */
    showErrorToasts?: boolean

    /**
     * Show toast notifications for successful refreshes
     * @default false
     */
    showSuccessToasts?: boolean

    /**
     * Custom error handler function
     */
    onError?: (error: DashboardApiError) => void

    /**
     * Custom success handler function
     */
    onSuccess?: (data: OrderActivityData[]) => void

    /**
     * Enable the query (useful for conditional fetching)
     * @default true
     */
    enabled?: boolean

    /**
     * Enable retry mechanisms for failed requests
     * @default true
     */
    enableRetry?: boolean

    /**
     * Maximum number of retry attempts
     * @default 3
     */
    maxRetries?: number
}

/**
 * Hook for fetching and managing order activity chart data
 * 
 * Provides real-time order activity chart data with configurable days parameter,
 * automatic refresh, comprehensive error handling, retry mechanisms, and loading states.
 * Integrates with TanStack Query for efficient caching and background updates.
 * 
 * @param options Configuration options for the hook
 * @returns Order activity chart data and control functions
 */
export const useOrderActivityChart = (
    options: UseOrderActivityChartOptions = {}
): UseOrderActivityChartReturn => {
    const {
        initialDays = DASHBOARD_DEFAULTS.ACTIVITY_CHART_DAYS,
        enableAutoRefresh = true,
        refreshIntervalMs = DASHBOARD_DEFAULTS.REFRESH_INTERVAL_MS,
        staleTimeMs = DASHBOARD_DEFAULTS.STALE_TIME_MS,
        cacheTimeMs = DASHBOARD_DEFAULTS.CACHE_TIME_MS,
        showErrorToasts = true,
        showSuccessToasts = false,
        onError,
        onSuccess,
        enabled = true,
        enableRetry = true,
        maxRetries = 3
    } = options


    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastSuccessRef = useRef<Date | null>(null)
    const [days, setDays] = useState(initialDays)

    // Validate days parameter
    const validatedDays = Math.max(
        DASHBOARD_DEFAULTS.MIN_ACTIVITY_DAYS,
        Math.min(days, DASHBOARD_DEFAULTS.MAX_ACTIVITY_DAYS)
    )

    // Handle error toast notifications
    const handleErrorToast = useCallback((error: DashboardApiError) => {
        let message: string = DASHBOARD_ERROR_MESSAGES.GENERIC_ERROR

        if (error.statusCode) {
            switch (error.statusCode) {
                case 400:
                    message = 'Ungültige Parameter für Aktivitätsdiagramm'
                    break
                case 401:
                    message = DASHBOARD_ERROR_MESSAGES.AUTH_ERROR
                    break
                case 403:
                    message = DASHBOARD_ERROR_MESSAGES.PERMISSION_ERROR
                    break
                case 500:
                    message = DASHBOARD_ERROR_MESSAGES.SERVER_ERROR
                    break
                default:
                    message = error.message || DASHBOARD_ERROR_MESSAGES.GENERIC_ERROR
            }
        } else if (error.message.includes('Network')) {
            message = DASHBOARD_ERROR_MESSAGES.NETWORK_ERROR
        } else if (error.message.includes('timeout')) {
            message = DASHBOARD_ERROR_MESSAGES.TIMEOUT_ERROR
        } else {
            message = error.message
        }

        toast.error(`Aktivitätsdiagramm: ${message}`)
    }, [])

    // Main query for order activity chart data
    const {
        data: activityChart,
        isLoading,
        error,
        refetch,
        dataUpdatedAt,
        isRefetching
    } = useQuery({
        queryKey: dashboardQueryKeys.activityChart(validatedDays),
        queryFn: async () => {
            console.log('useOrderActivityChart - Making API call with days:', validatedDays);
            const result = await dashboardApi.getOrderActivityChart(validatedDays);
            console.log('useOrderActivityChart - API Response:', {
                resultType: typeof result,
                resultLength: result?.length,
                sampleData: result?.slice(0, 3)
            });
            return result;
        },
        enabled,
        staleTime: staleTimeMs,
        gcTime: cacheTimeMs,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: enableRetry ? (failureCount, error) => {
            // Don't retry on authentication or permission errors
            if (error instanceof DashboardApiError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    return false
                }
                // Don't retry on validation errors (400)
                if (error.statusCode === 400) {
                    return false
                }
            }
            // Retry up to maxRetries times for other errors
            return failureCount < maxRetries
        } : false,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    })

    // Debug the query result
    console.log('useOrderActivityChart - Query Result:', {
        activityChart,
        activityChartType: typeof activityChart,
        activityChartLength: activityChart?.length,
        isLoading,
        error,
        enabled,
        validatedDays
    });

    // Handle success callback
    useEffect(() => {
        if (activityChart && !isLoading && !error) {
            lastSuccessRef.current = new Date()

            if (showSuccessToasts) {
                toast.success('Aktivitätsdiagramm aktualisiert')
            }

            onSuccess?.(activityChart)
        }
    }, [activityChart, isLoading, error, showSuccessToasts, onSuccess])

    // Handle error callback
    useEffect(() => {
        if (error) {
            const dashboardError = error instanceof DashboardApiError
                ? error
                : new DashboardApiError(error?.message || DASHBOARD_ERROR_MESSAGES.GENERIC_ERROR)

            if (showErrorToasts) {
                handleErrorToast(dashboardError)
            }

            onError?.(dashboardError)
        }
    }, [error, showErrorToasts, onError, handleErrorToast])

    // Manual refresh function with optional days parameter
    const refresh = useCallback(async (newDays?: number): Promise<void> => {
        try {
            if (newDays !== undefined && newDays !== days) {
                setDays(newDays)
                // The query will automatically refetch when days changes due to query key change
                return
            }
            await refetch()
        } catch (error) {
            // Error is already handled by the query's onError callback
            throw error
        }
    }, [refetch, days])

    // Update days parameter with validation
    const updateDays = useCallback((newDays: number) => {
        const validatedNewDays = Math.max(
            DASHBOARD_DEFAULTS.MIN_ACTIVITY_DAYS,
            Math.min(newDays, DASHBOARD_DEFAULTS.MAX_ACTIVITY_DAYS)
        )

        if (validatedNewDays !== days) {
            setDays(validatedNewDays)
        }
    }, [days])

    // Setup automatic refresh interval
    useEffect(() => {
        if (!enableAutoRefresh || !enabled) {
            return
        }

        // Clear any existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current)
        }

        // Set up new interval
        intervalRef.current = setInterval(() => {
            // Only refresh if data exists and is not currently loading
            if (activityChart && !isLoading && !isRefetching) {
                refetch()
            }
        }, refreshIntervalMs)

        // Cleanup function
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [enableAutoRefresh, enabled, refreshIntervalMs, activityChart, isLoading, isRefetching, refetch])

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
            }
        }
    }, [])

    // Calculate if data is stale based on last update time
    const isDataStale = useCallback(() => {
        if (!dataUpdatedAt) return true
        const now = Date.now()
        const lastUpdate = dataUpdatedAt
        return (now - lastUpdate) > staleTimeMs
    }, [dataUpdatedAt, staleTimeMs])

    // Get user-friendly error message
    const getErrorMessage = useCallback((): string | null => {
        if (!error) return null

        if (error instanceof DashboardApiError) {
            return error.message
        }

        // Handle generic errors
        const errorMessage = error?.message || ''

        if (errorMessage.includes('Network')) {
            return DASHBOARD_ERROR_MESSAGES.NETWORK_ERROR
        }

        if (errorMessage.includes('timeout')) {
            return DASHBOARD_ERROR_MESSAGES.TIMEOUT_ERROR
        }

        return DASHBOARD_ERROR_MESSAGES.GENERIC_ERROR
    }, [error])

    // Get last updated timestamp
    const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null

    // Transform data for chart component compatibility
    const transformedData = activityChart?.map((item: OrderActivityData) => ({
        ...item,
        // Ensure compatibility with existing chart component
        name: item.dateDisplay, // Chart component expects 'name' field
        date: item.date,
        dateDisplay: item.dateDisplay,
        auftraege: item.auftraege,
        anfragen: item.anfragen
    })) || null

    return {
        // Data
        activityChart: transformedData,

        // Loading states
        isLoading: isLoading || isRefetching,

        // Error states
        error: getErrorMessage(),

        // Actions
        refresh,

        // Metadata
        lastUpdated,
        isStale: isDataStale(),

        // Days management
        days: validatedDays,
        setDays: updateDays
    }
}

/**
 * Hook for order activity chart with simplified interface
 * 
 * Provides a simpler interface for basic order activity chart usage
 * without advanced configuration options.
 * 
 * @param days Number of days for chart data (default: 30)
 * @returns Simplified order activity chart interface
 */
export const useSimpleOrderActivityChart = (days: number = DASHBOARD_DEFAULTS.ACTIVITY_CHART_DAYS) => {
    const {
        activityChart,
        isLoading,
        error,
        refresh
    } = useOrderActivityChart({
        initialDays: days,
        enableAutoRefresh: true,
        showErrorToasts: true,
        showSuccessToasts: false
    })

    return {
        activityChart,
        isLoading,
        error,
        refresh: () => refresh(),
        hasData: !!activityChart && activityChart.length > 0,
        hasError: !!error
    }
}

/**
 * Hook for order activity chart with custom refresh interval
 * 
 * @param days Number of days for chart data
 * @param refreshIntervalMs Custom refresh interval in milliseconds
 * @returns Order activity chart with custom refresh timing
 */
export const useOrderActivityChartWithInterval = (
    days: number = DASHBOARD_DEFAULTS.ACTIVITY_CHART_DAYS,
    refreshIntervalMs: number
) => {
    return useOrderActivityChart({
        initialDays: days,
        enableAutoRefresh: true,
        refreshIntervalMs,
        showErrorToasts: true
    })
}

/**
 * Hook for order activity chart without auto-refresh
 * 
 * Useful for components that need manual control over data fetching
 * 
 * @param days Number of days for chart data
 * @returns Order activity chart without automatic refresh
 */
export const useManualOrderActivityChart = (days: number = DASHBOARD_DEFAULTS.ACTIVITY_CHART_DAYS) => {
    return useOrderActivityChart({
        initialDays: days,
        enableAutoRefresh: false,
        showErrorToasts: true,
        showSuccessToasts: true
    })
}

/**
 * Hook for order activity chart with skeleton UI support
 * 
 * Provides additional loading states specifically designed for skeleton UI components
 * 
 * @param days Number of days for chart data
 * @returns Order activity chart with skeleton-friendly loading states
 */
export const useOrderActivityChartWithSkeleton = (days: number = DASHBOARD_DEFAULTS.ACTIVITY_CHART_DAYS) => {
    const result = useOrderActivityChart({
        initialDays: days,
        enableAutoRefresh: true,
        showErrorToasts: true
    })

    return {
        ...result,
        // Additional skeleton-specific states
        showSkeleton: result.isLoading && !result.activityChart,
        showRefreshIndicator: result.isLoading && !!result.activityChart,
        isEmpty: !result.isLoading && (!result.activityChart || result.activityChart.length === 0),
        hasPartialData: !!result.activityChart && result.activityChart.length > 0
    }
}

export default useOrderActivityChart