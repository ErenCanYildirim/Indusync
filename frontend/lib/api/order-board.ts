/**
 * Order Board API Service
 * Handles order matching and discovery for service providers
 * 
 * @author IndusSync Frontend Team
 * @since Order Board Integration
 */

import { apiClient } from './client'
import type {
    OrderMatchResponse,
    OrderBoardFilters,
    OrderBoardResponse,
    ApiResponse
} from './types'

// =============================================================================
// ORDER BOARD API ENDPOINTS
// =============================================================================

export const orderBoardApi = {
    /**
     * Get matched orders for the authenticated company
     * GET /v1/order-board/matches
     */
    async getMatchedOrders(filters: OrderBoardFilters = {}): Promise<OrderBoardResponse> {
        const searchParams = new URLSearchParams()

        if (filters.minScore !== undefined) searchParams.append('minScore', filters.minScore.toString())
        if (filters.unviewedOnly !== undefined) searchParams.append('unviewedOnly', filters.unviewedOnly.toString())
        if (filters.page !== undefined) searchParams.append('page', filters.page.toString())
        if (filters.size !== undefined) searchParams.append('size', filters.size.toString())

        const response = await apiClient.get<OrderBoardResponse>(
            `/order-board/matches?${searchParams.toString()}`
        )
        return response.data
    },

    /**
     * Mark an order match as viewed by the provider
     * POST /v1/order-board/matches/{orderId}/view
     */
    async markOrderViewed(orderId: string): Promise<void> {
        await apiClient.post(`/order-board/matches/${orderId}/view`)
    },

    /**
     * Express interest in an order match
     * POST /v1/order-board/matches/{orderId}/interest
     */
    async expressInterest(orderId: string): Promise<void> {
        await apiClient.post(`/order-board/matches/${orderId}/interest`)
    },

    /**
     * Get available orders (general discovery)
     * GET /v1/order-board/available
     */
    async getAvailableOrders(filters: {
        companyLat?: number
        companyLng?: number
        maxDistanceKm?: number
        primaryCategory?: string
        urgency?: string
        minBudget?: number
        maxBudget?: number
        specialization?: string
        page?: number
        size?: number
        sortBy?: string
        sortDir?: string
    } = {}): Promise<ApiResponse<any[]>> {
        const searchParams = new URLSearchParams()

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                searchParams.append(key, value.toString())
            }
        })

        const response = await apiClient.get<ApiResponse<any[]>>(
            `/order-board/available?${searchParams.toString()}`
        )
        return response.data
    },

    /**
     * Get details of an available order
     * GET /v1/order-board/available/{orderId}
     */
    async getAvailableOrderDetails(orderId: string): Promise<any> {
        const response = await apiClient.get(`/order-board/available/${orderId}`)
        return response.data
    },

    /**
     * Get orders near company location
     * GET /v1/order-board/nearby
     */
    async getNearbyOrders(filters: {
        radiusKm?: number
        page?: number
        size?: number
    } = {}): Promise<ApiResponse<any[]>> {
        const searchParams = new URLSearchParams()

        if (filters.radiusKm !== undefined) searchParams.append('radiusKm', filters.radiusKm.toString())
        if (filters.page !== undefined) searchParams.append('page', filters.page.toString())
        if (filters.size !== undefined) searchParams.append('size', filters.size.toString())

        const response = await apiClient.get<ApiResponse<any[]>>(
            `/order-board/nearby?${searchParams.toString()}`
        )
        return response.data
    },

    /**
     * Get available order categories
     * GET /v1/order-board/categories
     */
    async getAvailableCategories(): Promise<string[]> {
        const response = await apiClient.get<string[]>('/order-board/categories')
        return response.data
    }
}

// =============================================================================
// REACT QUERY KEYS
// =============================================================================

export const orderBoardQueryKeys = {
    all: ['order-board'] as const,
    matches: () => [...orderBoardQueryKeys.all, 'matches'] as const,
    matchesList: (filters: OrderBoardFilters) => [...orderBoardQueryKeys.matches(), filters] as const,
    available: () => [...orderBoardQueryKeys.all, 'available'] as const,
    availableList: (filters: any) => [...orderBoardQueryKeys.available(), filters] as const,
    nearby: () => [...orderBoardQueryKeys.all, 'nearby'] as const,
    nearbyList: (filters: any) => [...orderBoardQueryKeys.nearby(), filters] as const,
    categories: () => [...orderBoardQueryKeys.all, 'categories'] as const,
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export interface OrderBoardApiError {
    message: string
    code?: string
    details?: any
}

export function handleOrderBoardApiError(error: any): OrderBoardApiError {
    if (error.response?.data) {
        return {
            message: error.response.data.message || 'Ein Fehler ist aufgetreten',
            code: error.response.data.code,
            details: error.response.data.details
        }
    }

    if (error.message) {
        return { message: error.message }
    }

    return { message: 'Ein unbekannter Fehler ist aufgetreten' }
} 