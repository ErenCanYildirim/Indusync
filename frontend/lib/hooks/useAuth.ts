"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { authApi } from '@/lib/api/auth'
import { companyApi } from '@/lib/api/company'
import { profileApi } from '@/lib/api/profile'
import {
    setAuthToken,
    removeAuthToken,
    getAuthToken,
    setUserData,
    clearAuthData,
    setRefreshToken
} from '@/lib/utils/auth'
import { queryKeys } from '@/lib/api/types'
import type { LoginRequest, RegisterRequest, UserProfile } from '@/lib/api/types'
import type { UpdateProfileData } from '@/lib/types/profile'
import { toast } from 'sonner'
import {
    getCompanyPermissions,
    type CompanyRole,
    type CompanyPermissions
} from '@/lib/utils/permissions'

/**
 * Main authentication hook
 * Provides auth state and mutations for login, register, logout
 */
export const useAuth = () => {
    const queryClient = useQueryClient()
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)

    // Handle client-side mounting to prevent hydration issues
    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Get current user query
    const {
        data: user,
        isLoading: isLoadingUser,
        error: userError,
        isError: isUserError
    } = useQuery({
        queryKey: queryKeys.auth.user,
        queryFn: authApi.getCurrentUser,
        enabled: isMounted && !!getAuthToken(), // Only fetch if mounted and we have a token
        retry: false, // Don't retry auth queries
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })

    // Get company profile query
    const {
        data: companyProfile,
        isLoading: isLoadingCompanyProfile,
        error: companyProfileError,
    } = useQuery({
        queryKey: queryKeys.company.profile,
        queryFn: companyApi.getCompanyProfile,
        enabled: isMounted && !!getAuthToken() && !!(user?.companyId || user?.currentCompanyMembership?.companyId), // Use companyId or currentCompanyMembership.companyId as fallback
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    })

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: (data: LoginRequest) => authApi.login(data),
        onSuccess: (response, variables) => {
            // Store tokens
            setAuthToken(response.token, variables.rememberMe)
            if (response.refreshToken) {
                setRefreshToken(response.refreshToken)
            }

            // Store user data
            setUserData(response.user)
            queryClient.setQueryData(queryKeys.auth.user, response.user)

            // Invalidate all queries to refetch with new auth
            queryClient.invalidateQueries({ queryKey: ['auth'] })
            queryClient.invalidateQueries({ queryKey: ['company'] })

            // Success message
            toast.success(`Willkommen zurück, ${response.user.firstName || response.user.email}!`)

            // Redirect to dashboard
            router.push('/dashboard')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Anmeldung fehlgeschlagen'
            toast.error(message)
        }
    })

    // Register mutation with file upload support
    const registerMutation = useMutation({
        mutationFn: (params: { data: RegisterRequest; files?: { verificationFile?: File; certificatesFile?: File } }) =>
            authApi.register(params.data, params.files),
        onSuccess: (response) => {
            // Store tokens
            setAuthToken(response.token)
            if (response.refreshToken) {
                setRefreshToken(response.refreshToken)
            }

            // Store user data
            setUserData(response.user)
            queryClient.setQueryData(queryKeys.auth.user, response.user)

            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['auth'] })
            queryClient.invalidateQueries({ queryKey: ['company'] })

            // Success message
            toast.success('Registrierung erfolgreich! Willkommen bei IndusSync.')

            // Redirect based on account type
            if (response.user.accountType === 'BUSINESS') {
                router.push('/dashboard')
            } else {
                router.push('/dashboard')
            }
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Registrierung fehlgeschlagen'
            toast.error(message)
        }
    })

    // Logout mutation
    const logoutMutation = useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            handleLogout()
        },
        onError: () => {
            // Even if logout fails on server, clear local data
            handleLogout()
        }
    })

    // Helper function to handle logout cleanup
    const handleLogout = () => {
        clearAuthData()
        queryClient.clear() // Clear all cached data
        toast.success('Sie wurden erfolgreich abgemeldet.')
        router.push('/login')
    }

    // Check authentication status
    const checkAuthMutation = useMutation({
        mutationFn: () => authApi.checkAuth(),
        onError: () => {
            // If auth check fails, user is not authenticated
            clearAuthData()
            queryClient.removeQueries({ queryKey: queryKeys.auth.user })
        }
    })

    // Update profile mutation
    const updateProfileMutation = useMutation({
        mutationFn: (data: UpdateProfileData) => profileApi.updateProfile(data),
        onSuccess: (updatedUser) => {
            queryClient.setQueryData(queryKeys.auth.user, updatedUser)
            setUserData(updatedUser)
            toast.success('Profil erfolgreich aktualisiert.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Aktualisieren des Profils'
            toast.error(message)
        }
    })    // Change password mutation
    const changePasswordMutation = useMutation({
        mutationFn: ({ currentPassword, newPassword, confirmPassword }: {
            currentPassword: string
            newPassword: string
            confirmPassword: string
        }) => authApi.changePassword(currentPassword, newPassword, confirmPassword),
        onSuccess: () => {
            toast.success('Passwort erfolgreich geändert.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Ändern des Passworts'
            toast.error(message)
        }
    })

    // Request password reset mutation
    const requestPasswordResetMutation = useMutation({
        mutationFn: (email: string) => authApi.requestPasswordReset(email),
        onSuccess: () => {
            toast.success('Anweisungen zum Zurücksetzen des Passworts wurden an Ihre E-Mail gesendet.')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Senden der E-Mail'
            toast.error(message)
        }
    })

    // Reset password mutation
    const resetPasswordMutation = useMutation({
        mutationFn: ({ token, newPassword, confirmPassword }: { token: string, newPassword: string, confirmPassword: string }) =>
            authApi.resetPassword(token, newPassword, confirmPassword),
        onSuccess: () => {
            toast.success('Passwort erfolgreich zurückgesetzt. Sie können sich jetzt anmelden.')
            router.push('/login')
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler beim Zurücksetzen des Passworts'
            toast.error(message)
        }
    })

    // Verify email mutation
    const verifyEmailMutation = useMutation({
        mutationFn: (token: string) => authApi.verifyEmail(token),
        onSuccess: () => {
            toast.success('E-Mail erfolgreich verifiziert.')
            queryClient.invalidateQueries({ queryKey: queryKeys.auth.user })
        },
        onError: (error: any) => {
            const message = error?.response?.data?.message || 'Fehler bei der E-Mail-Verifizierung'
            toast.error(message)
        }
    })

    // Computed values
    const isAuthenticated = !!user && !isUserError
    const hasToken = isMounted ? !!getAuthToken() : false
    const isEmailVerified = user?.emailVerified === true

    // Company role and permissions - FIXED: Use company profile data to determine company role
    const companyRole = useMemo((): CompanyRole | null => {
        if (!companyProfile) return null;

        // Determine role based on company profile flags (company's role, not user's permissions)
        const isClient = companyProfile.isAuftraggeber === true;
        const isProvider = companyProfile.isAuftragnehmer === true;


        if (isClient && isProvider) {
            return 'BOTH';
        } else if (isClient) {
            return 'CLIENT';
        } else if (isProvider) {
            return 'PROVIDER';
        }

        // Default fallback - if no role is explicitly set, assume CLIENT
        return 'CLIENT';
    }, [companyProfile, user]);

    const companyPermissions = useMemo((): CompanyPermissions | null => {
        if (!companyRole) return null;
        return getCompanyPermissions(companyRole);
    }, [companyRole]);

    return {
        // User state
        user,
        isLoadingUser,
        isUserError,
        isAuthenticated,
        hasToken,
        isEmailVerified,

        // Company profile state
        companyProfile,
        isLoadingCompanyProfile,
        companyProfileError,

        // Company role and permissions
        companyRole,
        companyPermissions,

        // Mutations
        login: loginMutation.mutate,
        loginAsync: loginMutation.mutateAsync,
        isLoggingIn: loginMutation.isPending,

        register: registerMutation.mutate,
        registerAsync: registerMutation.mutateAsync,
        // Expose error and loading state for registration
        registerError: registerMutation.error,
        isRegisterLoading: registerMutation.isPending,
        isRegistering: registerMutation.isPending,

        logout: logoutMutation.mutate,
        logoutAsync: logoutMutation.mutateAsync,
        isLoggingOut: logoutMutation.isPending,

        checkAuth: checkAuthMutation.mutate,

        updateProfile: updateProfileMutation.mutate,
        updateProfileAsync: updateProfileMutation.mutateAsync,
        isUpdatingProfile: updateProfileMutation.isPending,

        changePassword: changePasswordMutation.mutate,
        changePasswordAsync: changePasswordMutation.mutateAsync,
        isChangingPassword: changePasswordMutation.isPending,

        requestPasswordReset: requestPasswordResetMutation.mutate,
        requestPasswordResetAsync: requestPasswordResetMutation.mutateAsync,
        isRequestingPasswordReset: requestPasswordResetMutation.isPending,

        resetPassword: resetPasswordMutation.mutate,
        resetPasswordAsync: resetPasswordMutation.mutateAsync,
        isResettingPassword: resetPasswordMutation.isPending,

        verifyEmail: verifyEmailMutation.mutate,
        verifyEmailAsync: verifyEmailMutation.mutateAsync,
        isVerifyingEmail: verifyEmailMutation.isPending,
    }
}

export default useAuth
