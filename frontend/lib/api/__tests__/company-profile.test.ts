import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { CompanyApiService } from '../company-profile'
import { apiClient } from '../client'
import { CompanyProfileErrorCodes } from '@/lib/types/company-profile'
import type { CompanyProfile } from '@/lib/types/company-profile'

// Mock the API client
vi.mock('../client', () => ({
    apiClient: {
        get: vi.fn()
    }
}))

const mockApiClient = vi.mocked(apiClient)

describe('CompanyApiService', () => {
    let service: CompanyApiService

    beforeEach(() => {
        service = new CompanyApiService()
        vi.clearAllMocks()
    })

    afterEach(() => {
        service.clearCache()
    })

    const mockCompanyProfile: CompanyProfile = {
        companyId: 'test-company-id',
        name: 'Test Company',
        companyType: 'GMBH',
        description: 'A test company',
        isAuftraggeber: true,
        isAuftragnehmer: false,
        specializations: ['Software Development'],
        industries: ['Technology'],
        verified: true,
        createdAt: '2024-01-01T00:00:00Z'
    }

    describe('getPublicCompanyInfo', () => {
        it('should successfully fetch company profile', async () => {
            mockApiClient.get.mockResolvedValueOnce({
                data: mockCompanyProfile,
                status: 200
            })

            const result = await service.getPublicCompanyInfo('test-company-id')

            expect(mockApiClient.get).toHaveBeenCalledWith('/companies/test-company-id/public')
            expect(result).toEqual(mockCompanyProfile)
        })

        it('should throw error for invalid company ID', async () => {
            await expect(service.getPublicCompanyInfo('')).rejects.toMatchObject({
                message: 'Company ID is required and must be a non-empty string',
                code: CompanyProfileErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })

            await expect(service.getPublicCompanyInfo('   ')).rejects.toMatchObject({
                message: 'Company ID is required and must be a non-empty string',
                code: CompanyProfileErrorCodes.INVALID_COMPANY_ID,
                status: 400
            })
        })

        it('should handle 404 company not found error', async () => {
            mockApiClient.get.mockRejectedValueOnce({
                response: {
                    status: 404,
                    data: { message: 'Company not found' }
                }
            })

            await expect(service.getPublicCompanyInfo('non-existent-id')).rejects.toMatchObject({
                message: "Company with ID 'non-existent-id' not found",
                code: CompanyProfileErrorCodes.COMPANY_NOT_FOUND,
                status: 404
            })
        })

        it('should handle 403 access denied error', async () => {
            mockApiClient.get.mockRejectedValueOnce({
                response: {
                    status: 403,
                    data: { message: 'Access denied' }
                }
            })

            await expect(service.getPublicCompanyInfo('restricted-id')).rejects.toMatchObject({
                message: 'Access denied: You do not have permission to view this company profile',
                code: CompanyProfileErrorCodes.ACCESS_DENIED,
                status: 403
            })
        })

        it('should handle network errors', async () => {
            mockApiClient.get.mockRejectedValueOnce({
                request: {},
                message: 'Network Error'
            })

            await expect(service.getPublicCompanyInfo('test-id')).rejects.toMatchObject({
                message: 'Network error: Unable to connect to server',
                code: CompanyProfileErrorCodes.NETWORK_ERROR
            })
        })

        it('should handle invalid response data', async () => {
            mockApiClient.get.mockResolvedValueOnce({
                data: null,
                status: 200
            })

            await expect(service.getPublicCompanyInfo('test-id')).rejects.toMatchObject({
                message: 'No company data received from server',
                code: CompanyProfileErrorCodes.NO_DATA_RECEIVED,
                status: 200
            })
        })

        it('should handle invalid company profile structure', async () => {
            const invalidProfile = {
                companyId: 'test-id',
                // Missing required fields
            }

            mockApiClient.get.mockResolvedValueOnce({
                data: invalidProfile,
                status: 200
            })

            await expect(service.getPublicCompanyInfo('test-id')).rejects.toMatchObject({
                message: 'Invalid company profile data received from server',
                code: CompanyProfileErrorCodes.INVALID_PROFILE_DATA,
                status: 200
            })
        })
    })

    describe('caching', () => {
        it('should cache successful responses', async () => {
            mockApiClient.get.mockResolvedValueOnce({
                data: mockCompanyProfile,
                status: 200
            })

            // First call should make API request
            const result1 = await service.getPublicCompanyInfo('test-company-id')
            expect(mockApiClient.get).toHaveBeenCalledTimes(1)
            expect(result1).toEqual(mockCompanyProfile)

            // Second call should use cache
            const result2 = await service.getPublicCompanyInfo('test-company-id')
            expect(mockApiClient.get).toHaveBeenCalledTimes(1) // Still only 1 call
            expect(result2).toEqual(mockCompanyProfile)
        })

        it('should provide cache statistics', () => {
            const stats = service.getCacheStats()
            expect(stats).toMatchObject({
                size: 0,
                maxSize: 100,
                entries: []
            })
        })

        it('should clear cache', async () => {
            mockApiClient.get.mockResolvedValueOnce({
                data: mockCompanyProfile,
                status: 200
            })

            await service.getPublicCompanyInfo('test-company-id')
            expect(service.getCacheStats().size).toBe(1)

            service.clearCache()
            expect(service.getCacheStats().size).toBe(0)
        })

        it('should clear specific cache entry', async () => {
            mockApiClient.get
                .mockResolvedValueOnce({ data: mockCompanyProfile, status: 200 })
                .mockResolvedValueOnce({ data: { ...mockCompanyProfile, companyId: 'test-2' }, status: 200 })

            await service.getPublicCompanyInfo('test-1')
            await service.getPublicCompanyInfo('test-2')
            expect(service.getCacheStats().size).toBe(2)

            service.clearCache('test-1')
            const stats = service.getCacheStats()
            expect(stats.size).toBe(1)
            expect(stats.entries).toEqual(['test-2'])
        })
    })

    describe('batch operations', () => {
        it('should fetch multiple company profiles', async () => {
            const profile1 = { ...mockCompanyProfile, companyId: 'company-1' }
            const profile2 = { ...mockCompanyProfile, companyId: 'company-2' }

            mockApiClient.get
                .mockResolvedValueOnce({ data: profile1, status: 200 })
                .mockResolvedValueOnce({ data: profile2, status: 200 })

            const results = await service.getMultipleCompanyProfiles(['company-1', 'company-2'])

            expect(results).toHaveLength(2)
            expect(results[0]).toEqual(profile1)
            expect(results[1]).toEqual(profile2)
        })

        it('should handle partial failures in batch operations', async () => {
            const profile1 = { ...mockCompanyProfile, companyId: 'company-1' }

            mockApiClient.get
                .mockResolvedValueOnce({ data: profile1, status: 200 })
                .mockRejectedValueOnce({ response: { status: 404 } })

            const results = await service.getMultipleCompanyProfiles(['company-1', 'company-2'])

            expect(results).toHaveLength(1)
            expect(results[0]).toEqual(profile1)
        })

        it('should return empty array for empty input', async () => {
            const results = await service.getMultipleCompanyProfiles([])
            expect(results).toEqual([])
        })
    })

    describe('prefetch', () => {
        it('should prefetch company profile silently', async () => {
            mockApiClient.get.mockResolvedValueOnce({
                data: mockCompanyProfile,
                status: 200
            })

            await service.prefetchCompanyProfile('test-company-id')

            expect(mockApiClient.get).toHaveBeenCalledWith('/companies/test-company-id/public')
            expect(service.getCacheStats().size).toBe(1)
        })

        it('should handle prefetch errors silently', async () => {
            mockApiClient.get.mockRejectedValueOnce({
                response: { status: 404 }
            })

            // Should not throw
            await expect(service.prefetchCompanyProfile('non-existent-id')).resolves.toBeUndefined()
        })
    })
})