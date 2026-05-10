import { renderHook, waitFor } from '@testing-library/react'
import { act } from '@testing-library/react'
import { useCompanyProfile } from '../use-company-profile'
import { companyApiService } from '@/lib/api/company-profile'
import type { CompanyProfile, CompanyProfileApiError } from '@/lib/types/company-profile'

// Mock the company API service
jest.mock('@/lib/api/company-profile', () => ({
    companyApiService: {
        getPublicCompanyInfo: jest.fn(),
        clearCache: jest.fn(),
        getCacheStats: jest.fn(),
        prefetchCompanyProfile: jest.fn(),
        getMultipleCompanyProfiles: jest.fn()
    }
}))

const mockCompanyApiService = companyApiService as jest.Mocked<typeof companyApiService>

// Mock company profile data
const mockCompanyProfile: CompanyProfile = {
    companyId: 'test-company-id',
    name: 'Test Company',
    companyType: 'GMBH',
    description: 'A test company for unit testing',
    website: 'https://test-company.com',
    city: 'Berlin',
    isAuftraggeber: true,
    isAuftragnehmer: false,
    specializations: ['Software Development', 'Web Design'],
    industries: ['Technology', 'Digital Services'],
    verified: true,
    foundedYear: 2020,
    employeeCount: 50,
    logoUrl: 'https://test-company.com/logo.png',
    contactEmail: 'contact@test-company.com',
    contactPhone: '+49 30 12345678',
    address: {
        street: 'Test Street',
        houseNumber: '123',
        postalCode: '10115',
        city: 'Berlin',
        country: 'Germany'
    },
    qualityScore: 4.5,
    completionRate: 95.5,
    insuranceCoverage: true,
    createdAt: '2020-01-01T00:00:00Z',
    documents: [
        {
            id: 'doc-1',
            type: 'VERIFICATION',
            name: 'Company Registration',
            url: 'https://test-company.com/docs/registration.pdf',
            uploadedAt: '2020-01-01T00:00:00Z'
        }
    ]
}

describe('useCompanyProfile', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset console.error mock
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    describe('successful data fetching', () => {
        it('should fetch company profile data successfully', async () => {
            mockCompanyApiService.getPublicCompanyInfo.mockResolvedValueOnce(mockCompanyProfile)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            // Initially should be loading
            expect(result.current.isLoading).toBe(true)
            expect(result.current.isError).toBe(false)
            expect(result.current.data).toBe(null)
            expect(result.current.error).toBe(null)

            // Wait for the API call to complete
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Should have successful data
            expect(result.current.data).toEqual(mockCompanyProfile)
            expect(result.current.isError).toBe(false)
            expect(result.current.error).toBe(null)
            expect(result.current.isRefetching).toBe(false)

            // Should have called the API service
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenCalledWith('test-company-id')
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenCalledTimes(1)
        })

        it('should provide refetch functionality', async () => {
            mockCompanyApiService.getPublicCompanyInfo.mockResolvedValue(mockCompanyProfile)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            // Call refetch
            act(() => {
                result.current.refetch()
            })

            // Should be refetching
            expect(result.current.isRefetching).toBe(true)
            expect(result.current.isLoading).toBe(false)

            // Wait for refetch to complete
            await waitFor(() => {
                expect(result.current.isRefetching).toBe(false)
            })

            // Should have called API service twice (initial + refetch)
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenCalledTimes(2)
        })
    })

    describe('error handling', () => {
        it('should handle invalid company ID', async () => {
            const { result } = renderHook(() => useCompanyProfile(''))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error).toBeTruthy()
            expect(result.current.error?.message).toContain('Company ID is required')
            expect(result.current.data).toBe(null)
        })

        it('should handle company not found error', async () => {
            const notFoundError = new Error('Company not found') as CompanyProfileApiError
            notFoundError.code = 'COMPANY_NOT_FOUND'
            notFoundError.status = 404

            mockCompanyApiService.getPublicCompanyInfo.mockRejectedValueOnce(notFoundError)

            const { result } = renderHook(() => useCompanyProfile('non-existent-id'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error).toEqual(notFoundError)
            expect(result.current.data).toBe(null)
        })

        it('should handle access denied error', async () => {
            const accessDeniedError = new Error('Access denied') as CompanyProfileApiError
            accessDeniedError.code = 'ACCESS_DENIED'
            accessDeniedError.status = 403

            mockCompanyApiService.getPublicCompanyInfo.mockRejectedValueOnce(accessDeniedError)

            const { result } = renderHook(() => useCompanyProfile('restricted-company-id'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error).toEqual(accessDeniedError)
            expect(result.current.data).toBe(null)
        })

        it('should handle network errors', async () => {
            const networkError = new Error('Network error') as CompanyProfileApiError
            networkError.code = 'NETWORK_ERROR'

            mockCompanyApiService.getPublicCompanyInfo.mockRejectedValueOnce(networkError)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error).toEqual(networkError)
            expect(result.current.data).toBe(null)
        })

        it('should handle server errors', async () => {
            const serverError = new Error('Internal server error') as CompanyProfileApiError
            serverError.code = 'SERVER_ERROR'
            serverError.status = 500

            mockCompanyApiService.getPublicCompanyInfo.mockRejectedValueOnce(serverError)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error).toEqual(serverError)
            expect(result.current.data).toBe(null)
        })
    })

    describe('company ID changes', () => {
        it('should refetch data when company ID changes', async () => {
            const company1 = { ...mockCompanyProfile, companyId: 'company-1', name: 'Company 1' }
            const company2 = { ...mockCompanyProfile, companyId: 'company-2', name: 'Company 2' }

            mockCompanyApiService.getPublicCompanyInfo
                .mockResolvedValueOnce(company1)
                .mockResolvedValueOnce(company2)

            const { result, rerender } = renderHook(
                ({ companyId }) => useCompanyProfile(companyId),
                { initialProps: { companyId: 'company-1' } }
            )

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.data).toEqual(company1)

            // Change company ID
            rerender({ companyId: 'company-2' })

            // Should start loading again
            expect(result.current.isLoading).toBe(true)

            // Wait for new data
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.data).toEqual(company2)
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenCalledTimes(2)
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenNthCalledWith(1, 'company-1')
            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenNthCalledWith(2, 'company-2')
        })

        it('should handle rapid company ID changes correctly', async () => {
            mockCompanyApiService.getPublicCompanyInfo.mockImplementation((id) => {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve({ ...mockCompanyProfile, companyId: id, name: `Company ${id}` })
                    }, 100)
                })
            })

            const { result, rerender } = renderHook(
                ({ companyId }) => useCompanyProfile(companyId),
                { initialProps: { companyId: 'company-1' } }
            )

            // Quickly change company ID multiple times
            rerender({ companyId: 'company-2' })
            rerender({ companyId: 'company-3' })

            // Wait for final result
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            }, { timeout: 1000 })

            // Should have the data for the final company ID
            expect(result.current.data?.companyId).toBe('company-3')
            expect(result.current.data?.name).toBe('Company company-3')
        })
    })

    describe('loading states', () => {
        it('should manage loading states correctly during initial fetch', async () => {
            let resolvePromise: (value: CompanyProfile) => void
            const promise = new Promise<CompanyProfile>((resolve) => {
                resolvePromise = resolve
            })

            mockCompanyApiService.getPublicCompanyInfo.mockReturnValueOnce(promise)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            // Should be loading initially
            expect(result.current.isLoading).toBe(true)
            expect(result.current.isRefetching).toBe(false)
            expect(result.current.isError).toBe(false)

            // Resolve the promise
            act(() => {
                resolvePromise!(mockCompanyProfile)
            })

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isRefetching).toBe(false)
            expect(result.current.data).toEqual(mockCompanyProfile)
        })

        it('should manage refetching state correctly', async () => {
            mockCompanyApiService.getPublicCompanyInfo.mockResolvedValue(mockCompanyProfile)

            const { result } = renderHook(() => useCompanyProfile('test-company-id'))

            // Wait for initial load
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            let resolveRefetch: (value: CompanyProfile) => void
            const refetchPromise = new Promise<CompanyProfile>((resolve) => {
                resolveRefetch = resolve
            })

            mockCompanyApiService.getPublicCompanyInfo.mockReturnValueOnce(refetchPromise)

            // Start refetch
            act(() => {
                result.current.refetch()
            })

            // Should be refetching but not loading
            expect(result.current.isLoading).toBe(false)
            expect(result.current.isRefetching).toBe(true)

            // Resolve refetch
            act(() => {
                resolveRefetch!(mockCompanyProfile)
            })

            await waitFor(() => {
                expect(result.current.isRefetching).toBe(false)
            })

            expect(result.current.isLoading).toBe(false)
        })
    })

    describe('cleanup and memory leaks', () => {
        it('should not update state after component unmount', async () => {
            let resolvePromise: (value: CompanyProfile) => void
            const promise = new Promise<CompanyProfile>((resolve) => {
                resolvePromise = resolve
            })

            mockCompanyApiService.getPublicCompanyInfo.mockReturnValueOnce(promise)

            const { result, unmount } = renderHook(() => useCompanyProfile('test-company-id'))

            expect(result.current.isLoading).toBe(true)

            // Unmount before promise resolves
            unmount()

            // Resolve promise after unmount
            act(() => {
                resolvePromise!(mockCompanyProfile)
            })

            // Wait a bit to ensure no state updates occur
            await new Promise(resolve => setTimeout(resolve, 100))

            // State should remain in loading state since component was unmounted
            expect(result.current.isLoading).toBe(true)
            expect(result.current.data).toBe(null)
        })
    })

    describe('edge cases', () => {
        it('should handle whitespace-only company ID', async () => {
            const { result } = renderHook(() => useCompanyProfile('   '))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(result.current.isError).toBe(true)
            expect(result.current.error?.message).toContain('Company ID is required')
        })

        it('should trim company ID before making API call', async () => {
            mockCompanyApiService.getPublicCompanyInfo.mockResolvedValueOnce(mockCompanyProfile)

            const { result } = renderHook(() => useCompanyProfile('  test-company-id  '))

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false)
            })

            expect(mockCompanyApiService.getPublicCompanyInfo).toHaveBeenCalledWith('test-company-id')
        })

        it('should handle refetch when no company ID is set', () => {
            const { result } = renderHook(() => useCompanyProfile(''))

            // Should not throw error when calling refetch
            expect(() => {
                result.current.refetch()
            }).not.toThrow()
        })
    })
})