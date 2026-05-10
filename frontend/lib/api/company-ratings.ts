import { apiClient } from './client'
import type {
    CompanyRatingsSummary,
    ProjectReviewSummary,
    OrderReviewDetails,
    PaginatedProjectReviews,
    RatingsApiError
} from '@/lib/types/company-ratings'

/**
 * Error codes for company ratings API operations
 */
export const CompanyRatingsErrorCodes = {
    INVALID_COMPANY_ID: 'INVALID_COMPANY_ID',
    COMPANY_NOT_FOUND: 'COMPANY_NOT_FOUND',
    INVALID_ORDER_ID: 'INVALID_ORDER_ID',
    ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
    ACCESS_DENIED: 'ACCESS_DENIED',
    AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
    NO_DATA_RECEIVED: 'NO_DATA_RECEIVED',
    INVALID_RESPONSE_DATA: 'INVALID_RESPONSE_DATA',
    NETWORK_ERROR: 'NETWORK_ERROR',
    REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    SERVER_ERROR: 'SERVER_ERROR',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const

export type CompanyRatingsErrorCode = typeof CompanyRatingsErrorCodes[keyof typeof CompanyRatingsErrorCodes]

/**
 * Cache configuration for company ratings data
 */
interface RatingsCacheConfig {
    /** Time to live in milliseconds */
    ttl: number
    /** Maximum number of cached entries */
    maxSize: number
}

/**
 * Cached ratings data structure
 */
interface CachedRatingsData<T> {
    data: T
    timestamp: number
    expiresAt: number
}

/**
 * Company Ratings API Service
 * 
 * This service handles all API operations related to company ratings and reviews.
 * It includes proper error handling, request caching, and TypeScript types
 * for API responses and error states.
 */
export class CompanyRatingsApiService {
    private summaryCache = new Map<string, CachedRatingsData<CompanyRatingsSummary>>()
    private projectsCache = new Map<string, CachedRatingsData<PaginatedProjectReviews>>()
    private detailsCache = new Map<string, CachedRatingsData<OrderReviewDetails>>()

    private readonly cacheConfig: RatingsCacheConfig = {
        ttl: 5 * 60 * 1000, // 5 minutes
        maxSize: 100 // Maximum 100 cached entries per cache type
    }

    /**
     * Get company ratings summary including overall rating and category breakdowns
     * 
     * @param companyId - The unique identifier of the company
     * @returns Promise<CompanyRatingsSummary> - Complete company ratings summary
     * @throws RatingsApiError - For various error scenarios
     */
    async getCompanyRatingsSummary(companyId: string): Promise<CompanyRatingsSummary> {
        // Input validation
        if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
            const error = new Error('Company ID is required and must be a non-empty string') as unknown as RatingsApiError
            error.code = CompanyRatingsErrorCodes.INVALID_COMPANY_ID
            error.status = 400
            throw error
        }

        const trimmedCompanyId = companyId.trim()

        // Check cache first
        const cachedSummary = this.getCachedData(this.summaryCache, trimmedCompanyId)
        if (cachedSummary) {
            return cachedSummary
        }

        try {
            // Make API request to get company ratings summary
            const response = await apiClient.get(`/companies/${trimmedCompanyId}/ratings`)

            // Validate response data
            if (!response.data) {
                const error = new Error('No ratings data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.NO_DATA_RECEIVED
                error.status = response.status
                throw error
            }

            const ratingsSummary: CompanyRatingsSummary = response.data

            // Validate required fields
            if (!this.isValidRatingsSummary(ratingsSummary)) {
                const error = new Error('Invalid ratings summary data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.INVALID_RESPONSE_DATA
                error.status = response.status
                error.details = { receivedData: ratingsSummary }
                throw error
            }

            // Cache the successful response
            this.setCachedData(this.summaryCache, trimmedCompanyId, ratingsSummary)

            return ratingsSummary

        } catch (error: any) {
            throw this.handleApiError(error, trimmedCompanyId, 'ratings summary')
        }
    }

    /**
     * Get paginated list of company project reviews
     * 
     * @param companyId - The unique identifier of the company
     * @param page - Page number (0-based)
     * @param size - Number of items per page
     * @returns Promise<PaginatedProjectReviews> - Paginated project reviews
     * @throws RatingsApiError - For various error scenarios
     */
    async getCompanyProjectReviews(
        companyId: string,
        page: number = 0,
        size: number = 10
    ): Promise<PaginatedProjectReviews> {
        // Input validation
        if (!companyId || typeof companyId !== 'string' || companyId.trim() === '') {
            const error = new Error('Company ID is required and must be a non-empty string') as unknown as RatingsApiError
            error.code = CompanyRatingsErrorCodes.INVALID_COMPANY_ID
            error.status = 400
            throw error
        }

        if (page < 0 || size <= 0 || size > 100) {
            const error = new Error('Invalid pagination parameters') as unknown as RatingsApiError
            error.code = CompanyRatingsErrorCodes.INVALID_COMPANY_ID
            error.status = 400
            error.details = { page, size }
            throw error
        }

        const trimmedCompanyId = companyId.trim()
        const cacheKey = `${trimmedCompanyId}-${page}-${size}`

        // Check cache first
        const cachedProjects = this.getCachedData(this.projectsCache, cacheKey)
        if (cachedProjects) {
            return cachedProjects
        }

        try {
            // Make API request to get company project reviews
            const response = await apiClient.get(`/companies/${trimmedCompanyId}/project-reviews`, {
                params: { page, size }
            })

            // Validate response data
            if (!response.data) {
                const error = new Error('No project reviews data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.NO_DATA_RECEIVED
                error.status = response.status
                throw error
            }

            const projectReviews: PaginatedProjectReviews = response.data

            // Validate required fields
            if (!this.isValidPaginatedProjectReviews(projectReviews)) {
                const error = new Error('Invalid project reviews data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.INVALID_RESPONSE_DATA
                error.status = response.status
                error.details = { receivedData: projectReviews }
                throw error
            }

            // Cache the successful response
            this.setCachedData(this.projectsCache, cacheKey, projectReviews)

            return projectReviews

        } catch (error: any) {
            throw this.handleApiError(error, trimmedCompanyId, 'project reviews')
        }
    }

    /**
     * Get detailed review information for a specific order
     * 
     * @param orderId - The unique identifier of the order
     * @returns Promise<OrderReviewDetails> - Detailed review information
     * @throws RatingsApiError - For various error scenarios
     */
    async getOrderReviewDetails(orderId: string): Promise<OrderReviewDetails> {
        // Input validation
        if (!orderId || typeof orderId !== 'string' || orderId.trim() === '') {
            const error = new Error('Order ID is required and must be a non-empty string') as unknown as RatingsApiError
            error.code = CompanyRatingsErrorCodes.INVALID_ORDER_ID
            error.status = 400
            throw error
        }

        const trimmedOrderId = orderId.trim()

        // Check cache first
        const cachedDetails = this.getCachedData(this.detailsCache, trimmedOrderId)
        if (cachedDetails) {
            return cachedDetails
        }

        try {
            // Make API request to get order review details
            const response = await apiClient.get(`/orders/${trimmedOrderId}/reviews`)

            // Validate response data
            if (!response.data) {
                const error = new Error('No review details data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.NO_DATA_RECEIVED
                error.status = response.status
                throw error
            }

            const reviewDetails: OrderReviewDetails = response.data

            // Validate required fields
            if (!this.isValidOrderReviewDetails(reviewDetails)) {
                const error = new Error('Invalid review details data received from server') as unknown as RatingsApiError
                error.code = CompanyRatingsErrorCodes.INVALID_RESPONSE_DATA
                error.status = response.status
                error.details = { receivedData: reviewDetails }
                throw error
            }

            // Cache the successful response
            this.setCachedData(this.detailsCache, trimmedOrderId, reviewDetails)

            return reviewDetails

        } catch (error: any) {
            throw this.handleApiError(error, trimmedOrderId, 'review details')
        }
    }

    /**
     * Clear cached data for better performance management
     * 
     * @param type - Type of cache to clear ('summary', 'projects', 'details', or 'all')
     * @param key - Optional specific key to clear
     */
    clearCache(type: 'summary' | 'projects' | 'details' | 'all' = 'all', key?: string): void {
        if (type === 'all') {
            this.summaryCache.clear()
            this.projectsCache.clear()
            this.detailsCache.clear()
        } else if (type === 'summary') {
            if (key) {
                this.summaryCache.delete(key)
            } else {
                this.summaryCache.clear()
            }
        } else if (type === 'projects') {
            if (key) {
                this.projectsCache.delete(key)
            } else {
                this.projectsCache.clear()
            }
        } else if (type === 'details') {
            if (key) {
                this.detailsCache.delete(key)
            } else {
                this.detailsCache.clear()
            }
        }
    }

    /**
     * Get cache statistics for debugging and monitoring
     */
    getCacheStats() {
        return {
            summary: {
                size: this.summaryCache.size,
                maxSize: this.cacheConfig.maxSize,
                entries: Array.from(this.summaryCache.keys())
            },
            projects: {
                size: this.projectsCache.size,
                maxSize: this.cacheConfig.maxSize,
                entries: Array.from(this.projectsCache.keys())
            },
            details: {
                size: this.detailsCache.size,
                maxSize: this.cacheConfig.maxSize,
                entries: Array.from(this.detailsCache.keys())
            }
        }
    }

    /**
     * Prefetch company ratings data for better performance
     * 
     * @param companyId - Company ID to prefetch
     * @returns Promise<void> - Resolves when prefetch is complete
     */
    async prefetchCompanyRatings(companyId: string): Promise<void> {
        try {
            // Prefetch summary and first page of projects in parallel
            await Promise.all([
                this.getCompanyRatingsSummary(companyId),
                this.getCompanyProjectReviews(companyId, 0, 10)
            ])
        } catch (error) {
            // Silently fail prefetch operations to avoid disrupting user experience
            console.warn(`Failed to prefetch company ratings for ID: ${companyId}`, error)
        }
    }

    /**
     * Get cached data if available and not expired
     */
    private getCachedData<T>(cache: Map<string, CachedRatingsData<T>>, key: string): T | null {
        const cached = cache.get(key)

        if (!cached) {
            return null
        }

        // Check if cache entry has expired
        if (Date.now() > cached.expiresAt) {
            cache.delete(key)
            return null
        }

        return cached.data
    }

    /**
     * Cache data with expiration and LRU behavior
     */
    private setCachedData<T>(cache: Map<string, CachedRatingsData<T>>, key: string, data: T): void {
        // Implement LRU cache behavior - remove oldest entries if cache is full
        if (cache.size >= this.cacheConfig.maxSize) {
            const oldestKey = cache.keys().next().value
            if (oldestKey) {
                cache.delete(oldestKey)
            }
        }

        const now = Date.now()
        cache.set(key, {
            data,
            timestamp: now,
            expiresAt: now + this.cacheConfig.ttl
        })
    }

    /**
     * Validate company ratings summary data structure
     */
    private isValidRatingsSummary(summary: any): summary is CompanyRatingsSummary {
        return !!(
            summary &&
            typeof summary === 'object' &&
            summary.companyId &&
            typeof summary.companyId === 'string' &&
            typeof summary.totalReviews === 'number' &&
            typeof summary.completedOrders === 'number' &&
            summary.categoryRatings &&
            typeof summary.categoryRatings === 'object' &&
            Array.isArray(summary.recentProjects)
        )
    }

    /**
     * Validate paginated project reviews data structure
     */
    private isValidPaginatedProjectReviews(projects: any): projects is PaginatedProjectReviews {
        return !!(
            projects &&
            typeof projects === 'object' &&
            Array.isArray(projects.content) &&
            typeof projects.page === 'number' &&
            typeof projects.size === 'number' &&
            typeof projects.totalElements === 'number' &&
            typeof projects.totalPages === 'number' &&
            typeof projects.first === 'boolean' &&
            typeof projects.last === 'boolean'
        )
    }

    /**
     * Validate order review details data structure
     */
    private isValidOrderReviewDetails(details: any): details is OrderReviewDetails {
        return !!(
            details &&
            typeof details === 'object' &&
            details.orderId &&
            typeof details.orderId === 'string' &&
            details.projectName &&
            typeof details.projectName === 'string' &&
            details.completionDate &&
            typeof details.completionDate === 'string' &&
            Array.isArray(details.reviews)
        )
    }

    /**
     * Handle API errors with proper error transformation
     */
    private handleApiError(error: any, identifier: string, operation: string): RatingsApiError {
        if (error.response) {
            // Server responded with error status
            const apiError = new Error(this.getErrorMessage(error)) as unknown as RatingsApiError
            apiError.status = error.response.status
            apiError.code = this.getErrorCode(error)
            apiError.details = {
                identifier,
                operation,
                responseData: error.response.data,
                responseStatus: error.response.status
            }

            // Handle specific HTTP status codes
            switch (error.response.status) {
                case 404:
                    if (operation === 'review details') {
                        apiError.message = `Order with ID '${identifier}' not found`
                        apiError.code = CompanyRatingsErrorCodes.ORDER_NOT_FOUND
                    } else {
                        apiError.message = `Company with ID '${identifier}' not found`
                        apiError.code = CompanyRatingsErrorCodes.COMPANY_NOT_FOUND
                    }
                    break
                case 403:
                    apiError.message = `Access denied: You do not have permission to view ${operation}`
                    apiError.code = CompanyRatingsErrorCodes.ACCESS_DENIED
                    break
                case 401:
                    apiError.message = `Authentication required to view ${operation}`
                    apiError.code = CompanyRatingsErrorCodes.AUTHENTICATION_REQUIRED
                    break
                case 429:
                    apiError.message = 'Too many requests. Please try again later'
                    apiError.code = CompanyRatingsErrorCodes.RATE_LIMIT_EXCEEDED
                    break
                case 500:
                    apiError.message = `Server error occurred while fetching ${operation}`
                    apiError.code = CompanyRatingsErrorCodes.SERVER_ERROR
                    break
            }

            return apiError
        } else if (error.request) {
            // Network error - no response received
            const networkError = new Error('Network error: Unable to connect to server') as unknown as RatingsApiError
            networkError.code = CompanyRatingsErrorCodes.NETWORK_ERROR
            networkError.details = {
                identifier,
                operation,
                requestConfig: error.config
            }
            return networkError
        } else if (error.code === 'ECONNABORTED') {
            // Request timeout
            const timeoutError = new Error('Request timeout: Server took too long to respond') as unknown as RatingsApiError
            timeoutError.code = CompanyRatingsErrorCodes.REQUEST_TIMEOUT
            timeoutError.details = { identifier, operation }
            return timeoutError
        } else {
            // Re-throw validation errors and other custom errors
            if (error.code && Object.values(CompanyRatingsErrorCodes).includes(error.code as CompanyRatingsErrorCode)) {
                return error
            }

            // Unknown error
            const unknownError = new Error(`Unknown error occurred while fetching ${operation}: ${error.message}`) as unknown as RatingsApiError
            unknownError.code = CompanyRatingsErrorCodes.UNKNOWN_ERROR
            unknownError.details = {
                identifier,
                operation,
                originalError: error
            }
            return unknownError
        }
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
        return CompanyRatingsErrorCodes.UNKNOWN_ERROR
    }
}

/**
 * Default instance of CompanyRatingsApiService for use throughout the application
 */
export const companyRatingsApiService = new CompanyRatingsApiService()

/**
 * Export default instance for convenience
 */
export default companyRatingsApiService