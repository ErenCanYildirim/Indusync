import { companyApi } from '../api/company'
import type {
    TermsConditionsDocument,
    TermsConditionsResponse,
    AccessContext
} from '../types/terms-conditions'

/**
 * Utility functions for Terms & Conditions operations
 * 
 * This module provides helper functions for common T&C operations
 * that can be reused across components and hooks.
 */

/**
 * Get Terms & Conditions document with access tracking
 * 
 * This is a convenience function that combines document retrieval with access tracking
 * for use in components that need both operations.
 * 
 * @param companyId - The company ID to get T&C for
 * @param accessContext - Context where the document is being accessed
 * @param orderId - Optional order ID for context (when accessed from order pages)
 * @returns Promise<{ document: TermsConditionsDocument | null, url: string | null }>
 */
export async function getTermsConditionsWithTracking(
    companyId: string,
    accessContext: AccessContext,
    orderId?: string
): Promise<{ document: TermsConditionsDocument | null, url: string | null }> {
    try {
        // First get the document info
        const documentResponse = await companyApi.getTermsConditions(companyId)

        if (!documentResponse.hasDocument || !documentResponse.document) {
            return { document: null, url: null }
        }

        // Get secure URL for document access
        const url = await companyApi.getTermsConditionsUrl(companyId)

        // Track the access for audit purposes
        await companyApi.trackTermsConditionsAccess({
            documentId: documentResponse.document.documentId,
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

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate Terms & Conditions file before upload
 * 
 * @param file - File to validate
 * @returns Object with validation result and error message if invalid
 */
export function validateTermsConditionsFile(file: File): {
    isValid: boolean
    error?: string
} {
    if (!file) {
        return { isValid: false, error: 'File is required' }
    }

    if (file.type !== 'application/pdf') {
        return { isValid: false, error: 'Only PDF files are allowed' }
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
        return { isValid: false, error: 'File size exceeds 10MB limit' }
    }

    return { isValid: true }
}

/**
 * Open Terms & Conditions document in new tab/window
 * 
 * @param url - Document URL to open
 * @param companyName - Company name for window title
 */
export function openTermsConditionsDocument(url: string, companyName: string): void {
    const windowName = `tc_${companyName.replace(/\s+/g, '_')}`
    const windowFeatures = 'width=800,height=600,scrollbars=yes,resizable=yes'

    window.open(url, windowName, windowFeatures)
}

/**
 * Download Terms & Conditions document
 * 
 * @param url - Document URL to download
 * @param fileName - Original file name for download
 */
export function downloadTermsConditionsDocument(url: string, fileName: string): void {
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.target = '_blank'

    // Append to body, click, and remove
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

/**
 * Get display text for access context
 * 
 * @param context - Access context enum value
 * @returns Human-readable context description
 */
export function getAccessContextDisplayText(context: AccessContext): string {
    switch (context) {
        case 'ORDER_DETAIL':
            return 'Order Detail Page'
        case 'COMPANY_PROFILE':
            return 'Company Profile'
        case 'EXPRESSION_OF_INTEREST':
            return 'Expression of Interest'
        default:
            return 'Unknown Context'
    }
}

/**
 * Check if Terms & Conditions document is recent (uploaded within last 30 days)
 * 
 * @param uploadedAt - ISO date string of upload
 * @returns True if document is recent
 */
export function isRecentTermsConditionsDocument(uploadedAt: string): boolean {
    const uploadDate = new Date(uploadedAt)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return uploadDate > thirtyDaysAgo
}

/**
 * Generate Terms & Conditions document summary for display
 * 
 * @param document - Terms & Conditions document
 * @returns Summary object with display information
 */
export function getTermsConditionsDocumentSummary(document: TermsConditionsDocument) {
    return {
        fileName: document.originalFileName,
        fileSize: formatFileSize(document.fileSize),
        uploadedAt: new Date(document.uploadedAt).toLocaleDateString(),
        isRecent: isRecentTermsConditionsDocument(document.uploadedAt),
        version: document.version,
        isActive: document.isActive
    }
}