import { apiClient, createFormDataClient } from './client'
import {
    BusinessRole,
    BusinessRoleUtils,
    type CompanyRoles,
    type AddBusinessRoleData,
    type CompanyRoleAdditionResponse,
    type AvailableRolesResponse,
    type RoleRequirements
} from '../types/company-role-management'

/**
 * Company Role Management API endpoints
 * Handles adding business roles to companies and managing role-related data
 */
export const companyRoleApi = {
    /**
     * Add a business role to a company
     * @param companyId - The ID of the company to add the role to
     * @param data - The role addition data including role type and required fields
     * @returns Promise resolving to the role addition response
     */
    addBusinessRole: async (
        companyId: string,
        data: AddBusinessRoleData
    ): Promise<CompanyRoleAdditionResponse> => {
        try {
            // Create FormData for multipart request
            const formData = new FormData()

            // Add role and basic data
            formData.append('role', data.role)

            // Add optional fields if they exist
            if (data.specializations?.length) {
                data.specializations.forEach(spec => formData.append('specializations', spec))
            }
            if (data.industries?.length) {
                data.industries.forEach(industry => formData.append('industries', industry))
            }
            if (data.orderCategories?.length) {
                data.orderCategories.forEach(category => formData.append('orderCategories', category))
            }
            if (data.workRadiusKm) {
                formData.append('workRadiusKm', data.workRadiusKm.toString())
            }
            if (data.description) {
                formData.append('description', data.description)
            }
            if (data.certifications?.length) {
                data.certifications.forEach(cert => formData.append('certifications', cert))
            }
            if (data.contactPersonName) {
                formData.append('contactPersonName', data.contactPersonName)
            }
            if (data.contactPersonEmail) {
                formData.append('contactPersonEmail', data.contactPersonEmail)
            }
            if (data.contactPersonPhone) {
                formData.append('contactPersonPhone', data.contactPersonPhone)
            }
            if (data.employeeCount) {
                formData.append('employeeCount', data.employeeCount.toString())
            }
            if (data.businessHours) {
                formData.append('businessHours', data.businessHours)
            }

            // Add files only for Auftragnehmer (provider) role
            if (data.role === BusinessRole.AUFTRAGNEHMER) {
                if (data._verificationFile) {
                    formData.append('verificationDocument', data._verificationFile)
                }
                if (data._certificatesFile) {
                    formData.append('certificatesDocument', data._certificatesFile)
                }
            }

            const formDataClient = createFormDataClient()
            const response = await formDataClient.post(
                `/companies/${companyId}/roles/add`,
                formData
            )

            return response.data
        } catch (error: any) {
            // Enhanced error handling for role addition
            if (error.response?.status === 400) {
                const errorData = error.response.data
                throw new Error(
                    errorData?.message || 'Ungültige Daten für die Rollenerweiterung'
                )
            }

            if (error.response?.status === 403) {
                throw new Error(
                    'Sie haben keine Berechtigung, Rollen für dieses Unternehmen zu verwalten'
                )
            }

            if (error.response?.status === 404) {
                throw new Error('Unternehmen nicht gefunden')
            }

            if (error.response?.status === 409) {
                throw new Error(
                    'Diese Rolle ist bereits für das Unternehmen aktiviert'
                )
            }

            if (error.response?.status === 422) {
                const validationErrors = error.response.data?.fieldErrors
                if (validationErrors) {
                    const errorMessages = Object.entries(validationErrors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join(', ')
                    throw new Error(`Validierungsfehler: ${errorMessages}`)
                }
                throw new Error(
                    error.response.data?.message || 'Validierungsfehler bei der Rollenerweiterung'
                )
            }

            // Re-throw the error to be handled by the interceptor
            throw error
        }
    },

    /**
     * Get available roles that can be added to a company
     * @param companyId - The ID of the company to check available roles for
     * @returns Promise resolving to available roles and current role state
     */
    getAvailableRoles: async (companyId: string): Promise<AvailableRolesResponse> => {
        try {
            const response = await apiClient.get(`/companies/${companyId}/available-roles`)
            // The backend returns just an array of available roles, but we need to construct
            // the full response object. We'll get current roles from the company profile.
            const availableRoles = response.data as BusinessRole[]

            // Since we can't get current roles from this endpoint, we'll return a partial response
            // The hook will merge this with company profile data
            return {
                availableRoles,
                currentRoles: {
                    isAuftraggeber: false, // Will be overridden by hook with actual data
                    isAuftragnehmer: false, // Will be overridden by hook with actual data
                }
            }
        } catch (error: any) {
            // Enhanced error handling for available roles
            if (error.response?.status === 403) {
                throw new Error(
                    'Sie haben keine Berechtigung, Rolleninformationen für dieses Unternehmen abzurufen'
                )
            }

            if (error.response?.status === 404) {
                throw new Error('Unternehmen nicht gefunden')
            }

            // Re-throw the error to be handled by the interceptor
            throw error
        }
    },

    /**
     * Get role requirements for a specific business role
     * @param companyId - The ID of the company (for authorization)
     * @param role - The business role to get requirements for
     * @returns Promise resolving to role requirements data
     */
    getRoleRequirements: async (
        companyId: string,
        role: BusinessRole
    ): Promise<RoleRequirements> => {
        try {
            const response = await apiClient.get(
                `/companies/${companyId}/role-requirements`,
                {
                    params: { role }
                }
            )
            return response.data
        } catch (error: any) {
            // Enhanced error handling for role requirements
            if (error.response?.status === 400) {
                throw new Error('Ungültige Rolle angegeben')
            }

            if (error.response?.status === 403) {
                throw new Error(
                    'Sie haben keine Berechtigung, Rolleninformationen für dieses Unternehmen abzurufen'
                )
            }

            if (error.response?.status === 404) {
                throw new Error('Unternehmen nicht gefunden')
            }

            // Re-throw the error to be handled by the interceptor
            throw error
        }
    },

    /**
     * Upload verification documents for role addition
     * @param companyId - The ID of the company
     * @param role - The business role being added
     * @param files - FormData containing the verification documents
     * @returns Promise resolving to upload response with document URLs
     */
    uploadRoleVerificationDocuments: async (
        companyId: string,
        role: BusinessRole,
        files: FormData
    ): Promise<{ verificationDocumentUrl?: string; certificatesDocumentUrl?: string }> => {
        try {
            const formDataClient = createFormDataClient()
            const results: { verificationDocumentUrl?: string; certificatesDocumentUrl?: string } = {}

            // Upload verification document if present
            const verificationFile = files.get('verificationDocument') as File
            if (verificationFile) {
                const verificationFormData = new FormData()
                verificationFormData.append('file', verificationFile)

                const verificationResponse = await formDataClient.post(
                    '/files/company-verification',
                    verificationFormData
                )
                results.verificationDocumentUrl = verificationResponse.data.storedPath
            }

            // Upload certificates document if present
            const certificatesFile = files.get('certificatesDocument') as File
            if (certificatesFile) {
                const certificatesFormData = new FormData()
                certificatesFormData.append('file', certificatesFile)

                const certificatesResponse = await formDataClient.post(
                    '/files/company-certificates',
                    certificatesFormData
                )
                results.certificatesDocumentUrl = certificatesResponse.data.storedPath
            }

            return results
        } catch (error: any) {
            // Enhanced error handling for document uploads
            if (error.response?.status === 400) {
                throw new Error(
                    'Ungültige Dateien. Bitte überprüfen Sie das Dateiformat und die Größe.'
                )
            }

            if (error.response?.status === 403) {
                throw new Error(
                    'Sie haben keine Berechtigung, Dokumente für dieses Unternehmen hochzuladen'
                )
            }

            if (error.response?.status === 413) {
                throw new Error(
                    'Die Dateien sind zu groß. Maximale Dateigröße: 10MB pro Datei.'
                )
            }

            // Re-throw the error to be handled by the interceptor
            throw error
        }
    },



    /**
     * Validate role addition data before submission
     * @param data - The role addition data to validate
     * @returns Promise resolving to validation result
     */
    validateRoleAdditionData: async (data: AddBusinessRoleData): Promise<{
        valid: boolean;
        errors: Record<string, string>;
    }> => {
        try {
            const response = await apiClient.post('/companies/roles/validate', data)
            return response.data
        } catch (error: any) {
            // Handle validation errors
            if (error.response?.status === 422) {
                return {
                    valid: false,
                    errors: error.response.data?.fieldErrors || {},
                }
            }

            // Re-throw other errors
            throw error
        }
    },
}

/**
 * Helper functions for role management
 */
export const companyRoleHelpers = {
    /**
     * Prepare form data for file uploads (only for Auftragnehmer role)
     * @param data - Role addition data containing files
     * @returns FormData object ready for upload or null if no files needed
     */
    prepareFileUploadData: (data: AddBusinessRoleData): FormData | null => {
        // Only Auftragnehmer role requires file uploads
        if (data.role !== BusinessRole.AUFTRAGNEHMER) {
            return null
        }

        const formData = new FormData()
        let hasFiles = false

        if (data._verificationFile) {
            formData.append('verificationDocument', data._verificationFile)
            hasFiles = true
        }

        if (data._certificatesFile) {
            formData.append('certificatesDocument', data._certificatesFile)
            hasFiles = true
        }

        return hasFiles ? formData : null
    },

    /**
     * Get client-side role requirements (fallback for offline scenarios)
     * @param role - The business role
     * @returns Role requirements data
     */
    getClientSideRoleRequirements: (role: BusinessRole): RoleRequirements => {
        return BusinessRoleUtils.getRoleRequirements(role)
    },

    /**
     * Check if role addition requires file uploads
     * @param role - The business role being added
     * @returns Whether file uploads are required
     */
    requiresFileUploads: (role: BusinessRole): boolean => {
        return role === BusinessRole.AUFTRAGNEHMER
    },

    /**
     * Get the expected file upload fields for a role
     * @param role - The business role being added
     * @returns Array of file field names
     */
    getFileUploadFields: (role: BusinessRole): string[] => {
        if (role === BusinessRole.AUFTRAGNEHMER) {
            return ['verificationDocument', 'certificatesDocument']
        }
        return []
    },
}

export default companyRoleApi