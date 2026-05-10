/**
 * Dashboard Performance Utilities
 * 
 * Utility functions and constants for optimizing dashboard performance,
 * including caching strategies, memoization helpers, and performance monitoring.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Performance Optimization
 */

import { useCallback, useMemo, useRef } from 'react'

/**
 * Performance configuration constants
 */
export const DASHBOARD_PERFORMANCE_CONFIG = {
    // Cache times in milliseconds
    ROLE_CONTEXT_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
    PROJECTS_CACHE_TIME: 2 * 60 * 1000, // 2 minutes
    DEADLINES_CACHE_TIME: 2 * 60 * 1000, // 2 minutes
    STATISTICS_CACHE_TIME: 2 * 60 * 1000, // 2 minutes

    // Garbage collection times (how long to keep in memory)
    DEFAULT_GC_TIME: 10 * 60 * 1000, // 10 minutes

    // Performance thresholds
    LOADING_TIMEOUT_MS: 2000, // 2 seconds as per requirements
    SKELETON_COUNT: 3, // Number of skeleton items to show

    // Query optimization
    REFETCH_ON_WINDOW_FOCUS: false,
    REFETCH_ON_MOUNT: false,
    REFETCH_ON_RECONNECT: true,

    // Batch sizes
    MAX_PROJECTS_FETCH: 10, // Fetch more than needed for filtering
    MAX_DEADLINES_FETCH: 50, // Fetch more for deadline calculations
} as const

/**
 * Hook for creating stable callback references to prevent unnecessary re-renders
 * 
 * @param callback The callback function to stabilize
 * @param deps Dependency array
 * @returns Stable callback reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList
): T {
    return useCallback(callback, deps)
}

/**
 * Hook for creating stable object references with deep comparison
 * 
 * @param factory Function that creates the object
 * @param deps Dependency array
 * @returns Stable object reference
 */
export function useStableObject<T>(
    factory: () => T,
    deps: React.DependencyList
): T {
    return useMemo(factory, deps)
}

/**
 * Hook for debouncing expensive operations
 * 
 * @param callback The callback to debounce
 * @param delay Delay in milliseconds
 * @param deps Dependency array
 * @returns Debounced callback
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
    deps: React.DependencyList
): T {
    const timeoutRef = useRef<NodeJS.Timeout>()

    return useCallback(
        ((...args: Parameters<T>) => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() => {
                callback(...args)
            }, delay)
        }) as T,
        [callback, delay, ...deps]
    )
}

/**
 * Performance monitoring utilities
 */
export class DashboardPerformanceMonitor {
    private static instance: DashboardPerformanceMonitor
    private metrics: Map<string, number> = new Map()

    static getInstance(): DashboardPerformanceMonitor {
        if (!DashboardPerformanceMonitor.instance) {
            DashboardPerformanceMonitor.instance = new DashboardPerformanceMonitor()
        }
        return DashboardPerformanceMonitor.instance
    }

    /**
     * Start timing an operation
     */
    startTiming(operation: string): void {
        this.metrics.set(`${operation}_start`, performance.now())
    }

    /**
     * End timing an operation and log if it exceeds threshold
     */
    endTiming(operation: string, threshold: number = DASHBOARD_PERFORMANCE_CONFIG.LOADING_TIMEOUT_MS): void {
        const startTime = this.metrics.get(`${operation}_start`)
        if (startTime) {
            const duration = performance.now() - startTime
            this.metrics.set(`${operation}_duration`, duration)

            if (duration > threshold) {
                console.warn(`Dashboard operation '${operation}' took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`)
            }

            // Clean up start time
            this.metrics.delete(`${operation}_start`)
        }
    }

    /**
     * Get timing for an operation
     */
    getTiming(operation: string): number | undefined {
        return this.metrics.get(`${operation}_duration`)
    }

    /**
     * Clear all metrics
     */
    clear(): void {
        this.metrics.clear()
    }
}

/**
 * Hook for monitoring component render performance
 */
export function useRenderPerformance(componentName: string) {
    const renderCount = useRef(0)
    const lastRenderTime = useRef(performance.now())

    renderCount.current++
    const currentTime = performance.now()
    const timeSinceLastRender = currentTime - lastRenderTime.current
    lastRenderTime.current = currentTime

    // Log excessive re-renders
    if (renderCount.current > 10 && timeSinceLastRender < 100) {
        console.warn(`${componentName} is re-rendering frequently (${renderCount.current} renders, ${timeSinceLastRender.toFixed(2)}ms since last)`)
    }

    return {
        renderCount: renderCount.current,
        timeSinceLastRender
    }
}

/**
 * Utility for creating optimized query keys
 */
export function createOptimizedQueryKey(
    baseKey: string[],
    params: Record<string, any>
): string[] {
    // Sort params to ensure consistent key ordering
    const sortedParams = Object.keys(params)
        .sort()
        .reduce((acc, key) => {
            acc[key] = params[key]
            return acc
        }, {} as Record<string, any>)

    return [...baseKey, sortedParams]
}

/**
 * Utility for batch invalidating related queries
 */
export function createBatchInvalidator(queryClient: any) {
    return async (queryPatterns: string[][]) => {
        const invalidationPromises = queryPatterns.map(pattern =>
            queryClient.invalidateQueries({
                queryKey: pattern,
                exact: false
            })
        )

        await Promise.all(invalidationPromises)
    }
}

/**
 * Memory usage monitoring (development only)
 */
export function logMemoryUsage(context: string) {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
        const memInfo = (performance as any).memory
        console.log(`Memory usage (${context}):`, {
            used: `${(memInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            total: `${(memInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
        })
    }
}

/**
 * Utility for creating stable array references
 */
export function useStableArray<T>(array: T[], compareFn?: (a: T, b: T) => boolean): T[] {
    return useMemo(() => {
        return array
    }, [
        array.length,
        ...array.map((item, index) =>
            compareFn ? `${index}-${JSON.stringify(item)}` : item
        )
    ])
}

/**
 * Hook for optimizing expensive calculations
 */
export function useExpensiveCalculation<T>(
    calculation: () => T,
    deps: React.DependencyList,
    debugName?: string
): T {
    return useMemo(() => {
        const monitor = DashboardPerformanceMonitor.getInstance()
        const operationName = debugName || 'expensive-calculation'

        monitor.startTiming(operationName)
        const result = calculation()
        monitor.endTiming(operationName, 100) // 100ms threshold for calculations

        return result
    }, deps)
}