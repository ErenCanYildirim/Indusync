/**
 * Dashboard Deadlines Hook
 * 
 * React hook for fetching and managing dashboard deadlines with deadline calculation,
 * urgency classification, and role-based filtering for upcoming deadlines.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { ordersApi, orderQueryKeys, handleOrderApiError } from '@/lib/api/orders'
import { dashboardApi } from '@/lib/api/dashboard'
import type {
    DashboardDeadline,
    UseDashboardDeadlinesReturn,
    OrderStatus
} from '@/lib/types/dashboard'
import { calculateUrgencyLevel, formatTimeRemaining } from '@/lib/types/dashboard'
import type { OrderListResponse, OrderDetailResponse } from '@/lib/api/types'
import { toast } from 'sonner'

/**
 * Configuration options for the dashboard deadlines hook
 */
interface UseDashboardDeadlinesOptions {
    /**
     * Enable the query (useful for conditional fetching)
     * @default true
     */
    enabled?: boolean

    /**
     * Time in milliseconds after which data is considered stale
     * @default 120000 (2 minutes)
     */
    staleTimeMs?: number

    /**
     * Show toast notifications for errors
     * @default false (dashboard errors should be handled gracefully)
     */
    showErrorToasts?: boolean

    /**
     * Maximum number of deadlines to return
     * @default 5
     */
    maxDeadlines?: number

    /**
     * Number of days to look ahead for deadlines
     * @default 30
     */
    lookAheadDays?: number
}

/**
 * Hook for fetching and managing dashboard deadlines
 * 
 * Calculates deadlines from order completion dates, milestones, and application responses.
 * Filters deadlines to next 30 days and sorts by urgency. Provides role-aware deadline
 * information with proper action text generation.
 * 
 * @param options Configuration options for the hook
 * @returns Dashboard deadlines data and control functions
 */
export const useDashboardDeadlines = (
    options: UseDashboardDeadlinesOptions = {}
): UseDashboardDeadlinesReturn => {
    const {
        enabled = true,
        staleTimeMs = 2 * 60 * 1000, // 2 minutes
        showErrorToasts = false,
        maxDeadlines = 5,
        lookAheadDays = 30
    } = options

    const queryClient = useQueryClient()

    // First, get the company's role context to determine filtering logic
    // Use longer cache time for role context as it rarely changes
    const {
        data: dashboardStats,
        isLoading: isLoadingStats
    } = useQuery({
        queryKey: ['dashboard', 'statistics'],
        queryFn: dashboardApi.getDashboardStatistics,
        enabled,
        staleTime: 5 * 60 * 1000, // 5 minutes for role context
        gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
        retry: 1 // Minimal retry for role context
    })

    // Determine company roles from dashboard statistics
    const companyRoles = useMemo(() => {
        if (!dashboardStats || !('companyRoles' in dashboardStats)) return []
        return (dashboardStats as any).companyRoles || []
    }, [dashboardStats])

    const isClient = companyRoles.includes('CLIENT')
    const isProvider = companyRoles.includes('PROVIDER')

    // Fetch client orders (orders created by the company)
    const {
        data: clientOrders,
        isLoading: isLoadingClientOrders,
        error: clientOrdersError
    } = useQuery({
        queryKey: ['dashboard', 'deadlines', 'client', maxDeadlines, lookAheadDays],
        queryFn: () => ordersApi.getMyOrders('client', { size: 50 }), // Fetch more to account for filtering
        enabled: enabled && isClient,
        staleTime: staleTimeMs,
        gcTime: staleTimeMs * 2, // Keep in cache longer
        retry: 2,
        // Optimize network requests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true
    })

    // Fetch provider orders (orders assigned to the company)
    const {
        data: providerOrders,
        isLoading: isLoadingProviderOrders,
        error: providerOrdersError
    } = useQuery({
        queryKey: ['dashboard', 'deadlines', 'provider', maxDeadlines, lookAheadDays],
        queryFn: () => ordersApi.getMyOrders('provider', { size: 50 }), // Fetch more to account for filtering
        enabled: enabled && isProvider,
        staleTime: staleTimeMs,
        gcTime: staleTimeMs * 2, // Keep in cache longer
        retry: 2,
        // Optimize network requests
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchOnReconnect: true
    })

    // Calculate deadline cutoff date
    const deadlineCutoff = useMemo(() => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() + lookAheadDays)
        return cutoff
    }, [lookAheadDays])

    // Transform orders to deadlines
    const deadlines = useMemo(() => {
        const allDeadlines: DashboardDeadline[] = []
        const now = new Date()

        // Process client orders (orders created by the company)
        if (isClient && clientOrders?.content) {
            clientOrders.content.forEach((order: OrderListResponse) => {
                // Only process orders that are active and have deadlines
                if (!['PUBLISHED', 'MATCHED', 'ASSIGNED'].includes(order.status)) {
                    return
                }

                // Order completion deadline
                if (order.deadline) {
                    const deadlineDate = new Date(order.deadline)
                    if (deadlineDate > now && deadlineDate <= deadlineCutoff) {
                        const urgencyLevel = calculateUrgencyLevel(deadlineDate)
                        const timeRemaining = formatTimeRemaining(deadlineDate)

                        let actionRequired = 'Auftrag abschließen'
                        if (order.status === 'PUBLISHED') {
                            actionRequired = 'Dienstleister auswählen'
                        } else if (order.status === 'MATCHED') {
                            actionRequired = 'Auftrag bestätigen'
                        }

                        allDeadlines.push({
                            id: `${order.id}-completion`,
                            orderId: order.id,
                            orderTitle: order.title,
                            deadlineDate,
                            deadlineType: 'completion',
                            urgencyLevel,
                            actionRequired,
                            timeRemaining
                        })
                    }
                }

                // Application response deadline (for published orders)
                if (order.status === 'PUBLISHED' && order.publishedAt) {
                    const publishedDate = new Date(order.publishedAt)
                    // Assume 7 days response time for applications
                    const responseDeadline = new Date(publishedDate)
                    responseDeadline.setDate(responseDeadline.getDate() + 7)

                    if (responseDeadline > now && responseDeadline <= deadlineCutoff) {
                        const urgencyLevel = calculateUrgencyLevel(responseDeadline)
                        const timeRemaining = formatTimeRemaining(responseDeadline)

                        allDeadlines.push({
                            id: `${order.id}-application-response`,
                            orderId: order.id,
                            orderTitle: order.title,
                            deadlineDate: responseDeadline,
                            deadlineType: 'application_response',
                            urgencyLevel,
                            actionRequired: 'Bewerbungen prüfen',
                            timeRemaining
                        })
                    }
                }
            })
        }

        // Process provider orders (orders assigned to the company)
        if (isProvider && providerOrders?.content) {
            providerOrders.content.forEach((order: OrderListResponse) => {
                // Only process orders that are assigned to this company
                if (order.status !== 'ASSIGNED') {
                    return
                }

                // Order completion deadline
                if (order.deadline) {
                    const deadlineDate = new Date(order.deadline)
                    if (deadlineDate > now && deadlineDate <= deadlineCutoff) {
                        const urgencyLevel = calculateUrgencyLevel(deadlineDate)
                        const timeRemaining = formatTimeRemaining(deadlineDate)

                        allDeadlines.push({
                            id: `${order.id}-provider-completion`,
                            orderId: order.id,
                            orderTitle: order.title,
                            deadlineDate,
                            deadlineType: 'completion',
                            urgencyLevel,
                            actionRequired: 'Auftrag fertigstellen',
                            timeRemaining
                        })
                    }
                }

                // Milestone deadlines (if any - this would require additional API calls to get order details)
                // For now, we'll skip milestone deadlines as they require individual order detail fetches
                // which could be expensive. This can be implemented later if needed.
            })
        }

        // Remove duplicates (in case of dual role companies with same orders)
        const uniqueDeadlines = allDeadlines.reduce((acc, deadline) => {
            const existingIndex = acc.findIndex(d => d.id === deadline.id)
            if (existingIndex === -1) {
                acc.push(deadline)
            }
            return acc
        }, [] as DashboardDeadline[])

        // Sort by urgency and deadline date, then limit to maxDeadlines
        return uniqueDeadlines
            .sort((a, b) => {
                // First sort by urgency level (critical > high > medium > low)
                const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                const urgencyDiff = urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel]
                if (urgencyDiff !== 0) return urgencyDiff

                // Then sort by deadline date (sooner first)
                return a.deadlineDate.getTime() - b.deadlineDate.getTime()
            })
            .slice(0, maxDeadlines)
    }, [isClient, isProvider, clientOrders, providerOrders, deadlineCutoff, maxDeadlines])

    // Calculate loading state
    const isLoading = useMemo(() => {
        if (isLoadingStats) return true
        if (isClient && isLoadingClientOrders) return true
        if (isProvider && isLoadingProviderOrders) return true
        return false
    }, [isLoadingStats, isClient, isLoadingClientOrders, isProvider, isLoadingProviderOrders])

    // Calculate error state
    const error = useMemo(() => {
        if (clientOrdersError) {
            const orderError = handleOrderApiError(clientOrdersError)
            return orderError.message
        }
        if (providerOrdersError) {
            const orderError = handleOrderApiError(providerOrdersError)
            return orderError.message
        }
        return undefined
    }, [clientOrdersError, providerOrdersError])

    // Show error toast if enabled
    if (error && showErrorToasts) {
        toast.error(`Fehler beim Laden der anstehenden Termine: ${error}`)
    }

    // Manual refresh function with optimized cache invalidation
    const refresh = useCallback(async () => {
        // Invalidate and refetch dashboard deadlines data
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'deadlines'],
                exact: false
            }),
            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'statistics']
            })
        ])
    }, [queryClient])

    return {
        deadlines,
        isLoading,
        error,
        refresh
    }
}

/**
 * Hook for dashboard deadlines with simplified interface
 * 
 * @returns Simplified dashboard deadlines interface
 */
export const useSimpleDashboardDeadlines = () => {
    const { deadlines, isLoading, error, refresh } = useDashboardDeadlines({
        enabled: true,
        showErrorToasts: false,
        maxDeadlines: 5,
        lookAheadDays: 30
    })

    return {
        deadlines,
        isLoading,
        error,
        refresh,
        hasDeadlines: deadlines.length > 0,
        hasError: !!error,
        criticalDeadlines: deadlines.filter(d => d.urgencyLevel === 'critical'),
        highPriorityDeadlines: deadlines.filter(d => ['critical', 'high'].includes(d.urgencyLevel))
    }
}

/**
 * Hook for dashboard deadlines with custom look-ahead period
 * 
 * @param lookAheadDays Number of days to look ahead for deadlines
 * @returns Dashboard deadlines with custom time range
 */
export const useDashboardDeadlinesWithRange = (lookAheadDays: number) => {
    return useDashboardDeadlines({
        enabled: true,
        showErrorToasts: false,
        maxDeadlines: 10,
        lookAheadDays
    })
}

export default useDashboardDeadlines