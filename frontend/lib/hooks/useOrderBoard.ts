"use client"

/**
 * Order Board Hooks
 * React Query hooks for order board and matching functionality
 * 
 * @author IndusSync Frontend Team
 * @since Order Board Integration
 */

import React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    orderBoardApi,
    orderBoardQueryKeys,
    handleOrderBoardApiError
} from '@/lib/api/order-board'
import type { OrderBoardFilters } from '@/lib/api/types'

// ORDER BOARD QUERY HOOKS

/**
 * Hook for fetching matched orders for the authenticated company
 */
export function useMatchedOrders(filters: OrderBoardFilters = {}) {
    return useQuery({
        queryKey: orderBoardQueryKeys.matchesList(filters),
        queryFn: () => orderBoardApi.getMatchedOrders(filters),
        staleTime: 2 * 60 * 1000, // 2 minutes
        retry: (failureCount, error: any) => {
            // Don't retry on 403 (unauthorized access)
            if (error?.response?.status === 403) return false
            return failureCount < 3
        }
    })
}

/**
 * Hook for fetching available orders (general discovery)
 */
export function useAvailableOrders(filters: any = {}) {
    return useQuery({
        queryKey: orderBoardQueryKeys.availableList(filters),
        queryFn: () => orderBoardApi.getAvailableOrders(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: Object.keys(filters).length > 0 || filters.page !== undefined
    })
}

/**
 * Hook for fetching nearby orders
 */
export function useNearbyOrders(filters: { radiusKm?: number; page?: number; size?: number } = {}) {
    return useQuery({
        queryKey: orderBoardQueryKeys.nearbyList(filters),
        queryFn: () => orderBoardApi.getNearbyOrders(filters),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

/**
 * Hook for fetching available order categories
 */
export function useAvailableCategories() {
    return useQuery({
        queryKey: orderBoardQueryKeys.categories(),
        queryFn: () => orderBoardApi.getAvailableCategories(),
        staleTime: 15 * 60 * 1000, // 15 minutes - categories don't change often
    })
}

/**
 * Hook for fetching detailed order information
 */
export function useAvailableOrderDetails(orderId: string, enabled: boolean = true) {
    return useQuery({
        queryKey: [...orderBoardQueryKeys.available(), 'detail', orderId],
        queryFn: () => orderBoardApi.getAvailableOrderDetails(orderId),
        enabled: enabled && !!orderId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
            // Don't retry on 404 (order not found)
            if (error?.response?.status === 404) return false
            return failureCount < 3
        }
    })
}

// ORDER BOARD MUTATION HOOKS

/**
 * Hook for marking an order match as viewed
 */
export function useMarkOrderViewed() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orderId: string) => orderBoardApi.markOrderViewed(orderId),
        onSuccess: (_, orderId) => {
            // Invalidate matched orders to refresh the viewed status
            queryClient.invalidateQueries({ queryKey: orderBoardQueryKeys.matches() })
        },
        onError: (error) => {
            const orderBoardError = handleOrderBoardApiError(error)
            toast.error(`Fehler beim Markieren als angesehen: ${orderBoardError.message}`)
        }
    })
}

/**
 * Hook for expressing interest in an order
 */
export function useExpressInterest() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (orderId: string) => orderBoardApi.expressInterest(orderId),
        onSuccess: (_, orderId) => {
            // Invalidate matched orders to refresh the interest status
            queryClient.invalidateQueries({ queryKey: orderBoardQueryKeys.matches() })
            toast.success('Interesse erfolgreich geäußert!')
        },
        onError: (error) => {
            const orderBoardError = handleOrderBoardApiError(error)
            toast.error(`Fehler beim Äußern des Interesses: ${orderBoardError.message}`)
        }
    })
}

// UTILITY HOOKS


/**
 * Hook for managing order board filters and pagination
 */
export function useOrderBoardFilters(initialFilters: OrderBoardFilters = {}) {
    const [filters, setFilters] = React.useState<OrderBoardFilters>(initialFilters)

    const updateFilters = (newFilters: Partial<OrderBoardFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }))
    }

    const resetFilters = () => {
        setFilters(initialFilters)
    }

    const setPage = (page: number) => {
        updateFilters({ page })
    }

    const setMinScore = (minScore: number) => {
        updateFilters({ minScore, page: 0 }) // Reset to first page when filtering
    }

    const setUnviewedOnly = (unviewedOnly: boolean) => {
        updateFilters({ unviewedOnly, page: 0 }) // Reset to first page when filtering
    }

    return {
        filters,
        updateFilters,
        resetFilters,
        setPage,
        setMinScore,
        setUnviewedOnly
    }
}

/**
 * Hook for match score utilities
 */
export function useMatchScoreUtils() {
    const getScoreColor = (score: number): string => {
        if (score >= 0.9) return 'text-green-600'
        if (score >= 0.7) return 'text-blue-600'
        if (score >= 0.5) return 'text-yellow-600'
        if (score >= 0.3) return 'text-orange-600'
        return 'text-red-600'
    }

    const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
        if (score >= 0.7) return 'default'
        if (score >= 0.5) return 'secondary'
        if (score >= 0.3) return 'outline'
        return 'destructive'
    }

    const getMatchQuality = (score: number): string => {
        if (score >= 0.9) return 'Exzellent'
        if (score >= 0.7) return 'Hoch'
        if (score >= 0.5) return 'Gut'
        if (score >= 0.3) return 'Mittel'
        return 'Niedrig'
    }

    const formatScore = (score: number): string => {
        return `${Math.round(score * 100)}%`
    }

    return {
        getScoreColor,
        getScoreBadgeVariant,
        getMatchQuality,
        formatScore
    }
} 