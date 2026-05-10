"use client"

import { useState, useCallback, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { companyRoleApi } from "@/lib/api/company-role"
import { useAuth } from "@/lib/hooks/useAuth"
import { toast } from "sonner"
import {
    BusinessRole,
    CompanyRoles,
    AddBusinessRoleData,
    CompanyRoleAdditionResponse,
    AvailableRolesResponse,
    RoleRequirements
} from "@/lib/types/company-role-management"
import { BusinessRoleUtils } from "@/lib/types/company-role-management"

/**
 * Return type for the useCompanyRoles hook
 */
export interface UseCompanyRolesReturn {
    /** Current company roles state */
    currentRoles: CompanyRoles | null
    /** Available roles that can be added */
    availableRoles: BusinessRole[]
    /** Loading state for initial data fetch */
    isLoading: boolean
    /** Loading state for role addition */
    isAddingRole: boolean
    /** Loading state for data refresh */
    isRefreshing: boolean
    /** Error message if any operation fails */
    error: string | null
    /** Function to add a business role with optimistic updates */
    addBusinessRole: (role: BusinessRole, data: AddBusinessRoleData) => Promise<CompanyRoleAdditionResponse>
    /** Function to manually refresh role data */
    refreshRoles: () => Promise<void>
    /** Function to get role requirements */
    getRoleRequirements: (role: BusinessRole) => Promise<RoleRequirements>
    /** Function to check if a role can be added */
    canAddRole: (role: BusinessRole) => boolean
    /** Function to clear error state */
    clearError: () => void
}

/**
 * Query keys for React Query caching
 */
const queryKeys = {
    companyRoles: (companyId: string) => ['company-roles', companyId] as const,
    availableRoles: (companyId: string) => ['company-roles', 'available', companyId] as const,
    roleRequirements: (companyId: string, role: BusinessRole) => ['company-roles', 'requirements', companyId, role] as const,
}

/**
 * Custom hook for managing company roles state and operations.
 * 
 * Provides comprehensive role management functionality including:
 * - Current roles and available roles fetching with loading states
 * - Role addition with optimistic updates and error handling
 * - Manual data refresh capability
 * - Role requirements fetching
 * - Integration with global auth state for company context
 * 
 * Features:
 * - Optimistic updates for better UX during role addition
 * - Comprehensive error handling with user-friendly messages
 * - Loading states for all operations
 * - Automatic cache invalidation after successful operations
 * - Integration with toast notifications for user feedback
 * - TypeScript support with proper type safety
 * 
 * @param companyId - The ID of the company to manage roles for (optional, uses auth context if not provided)
 * @returns UseCompanyRolesReturn object with role state and operations
 */
export function useCompanyRoles(companyId?: string): UseCompanyRolesReturn {
    const queryClient = useQueryClient()
    const { user, companyProfile } = useAuth()
    const [error, setError] = useState<string | null>(null)

    // Determine the company ID to use
    const effectiveCompanyId = companyId || user?.companyId || user?.currentCompanyMembership?.companyId || companyProfile?.id

    // Query for available roles (includes current roles)
    const {
        data: availableRolesData,
        isLoading: isLoadingAvailableRoles,
        error: availableRolesError,
        refetch: refetchAvailableRoles
    } = useQuery({
        queryKey: queryKeys.availableRoles(effectiveCompanyId || ''),
        queryFn: () => companyRoleApi.getAvailableRoles(effectiveCompanyId!),
        enabled: !!effectiveCompanyId,
        retry: 2,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 5 * 60 * 1000, // 5 minutes
    })

    // Get current roles from company profile instead of making a separate API call
    // since the /companies/{id}/roles endpoint doesn't exist in the backend
    const currentRolesFromProfile: CompanyRoles | null = companyProfile ? {
        isAuftraggeber: companyProfile.isAuftraggeber || false,
        isAuftragnehmer: companyProfile.isAuftragnehmer || false,
    } : null

    // Mutation for adding business roles
    const addRoleMutation = useMutation({
        mutationFn: ({ role, data }: { role: BusinessRole; data: AddBusinessRoleData }) =>
            companyRoleApi.addBusinessRole(effectiveCompanyId!, data),
        onMutate: async ({ role }) => {
            // Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: queryKeys.availableRoles(effectiveCompanyId!) })
            await queryClient.cancelQueries({ queryKey: queryKeys.companyRoles(effectiveCompanyId!) })

            // Snapshot previous values
            const previousAvailableRoles = queryClient.getQueryData(queryKeys.availableRoles(effectiveCompanyId!))
            const previousCurrentRoles = queryClient.getQueryData(queryKeys.companyRoles(effectiveCompanyId!))

            // Optimistically update current roles
            if (previousAvailableRoles) {
                const optimisticRoles: AvailableRolesResponse = {
                    ...previousAvailableRoles as AvailableRolesResponse,
                    currentRoles: {
                        ...((previousAvailableRoles as AvailableRolesResponse).currentRoles),
                        [role === BusinessRole.AUFTRAGGEBER ? 'isAuftraggeber' : 'isAuftragnehmer']: true
                    },
                    availableRoles: ((previousAvailableRoles as AvailableRolesResponse).availableRoles).filter(r => r !== role)
                }
                queryClient.setQueryData(queryKeys.availableRoles(effectiveCompanyId!), optimisticRoles)
            }

            if (previousCurrentRoles) {
                const optimisticCurrentRoles: CompanyRoles = {
                    ...(previousCurrentRoles as CompanyRoles),
                    [role === BusinessRole.AUFTRAGGEBER ? 'isAuftraggeber' : 'isAuftragnehmer']: true
                }
                queryClient.setQueryData(queryKeys.companyRoles(effectiveCompanyId!), optimisticCurrentRoles)
            }

            return { previousAvailableRoles, previousCurrentRoles }
        },
        onSuccess: (response, { role }) => {
            // Update cache with server response
            const updatedRoles: CompanyRoles = {
                isAuftraggeber: response.isAuftraggeber,
                isAuftragnehmer: response.isAuftragnehmer
            }

            const updatedAvailableRoles: AvailableRolesResponse = {
                currentRoles: updatedRoles,
                availableRoles: BusinessRoleUtils.getAvailableRoles(updatedRoles)
            }

            queryClient.setQueryData(queryKeys.availableRoles(effectiveCompanyId!), updatedAvailableRoles)
            queryClient.setQueryData(queryKeys.companyRoles(effectiveCompanyId!), updatedRoles)

            // Invalidate related queries to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['company'] })
            queryClient.invalidateQueries({ queryKey: ['auth'] })

            // Clear any existing errors
            setError(null)

            // Show success message
            const roleName = BusinessRoleUtils.getDisplayName(role)
            toast.success(`${roleName}-Rolle erfolgreich hinzugefügt!`, {
                description: response.message || `Ihr Unternehmen kann jetzt als ${roleName} agieren.`
            })

            // Show verification message if required
            if (response.requiresVerification) {
                toast.info("Dokumente werden geprüft", {
                    description: "Ihre hochgeladenen Dokumente werden geprüft. Sie erhalten eine Benachrichtigung über das Ergebnis."
                })
            }
        },
        onError: (err, { role }, context) => {
            // Revert optimistic updates
            if (context?.previousAvailableRoles) {
                queryClient.setQueryData(queryKeys.availableRoles(effectiveCompanyId!), context.previousAvailableRoles)
            }
            if (context?.previousCurrentRoles) {
                queryClient.setQueryData(queryKeys.companyRoles(effectiveCompanyId!), context.previousCurrentRoles)
            }

            // Handle error
            const errorMessage = err instanceof Error ? err.message : "Fehler beim Hinzufügen der Rolle"
            setError(errorMessage)

            const roleName = BusinessRoleUtils.getDisplayName(role)
            toast.error(`Fehler beim Hinzufügen der ${roleName}-Rolle`, {
                description: errorMessage
            })

            console.error("Error adding business role:", err)
        }
    })

    // Handle query errors
    useEffect(() => {
        if (availableRolesError) {
            const errorMessage = availableRolesError instanceof Error
                ? availableRolesError.message
                : "Fehler beim Laden der verfügbaren Rollen"
            setError(errorMessage)
        } else {
            setError(null)
        }
    }, [availableRolesError])

    /**
     * Add a business role to the company
     */
    const addBusinessRole = useCallback(async (
        role: BusinessRole,
        data: AddBusinessRoleData
    ): Promise<CompanyRoleAdditionResponse> => {
        if (!effectiveCompanyId) {
            throw new Error("Keine Unternehmens-ID verfügbar")
        }

        setError(null)
        return addRoleMutation.mutateAsync({ role, data })
    }, [effectiveCompanyId, addRoleMutation])

    /**
     * Refresh role data from the server
     */
    const refreshRoles = useCallback(async (): Promise<void> => {
        if (!effectiveCompanyId) {
            throw new Error("Keine Unternehmens-ID verfügbar")
        }

        setError(null)

        try {
            await refetchAvailableRoles()
            // Also invalidate company profile to get updated role data
            queryClient.invalidateQueries({ queryKey: ['company'] })
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Fehler beim Aktualisieren der Rollendaten"
            setError(errorMessage)
            throw err
        }
    }, [effectiveCompanyId, refetchAvailableRoles,])

    /**
     * Get role requirements for a specific business role
     */
    const getRoleRequirements = useCallback(async (role: BusinessRole): Promise<RoleRequirements> => {
        if (!effectiveCompanyId) {
            throw new Error("Keine Unternehmens-ID verfügbar")
        }

        try {
            return await companyRoleApi.getRoleRequirements(effectiveCompanyId, role)
        } catch (err) {
            // Fallback to client-side requirements if API fails
            console.warn("Failed to fetch role requirements from API, using client-side fallback:", err)
            return BusinessRoleUtils.getRoleRequirements(role)
        }
    }, [effectiveCompanyId])

    /**
     * Check if a role can be added to the company
     */
    const canAddRole = useCallback((role: BusinessRole): boolean => {
        const currentRoles = availableRolesData?.currentRoles || currentRolesFromProfile
        if (!currentRoles) return false

        return BusinessRoleUtils.canAddRole(currentRoles, role)
    }, [availableRolesData, currentRolesFromProfile])

    /**
     * Clear error state
     */
    const clearError = useCallback(() => {
        setError(null)
    }, [])

    // Determine loading states
    const isLoading = isLoadingAvailableRoles
    const isAddingRole = addRoleMutation.isPending
    const isRefreshing = false // Will be true during manual refresh

    // Extract current roles and available roles
    const currentRoles = availableRolesData?.currentRoles || currentRolesFromProfile || null
    const availableRoles = availableRolesData?.availableRoles ||
        (currentRoles ? BusinessRoleUtils.getAvailableRoles(currentRoles) : [])

    return {
        currentRoles,
        availableRoles,
        isLoading,
        isAddingRole,
        isRefreshing,
        error,
        addBusinessRole,
        refreshRoles,
        getRoleRequirements,
        canAddRole,
        clearError
    }
}

export default useCompanyRoles