"use client"

import { useState, useCallback, useMemo } from "react"
import { useAuth } from "@/lib/hooks/useAuth"
import { profileApi } from "@/lib/api/profile"
import type {
    UserProfile as ProfileUserProfile,
    UpdateProfileData,
    ChangePasswordData,
    UseProfileReturn,
    ProfileApiError
} from "@/lib/types/profile"
import type { UserProfile as ApiUserProfile } from "@/lib/api/types"
import { isProfileApiError } from "@/lib/types/profile"

/**
 * Custom hook for managing user profile state and operations.
 * 
 * Provides comprehensive profile management functionality including:
 * - Profile data fetching with loading and error states
 * - Profile updates with optimistic updates and global state synchronization
 * - Password changes with proper error handling
 * - Manual profile refresh capability
 * 
 * Features:
 * - Integrates with global useAuth state for real-time updates across application
 * - Optimistic updates for better UX
 * - Comprehensive error handling with specific error messages
 * - Loading states for all operations
 * - Automatic profile refresh after successful operations
 * - Maintains user session after profile updates
 * 
 * @returns UseProfileReturn object with profile state and operations
 */
export function useProfile(): UseProfileReturn {
    // Use global auth state instead of local state for real-time updates
    const {
        user: authUser,
        isLoadingUser,
        updateProfile: updateAuthProfile,
        isUpdatingProfile,
        changePassword: changeAuthPassword,
        isChangingPassword
    } = useAuth()

    const [error, setError] = useState<string | null>(null)

    /**
     * Transform API UserProfile to Profile UserProfile
     * Converts the user data from the API format to the profile format
     */
    const transformUser = useCallback((apiUser: ApiUserProfile | null): ProfileUserProfile | null => {
        if (!apiUser) return null

        return {
            ...apiUser,
            // Ensure required fields have proper values
            firstName: apiUser.firstName || '',
            lastName: apiUser.lastName || '',
            // Add missing properties with default values
            active: true, // Assume user is active if they're authenticated
            emailNotifications: true, // Default to true, will be updated from backend
            fullName: apiUser.firstName && apiUser.lastName
                ? `${apiUser.firstName} ${apiUser.lastName}`
                : undefined
        }
    }, [])

    // Memoize transformed user so reference is stable across renders unless authUser changes
    const memoizedUser = useMemo(() => transformUser(authUser ?? null), [authUser, transformUser])

    /**
     * Refresh profile data from the backend
     * Uses the global auth state refresh mechanism to ensure consistency
     * Handles authentication errors and redirects to login if needed
     */
    const refreshProfile = useCallback(async (): Promise<void> => {
        setError(null)

        try {
            // Use the auth API to refresh profile data which will update global state
            const profileData = await profileApi.getProfile()
            // The auth hook will automatically update its state through React Query
            // No need to manually update local state since we're using authUser
        } catch (err) {
            // Handle authentication errors - redirect to login
            if (err instanceof Error && err.message.includes("Nicht authentifiziert")) {
                console.warn("Authentication error during profile fetch, redirecting to login")
                // The API client will handle the redirect automatically
                setError("Sitzung abgelaufen. Sie werden zur Anmeldung weitergeleitet...")
                return
            }

            const errorMessage = err instanceof Error ? err.message : "Fehler beim Laden des Profils"
            setError(errorMessage)
            console.error("Error fetching profile:", err)
        }
    }, [])

    /**
     * Update user profile with global state synchronization
     * Updates the profile data using the global auth state for real-time updates across application
     * 
     * @param data - Profile data to update
     * @throws Error if update fails
     */
    const updateProfile = useCallback(async (data: UpdateProfileData): Promise<void> => {
        if (!authUser) {
            throw new Error("Kein Benutzerprofil geladen")
        }

        setError(null)

        try {
            // Use the global auth updateProfile method which handles:
            // - API call to backend
            // - Global state updates via React Query
            // - Toast notifications
            // - Optimistic updates through React Query
            await updateAuthProfile(data)

            // The global auth state will be automatically updated by React Query
            // All components using useAuth will see the updated user data immediately
        } catch (err) {
            // Handle different error types
            if (isProfileApiError(err)) {
                // Handle validation errors with field-specific messages
                if (err.validationErrors && err.validationErrors.length > 0) {
                    const fieldErrors = err.validationErrors.map(ve => ve.message).join(", ")
                    setError(`Validierungsfehler: ${fieldErrors}`)
                } else {
                    setError(err.message)
                }
            } else {
                const errorMessage = err instanceof Error ? err.message : "Fehler beim Aktualisieren des Profils"
                setError(errorMessage)
            }

            console.error("Error updating profile:", err)
            throw err
        }
    }, [authUser, updateAuthProfile])

    /**
     * Change user password with global state integration
     * Uses the global auth state for consistent password change handling
     * 
     * @param data - Password change data (current, new, confirm passwords)
     * @throws Error if password change fails
     */
    const changePassword = useCallback(async (data: ChangePasswordData): Promise<void> => {
        setError(null)

        try {
            // Use the global auth changePassword method which handles:
            // - API call to backend
            // - Toast notifications
            // - Proper error handling
            await changeAuthPassword({
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            })

            // Password change successful - user session remains valid
            // The global auth state handles all the necessary updates
        } catch (err) {
            // Handle password-specific errors
            const errorMessage = err instanceof Error ? err.message : "Fehler beim Ändern des Passworts"
            setError(errorMessage)

            console.error("Error changing password:", err)
            throw err
        }
    }, [changeAuthPassword])

    return {
        user: memoizedUser,
        loading: isLoadingUser || isUpdatingProfile || isChangingPassword,
        error,
        updateProfile,
        changePassword,
        refreshProfile
    }
}

export default useProfile