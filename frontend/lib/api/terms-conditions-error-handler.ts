import type {
    TermsConditionsApiError,
    TermsConditionsErrorCode,
    TermsConditionsErrorCodes
} from '../types/terms-conditions'

/**
 * Terms & Conditions API Error Handler
 * 
 * This module provides error handling utilities specifically for T&C API operations,
 * following the existing error handling patterns in the codebase.
 */

/**
 * Create a Terms & Conditions API error
 * 
 * @param message - Error message
 * @param code - Error code
 * @param status - HTTP status code
 * @returns TermsConditionsApiError
 */
export function createTermsConditionsError(
    message: string,
    code?: TermsConditionsErrorCode,
    status?: number
): TermsConditionsApiError {
    const error = new Error(message) as TermsConditionsApiError
    error.name = 'TermsConditionsApiError'
    error.code = code
    error.status = status
    return error
}

/**
 * Handle Terms & Conditions API errors and convert to user-friendly messages
 * 
 * @param error - Error from API call
 * @returns User-friendly error message
 */
export function handleTermsConditionsError(error: any): string {
    // Handle network errors
    if (!error.response) {
        return 'Network error. Please check your connection and try again.'
    }

    const status = error.response?.status
    const errorCode = error.response?.data?.code
    const message = error.response?.data?.message

    // Handle specific error codes
    switch (errorCode) {
        case TermsConditionsErrorCodes.DOCUMENT_NOT_FOUND:
            return 'Terms & Conditions document not found.'

        case TermsConditionsErrorCodes.INVALID_COMPANY_ID:
            return 'Invalid company ID provided.'

        case TermsConditionsErrorCodes.INVALID_FILE_TYPE:
            return 'Only PDF files are allowed for Terms & Conditions documents.'

        case TermsConditionsErrorCodes.FILE_TOO_LARGE:
            return 'File size exceeds the 10MB limit.'

        case TermsConditionsErrorCodes.UPLOAD_FAILED:
            return 'Failed to upload document. Please try again.'

        case TermsConditionsErrorCodes.ACCESS_DENIED:
            return 'You do not have permission to access this document.'

        case TermsConditionsErrorCodes.DOCUMENT_PROCESSING_FAILED:
            return 'Document processing failed. Please try uploading again.'

        case TermsConditionsErrorCodes.MALWARE_DETECTED:
            return 'Security scan detected potential issues with the file. Please use a different document.'

        case TermsConditionsErrorCodes.STORAGE_ERROR:
            return 'Storage error occurred. Please try again later.'

        case TermsConditionsErrorCodes.VALIDATION_ERROR:
            return message || 'Document validation failed.'

        case TermsConditionsErrorCodes.RATE_LIMIT_EXCEEDED:
            return 'Too many requests. Please wait a moment before trying again.'

        case TermsConditionsErrorCodes.SERVER_ERROR:
            return 'Server error occurred. Please try again later.'
    }

    // Handle HTTP status codes
    switch (status) {
        case 400:
            return message || 'Invalid request. Please check your input and try again.'

        case 401:
            return 'Authentication required. Please log in and try again.'

        case 403:
            return 'You do not have permission to perform this action.'

        case 404:
            return 'Terms & Conditions document not found.'

        case 413:
            return 'File size is too large. Maximum size is 10MB.'

        case 415:
            return 'Unsupported file type. Only PDF files are allowed.'

        case 429:
            return 'Too many requests. Please wait a moment before trying again.'

        case 500:
            return 'Server error occurred. Please try again later.'

        case 503:
            return 'Service temporarily unavailable. Please try again later.'

        default:
            return message || 'An unexpected error occurred. Please try again.'
    }
}

/**
 * Check if error is a Terms & Conditions API error
 * 
 * @param error - Error to check
 * @returns True if error is a TermsConditionsApiError
 */
export function isTermsConditionsApiError(error: any): error is TermsConditionsApiError {
    return error && error.name === 'TermsConditionsApiError'
}

/**
 * Get error severity level for UI display
 * 
 * @param error - Error to analyze
 * @returns Severity level: 'error' | 'warning' | 'info'
 */
export function getTermsConditionsErrorSeverity(error: any): 'error' | 'warning' | 'info' {
    const status = error.response?.status
    const errorCode = error.response?.data?.code

    // Warning level errors (user can potentially fix)
    const warningCodes = [
        TermsConditionsErrorCodes.INVALID_FILE_TYPE,
        TermsConditionsErrorCodes.FILE_TOO_LARGE,
        TermsConditionsErrorCodes.VALIDATION_ERROR,
        TermsConditionsErrorCodes.MALWARE_DETECTED
    ]

    const warningStatuses = [400, 413, 415]

    if (warningCodes.includes(errorCode) || warningStatuses.includes(status)) {
        return 'warning'
    }

    // Info level errors (temporary issues)
    const infoCodes = [
        TermsConditionsErrorCodes.RATE_LIMIT_EXCEEDED
    ]

    const infoStatuses = [429, 503]

    if (infoCodes.includes(errorCode) || infoStatuses.includes(status)) {
        return 'info'
    }

    // Default to error level
    return 'error'
}

/**
 * Check if error is retryable
 * 
 * @param error - Error to check
 * @returns True if the operation can be retried
 */
export function isRetryableTermsConditionsError(error: any): boolean {
    const status = error.response?.status
    const errorCode = error.response?.data?.code

    // Retryable error codes
    const retryableCodes = [
        TermsConditionsErrorCodes.UPLOAD_FAILED,
        TermsConditionsErrorCodes.STORAGE_ERROR,
        TermsConditionsErrorCodes.SERVER_ERROR,
        TermsConditionsErrorCodes.RATE_LIMIT_EXCEEDED
    ]

    // Retryable HTTP status codes
    const retryableStatuses = [429, 500, 502, 503, 504]

    return retryableCodes.includes(errorCode) || retryableStatuses.includes(status)
}

/**
 * Get retry delay in milliseconds for retryable errors
 * 
 * @param error - Error to analyze
 * @param attemptNumber - Current retry attempt number (1-based)
 * @returns Delay in milliseconds
 */
export function getTermsConditionsRetryDelay(error: any, attemptNumber: number): number {
    const status = error.response?.status
    const errorCode = error.response?.data?.code

    // Rate limit errors should wait longer
    if (errorCode === TermsConditionsErrorCodes.RATE_LIMIT_EXCEEDED || status === 429) {
        return Math.min(30000, 5000 * attemptNumber) // 5s, 10s, 15s, max 30s
    }

    // Exponential backoff for other retryable errors
    return Math.min(10000, 1000 * Math.pow(2, attemptNumber - 1)) // 1s, 2s, 4s, 8s, max 10s
}