/**
 * Example usage of CompanyRatingsApiService
 * This file demonstrates how to use the company ratings API service
 */

import { companyRatingsApiService, CompanyRatingsErrorCodes } from './company-ratings'
import type { RatingsApiError } from '@/lib/types/company-ratings'

/**
 * Example: Fetch company ratings summary
 */
export async function fetchCompanyRatingsExample(companyId: string) {
    try {
        // Get company ratings summary
        const summary = await companyRatingsApiService.getCompanyRatingsSummary(companyId)

        console.log('Company Ratings Summary:', {
            companyId: summary.companyId,
            overallRating: summary.overallRating,
            totalReviews: summary.totalReviews,
            completedOrders: summary.completedOrders,
            categoryCount: Object.keys(summary.categoryRatings).length,
            recentProjectsCount: summary.recentProjects.length
        })

        return summary
    } catch (error) {
        const ratingsError = error as RatingsApiError

        switch (ratingsError.code) {
            case CompanyRatingsErrorCodes.COMPANY_NOT_FOUND:
                console.error('Company not found:', ratingsError.message)
                break
            case CompanyRatingsErrorCodes.ACCESS_DENIED:
                console.error('Access denied:', ratingsError.message)
                break
            case CompanyRatingsErrorCodes.NETWORK_ERROR:
                console.error('Network error:', ratingsError.message)
                break
            default:
                console.error('Unknown error:', ratingsError.message)
        }

        throw error
    }
}

/**
 * Example: Fetch company project reviews with pagination
 */
export async function fetchCompanyProjectsExample(companyId: string, page: number = 0) {
    try {
        // Get paginated project reviews
        const projects = await companyRatingsApiService.getCompanyProjectReviews(companyId, page, 10)

        console.log('Company Project Reviews:', {
            companyId,
            page: projects.page,
            totalElements: projects.totalElements,
            totalPages: projects.totalPages,
            projectsCount: projects.content.length,
            isFirstPage: projects.first,
            isLastPage: projects.last
        })

        // Log each project summary
        projects.content.forEach((project, index) => {
            console.log(`Project ${index + 1}:`, {
                orderId: project.orderId,
                projectName: project.projectName,
                overallRating: project.overallRating,
                companyRole: project.companyRole,
                reviewerCompany: project.reviewerCompanyName
            })
        })

        return projects
    } catch (error) {
        const ratingsError = error as RatingsApiError
        console.error('Error fetching project reviews:', ratingsError.message)
        throw error
    }
}

/**
 * Example: Fetch detailed review information for an order
 */
export async function fetchOrderReviewDetailsExample(orderId: string) {
    try {
        // Get detailed review information
        const details = await companyRatingsApiService.getOrderReviewDetails(orderId)

        console.log('Order Review Details:', {
            orderId: details.orderId,
            projectName: details.projectName,
            completionDate: details.completionDate,
            reviewsCount: details.reviews.length
        })

        // Log each review
        details.reviews.forEach((review, index) => {
            console.log(`Review ${index + 1}:`, {
                reviewId: review.reviewId,
                reviewer: review.reviewerCompanyName,
                reviewee: review.revieweeCompanyName,
                revieweeRole: review.revieweeRole,
                ratingsCount: Object.keys(review.ratings).length
            })

            // Log category ratings
            Object.entries(review.ratings).forEach(([category, rating]) => {
                console.log(`  ${category}:`, {
                    score: rating.score,
                    qualityLevel: rating.qualityLevel,
                    hasComment: !!rating.comment
                })
            })
        })

        return details
    } catch (error) {
        const ratingsError = error as RatingsApiError

        if (ratingsError.code === CompanyRatingsErrorCodes.ORDER_NOT_FOUND) {
            console.error('Order not found:', ratingsError.message)
        } else {
            console.error('Error fetching review details:', ratingsError.message)
        }

        throw error
    }
}

/**
 * Example: Demonstrate caching and performance features
 */
export async function demonstrateCachingExample(companyId: string) {
    console.log('=== Caching Demonstration ===')

    // Clear cache to start fresh
    companyRatingsApiService.clearCache()

    // First call - will hit the API
    console.log('First call (will hit API):')
    const start1 = Date.now()
    await companyRatingsApiService.getCompanyRatingsSummary(companyId)
    const duration1 = Date.now() - start1
    console.log(`Duration: ${duration1}ms`)

    // Second call - should use cache
    console.log('Second call (should use cache):')
    const start2 = Date.now()
    await companyRatingsApiService.getCompanyRatingsSummary(companyId)
    const duration2 = Date.now() - start2
    console.log(`Duration: ${duration2}ms`)

    // Show cache statistics
    const stats = companyRatingsApiService.getCacheStats()
    console.log('Cache Statistics:', stats)

    // Prefetch example
    console.log('Prefetching ratings for better performance...')
    await companyRatingsApiService.prefetchCompanyRatings(companyId)
    console.log('Prefetch completed')
}

/**
 * Example: Error handling demonstration
 */
export async function demonstrateErrorHandlingExample() {
    console.log('=== Error Handling Demonstration ===')

    try {
        // Test invalid company ID
        await companyRatingsApiService.getCompanyRatingsSummary('')
    } catch (error) {
        const ratingsError = error as RatingsApiError
        console.log('Invalid company ID error:', {
            message: ratingsError.message,
            code: ratingsError.code,
            status: ratingsError.status
        })
    }

    try {
        // Test invalid pagination
        await companyRatingsApiService.getCompanyProjectReviews('test-id', -1, 0)
    } catch (error) {
        const ratingsError = error as RatingsApiError
        console.log('Invalid pagination error:', {
            message: ratingsError.message,
            code: ratingsError.code,
            status: ratingsError.status,
            details: ratingsError.details
        })
    }

    try {
        // Test invalid order ID
        await companyRatingsApiService.getOrderReviewDetails('   ')
    } catch (error) {
        const ratingsError = error as RatingsApiError
        console.log('Invalid order ID error:', {
            message: ratingsError.message,
            code: ratingsError.code,
            status: ratingsError.status
        })
    }
}

/**
 * Complete example usage
 */
export async function completeUsageExample() {
    const companyId = 'example-company-id'
    const orderId = 'example-order-id'

    try {
        console.log('=== Complete Company Ratings API Usage Example ===')

        // 1. Fetch company ratings summary
        console.log('\n1. Fetching company ratings summary...')
        const summary = await fetchCompanyRatingsExample(companyId)

        // 2. Fetch project reviews
        console.log('\n2. Fetching company project reviews...')
        const projects = await fetchCompanyProjectsExample(companyId)

        // 3. Fetch detailed review for first project (if available)
        if (projects.content.length > 0) {
            console.log('\n3. Fetching detailed review for first project...')
            await fetchOrderReviewDetailsExample(projects.content[0].orderId)
        }

        // 4. Demonstrate caching
        console.log('\n4. Demonstrating caching...')
        await demonstrateCachingExample(companyId)

        // 5. Demonstrate error handling
        console.log('\n5. Demonstrating error handling...')
        await demonstrateErrorHandlingExample()

        console.log('\n=== Example completed successfully ===')

    } catch (error) {
        console.error('Example failed:', error)
    }
}