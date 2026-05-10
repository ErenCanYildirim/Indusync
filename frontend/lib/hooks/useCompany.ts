import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { companyApi } from '@/lib/api/company'
import { queryKeys } from '@/lib/api/types'
import type { CompanyProfile } from '@/lib/api/types'
import { toast } from 'sonner'

/**
 * Company management hook
 * Provides company-related queries and mutations
 */
export const useCompany = () => {
    const queryClient = useQueryClient()

    // Get company profile query
    const {
        data: company,
        isLoading,
        error,
        isError
    } = useQuery({
        queryKey: queryKeys.company.profile,
        queryFn: companyApi.getCompanyProfile,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })    // Update company profile mutation
    const updateCompanyMutation = useMutation({
        mutationFn: (data: Partial<CompanyProfile>) => {
            if (!company?.companyId && !company?.id) {
                return Promise.reject(new Error('Unternehmensdaten wurden noch nicht geladen.'))
            }
            // Use companyId from backend response, fallback to id if available
            const companyId = company.companyId || company.id!
            return companyApi.updateCompanyProfile(companyId, data)
        },
        onSuccess: (updatedCompany) => {
            // Update the cached company data
            queryClient.setQueryData(queryKeys.company.profile, updatedCompany)
            toast.success('Unternehmensprofil erfolgreich aktualisiert.')
        },
        onError: (error: any) => {
            console.error('Company update error:', error)

            // Handle specific error cases
            if (error?.response?.status === 404) {
                toast.error('Unternehmen nicht gefunden.')
            } else if (error?.response?.status === 403) {
                toast.error('Sie haben keine Berechtigung, diese Unternehmensdaten zu ändern.')
            } else if (error?.response?.status === 400) {
                const message = error?.response?.data?.message || 'Ungültige Eingabedaten.'
                toast.error(message)
            } else {
                const message = error?.response?.data?.message || 'Fehler beim Aktualisieren des Unternehmensprofils'
                toast.error(message)
            }
        }
    })

    // Upload verification documents mutation
    const uploadVerificationMutation = useMutation({
        mutationFn: (files: FormData) => companyApi.uploadVerificationDocuments(files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.company.profile })
            toast.success('Verifizierungsdokumente erfolgreich hochgeladen.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Hochladen der Dokumente'
            toast.error(message)
        }
    })

    // Upload certificates mutation
    const uploadCertificatesMutation = useMutation({
        mutationFn: (files: FormData) => companyApi.uploadCertificates(files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.company.profile })
            toast.success('Zertifikate erfolgreich hochgeladen.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Hochladen der Zertifikate'
            toast.error(message)
        }
    })

    // Submit for verification mutation
    const submitVerificationMutation = useMutation({
        mutationFn: () => companyApi.submitForVerification(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.company.profile })
            toast.success('Verifizierungsantrag erfolgreich eingereicht.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Einreichen des Verifizierungsantrags'
            toast.error(message)
        }
    })

    // Update company location mutation
    const updateLocationMutation = useMutation({
        mutationFn: (data: {
            latitude: number
            longitude: number
            street?: string
            houseNumber?: string
            postalCode?: string
            city?: string
            country?: string
        }) => companyApi.updateLocation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.company.profile })
            toast.success('Standort erfolgreich aktualisiert.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Aktualisieren des Standorts'
            toast.error(message)
        }
    })

    // Update work radius mutation
    const updateWorkRadiusMutation = useMutation({
        mutationFn: (workRadiusKm: number) => companyApi.updateWorkRadius(workRadiusKm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.company.profile })
            toast.success('Arbeitsradius erfolgreich aktualisiert.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Aktualisieren des Arbeitsradius'
            toast.error(message)
        }
    })

    // Upload logo mutation
    const uploadLogoMutation = useMutation({
        mutationFn: (logoFile: File) => companyApi.uploadLogo(logoFile),
        onSuccess: (updatedCompany) => {
            // Update the cached company data with the new logo URL
            queryClient.setQueryData(queryKeys.company.profile, updatedCompany)
            toast.success('Firmenlogo erfolgreich aktualisiert.')
        },
        onError: (error: any) => {
            console.error('Logo upload error:', error)

            // Handle specific error cases
            if (error?.response?.status === 404) {
                toast.error('Unternehmen nicht gefunden.')
            } else if (error?.response?.status === 403) {
                toast.error('Sie haben keine Berechtigung, das Logo zu ändern.')
            } else if (error?.response?.status === 400) {
                const message = error?.response?.data || 'Ungültige Datei oder Dateigröße zu groß.'
                toast.error(message)
            } else {
                const message = error?.response?.data || 'Fehler beim Hochladen des Logos'
                toast.error(message)
            }
        }
    })

    return {
        // Company state
        company,
        isLoading,
        error,
        isError,        // Company actions
        updateCompany: updateCompanyMutation.mutate,
        uploadLogo: uploadLogoMutation.mutate,
        uploadVerificationDocuments: uploadVerificationMutation.mutate,
        uploadCertificates: uploadCertificatesMutation.mutate,
        submitForVerification: submitVerificationMutation.mutate,
        updateLocation: updateLocationMutation.mutate,
        updateWorkRadius: updateWorkRadiusMutation.mutate,        // Loading states
        isUpdating: updateCompanyMutation.isPending,
        isUploadingLogo: uploadLogoMutation.isPending,
        isUploadingVerification: uploadVerificationMutation.isPending,
        isUploadingCertificates: uploadCertificatesMutation.isPending,
        isSubmittingVerification: submitVerificationMutation.isPending,
        isUpdatingLocation: updateLocationMutation.isPending,
        isUpdatingWorkRadius: updateWorkRadiusMutation.isPending,

        // Error states
        updateError: updateCompanyMutation.error,
        uploadVerificationError: uploadVerificationMutation.error,
        uploadCertificatesError: uploadCertificatesMutation.error,
    }
}

/**
 * Hook for company verification status
 */
export const useCompanyVerification = () => {
    const queryClient = useQueryClient()

    const {
        data: verificationStatus,
        isLoading,
        error } = useQuery({
            queryKey: ['company', 'verification-status'],
            queryFn: companyApi.getVerificationStatus,
            staleTime: 2 * 60 * 1000, // 2 minutes
        })

    return {
        verificationStatus,
        isLoading,
        error,
        isPending: verificationStatus?.status === 'pending',
        isApproved: verificationStatus?.status === 'approved',
        isRejected: verificationStatus?.status === 'rejected',
        isNotSubmitted: verificationStatus?.status === 'not_submitted',
    }
}

/**
 * Hook for company statistics
 */
export const useCompanyStats = () => {
    const {
        data: stats,
        isLoading,
        error
    } = useQuery({
        queryKey: ['company', 'stats'],
        queryFn: companyApi.getCompanyStats,
        staleTime: 10 * 60 * 1000, // 10 minutes
    })

    return {
        stats,
        isLoading,
        error,
    }
}

/**
 * Hook for company search with filters
 */
export const useCompanySearch = (params?: {
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
}) => {
    const {
        data: searchResults,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['company', 'search', params],
        queryFn: () => companyApi.searchCompanies(params),
        enabled: !!params, // Only fetch when params are provided
        staleTime: 2 * 60 * 1000, // 2 minutes
    })

    return {
        companies: searchResults?.data || [],
        pagination: searchResults ? {
            page: searchResults.page,
            size: searchResults.size,
            totalElements: searchResults.totalElements,
            totalPages: searchResults.totalPages,
            first: searchResults.first,
            last: searchResults.last,
        } : null,
        isLoading,
        error,
        refetch,
    }
}

/**
 * Hook for favorite companies management
 */
export const useFavoriteCompanies = () => {
    const queryClient = useQueryClient()

    const {
        data: favoriteCompanies,
        isLoading,
        error
    } = useQuery({
        queryKey: ['company', 'favorites'],
        queryFn: () => companyApi.getFavoriteCompanies(),
        staleTime: 5 * 60 * 1000, // 5 minutes
    })

    const addToFavoritesMutation = useMutation({
        mutationFn: (companyId: string) => companyApi.addToFavorites(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', 'favorites'] })
            toast.success('Unternehmen zu Favoriten hinzugefügt.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Hinzufügen zu Favoriten'
            toast.error(message)
        }
    })

    const removeFromFavoritesMutation = useMutation({
        mutationFn: (companyId: string) => companyApi.removeFromFavorites(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company', 'favorites'] })
            toast.success('Unternehmen aus Favoriten entfernt.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Entfernen aus Favoriten'
            toast.error(message)
        }
    })

    return {
        favoriteCompanies: favoriteCompanies?.data || [],
        isLoading,
        error,
        addToFavorites: addToFavoritesMutation.mutate,
        removeFromFavorites: removeFromFavoritesMutation.mutate,
        isAddingToFavorites: addToFavoritesMutation.isPending,
        isRemovingFromFavorites: removeFromFavoritesMutation.isPending,
    }
}

export default useCompany