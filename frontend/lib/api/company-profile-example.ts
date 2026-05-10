/**
 * Example usage of CompanyApiService
 * 
 * This file demonstrates how to use the CompanyApiService in different scenarios.
 * It's not meant to be imported in production code, but serves as documentation
 * and can be used for manual testing.
 */

import { companyApiService, CompanyApiService } from './company-profile'
import { CompanyProfileErrorCodes } from '@/lib/types/company-profile'
import type { CompanyProfile, CompanyProfileApiError } from '@/lib/types/company-profile'

/**
 * Example 1: Basic usage with error handling
 */
export async function fetchCompanyProfileExample(companyId: string): Promise<CompanyProfile | null> {
    try {
        const profile = await companyApiService.getPublicCompanyInfo(companyId)
        console.log('Successfully fetched company profile:', profile.name)
        return profile
    } catch (error) {
        const apiError = error as CompanyProfileApiError

        switch (apiError.code) {
            case CompanyProfileErrorCodes.COMPANY_NOT_FOUND:
                console.warn('Company not found:', companyId)
                return null

            case CompanyProfileErrorCodes.ACCESS_DENIED:
                console.error('Access denied for company:', companyId)
                throw new Error('You do not have permission to view this company')

            case CompanyProfileErrorCodes.NETWORK_ERROR:
                console.error('Network error while fetching company profile')
                throw new Error('Please check your internet connection and try again')

            case CompanyProfileErrorCodes.AUTHENTICATION_REQUIRED:
                console.error('Authentication required')
                throw new Error('Please log in to view company profiles')

            default:
                console.error('Unexpected error:', apiError.message)
                throw new Error('An unexpected error occurred while fetching the company profile')
        }
    }
}

/**
 * Example 2: Batch fetching with progress tracking
 */
export async function fetchMultipleCompaniesExample(companyIds: string[]): Promise<{
    successful: CompanyProfile[]
    failed: string[]
    total: number
}> {
    console.log(`Fetching ${companyIds.length} company profiles...`)

    const results = await companyApiService.getMultipleCompanyProfiles(companyIds)
    const successful = results
    const failed = companyIds.filter(id => !results.some(profile => profile.companyId === id))

    console.log(`Successfully fetched ${successful.length}/${companyIds.length} profiles`)

    if (failed.length > 0) {
        console.warn('Failed to fetch profiles for companies:', failed)
    }

    return {
        successful,
        failed,
        total: companyIds.length
    }
}

/**
 * Example 3: Using cache management
 */
export async function fetchWithCacheManagement(companyId: string, forceRefresh = false): Promise<CompanyProfile> {
    if (forceRefresh) {
        // Clear cache for this specific company to force fresh data
        companyApiService.clearCache(companyId)
        console.log('Cache cleared for company:', companyId)
    }

    // Check cache stats before fetching
    const statsBefore = companyApiService.getCacheStats()
    console.log('Cache stats before fetch:', statsBefore)

    const profile = await companyApiService.getPublicCompanyInfo(companyId)

    // Check cache stats after fetching
    const statsAfter = companyApiService.getCacheStats()
    console.log('Cache stats after fetch:', statsAfter)

    return profile
}

/**
 * Example 4: Prefetching for performance optimization
 */
export async function prefetchCompaniesForOrder(orderCompanies: string[]): Promise<void> {
    console.log('Prefetching company profiles for better performance...')

    // Prefetch all companies in parallel
    const prefetchPromises = orderCompanies.map(companyId =>
        companyApiService.prefetchCompanyProfile(companyId)
    )

    await Promise.all(prefetchPromises)

    const cacheStats = companyApiService.getCacheStats()
    console.log(`Prefetched ${cacheStats.size} company profiles`)
}

/**
 * Example 5: Custom service instance with different cache configuration
 */
export function createCustomCompanyService(): CompanyApiService {
    // Create a new instance for specific use cases that might need different caching behavior
    const customService = new CompanyApiService()

    // You could extend this to accept custom cache configuration in the constructor
    // For now, it uses the default configuration

    return customService
}

/**
 * Example 6: Error recovery and retry logic
 */
export async function fetchWithRetry(
    companyId: string,
    maxRetries = 3,
    retryDelay = 1000
): Promise<CompanyProfile> {
    let lastError: CompanyProfileApiError | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Attempt ${attempt}/${maxRetries} to fetch company ${companyId}`)
            return await companyApiService.getPublicCompanyInfo(companyId)
        } catch (error) {
            lastError = error as CompanyProfileApiError

            // Don't retry for certain error types
            if (lastError.code === CompanyProfileErrorCodes.COMPANY_NOT_FOUND ||
                lastError.code === CompanyProfileErrorCodes.ACCESS_DENIED ||
                lastError.code === CompanyProfileErrorCodes.AUTHENTICATION_REQUIRED) {
                throw lastError
            }

            if (attempt < maxRetries) {
                console.log(`Attempt ${attempt} failed, retrying in ${retryDelay}ms...`)
                await new Promise(resolve => setTimeout(resolve, retryDelay))
                retryDelay *= 2 // Exponential backoff
            }
        }
    }

    console.error(`All ${maxRetries} attempts failed for company ${companyId}`)
    throw lastError!
}

/**
 * Example 7: Validation and type checking
 */
export function validateCompanyProfile(profile: any): profile is CompanyProfile {
    // This demonstrates how you might validate a company profile
    // The service already does internal validation, but you might want additional checks

    if (!profile || typeof profile !== 'object') {
        return false
    }

    // Check required fields
    const requiredFields = ['companyId', 'name', 'companyType', 'isAuftraggeber', 'isAuftragnehmer', 'verified', 'createdAt']
    for (const field of requiredFields) {
        if (!(field in profile)) {
            console.warn(`Missing required field: ${field}`)
            return false
        }
    }

    // Check array fields
    if (!Array.isArray(profile.specializations) || !Array.isArray(profile.industries)) {
        console.warn('Specializations and industries must be arrays')
        return false
    }

    // Check boolean fields
    if (typeof profile.isAuftraggeber !== 'boolean' || typeof profile.isAuftragnehmer !== 'boolean') {
        console.warn('Business role flags must be boolean')
        return false
    }

    return true
}

/**
 * Example 8: Performance monitoring
 */
export async function fetchWithPerformanceMonitoring(companyId: string): Promise<{
    profile: CompanyProfile
    metrics: {
        duration: number
        cacheHit: boolean
        cacheSize: number
    }
}> {
    const startTime = performance.now()
    const initialCacheSize = companyApiService.getCacheStats().size

    const profile = await companyApiService.getPublicCompanyInfo(companyId)

    const endTime = performance.now()
    const finalCacheSize = companyApiService.getCacheStats().size

    const metrics = {
        duration: endTime - startTime,
        cacheHit: finalCacheSize === initialCacheSize, // If cache size didn't change, it was a cache hit
        cacheSize: finalCacheSize
    }

    console.log(`Company profile fetch metrics:`, metrics)

    return { profile, metrics }
}