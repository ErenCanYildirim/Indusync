/**
 * Dashboard Projects Hook
 * 
 * React hook for fetching and managing dashboard projects (active orders) with role-based filtering,
 * loading states, error handling, and automatic refresh capabilities.
 * 
 * @author IndusSync Frontend Team
 * @since Dashboard Content Sections Implementation
 */

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { ordersApi, orderQueryKeys, handleOrderApiError } from '@/lib/api/orders'
import { dashboardApi } from '@/lib/api/dashboard'
import type {
    DashboardProject,
    UseDashboardProjectsReturn,
    OrderStatus
} from '@/lib/types/dashboard'
import type { OrderListResponse } from '@/lib/api/types'
import { toast } from 'sonner'
import {
    DASHBOARD_PERFORMANCE_CONFIG,
    useExpensiveCalculation,
    createOptimizedQueryKey,
    DashboardPerformanceMonitor
} from '@/lib/utils/dashboard-performance'

/**
 * Configuration options for the dashboard projects hook
 */
interface UseDashboardProjectsOptions {
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
     * Maximum number of projects to return
     * @default 5
     */
    maxProjects?: number
}

/**
 * Hook for fetching and managing dashboard projects (active orders)
 * 
 * Fetches active orders from the backend and transforms them into dashboard projects
 * with role-based filtering. Integrates with existing OrderFacadeService through
 * the orders API and handles both client and provider roles.
 * 
 * @param options Configuration options for the hook
 * @returns Dashboard projects data and control functions
 */
export const useDashboardProjects = (
    options: UseDashboardProjectsOptions = {}
): UseDashboardProjectsReturn => {
    const {
        enabled = true,
        staleTimeMs = 2 * 60 * 1000, // 2 minutes
        showErrorToasts = false,
        maxProjects = 5
    } = options

    const queryClient = useQueryClient()
    const performanceMonitor = DashboardPerformanceMonitor.getInstance()

    // First, get the company's role context to determine filtering logic
    // Use longer cache time for role context as it rarely changes
    const {
        data: dashboardStats,
        isLoading: isLoadingStats
    } = useQuery({
        queryKey: createOptimizedQueryKey(['dashboard', 'statistics'], {}),
        queryFn: () => {
            performanceMonitor.startTiming('dashboard-statistics')
            return dashboardApi.getDashboardStatistics().finally(() => {
                performanceMonitor.endTiming('dashboard-statistics')
            })
        },
        enabled,
        staleTime: DASHBOARD_PERFORMANCE_CONFIG.ROLE_CONTEXT_CACHE_TIME,
        gcTime: DASHBOARD_PERFORMANCE_CONFIG.DEFAULT_GC_TIME,
        retry: 1, // Minimal retry for role context
        refetchOnWindowFocus: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_WINDOW_FOCUS,
        refetchOnMount: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_MOUNT,
        refetchOnReconnect: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_RECONNECT
    })

    // Determine company roles from dashboard statistics
    const companyRoles = useMemo(() => {
        if (!dashboardStats || !('companyRoles' in dashboardStats)) return []
        return (dashboardStats as any).companyRoles || []
    }, [dashboardStats])

    const isClient = companyRoles.includes('CLIENT')
    const isProvider = companyRoles.includes('PROVIDER')
    const isDualRole = isClient && isProvider

    // Fetch client orders (orders created by the company)
    const {
        data: clientOrders,
        isLoading: isLoadingClientOrders,
        error: clientOrdersError
    } = useQuery({
        queryKey: createOptimizedQueryKey(['dashboard', 'projects', 'client'], { maxProjects }),
        queryFn: () => {
            performanceMonitor.startTiming('client-orders-fetch')
            return ordersApi.getMyOrders('client', {
                size: Math.max(maxProjects * 2, DASHBOARD_PERFORMANCE_CONFIG.MAX_PROJECTS_FETCH)
            }).finally(() => {
                performanceMonitor.endTiming('client-orders-fetch')
            })
        },
        enabled: enabled && isClient,
        staleTime: DASHBOARD_PERFORMANCE_CONFIG.PROJECTS_CACHE_TIME,
        gcTime: DASHBOARD_PERFORMANCE_CONFIG.DEFAULT_GC_TIME,
        retry: 2,
        refetchOnWindowFocus: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_WINDOW_FOCUS,
        refetchOnMount: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_MOUNT,
        refetchOnReconnect: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_RECONNECT
    })

    // Fetch provider orders (orders assigned to the company)
    const {
        data: providerOrders,
        isLoading: isLoadingProviderOrders,
        error: providerOrdersError
    } = useQuery({
        queryKey: createOptimizedQueryKey(['dashboard', 'projects', 'provider'], { maxProjects }),
        queryFn: () => {
            performanceMonitor.startTiming('provider-orders-fetch')
            return ordersApi.getMyOrders('provider', {
                size: Math.max(maxProjects * 2, DASHBOARD_PERFORMANCE_CONFIG.MAX_PROJECTS_FETCH)
            }).finally(() => {
                performanceMonitor.endTiming('provider-orders-fetch')
            })
        },
        enabled: enabled && isProvider,
        staleTime: DASHBOARD_PERFORMANCE_CONFIG.PROJECTS_CACHE_TIME,
        gcTime: DASHBOARD_PERFORMANCE_CONFIG.DEFAULT_GC_TIME,
        retry: 2,
        refetchOnWindowFocus: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_WINDOW_FOCUS,
        refetchOnMount: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_MOUNT,
        refetchOnReconnect: DASHBOARD_PERFORMANCE_CONFIG.REFETCH_ON_RECONNECT
    })

    // Transform and filter orders to dashboard projects - optimized with performance monitoring
    const projects = useExpensiveCalculation(() => {
        const allProjects: DashboardProject[] = []

        // Process client orders (orders created by the company)
        if (isClient && clientOrders?.content) {
            const clientProjects = clientOrders.content
                .filter((order: OrderListResponse) => {
                    // For client role: show orders with status PUBLISHED, MATCHED, or ASSIGNED
                    return ['PUBLISHED', 'MATCHED', 'ASSIGNED'].includes(order.status)
                })
                .map((order: OrderListResponse): DashboardProject => ({
                    id: order.id,
                    title: order.title,
                    description: order.description,
                    status: order.status as OrderStatus,
                    deadline: order.deadline ? new Date(order.deadline) : undefined,
                    clientCompany: order.companyName, // For client role, this is the company itself
                    providerCompany: undefined, // Will be set when provider is assigned
                    roleContext: 'client'
                }))

            allProjects.push(...clientProjects)
        }

        // Process provider orders (orders assigned to the company)
        if (isProvider && providerOrders?.content) {
            const providerProjects = providerOrders.content
                .filter((order: OrderListResponse) => {
                    // For provider role: show orders with status ASSIGNED (orders assigned to this company)
                    return order.status === 'ASSIGNED'
                })
                .map((order: OrderListResponse): DashboardProject => ({
                    id: order.id,
                    title: order.title,
                    description: order.description,
                    status: order.status as OrderStatus,
                    deadline: order.deadline ? new Date(order.deadline) : undefined,
                    clientCompany: order.companyName, // The company that created the order
                    providerCompany: undefined, // This company is the provider
                    roleContext: 'provider'
                }))

            allProjects.push(...providerProjects)
        }

        // Remove duplicates (in case of dual role companies with same orders)
        const uniqueProjects = allProjects.reduce((acc, project) => {
            const existingIndex = acc.findIndex(p => p.id === project.id)
            if (existingIndex === -1) {
                acc.push(project)
            } else {
                // If duplicate found, prefer client role context for dual role companies
                if (project.roleContext === 'client') {
                    acc[existingIndex] = project
                }
            }
            return acc
        }, [] as DashboardProject[])

        // Sort by creation date (most recent first) and limit to maxProjects
        return uniqueProjects
            .sort((a, b) => {
                // Sort by deadline if available, otherwise by title
                if (a.deadline && b.deadline) {
                    return a.deadline.getTime() - b.deadline.getTime()
                }
                if (a.deadline && !b.deadline) return -1
                if (!a.deadline && b.deadline) return 1
                return a.title.localeCompare(b.title)
            })
            .slice(0, maxProjects)
    }, [isClient, isProvider, clientOrders, providerOrders, maxProjects], 'dashboard-projects-transform')

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
        toast.error(`Fehler beim Laden der aktuellen Projekte: ${error}`)
    }

    // Manual refresh function with optimized cache invalidation
    const refresh = useCallback(async () => {
        // Invalidate and refetch dashboard projects data
        await Promise.all([
            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'projects'],
                exact: false
            }),
            queryClient.invalidateQueries({
                queryKey: ['dashboard', 'statistics']
            })
        ])
    }, [queryClient])

    return {
        projects,
        isLoading,
        error,
        refresh
    }
}

/**
 * Hook for dashboard projects with simplified interface
 * 
 * @returns Simplified dashboard projects interface
 */
export const useSimpleDashboardProjects = () => {
    const { projects, isLoading, error, refresh } = useDashboardProjects({
        enabled: true,
        showErrorToasts: false,
        maxProjects: 5
    })

    return {
        projects,
        isLoading,
        error,
        refresh,
        hasProjects: projects.length > 0,
        hasError: !!error
    }
}

export default useDashboardProjects