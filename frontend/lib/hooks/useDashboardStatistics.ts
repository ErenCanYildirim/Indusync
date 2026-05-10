/**
 * Dashboard Statistics Hook
 * 
 * React hook for fetching and managing dashboard statistics with automatic refresh,
 * loading states, error handling, and user-friendly error messages.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Statistics Implementation
 */

import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef } from 'react'
import { dashboardApi, dashboardQueryKeys, DashboardApiError } from '@/lib/api/dashboard'
import type { DashboardStatistics, UseDashboardStatisticsReturn } from '@/lib/types/dashboard'
import { DASHBOARD_DEFAULTS, DASHBOARD_ERROR_MESSAGES } from '@/lib/types/dashboard'
import { toast } from 'sonner'

/**
 * Configuration options for the dashboard statistics hook
 */
interface UseDashboardStatisticsOptions {
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
    onSuccess?: (data: DashboardStatistics) => void

    /**
     * Enable the query (useful for conditional fetching)
     * @default true
     */
    enabled?: boolean
}

/**
 * Hook for fetching and managing dashboard statistics
 * 
 * Provides real-time dashboard statistics with automatic refresh, comprehensive
 * error handling, and loading states. Integrates with TanStack Query for
 * efficient caching and background updates.
 * 
 * @param options Configuration options for the hook
 * @returns Dashboard statistics data and control functions
 */
export const useDashboardStatistics = (
    options: UseDashboardStatisticsOptions = {}
): UseDashboardStatisticsReturn => {
    const {
        enableAutoRefresh = true,
        refreshIntervalMs = DASHBOARD_DEFAULTS.REFRESH_INTERVAL_MS,
        staleTimeMs = DASHBOARD_DEFAULTS.STALE_TIME_MS,
        cacheTimeMs = DASHBOARD_DEFAULTS.CACHE_TIME_MS,
        showErrorToasts = true,
        showSuccessToasts = false,
        onError,
        onSuccess,
        enabled = true
    } = options

    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const lastSuccessRef = useRef<Date | null>(null)

    // Handle error toast notifications
    const handleErrorToast = useCallback((error: DashboardApiError) => {
        let message: string = DASHBOARD_ERROR_MESSAGES.GENERIC_ERROR

        if (error.statusCode) {
            switch (error.statusCode) {
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

        toast.error(message)
    }, [])

    // Main query for dashboard statistics
    const {
        data: statistics,
        isLoading,
        error,
        refetch,
        dataUpdatedAt,
        isRefetching
    } = useQuery({
        queryKey: dashboardQueryKeys.statistics(),
        queryFn: dashboardApi.getDashboardStatistics,
        enabled,
        staleTime: staleTimeMs,
        gcTime: cacheTimeMs,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        retry: (failureCount, error) => {
            // Don't retry on authentication or permission errors
            if (error instanceof DashboardApiError) {
                if (error.statusCode === 401 || error.statusCode === 403) {
                    return false
                }
            }
            // Retry up to 3 times for other errors
            return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    })

    // Handle success callback
    useEffect(() => {
        if (statistics && !isLoading && !error) {
            lastSuccessRef.current = new Date()

            if (showSuccessToasts) {
                toast.success('Dashboard-Statistiken aktualisiert')
            }

            onSuccess?.(statistics)
        }
    }, [statistics, isLoading, error, showSuccessToasts, onSuccess])

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



    // Manual refresh function
    const refresh = useCallback(async (): Promise<void> => {
        try {
            await refetch()
        } catch (error) {
            // Error is already handled by the query's onError callback
            throw error
        }
    }, [refetch])

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
            if (statistics && !isLoading && !isRefetching) {
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
    }, [enableAutoRefresh, enabled, refreshIntervalMs, statistics, isLoading, isRefetching, refetch])

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

    return {
        // Data
        statistics: statistics || null,

        // Loading states
        isLoading: isLoading || isRefetching,

        // Error states
        error: getErrorMessage(),

        // Actions
        refresh,

        // Metadata
        lastUpdated,
        isStale: isDataStale()
    }
}

/**
 * Hook for dashboard statistics with simplified interface
 * 
 * Provides a simpler interface for basic dashboard statistics usage
 * without advanced configuration options.
 * 
 * @returns Simplified dashboard statistics interface
 */
export const useSimpleDashboardStatistics = () => {
    const {
        statistics,
        isLoading,
        error,
        refresh
    } = useDashboardStatistics({
        enableAutoRefresh: true,
        showErrorToasts: true,
        showSuccessToasts: false
    })

    return {
        statistics,
        isLoading,
        error,
        refresh,
        hasData: !!statistics,
        hasError: !!error
    }
}

/**
 * Hook for dashboard statistics with custom refresh interval
 * 
 * @param refreshIntervalMs Custom refresh interval in milliseconds
 * @returns Dashboard statistics with custom refresh timing
 */
export const useDashboardStatisticsWithInterval = (refreshIntervalMs: number) => {
    return useDashboardStatistics({
        enableAutoRefresh: true,
        refreshIntervalMs,
        showErrorToasts: true
    })
}

/**
 * Hook for dashboard statistics without auto-refresh
 * 
 * Useful for components that need manual control over data fetching
 * 
 * @returns Dashboard statistics without automatic refresh
 */
export const useManualDashboardStatistics = () => {
    return useDashboardStatistics({
        enableAutoRefresh: false,
        showErrorToasts: true,
        showSuccessToasts: true
    })
}

export default useDashboardStatistics