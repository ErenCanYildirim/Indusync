"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { companyApiService } from "@/lib/api/company-profile"
import type {
    CompanyProfile,
    UseCompanyProfileReturn,
    CompanyProfileApiError,
    CompanyProfileErrorCode
} from "@/lib/types/company-profile"

/**
 * Custom React hook for fetching and managing company profile data.
 * 
 * This hook provides comprehensive company profile management functionality including:
 * - Company profile data fetching with loading and error states
 * - Proper data caching and refetch mechanisms
 * - Error handling for various failure scenarios
 * - Loading state management for better UX
 * - Automatic cleanup to prevent memory leaks
 * 
 * Features:
 * - Integrates with CompanyApiService for data fetching and caching
 * - Handles all error scenarios defined in CompanyProfileErrorCodes
 * - Provides refetch functionality for manual data refresh
 * - Tracks refetching state separately from initial loading
 * - Prevents state updates on unmounted components
 * - Supports company ID changes with automatic refetching
 * 
 * @param companyId - The unique identifier of the company to fetch
 * @returns UseCompanyProfileReturn object with profile state and operations
 */
export function useCompanyProfile(companyId: string): UseCompanyProfileReturn {
    // State management
    const [data, setData] = useState<CompanyProfile | null>(null)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isRefetching, setIsRefetching] = useState<boolean>(false)
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

        setData(null)
        setIsError(false)
        setError(null)
    }, [])

    /**
     * Set error state with proper error handling
     */
    const setErrorState = useCallback((err: Error) => {
        if (!isMountedRef.current) return

        console.error("Company profile error:", err)
        setIsError(true)
        setError(err)
        setData(null)
    }, [])

    /**
     * Set success state with company profile data
     */
    const setSuccessState = useCallback((profile: CompanyProfile) => {
        if (!isMountedRef.current) return

        setData(profile)
        setIsError(false)
        setError(null)
    }, [])

    /**
     * Fetch company profile data from the API
     */
    const fetchCompanyProfile = useCallback(async (id: string, isRefetch: boolean = false) => {
        // Validate company ID
        if (!id || typeof id !== 'string' || id.trim() === '') {
            const validationError = new Error('Company ID is required and must be a non-empty string') as CompanyProfileApiError
            validationError.code = 'INVALID_COMPANY_ID'
            setErrorState(validationError)
            setIsLoading(false)
            setIsRefetching(false)
            return
        }

        const trimmedId = id.trim()

        // Set appropriate loading state
        if (isRefetch) {
            setIsRefetching(true)
        } else {
            setIsLoading(true)
            resetState()
        }

        try {
            // Fetch company profile using the API service
            const profile = await companyApiService.getPublicCompanyInfo(trimmedId)

            // Only update state if component is still mounted and ID hasn't changed
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                setSuccessState(profile)
            }
        } catch (err) {
            // Only update error state if component is still mounted and ID hasn't changed
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                const apiError = err as CompanyProfileApiError
                setErrorState(apiError)
            }
        } finally {
            // Clear loading states if component is still mounted
            if (isMountedRef.current && currentCompanyIdRef.current === trimmedId) {
                setIsLoading(false)
                setIsRefetching(false)
            }
        }
    }, [resetState, setErrorState, setSuccessState])

    /**
     * Refetch company profile data manually
     * This function can be called to refresh the data, for example after updates
     */
    const refetch = useCallback(() => {
        if (currentCompanyIdRef.current) {
            fetchCompanyProfile(currentCompanyIdRef.current, true)
        }
    }, [fetchCompanyProfile])

    /**
     * Effect to fetch data when component mounts or company ID changes
     */
    useEffect(() => {
        // Update the current company ID ref
        currentCompanyIdRef.current = companyId

        // Reset mounted flag
        isMountedRef.current = true

        // Fetch company profile data
        fetchCompanyProfile(companyId, false)

        // Cleanup function to prevent state updates after unmount
        return () => {
            isMountedRef.current = false
        }
    }, [companyId, fetchCompanyProfile])

    /**
     * Cleanup effect to set mounted flag to false on unmount
     */
    useEffect(() => {
        return () => {
            isMountedRef.current = false
        }
    }, [])

    return {
        data,
        isLoading,
        isRefetching,
        isError,
        error,
        refetch
    }
}

/**
 * Export default for convenience
 */
export default useCompanyProfile