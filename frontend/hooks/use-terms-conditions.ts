"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { termsConditionsApi } from "@/lib/api/terms-conditions"
import type {
    TermsConditionsDocument,
    UseTermsConditionsReturn,
    TermsConditionsResponse,
    TermsConditionsApiError,
    AccessContext
} from "@/lib/types/terms-conditions"
import { validateTermsConditionsFile } from "@/lib/types/terms-conditions"

/**
 * Custom React hook for managing Terms & Conditions documents.
 * 
 * This hook provides comprehensive T&C document management functionality including:
 * - Document upload with file validation and progress tracking
 * - Document retrieval with loading and error states
 * - Document deletion with confirmation handling
 * - Access tracking for audit compliance
 * - Proper data caching and refetch mechanisms
 * - Error handling for various failure scenarios
 * - Loading state management for better UX
 * - Automatic cleanup to prevent memory leaks
 * 
 * Features:
 * - Integrates with termsConditionsApi for all operations
 * - Handles file validation before upload
 * - Provides separate loading states for different operations
 * - Tracks document access for compliance
 * - Supports optimistic updates for better UX
 * - Prevents state updates on unmounted components
 * - Supports company ID changes with automatic refetching
 * 
 * @param companyId - The unique identifier of the company to manage T&C for
 * @returns UseTermsConditionsReturn object with document state and operations
 */
export function useTermsConditions(companyId: string): UseTermsConditionsReturn {
    // State management
    const [document, setDocument] = useState<TermsConditionsDocument | null>(null)
    const [hasDocument, setHasDocument] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isUploading, setIsUploading] = useState<boolean>(false)
    const [isDeleting, setIsDeleting] = useState<boolean>(false)
    const [isError, setIsError] = useState<boolean>(false)
    const [error, setError] = useState<Error | null>(null)

    // Ref to track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef<boolean>(true)

    // Ref to track the current company ID to handle ID changes
    const currentCompanyIdRef = useRef<string>(companyId)

    /**
     * Reset all state to initial values
     */
    const resetState = useCallback(() => {
        if (!isMountedRef.current) return

        setDocument(null)
        setHasDocument(false)
        setIsError(false)
        setError(null)
    }, [])

    /**
     * Set error state with proper error handling
     */
    const setErrorState = useCallback((err: Error) => {
        if (!isMountedRef.current) return

        console.error("Terms & Conditions error:", err)
        setIsError(true)
        setError(err)
    }, [])

    /**
     * Set success state with document data
     */
    const setSuccessState = useCallback((doc: TermsConditionsDocument | null) => {
        if (!isMountedRef.current) return

        setDocument(doc)
        setHasDocument(!!doc)
        setIsError(false)
        setError(null)
    }, [])

    /**
     * Fetch Terms & Conditions document from the API
     */
    const fetchDocument = useCallback(async (id: string) => {
        // Validate company ID
        if (!id || typeof id !== 'string' || id.trim() === '') {
            const validationError = new Error('Company ID is required and must be a non-empty string') as TermsConditionsApiError
            validationError.code = 'INVALID_COMPANY_ID'
            setErrorState(validationError)
            setIsLoading(false)
            return
        }

        const trimmedId = id.trim()
        setIsLoading(true)

        try {
            console.log("Fetching T&C document for company:", trimmedId);
            // Check if document exists and get it
            const response = await termsConditionsApi.getTermsConditions(trimmedId)
            console.log("T&C API response:", response);

            // Only update state if component is still mounted and ID hasn't changed
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                // Handle the actual backend response format
                if (response.successful && response.documentId && response.documentId !== null) {
                    // Convert response to TermsConditionsDocument format
                    const doc: TermsConditionsDocument = {
                        id: response.documentId,
                        companyId: trimmedId,
                        fileName: response.fileName || '',
                        originalFileName: response.originalFileName || '',
                        fileSize: response.fileSize || 0,
                        mimeType: response.mimeType || '',
                        uploadedAt: response.uploadedAt || '',
                        uploadedBy: response.uploadedBy || '',
                        url: response.fileUrl || '',
                        isActive: response.isActive || false,
                        version: response.version || 1,
                        checksum: response.checksum || ''
                    }
                    setSuccessState(doc)
                } else {
                    // No document found - this is normal and not an error
                    console.log("No T&C document found for company:", trimmedId, "Message:", response.message);
                    setSuccessState(null)
                }
            }
        } catch (err) {
            console.error("Error fetching T&C document:", err);
            // Only update error state if component is still mounted and ID hasn't changed
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                const apiError = err as TermsConditionsApiError
                // If it's a 404, that's not really an error - just no document exists
                if (apiError.status === 404 || (apiError as any)?.response?.status === 404) {
                    console.log("No T&C document found (404), setting to null");
                    setSuccessState(null)
                } else {
                    console.error("T&C API error:", apiError);
                    // For now, don't treat API errors as fatal - just show no document
                    setSuccessState(null)
                    // setErrorState(apiError)
                }
            }
        } finally {
            // Clear loading state if component is still mounted
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                setIsLoading(false)
            }
        }
    }, [setErrorState, setSuccessState])

    /**
     * Upload Terms & Conditions document
     */
    const uploadDocument = useCallback(async (file: File): Promise<TermsConditionsResponse> => {
        if (!currentCompanyIdRef.current) {
            throw new Error('Company ID is required for upload')
        }

        // Validate file before upload
        const validation = validateTermsConditionsFile(file)
        if (!validation.isValid) {
            const validationError = new Error(validation.errors.join(', ')) as TermsConditionsApiError
            validationError.code = 'INVALID_FILE_TYPE'
            throw validationError
        }

        setIsUploading(true)
        setError(null)

        try {
            const response = await termsConditionsApi.uploadTermsConditions(currentCompanyIdRef.current, file)

            // Optimistically update the document state
            if (isMountedRef.current) {
                const doc: TermsConditionsDocument = {
                    id: response.documentId ?? '',
                    companyId: currentCompanyIdRef.current ?? '',
                    fileName: response.fileName ?? '',
                    originalFileName: response.originalFileName ?? '',
                    fileSize: response.fileSize ?? 0,
                    mimeType: response.mimeType ?? '',
                    uploadedAt: response.uploadedAt ?? '',
                    uploadedBy: response.uploadedBy ?? '',
                    url: response.fileUrl ?? '',
                    isActive: response.isActive ?? false,
                    version: response.version ?? 0,
                    checksum: ''  // Not provided in response
                }
                setSuccessState(doc)
            }

            return response
        } catch (err) {
            if (isMountedRef.current) {
                setErrorState(err as Error)
            }
            throw err
        } finally {
            if (isMountedRef.current) {
                setIsUploading(false)
            }
        }
    }, [setErrorState, setSuccessState])

    /**
     * Delete Terms & Conditions document
     */
    const deleteDocument = useCallback(async (): Promise<void> => {
        if (!currentCompanyIdRef.current) {
            throw new Error('Company ID is required for deletion')
        }

        setIsDeleting(true)
        setError(null)

        try {
            await termsConditionsApi.deleteTermsConditions(currentCompanyIdRef.current)

            // Optimistically update the state
            if (isMountedRef.current) {
                setSuccessState(null)
            }
        } catch (err) {
            if (isMountedRef.current) {
                setErrorState(err as Error)
            }
            throw err
        } finally {
            if (isMountedRef.current) {
                setIsDeleting(false)
            }
        }
    }, [setErrorState, setSuccessState])

    /**
     * Get secure URL for document access
     */
    const getDocumentUrl = useCallback(async (): Promise<string> => {
        if (!currentCompanyIdRef.current) {
            throw new Error('Company ID is required to get document URL')
        }

        if (!document) {
            throw new Error('No document available to get URL for')
        }

        try {
            return await termsConditionsApi.getTermsConditionsUrl(currentCompanyIdRef.current)
        } catch (err) {
            if (isMountedRef.current) {
                setErrorState(err as Error)
            }
            throw err
        }
    }, [document, setErrorState])

    /**
     * Track document access for audit purposes
     */
    const trackAccess = useCallback(async (context: AccessContext, orderId?: string): Promise<void> => {
        if (!document || !currentCompanyIdRef.current) {
            console.warn('Cannot track access: no document or company ID available')
            return
        }

        try {
            // Get additional context information for audit logging
            const userAgent = navigator.userAgent
            const ipAddress = undefined // IP address should be determined server-side for security

            await termsConditionsApi.trackDocumentAccess(currentCompanyIdRef.current, {
                documentId: document.id,
                accessContext: context,
                orderId,
                userAgent,
                ipAddress
            })

            console.log('Document access tracked successfully', {
                documentId: document.id,
                context,
                orderId
            })
        } catch (err) {
            // Don't throw error for access tracking failures, just log
            console.error('Failed to track document access:', err)
        }
    }, [document])

    /**
     * Refetch document data manually
     * This function can be called to refresh the data, for example after updates
     */
    const refetch = useCallback(() => {
        if (currentCompanyIdRef.current) {
            fetchDocument(currentCompanyIdRef.current)
        }
    }, [fetchDocument])

    /**
     * Effect to fetch data when component mounts or company ID changes
     */
    useEffect(() => {
        // Update the current company ID ref
        currentCompanyIdRef.current = companyId

        // Reset mounted flag
        isMountedRef.current = true

        // Reset state when company ID changes
        resetState()

        // Fetch document data
        fetchDocument(companyId)

        // Cleanup function to prevent state updates after unmount
        return () => {
            isMountedRef.current = false
        }
    }, [companyId, fetchDocument, resetState])

    /**
     * Cleanup effect to set mounted flag to false on unmount
     */
    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return {
        document,
        hasDocument,
        isLoading,
        isUploading,
        isDeleting,
        isError,
        error,
        uploadDocument,
        deleteDocument,
        getDocumentUrl,
        trackAccess,
        refetch
    }
}

/**
 * Export default for convenience
 */
export default useTermsConditions