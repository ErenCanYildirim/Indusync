import { apiClient, createFormDataClient } from './client'
import type {
    TermsConditionsDocument,
    TermsConditionsResponse,
    GetTermsConditionsResponse,
    TermsConditionsAccessRequest,
    TermsConditionsAccessResponse,
    UploadTermsConditionsRequest
} from '../types/terms-conditions'

/**
 * Terms & Conditions API endpoints
 * 
 * This module provides API functions for managing Terms & Conditions documents
 * following the existing company API patterns with proper error handling,
 * FormData support for file uploads, and secure document access.
 */
export const termsConditionsApi = {
    /**
     * Upload Terms & Conditions document for a company
     * 
     * @param companyId - The company ID to upload T&C for
     * @param file - The PDF file to upload (max 10MB)
     * @returns Promise<TermsConditionsResponse> - Upload response with document metadata
     */
    uploadTermsConditions: async (companyId: string, file: File): Promise<TermsConditionsResponse> => {
        // Validate file before upload
        if (!file) {
            throw new Error('File is required')
        }

        if (file.type !== 'application/pdf') {
            throw new Error('Only PDF files are allowed')
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size exceeds 10MB limit')
        }

        const formData = new FormData()
        formData.append('file', file)

        const formDataClient = createFormDataClient()
        const response = await formDataClient.post(`/companies/${companyId}/terms-conditions/upload`, formData)
        return response.data
    },

    /**
     * Get Terms & Conditions document for a company
     * 
     * @param companyId - The company ID to get T&C for
     * @returns Promise<GetTermsConditionsResponse> - Document info or null if not found
     */
    getTermsConditions: async (companyId: string): Promise<GetTermsConditionsResponse> => {
        const response = await apiClient.get(`/companies/${companyId}/terms-conditions`)
        return response.data
    },

    /**
     * Delete Terms & Conditions document for a company
     * 
     * @param companyId - The company ID to delete T&C for
     * @returns Promise<void>
     */
    deleteTermsConditions: async (companyId: string): Promise<void> => {
        await apiClient.delete(`/companies/${companyId}/terms-conditions`)
    },

    /**
     * Get secure URL for accessing Terms & Conditions document
     * 
     * @param companyId - The company ID to get document URL for
     * @returns Promise<string> - Secure URL for document access
     */
    getTermsConditionsUrl: async (companyId: string): Promise<string> => {
        const response = await apiClient.get(`/companies/${companyId}/terms-conditions/url`)
        return response.data.url
    },

    /**
     * Track access to Terms & Conditions document for audit purposes
     * 
     * @param companyId - The company ID that owns the document
     * @param accessRequest - Access tracking information
     * @returns Promise<TermsConditionsAccessResponse> - Access tracking response
     */
    trackDocumentAccess: async (companyId: string, accessRequest: TermsConditionsAccessRequest): Promise<TermsConditionsAccessResponse> => {
        const response = await apiClient.post(`/companies/${companyId}/terms-conditions/access-log`, accessRequest)
        return response.data
    },

    /**
     * Check if a company has Terms & Conditions document
     * 
     * @param companyId - The company ID to check
     * @returns Promise<boolean> - True if company has T&C document
     */
    hasTermsConditions: async (companyId: string): Promise<boolean> => {
        try {
            const response = await termsConditionsApi.getTermsConditions(companyId)
            return response.hasDocument
        } catch (error) {
            // If we get a 404 or other error, assume no document exists
            return false
        }
    },

    /**
     * Get Terms & Conditions document with access tracking
     * 
     * This is a convenience method that combines document retrieval with access tracking
     * for use in components that need both operations.
     * 
     * @param companyId - The company ID to get T&C for
     * @param accessContext - Context where the document is being accessed
     * @param orderId - Optional order ID for context (when accessed from order pages)
     * @returns Promise<{ document: TermsConditionsDocument | null, url: string | null }>
     */
    getTermsConditionsWithTracking: async (
        companyId: string,
        accessContext: 'ORDER_DETAIL' | 'COMPANY_PROFILE' | 'EXPRESSION_OF_INTEREST',
        orderId?: string
    ): Promise<{ document: TermsConditionsDocument | null, url: string | null }> => {
        try {
            // First get the document info
            const documentResponse = await termsConditionsApi.getTermsConditions(companyId)

            if (!documentResponse.hasDocument || !documentResponse.document) {
                return { document: null, url: null }
            }

            // Get secure URL for document access
            const url = await termsConditionsApi.getTermsConditionsUrl(companyId)

            // Track the access for audit purposes
            await termsConditionsApi.trackDocumentAccess(companyId, {
                documentId: documentResponse.documentId,
                accessContext,
                orderId
            })

            // Convert response to TermsConditionsDocument format
            const document: TermsConditionsDocument = {
                id: documentResponse.document.documentId,
                companyId: companyId,
                fileName: documentResponse.document.fileName,
                originalFileName: documentResponse.document.originalFileName,
                fileSize: documentResponse.document.fileSize,
                mimeType: documentResponse.document.mimeType,
                uploadedAt: documentResponse.document.uploadedAt,
                uploadedBy: documentResponse.document.uploadedBy,
                url: url,
                isActive: documentResponse.document.isActive,
                version: documentResponse.document.version,
                checksum: ''  // Not provided in response, but required by interface
            }

            return { document, url }
        } catch (error) {
            console.error('Error getting T&C document with tracking:', error)
            return { document: null, url: null }
        }
    }
}

export default termsConditionsApi