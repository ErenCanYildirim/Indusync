import { apiClient } from './client'
import { CompanyProfileErrorCodes } from '@/lib/types/company-profile'
import type {
    CompanyProfile,
    CompanyProfileResponse,
    CompanyProfileLoadingState,
    CompanyProfileApiError,
    CompanyProfileCacheConfig,
    CachedCompanyProfile,
    CompanyProfileCacheStats,
    CompanyProfileErrorCode
} from '@/lib/types/company-profile'

/**
 * Company Profile API Service
 * 
 * This service handles all API operations related to viewing company profiles.
 * It includes proper error handling, request caching, and TypeScript types
 * for API responses and error states.
 */
export class CompanyApiService {
    private cache = new Map<string, CachedCompanyProfile>()
    private readonly cacheConfig: CompanyProfileCacheConfig = {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100 // Maximum 100 cached profiles
    }

    /**
     * Get public company information by company ID
     * 
     * @param companyId - The unique identifier of the company
     * @returns Promise<CompanyProfile> - Complete company profile data
     * @throws CompanyProfileApiError - For various error scenarios
     */
    async getPublicCompanyInfo(companyId: string): Promise<CompanyProfile> {
        // Input validation
        if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
            const error = new Error('Company ID is required and must be a non-empty string') as CompanyProfileApiError
            error.code = CompanyProfileErrorCodes.INVALID_COMPANY_ID
            error.status = 400
            throw error
        }

        const trimmedCompanyId = companyId.trim()

        // Check cache first
        const cachedProfile = this.getCachedProfile(trimmedCompanyId)
        if (cachedProfile) {
            return cachedProfile
        }

        try {
            // Make API request to get public company information
            const response = await apiClient.get(`/companies/${trimmedCompanyId}/public`)

            // Validate response data
            if (!response.data) {
                const error = new Error('No company data received from server') as CompanyProfileApiError
                error.code = CompanyProfileErrorCodes.NO_DATA_RECEIVED
                error.status = response.status
                throw error
            }

            const companyProfile: CompanyProfile = response.data

            // Validate required fields
            if (!this.isValidCompanyProfile(companyProfile)) {
                const error = new Error('Invalid company profile data received from server') as CompanyProfileApiError
                error.code = CompanyProfileErrorCodes.INVALID_PROFILE_DATA
                error.status = response.status
                error.details = { receivedData: companyProfile }
                throw error
            }

            // Cache the successful response
            this.setCachedProfile(trimmedCompanyId, companyProfile)

            return companyProfile

        } catch (error: any) {
            // Handle different types of errors
            if (error.response) {
                // Server responded with error status
                const apiError = new Error(this.getErrorMessage(error)) as CompanyProfileApiError
                apiError.status = error.response.status
                apiError.code = this.getErrorCode(error)
                apiError.details = {
                    companyId: trimmedCompanyId,
                    responseData: error.response.data,
                    responseStatus: error.response.status
                }

                // Handle specific HTTP status codes
                switch (error.response.status) {
                    case 404:
                        apiError.message = `Company with ID '${trimmedCompanyId}' not found`
                        apiError.code = CompanyProfileErrorCodes.COMPANY_NOT_FOUND
                        break
                    case 403:
                        apiError.message = 'Access denied: You do not have permission to view this company profile'
                        apiError.code = CompanyProfileErrorCodes.ACCESS_DENIED
                        break
                    case 401:
                        apiError.message = 'Authentication required to view company profiles'
                        apiError.code = CompanyProfileErrorCodes.AUTHENTICATION_REQUIRED
                        break
                    case 429:
                        apiError.message = 'Too many requests. Please try again later'
                        apiError.code = CompanyProfileErrorCodes.RATE_LIMIT_EXCEEDED
                        break
                    case 500:
                        apiError.message = 'Server error occurred while fetching company profile'
                        apiError.code = CompanyProfileErrorCodes.SERVER_ERROR
                        break
                }

                throw apiError
            } else if (error.request) {
                // Network error - no response received
                const networkError = new Error('Network error: Unable to connect to server') as CompanyProfileApiError
                networkError.code = CompanyProfileErrorCodes.NETWORK_ERROR
                networkError.details = {
                    companyId: trimmedCompanyId,
                    requestConfig: error.config
                }
                throw networkError
            } else if (error.code === 'ECONNABORTED') {
                // Request timeout
                const timeoutError = new Error('Request timeout: Server took too long to respond') as CompanyProfileApiError
                timeoutError.code = CompanyProfileErrorCodes.REQUEST_TIMEOUT
                timeoutError.details = { companyId: trimmedCompanyId }
                throw timeoutError
            } else {
                // Re-throw validation errors and other custom errors
                if (error.code && Object.values(CompanyProfileErrorCodes).includes(error.code as CompanyProfileErrorCode)) {
                    throw error
                }

                // Unknown error
                const unknownError = new Error(`Unknown error occurred while fetching company profile: ${error.message}`) as CompanyProfileApiError
                unknownError.code = CompanyProfileErrorCodes.UNKNOWN_ERROR
                unknownError.details = {
                    companyId: trimmedCompanyId,
                    originalError: error
                }
                throw unknownError
            }
        }
    }

    /**
     * Clear cached company profile data
     * 
     * @param companyId - Optional company ID to clear specific cache entry
     */
    clearCache(companyId?: string): void {
        if (companyId) {
            this.cache.delete(companyId)
        } else {
            this.cache.clear()
        }
    }

    /**
     * Get cache statistics for debugging
     */
    getCacheStats(): CompanyProfileCacheStats {
        return {
            size: this.cache.size,
            maxSize: this.cacheConfig.maxSize,
            entries: Array.from(this.cache.keys())
        }
    }

    /**
     * Prefetch company profile data for better performance
     * 
     * @param companyId - Company ID to prefetch
     * @returns Promise<void> - Resolves when prefetch is complete
     */
    async prefetchCompanyProfile(companyId: string): Promise<void> {
        try {
            await this.getPublicCompanyInfo(companyId)
        } catch (error) {
            // Silently fail prefetch operations to avoid disrupting user experience
            console.warn(`Failed to prefetch company profile for ID: ${companyId}`, error)
        }
    }

    /**
     * Batch fetch multiple company profiles
     * 
     * @param companyIds - Array of company IDs to fetch
     * @returns Promise<CompanyProfile[]> - Array of company profiles (may be partial if some fail)
     */
    async getMultipleCompanyProfiles(companyIds: string[]): Promise<CompanyProfile[]> {
        if (!Array.isArray(companyIds) || companyIds.length === 0) {
            return []
        }

        const promises = companyIds.map(async (id) => {
            try {
                return await this.getPublicCompanyInfo(id)
            } catch (error) {
                console.warn(`Failed to fetch company profile for ID: ${id}`, error)
                return null
            }
        })

        const results = await Promise.all(promises)
        return results.filter((profile): profile is CompanyProfile => profile !== null)
    }

    /**
     * Get cached company profile if available and not expired
     */
    private getCachedProfile(companyId: string): CompanyProfile | null {
        const cached = this.cache.get(companyId)

        if (!cached) {
            return null
        }

        // Check if cache entry has expired
        if (Date.now() > cached.expiresAt) {
            this.cache.delete(companyId)
            return null
        }

        return cached.data
    }

    /**
     * Cache company profile data with expiration
     */
    private setCachedProfile(companyId: string, profile: CompanyProfile): void {
        // Implement LRU cache behavior - remove oldest entries if cache is full
        if (this.cache.size >= this.cacheConfig.maxSize) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey) {
                this.cache.delete(oldestKey)
            }
        }

        const now = Date.now()
        this.cache.set(companyId, {
            data: profile,
            timestamp: now,
            expiresAt: now + this.cacheConfig.ttl
        })
    }

    /**
     * Validate company profile data structure
     */
    private isValidCompanyProfile(profile: any): profile is CompanyProfile {
        return !!(
            profile &&
            typeof profile === 'object' &&
            profile.companyId &&
            typeof profile.companyId === 'string' &&
            profile.name &&
            typeof profile.name === 'string' &&
            profile.companyType &&
            typeof profile.companyType === 'string' &&
            typeof profile.isAuftraggeber === 'boolean' &&
            typeof profile.isAuftragnehmer === 'boolean' &&
            Array.isArray(profile.specializations) &&
            Array.isArray(profile.industries) &&
            typeof profile.verified === 'boolean' &&
            profile.createdAt &&
            typeof profile.createdAt === 'string'
        )
    }

    /**
     * Extract error message from API error response
     */
    private getErrorMessage(error: any): string {
        if (error.response?.data?.message) {
            return error.response.data.message
        }
        if (error.response?.data?.error) {
            return error.response.data.error
        }
        if (error.message) {
            return error.message
        }
        return 'An unknown error occurred'
    }

    /**
     * Extract error code from API error response
     */
    private getErrorCode(error: any): string {
        if (error.response?.data?.code) {
            return error.response.data.code
        }
        if (error.code) {
            return error.code
        }
        return 'UNKNOWN_ERROR'
    }
}

/**
 * Default instance of CompanyApiService for use throughout the application
 */
export const companyApiService = new CompanyApiService()

/**
 * Export default instance for convenience
 */
export default companyApiService