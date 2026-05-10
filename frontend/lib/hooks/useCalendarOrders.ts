/**
 * Calendar Orders Hook
 * Fetches and processes orders specifically for calendar display
 * Only shows accepted orders with both startDate and deadline
 */

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { ordersApi } from '@/lib/api/orders'
import { OrderCalendarItem, transformToCalendarItem, CalendarOrderFilters } from '@/lib/types/calendar'
import { OrderDetailResponse, OrderListResponse } from '@/lib/api/types'

/**
 * Hook for fetching orders for calendar display
 * Automatically determines user role and fetches appropriate orders
 */
export function useCalendarOrders(filters?: CalendarOrderFilters) {
    const { user } = useAuth()

    // Determine user role based on company membership
    const userContext = useMemo(() => {
        const membership = user?.currentCompanyMembership
        // More flexible role detection - check multiple permission flags
        const isProvider = membership?.canAssignProjects || membership?.role === 'OWNER' || membership?.role === 'ADMIN'
        const isClient = membership?.canCreateOrders || membership?.role === 'OWNER' || membership?.role === 'ADMIN'

        return {
            isProvider,
            isClient,
            companyId: membership?.companyId,
            userRole: membership?.role
        }
    }, [user])

    // Fetch orders using dedicated calendar endpoint
    const ordersQuery = useQuery({
        queryKey: ['calendar-orders', userContext.companyId, userContext.isProvider, userContext.isClient],
        queryFn: async () => {
            if (!userContext.companyId) {
                return []
            }


            try {
                const allOrders = []

                // If user can be both client and provider, fetch from both perspectives
                if (userContext.isClient && userContext.isProvider) {

                    // Fetch client orders (orders they created)
                    try {
                        const clientOrders = await ordersApi.getCalendarOrders('client')
                        allOrders.push(...clientOrders)
                    } catch (error) {
                        console.error('Failed to fetch client orders:', error)
                    }

                    // Fetch provider orders (orders assigned to them)
                    try {
                        const providerOrders = await ordersApi.getCalendarOrders('provider')
                        allOrders.push(...providerOrders)
                    } catch (error) {
                        console.error('Failed to fetch provider orders:', error)
                    }

                    // Remove duplicates based on order ID
                    const uniqueOrders = allOrders.filter((order, index, self) =>
                        index === self.findIndex(o => o.id === order.id)
                    )

                    return uniqueOrders

                } else if (userContext.isProvider) {
                    // User is only a provider
                    const providerOrders = await ordersApi.getCalendarOrders('provider')
                    return providerOrders

                } else if (userContext.isClient) {
                    // User is only a client
                    const clientOrders = await ordersApi.getCalendarOrders('client')
                    return clientOrders

                } else {
                    return []
                }

            } catch (error) {
                console.error('Failed to fetch calendar orders:', error)
                throw error
            }
        },
        enabled: !!userContext.companyId && (userContext.isProvider || userContext.isClient),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false
    })

    // Transform and filter orders for calendar display
    const calendarOrders = useMemo(() => {
        if (!ordersQuery.data || ordersQuery.data.length === 0) {
            console.log('No calendar orders data available', ordersQuery.data)
            return []
        }


        // Transform backend response to frontend calendar items and filter out nulls
        const transformedOrders = ordersQuery.data
            .map(transformToCalendarItem)
            .filter((order): order is OrderCalendarItem => order !== null)


        // Apply additional filters if provided
        if (!filters) {
            return transformedOrders
        }

        const filteredOrders = transformedOrders.filter((order) => {
            // Status filter
            if (filters.statuses && filters.statuses.length > 0) {
                if (!filters.statuses.includes(order.status)) return false
            }

            // Completed orders filter
            if (filters.showCompletedOrders === false && order.status === 'COMPLETED') {
                return false
            }

            // Draft orders filter  
            if (filters.showDraftOrders === false && order.status === 'DRAFT') {
                return false
            }

            // Category filter
            if (filters.categoryFilter && order.primaryCategory !== filters.categoryFilter) {
                return false
            }

            // Urgency filter
            if (filters.urgencyFilter && filters.urgencyFilter.length > 0) {
                if (!order.urgency || !filters.urgencyFilter.includes(order.urgency)) {
                    return false
                }
            }

            return true
        })

        return filteredOrders
    }, [ordersQuery.data, filters])

    return {
        orders: calendarOrders,
        isLoading: ordersQuery.isLoading,
        error: ordersQuery.error,
        refetch: ordersQuery.refetch,
        userContext
    }
}

/**
 * Hook for getting orders for a specific day
 */
export function useOrdersForDay(day: Date, filters?: CalendarOrderFilters) {
    const { orders, ...rest } = useCalendarOrders(filters)

    const ordersForDay = useMemo(() => {
        const dayWithoutTime = new Date(day.getFullYear(), day.getMonth(), day.getDate())

        return orders.filter(order => {
            const startDate = new Date(order.startDate)
            const endDate = new Date(order.deadline)

            // Normalize dates to remove time component
            const startWithoutTime = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
            const endWithoutTime = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

            // Check if the day falls within the order duration
            return dayWithoutTime >= startWithoutTime && dayWithoutTime <= endWithoutTime
        })
    }, [orders, day])

    return {
        ordersForDay,
        ...rest
    }
}

/**
 * Hook for getting orders within a date range (for week/month views)
 */
export function useOrdersForDateRange(startDate: Date, endDate: Date, filters?: CalendarOrderFilters) {
    const { orders, ...rest } = useCalendarOrders(filters)

    const ordersInRange = useMemo(() => {
        const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
        const rangeEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())

        return orders.filter(order => {
            const orderStart = new Date(order.startDate)
            const orderEnd = new Date(order.deadline)

            const orderStartDate = new Date(orderStart.getFullYear(), orderStart.getMonth(), orderStart.getDate())
            const orderEndDate = new Date(orderEnd.getFullYear(), orderEnd.getMonth(), orderEnd.getDate())

            // Check if order overlaps with the date range
            return !(orderEndDate < rangeStart || orderStartDate > rangeEnd)
        })
    }, [orders, startDate, endDate])

    return {
        ordersInRange,
        ...rest
    }
} 