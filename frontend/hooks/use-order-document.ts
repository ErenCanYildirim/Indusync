/**
 * Order Documents Hook
 * Custom hook for managing order document operations
 * 
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client"

import { useState, useEffect, useCallback } from 'react'
import { ordersApi } from '@/lib/api/orders'
import type { OrderDocumentDto } from '@/lib/api/types'

// TYPE DEFINITIONS

interface UseOrderDocumentsState {
    documents: OrderDocumentDto[]
    isLoading: boolean
    error: string | null
    isRefreshing: boolean
}

interface UseOrderDocumentsReturn extends UseOrderDocumentsState {
    refetch: () => Promise<void>
    clearError: () => void
}

// HOOK IMPLEMENTATION

/**
 * Hook for fetching and managing order documents
 * @param orderId - ID of the order to fetch documents for
 * @returns Object with documents data and management functions
 */
export function useOrderDocuments(orderId: string): UseOrderDocumentsReturn {
    const [state, setState] = useState<UseOrderDocumentsState>({
        documents: [],
        isLoading: true,
        error: null,
        isRefreshing: false
    })

    // Fetch documents function
    const fetchDocuments = useCallback(async (isRefresh = false) => {
        if (!orderId) {
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Order ID is required'
            }))
            return
        }

        setState(prev => ({
            ...prev,
            isLoading: !isRefresh,
            isRefreshing: isRefresh,
            error: null
        }))

        try {
            const documents = await ordersApi.getOrderDocuments(orderId)
            setState(prev => ({
                ...prev,
                documents,
                isLoading: false,
                isRefreshing: false,
                error: null
            }))
        } catch (error) {
            console.error('Error fetching order documents:', error)
            const errorMessage = error instanceof Error
                ? error.message
                : 'Fehler beim Laden der Dokumente'

            setState(prev => ({
                ...prev,
                documents: [],
                isLoading: false,
                isRefreshing: false,
                error: errorMessage
            }))
        }
    }, [orderId])

    // Initial fetch on mount or orderId change
    useEffect(() => {
        fetchDocuments()
    }, [fetchDocuments])

    // Refetch function for manual refresh
    const refetch = useCallback(async () => {
        await fetchDocuments(true)
    }, [fetchDocuments])

    // Clear error function
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null
        }))
    }, [])

    return {
        ...state,
        refetch,
        clearError
    }
}