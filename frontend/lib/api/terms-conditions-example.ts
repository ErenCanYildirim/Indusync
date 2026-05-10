/**
 * Terms & Conditions API Usage Examples
 * 
 * This file demonstrates how to use the Terms & Conditions API functions
 * in various scenarios throughout the application.
 */

import { companyApi } from './company'
import {
    handleTermsConditionsError,
    isRetryableTermsConditionsError,
    getTermsConditionsRetryDelay
} from './terms-conditions-error-handler'
import {
    getTermsConditionsWithTracking,
    validateTermsConditionsFile,
    formatFileSize,
    openTermsConditionsDocument,
    downloadTermsConditionsDocument
} from '../utils/terms-conditions'
import type { TermsConditionsDocument } from '../types/terms-conditions'

/**
 * Example: Upload Terms & Conditions document from company profile
 */
export async function uploadTermsConditionsExample(companyId: string, file: File) {
    try {
        // Validate file before upload
        const validation = validateTermsConditionsFile(file)
        if (!validation.isValid) {
            console.error('File validation failed:', validation.error)
            return
        }

        console.log('Uploading T&C document:', {
            fileName: file.name,
            fileSize: formatFileSize(file.size),
            companyId
        })

        // Upload the document
        const response = await companyApi.uploadTermsConditions(companyId, file)

        console.log('Upload successful:', {
            documentId: response.documentId,
            fileName: response.fileName,
            fileSize: formatFileSize(response.fileSize),
            uploadedAt: response.uploadedAt
        })

        return response
    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('Upload failed:', errorMessage)

        // Check if error is retryable
        if (isRetryableTermsConditionsError(error)) {
            console.log('Error is retryable, could implement retry logic')
            const retryDelay = getTermsConditionsRetryDelay(error, 1)
            console.log(`Suggested retry delay: ${retryDelay}ms`)
        }

        throw new Error(errorMessage)
    }
}

/**
 * Example: Get Terms & Conditions document for order detail page
 */
export async function getTermsConditionsForOrderExample(companyId: string, orderId: string) {
    try {
        console.log('Getting T&C document for order:', { companyId, orderId })

        // Get document with access tracking
        const { document, url } = await getTermsConditionsWithTracking(
            companyId,
            'ORDER_DETAIL',
            orderId
        )

        if (!document) {
            console.log('No T&C document found for company')
            return null
        }

        console.log('T&C document retrieved:', {
            fileName: document.originalFileName,
            fileSize: formatFileSize(document.fileSize),
            uploadedAt: document.uploadedAt,
            version: document.version
        })

        return { document, url }
    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('Failed to get T&C document:', errorMessage)
        return null
    }
}

/**
 * Example: Check if company has Terms & Conditions document
 */
export async function checkCompanyHasTermsConditionsExample(companyId: string) {
    try {
        console.log('Checking if company has T&C document:', companyId)

        const hasDocument = await companyApi.hasTermsConditions(companyId)

        console.log('Company T&C status:', {
            companyId,
            hasTermsConditions: hasDocument
        })

        return hasDocument
    } catch (error) {
        console.error('Error checking T&C status:', error)
        return false
    }
}

/**
 * Example: Delete Terms & Conditions document
 */
export async function deleteTermsConditionsExample(companyId: string) {
    try {
        console.log('Deleting T&C document for company:', companyId)

        await companyApi.deleteTermsConditions(companyId)

        console.log('T&C document deleted successfully')
        return true
    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('Failed to delete T&C document:', errorMessage)
        throw new Error(errorMessage)
    }
}

/**
 * Example: Open Terms & Conditions document in new window
 */
export async function openTermsConditionsExample(companyId: string, companyName: string) {
    try {
        console.log('Opening T&C document:', { companyId, companyName })

        // Get document with tracking for company profile access
        const { document, url } = await getTermsConditionsWithTracking(
            companyId,
            'COMPANY_PROFILE'
        )

        if (!document || !url) {
            console.log('No T&C document available to open')
            return false
        }

        // Open document in new window
        openTermsConditionsDocument(url, companyName)

        console.log('T&C document opened in new window')
        return true
    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('Failed to open T&C document:', errorMessage)
        return false
    }
}

/**
 * Example: Download Terms & Conditions document
 */
export async function downloadTermsConditionsExample(companyId: string) {
    try {
        console.log('Downloading T&C document:', companyId)

        // Get document info and URL
        const documentResponse = await companyApi.getTermsConditions(companyId)

        if (!documentResponse.hasDocument || !documentResponse.document) {
            console.log('No T&C document available for download')
            return false
        }

        const url = await companyApi.getTermsConditionsUrl(companyId)

        // Download the document
        downloadTermsConditionsDocument(url, documentResponse.document.originalFileName)

        console.log('T&C document download initiated')
        return true
    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('Failed to download T&C document:', errorMessage)
        return false
    }
}

/**
 * Example: Bulk check Terms & Conditions availability for multiple companies
 */
export async function bulkCheckTermsConditionsExample(companyIds: string[]) {
    console.log('Bulk checking T&C availability for companies:', companyIds)

    const results = await Promise.allSettled(
        companyIds.map(async (companyId) => {
            try {
                const hasDocument = await companyApi.hasTermsConditions(companyId)
                return { companyId, hasTermsConditions: hasDocument, error: null }
            } catch (error) {
                return {
                    companyId,
                    hasTermsConditions: false,
                    error: handleTermsConditionsError(error)
                }
            }
        })
    )

    const processedResults = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return result.value
        } else {
            return {
                companyId: companyIds[index],
                hasTermsConditions: false,
                error: 'Promise rejected'
            }
        }
    })

    console.log('Bulk T&C check results:', processedResults)
    return processedResults
}

/**
 * Example: Retry logic for failed Terms & Conditions operations
 */
export async function retryTermsConditionsOperationExample<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
): Promise<T> {
    let lastError: any

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempting T&C operation (attempt ${attempt}/${maxRetries})`)
            return await operation()
        } catch (error) {
            lastError = error

            if (!isRetryableTermsConditionsError(error) || attempt === maxRetries) {
                throw error
            }

            const delay = getTermsConditionsRetryDelay(error, attempt)
            console.log(`Operation failed, retrying in ${delay}ms...`)

            await new Promise(resolve => setTimeout(resolve, delay))
        }
    }

    throw lastError
}

/**
 * Example: Complete Terms & Conditions workflow for company profile
 */
export async function completeTermsConditionsWorkflowExample(
    companyId: string,
    file?: File
) {
    try {
        console.log('Starting complete T&C workflow for company:', companyId)

        // Step 1: Check current status
        const hasExistingDocument = await companyApi.hasTermsConditions(companyId)
        console.log('Existing T&C status:', hasExistingDocument)

        // Step 2: If uploading new document
        if (file) {
            // Validate file
            const validation = validateTermsConditionsFile(file)
            if (!validation.isValid) {
                throw new Error(validation.error)
            }

            // Upload with retry logic
            const uploadResponse = await retryTermsConditionsOperationExample(
                () => companyApi.uploadTermsConditions(companyId, file)
            )

            console.log('New T&C document uploaded:', {
                documentId: uploadResponse.documentId,
                fileName: uploadResponse.originalFileName,
                version: uploadResponse.version
            })

            return uploadResponse
        }

        // Step 3: If just checking/retrieving existing document
        if (hasExistingDocument) {
            const documentResponse = await companyApi.getTermsConditions(companyId)
            console.log('Retrieved existing T&C document:', {
                fileName: documentResponse.document?.originalFileName,
                uploadedAt: documentResponse.document?.uploadedAt
            })
            return documentResponse
        }

        console.log('No T&C document found and no file provided for upload')
        return null

    } catch (error) {
        const errorMessage = handleTermsConditionsError(error)
        console.error('T&C workflow failed:', errorMessage)
        throw new Error(errorMessage)
    }
}