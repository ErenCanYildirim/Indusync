/**
 * Download Order Document Hook
 * Custom hook for downloading order documents with proper error handling
 * 
 * @author IndusSync Frontend Team
 * @since Order Detail Documents Fix Implementation
 */

"use client"

import { useState, useCallback } from 'react'
import { ordersApi } from '@/lib/api/orders'

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface UseDownloadOrderDocumentState {
    downloadingDocuments: Set<string>
    error: string | null
}

interface UseDownloadOrderDocumentReturn {
    downloadDocument: (orderId: string, documentId: string, fileName: string) => Promise<void>
    isDownloading: (documentId: string) => boolean
    error: string | null
    clearError: () => void
}

// =============================================================================
// HOOK IMPLEMENTATION
// =============================================================================

/**
 * Hook for downloading order documents
 * @returns Object with download function and state management
 */
export function useDownloadOrderDocument(): UseDownloadOrderDocumentReturn {
    const [state, setState] = useState<UseDownloadOrderDocumentState>({
        downloadingDocuments: new Set(),
        error: null
    })

    // Download document function
    const downloadDocument = useCallback(async (
        orderId: string,
        documentId: string,
        fileName: string
    ) => {
        // Add document to downloading set
        setState(prev => ({
            ...prev,
            downloadingDocuments: new Set([...prev.downloadingDocuments, documentId]),
            error: null
        }))

        try {
            // Download the document blob
            const blob = await ordersApi.downloadDocument(orderId, documentId)

            // Create download URL and trigger download
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = fileName

            // Append to body, click, and remove
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            // Clean up the URL
            window.URL.revokeObjectURL(url)

        } catch (error) {
            console.error('Error downloading document:', error)
            const errorMessage = error instanceof Error
                ? error.message
                : 'Fehler beim Herunterladen der Datei'

            setState(prev => ({
                ...prev,
                error: errorMessage
            }))
        } finally {
            // Remove document from downloading set
            setState(prev => ({
                ...prev,
                downloadingDocuments: new Set(
                    [...prev.downloadingDocuments].filter(id => id !== documentId)
                )
            }))
        }
    }, [])

    // Check if document is currently downloading
    const isDownloading = useCallback((documentId: string) => {
        return state.downloadingDocuments.has(documentId)
    }, [state.downloadingDocuments])

    // Clear error function
    const clearError = useCallback(() => {
        setState(prev => ({
            ...prev,
            error: null
        }))
    }, [])

    return {
        downloadDocument,
        isDownloading,
        error: state.error,
        clearError
    }
}