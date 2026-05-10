import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'
import { CompanyRatingsApiService, CompanyRatingsErrorCodes } from '../company-ratings'
import { apiClient } from '../client'
import type {
    CompanyRatingsSummary,
    PaginatedProjectReviews,
    OrderReviewDetails,
    RatingsApiError
} from '@/lib/types/company-ratings'

// Mock the API client
vi.mock('../client', () => ({
    apiClient: {
        get: vi.fn()
    }
}))

const mockApiClient = apiClient as { get: Mock }

describe('CompanyRatingsApiService', () => {
    let service: CompanyRatingsApiService

    beforeEach(() => {
        service = new CompanyRatingsApiService()
        service.clearCache()
        vi.clearAllMocks()
    })

    describe('getCompanyRatingsSummary', () => {
        const mockSummary: CompanyRatingsSummary = {
            companyId: 'test-company-id',
            overallRating: 85.5,
            totalReviews: 25,
            completedOrders: 30,
            categoryRatings: {
                COMMUNICATION: {
                    category: 'COMMUNICATION',
                    averageScore: 90,
                    reviewCount: 25,
                    qualityLevel: 'Sehr gut'
                },
                RESPONSE_TIME: {
                    category: 'RESPONSE_TIME',
                    averageScore: 80,
                    reviewCount: 25,
                    qualityLevel: 'Gut'
                },
                PUNCTUALITY: {
                    category: 'PUNCTUALITY',
                    averageScore: 85,
                    reviewCount: 25,
                    qualityLevel: 'Sehr gut'
                },
                QUALITY: {
                    category: 'QUALITY',
                    averageScore: 88,
                    reviewCount: 25,
                    qualityLevel: 'Sehr gut'
                },
                BUDGET: {
                    category: 'BUDGET',
                    averageScore: 82,
                    reviewCount: 25,
                    qualityLevel: 'Gut'
                },
                FLEXIBILITY: {
                    category: 'FLEXIBILITY',
                    averageScore: 87,
                    reviewCount: 25,
                    qualityLevel: 'Sehr gut'
                },
                DOCUMENTATION: {
                    category: 'DOCUMENTATION',
                    averageScore: 84,
                    reviewCount: 25,
                    qualityLevel: 'Gut'
                },
                OVERALL_SATISFACTION: {
                    category: 'OVERALL_SATISFACTION',
                    averageScore: 86,
                    reviewCount: 25,
                    qualityLevel: 'Sehr gut'
                }
            },
            recentProjects: []
        }

        it('should successfully fetch company ratings summary', async () => {
            mockApiClient.get.mockResolvedValue({ data: mockSummary, status: 200 })

            const result = await service.getCompanyRatingsSummary('test-company-id')

            expect(mockApiClient.get).toHaveBeenCalledWith('/companies/test-company-id/ratings')
            expect(result).toEqual(mockSummary)
        })

        it('should throw error for invalid company ID', async () => {
            await expect(service.getCompanyRatingsSummary('')).rejects.toMatchObject({
                message: 'Company ID is required and must be a non-empty string',
                code: CompanyRatingsErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })

            expect(mockApiClient.get).not.toHaveBeenCalled()
        })

        it('should handle 404 company not found error', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Company not found' }
                }
            }
            mockApiClient.get.mockRejectedValue(error)

            await expect(service.getCompanyRatingsSummary('nonexistent-id')).rejects.toMatchObject({
                message: "Company with ID 'nonexistent-id' not found",
                code: CompanyRatingsErrorCodes.COMPANY_NOT_FOUND,
                status: 404
            })
        })

        it('should cache successful responses', async () => {
            mockApiClient.get.mockResolvedValue({ data: mockSummary, status: 200 })

            // First call
            await service.getCompanyRatingsSummary('test-company-id')
            // Second call should use cache
            await service.getCompanyRatingsSummary('test-company-id')

            expect(mockApiClient.get).toHaveBeenCalledTimes(1)
        })
    })

    describe('getCompanyProjectReviews', () => {
        const mockProjectReviews: PaginatedProjectReviews = {
            content: [
                {
                    orderId: 'order-1',
                    projectName: 'Test Project 1',
                    completionDate: '2024-01-15T10:00:00Z',
                    overallRating: 85,
                    companyRole: 'PROVIDER',
                    status: 'COMPLETED',
                    reviewerCompanyId: 'reviewer-1',
                    reviewerCompanyName: 'Reviewer Company 1'
                }
            ],
            page: 0,
            size: 10,
            totalElements: 1,
            totalPages: 1,
            first: true,
            last: true
        }

        it('should successfully fetch company project reviews', async () => {
            mockApiClient.get.mockResolvedValue({ data: mockProjectReviews, status: 200 })

            const result = await service.getCompanyProjectReviews('test-company-id', 0, 10)

            expect(mockApiClient.get).toHaveBeenCalledWith('/companies/test-company-id/project-reviews', {
                params: { page: 0, size: 10 }
            })
            expect(result).toEqual(mockProjectReviews)
        })

        it('should use default pagination parameters', async () => {
            mockApiClient.get.mockResolvedValue({ data: mockProjectReviews, status: 200 })

            await service.getCompanyProjectReviews('test-company-id')

            expect(mockApiClient.get).toHaveBeenCalledWith('/companies/test-company-id/project-reviews', {
                params: { page: 0, size: 10 }
            })
        })

        it('should validate pagination parameters', async () => {
            await expect(service.getCompanyProjectReviews('test-company-id', -1, 10)).rejects.toMatchObject({
                message: 'Invalid pagination parameters',
                code: CompanyRatingsErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })

            await expect(service.getCompanyProjectReviews('test-company-id', 0, 0)).rejects.toMatchObject({
                message: 'Invalid pagination parameters',
                code: CompanyRatingsErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })

            await expect(service.getCompanyProjectReviews('test-company-id', 0, 101)).rejects.toMatchObject({
                message: 'Invalid pagination parameters',
                code: CompanyRatingsErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })
        })
    })

    describe('getOrderReviewDetails', () => {
        const mockReviewDetails: OrderReviewDetails = {
            orderId: 'test-order-id',
            projectName: 'Test Project',
            completionDate: '2024-01-15T10:00:00Z',
            reviews: [
                {
                    reviewId: 'review-1',
                    reviewerCompanyId: 'reviewer-1',
                    reviewerCompanyName: 'Reviewer Company',
                    revieweeCompanyId: 'reviewee-1',
                    revieweeCompanyName: 'Reviewee Company',
                    revieweeRole: 'PROVIDER',
                    reviewDate: '2024-01-16T10:00:00Z',
                    ratings: {
                        COMMUNICATION: {
                            category: 'COMMUNICATION',
                            score: 90,
                            comment: 'Excellent communication',
                            qualityLevel: 'Sehr gut'
                        },
                        RESPONSE_TIME: {
                            category: 'RESPONSE_TIME',
                            score: 85,
                            comment: 'Good response time',
                            qualityLevel: 'Sehr gut'
                        },
                        PUNCTUALITY: {
                            category: 'PUNCTUALITY',
                            score: 88,
                            comment: 'Very punctual',
                            qualityLevel: 'Sehr gut'
                        },
                        QUALITY: {
                            category: 'QUALITY',
                            score: 92,
                            comment: 'High quality work',
                            qualityLevel: 'Sehr gut'
                        },
                        BUDGET: {
                            category: 'BUDGET',
                            score: 80,
                            comment: 'Within budget',
                            qualityLevel: 'Gut'
                        },
                        FLEXIBILITY: {
                            category: 'FLEXIBILITY',
                            score: 87,
                            comment: 'Flexible approach',
                            qualityLevel: 'Sehr gut'
                        },
                        DOCUMENTATION: {
                            category: 'DOCUMENTATION',
                            score: 84,
                            comment: 'Good documentation',
                            qualityLevel: 'Gut'
                        },
                        OVERALL_SATISFACTION: {
                            category: 'OVERALL_SATISFACTION',
                            score: 89,
                            comment: 'Very satisfied',
                            qualityLevel: 'Sehr gut'
                        }
                    }
                }
            ]
        }

        it('should successfully fetch order review details', async () => {
            mockApiClient.get.mockResolvedValue({ data: mockReviewDetails, status: 200 })

            const result = await service.getOrderReviewDetails('test-order-id')

            expect(mockApiClient.get).toHaveBeenCalledWith('/orders/test-order-id/reviews')
            expect(result).toEqual(mockReviewDetails)
        })

        it('should throw error for invalid order ID', async () => {
            await expect(service.getOrderReviewDetails('')).rejects.toMatchObject({
                message: 'Order ID is required and must be a non-empty string',
                code: CompanyRatingsErrorCodes.INVALID_ORDER_ID,
                status: 400
            })

            expect(mockApiClient.get).not.toHaveBeenCalled()
        })

        it('should handle 404 order not found error', async () => {
            const error = {
                response: {
                    status: 404,
                    data: { message: 'Order not found' }
                }
            }
            mockApiClient.get.mockRejectedValue(error)

            await expect(service.getOrderReviewDetails('nonexistent-order')).rejects.toMatchObject({
                message: "Order with ID 'nonexistent-order' not found",
                code: CompanyRatingsErrorCodes.ORDER_NOT_FOUND,
                status: 404
            })
        })
    })

    describe('cache management', () => {
        it('should clear specific cache types', () => {
            service.clearCache('summary', 'test-key')
            service.clearCache('projects', 'test-key')
            service.clearCache('details', 'test-key')
            service.clearCache('all')

            // Should not throw any errors
            expect(true).toBe(true)
        })

        it('should provide cache statistics', () => {
            const stats = service.getCacheStats()

            expect(stats).toHaveProperty('summary')
            expect(stats).toHaveProperty('projects')
            expect(stats).toHaveProperty('details')
            expect(stats.summary).toHaveProperty('size')
            expect(stats.summary).toHaveProperty('maxSize')
            expect(stats.summary).toHaveProperty('entries')
        })
    })

    describe('prefetchCompanyRatings', () => {
        it('should prefetch ratings data without throwing errors', async () => {
            const mockSummary: CompanyRatingsSummary = {
                companyId: 'test-company-id',
                overallRating: 85.5,
                totalReviews: 25,
                completedOrders: 30,
                categoryRatings: {} as any,
                recentProjects: []
            }

            const mockProjectReviews: PaginatedProjectReviews = {
                content: [],
                page: 0,
                size: 10,
                totalElements: 0,
                totalPages: 0,
                first: true,
                last: true
            }

            mockApiClient.get
                .mockResolvedValueOnce({ data: mockSummary, status: 200 })
                .mockResolvedValueOnce({ data: mockProjectReviews, status: 200 })

            await expect(service.prefetchCompanyRatings('test-company-id')).resolves.toBeUndefined()

            expect(mockApiClient.get).toHaveBeenCalledTimes(2)
        })

        it('should handle prefetch errors gracefully', async () => {
            mockApiClient.get.mockRejectedValue(new Error('Network error'))

            // Should not throw error even if prefetch fails
            await expect(service.prefetchCompanyRatings('test-company-id')).resolves.toBeUndefined()
        })
    })
})