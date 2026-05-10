import { apiClient, createFormDataClient } from './client'
import type { CompanyProfile, CompanyDocument, PaginatedResponse } from './types'
import type {
    TermsConditionsResponse,
    GetTermsConditionsResponse,
    TermsConditionsAccessRequest,
    TermsConditionsAccessResponse
} from '../types/terms-conditions'

/**
 * Company API endpoints
 */
export const companyApi = {
    /**
     * Get current company profile
     */
    getCompanyProfile: async (): Promise<CompanyProfile> => {
        const response = await apiClient.get('/companies/profile')
        return response.data
    },    /**
     * Update company profile
     */
    updateCompanyProfile: async (companyId: string, data: Partial<CompanyProfile>): Promise<CompanyProfile> => {
        // Transform frontend data structure to match backend UpdateCompanyRequest
        const updateRequest = {
            name: data.name,
            description: data.description,
            website: data.website,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            businessHours: data.businessHours,
            workRadiusKm: data.workRadiusKm,
            specializations: data.specializations,
            industries: data.industries,
            orderCategories: data.orderCategories,
            isAuftraggeber: data.isAuftraggeber,
            isAuftragnehmer: data.isAuftragnehmer,
            logoUrl: data.logoUrl,
            vatNumber: data.vatNumber,
            taxId: data.taxId,
            address: data.address ? {
                street: data.address.street,
                houseNumber: data.address.houseNumber,
                postalCode: data.address.postalCode,
                city: data.address.city,
                country: data.address.country
            } : undefined
        }

        const response = await apiClient.put(`/companies/${companyId}`, updateRequest)
        return response.data
    },

    /**
     * Get company by ID
     */
    getCompanyById: async (id: string): Promise<CompanyProfile> => {
        const response = await apiClient.get(`/companies/${id}`)
        return response.data
    },

    /**
     * Search companies with filters
     */
    searchCompanies: async (params?: {
        page?: number
        size?: number
        city?: string
        companyType?: string
        industries?: string[]
        specializations?: string[]
        orderCategories?: string[]
        verified?: boolean
        workRadiusKm?: number
        latitude?: number
        longitude?: number
    }): Promise<PaginatedResponse<CompanyProfile>> => {
        const response = await apiClient.get('/companies/search', { params })
        return response.data
    },

    /**
     * Upload company verification documents
     */
    uploadVerificationDocuments: async (files: FormData): Promise<void> => {
        const formDataClient = createFormDataClient()
        await formDataClient.post('/companies/verification-documents', files)
    },

    /**
     * Upload company certificates
     */
    uploadCertificates: async (files: FormData): Promise<void> => {
        const formDataClient = createFormDataClient()
        await formDataClient.post('/companies/certificates', files)
    },

    /**
     * Get company verification status
     */
    getVerificationStatus: async (): Promise<{
        verified: boolean
        status: 'pending' | 'approved' | 'rejected' | 'not_submitted'
        message?: string
        submittedAt?: string
        reviewedAt?: string
    }> => {
        const response = await apiClient.get('/companies/verification-status')
        return response.data
    },

    /**
     * Submit company for verification
     */
    submitForVerification: async (): Promise<void> => {
        await apiClient.post('/companies/submit-verification')
    },

    /**
     * Get company statistics
     */
    getCompanyStats: async (): Promise<{
        totalOrders: number
        completedOrders: number
        averageRating: number
        totalRevenue: number
        memberSince: string
    }> => {
        const response = await apiClient.get('/companies/stats')
        return response.data
    },

    /**
     * Get company reviews
     */
    getCompanyReviews: async (companyId?: string, params?: {
        page?: number
        size?: number
    }): Promise<PaginatedResponse<{
        id: string
        rating: number
        comment: string
        authorName: string
        orderId: string
        createdAt: string
    }>> => {
        const endpoint = companyId ? `/companies/${companyId}/reviews` : '/companies/reviews'
        const response = await apiClient.get(endpoint, { params })
        return response.data
    },

    /**
     * Add company to favorites
     */
    addToFavorites: async (companyId: string): Promise<void> => {
        await apiClient.post(`/companies/${companyId}/favorite`)
    },

    /**
     * Remove company from favorites
     */
    removeFromFavorites: async (companyId: string): Promise<void> => {
        await apiClient.delete(`/companies/${companyId}/favorite`)
    },

    /**
     * Get favorite companies
     */
    getFavoriteCompanies: async (params?: {
        page?: number
        size?: number
    }): Promise<PaginatedResponse<CompanyProfile>> => {
        const response = await apiClient.get('/companies/favorites', { params })
        return response.data
    },

    /**
     * Update company location
     */
    updateLocation: async (data: {
        latitude: number
        longitude: number
        street?: string
        houseNumber?: string
        postalCode?: string
        city?: string
        country?: string
    }): Promise<void> => {
        await apiClient.put('/companies/location', data)
    },

    /**
     * Update work radius
     */
    updateWorkRadius: async (workRadiusKm: number): Promise<void> => {
        await apiClient.put('/companies/work-radius', { workRadiusKm })
    },

    /**
     * Upload company logo
     */
    uploadLogo: async (logoFile: File): Promise<CompanyProfile> => {
        const formData = new FormData()
        formData.append('file', logoFile)

        const formDataClient = createFormDataClient()
        const response = await formDataClient.post('/companies/logo', formData)
        return response.data
    },

    /**
     * Get nearby companies
     */
    getNearbyCompanies: async (params: {
        latitude: number
        longitude: number
        radiusKm: number
        page?: number
        size?: number
        industries?: string[]
        specializations?: string[]
    }): Promise<PaginatedResponse<CompanyProfile & { distance: number }>> => {
        const response = await apiClient.get('/companies/nearby', { params })
        return response.data
    },

    /**
     * Get company documents
     */
    getCompanyDocuments: async (companyId?: string): Promise<CompanyDocument[]> => {
        const endpoint = companyId ? `/companies/${companyId}/documents` : '/companies/documents'
        const response = await apiClient.get(endpoint)
        return response.data
    },

    /**
     * Get secure document download URL
     */
    getDocumentDownloadUrl: async (documentId: string): Promise<string> => {
        const response = await apiClient.get(`/companies/documents/${documentId}/download-url`)
        return response.data.url
    },

    // =============================================================================
    // TERMS & CONDITIONS API METHODS
    // =============================================================================

    /**
     * Upload Terms & Conditions document for a company
     */
    uploadTermsConditions: async (companyId: string, file: File): Promise<TermsConditionsResponse> => {
        // Validate file before upload
        if (!file) {
            throw new Error('File is required')
        }

        if (file.type !== 'application/pdf') {
            throw new Error('Only PDF files are allowed')
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('File size exceeds 10MB limit')
        }

        const formData = new FormData()
        formData.append('file', file)

        const formDataClient = createFormDataClient()
        const response = await formDataClient.post(`/companies/${companyId}/terms-conditions/upload`, formData)
        return response.data
    },

    /**
     * Get Terms & Conditions document for a company
     */
    getTermsConditions: async (companyId: string): Promise<GetTermsConditionsResponse> => {
        const response = await apiClient.get(`/companies/${companyId}/terms-conditions`)
        return response.data
    },

    /**
     * Delete Terms & Conditions document for a company
     */
    deleteTermsConditions: async (companyId: string): Promise<void> => {
        await apiClient.delete(`/companies/${companyId}/terms-conditions`)
    },

    /**
     * Get secure URL for accessing Terms & Conditions document
     */
    getTermsConditionsUrl: async (companyId: string): Promise<string> => {
        const response = await apiClient.get(`/companies/${companyId}/terms-conditions/url`)
        return response.data.url
    },

    /**
     * Track access to Terms & Conditions document for audit purposes
     */
    trackTermsConditionsAccess: async (accessRequest: TermsConditionsAccessRequest): Promise<TermsConditionsAccessResponse> => {
        const response = await apiClient.post('/companies/terms-conditions/access', accessRequest)
        return response.data
    },

    /**
     * Check if a company has Terms & Conditions document
     */
    hasTermsConditions: async (companyId: string): Promise<boolean> => {
        try {
            const response = await companyApi.getTermsConditions(companyId)
            return response.hasDocument
        } catch (error) {
            // If we get a 404 or other error, assume no document exists
            return false
        }
    }
}

export default companyApi