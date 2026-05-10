import { apiClient } from './client'
import type {
    UserProfile,
    UpdateProfileData,
    ChangePasswordData,
    ProfileApiError,
    UpdateProfileResponse,
    ChangePasswordResponse
} from '@/lib/types/profile'

/**
 * Profile API service
 * Handles all profile-related API operations including fetching, updating profile data,
 * and changing passwords with proper error handling and HTTP status code processing.
 */
export const profileApi = {
    /**
     * Get current user profile
     * Fetches the current user's profile information from the backend
     * 
     * @returns Promise<UserProfile> - The current user's profile data
     * @throws Error with specific message for different error scenarios
     */
    async getProfile(): Promise<UserProfile> {
        try {
            const response = await apiClient.get('/auth/profile')
            return response.data
        } catch (error: any) {
            // Handle different error scenarios with specific messages
            if (error.response?.status === 401) {
                throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
            }
            if (error.response?.status === 404) {
                throw new Error('Benutzerprofil nicht gefunden.')
            }
            if (error.response?.status >= 500) {
                throw new Error('Serverfehler beim Laden des Profils. Bitte versuchen Sie es später erneut.')
            }

            // Handle network errors
            if (!error.response) {
                throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
            }

            const errorMessage = error.response?.data?.message || 'Fehler beim Laden des Profils'
            throw new Error(errorMessage)
        }
    },

    /**
     * Update user profile
     * Updates the current user's profile information with validation
     * 
     * @param data - Profile data to update (firstName, lastName, phone, website, emailNotifications)
     * @returns Promise<UserProfile> - The updated user profile data
     * @throws ProfileApiError with validation errors or Error with specific message
     */
    async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
        try {
            const response = await apiClient.put('/auth/update-profile', data)
            return response.data
        } catch (error: any) {
            // Handle validation errors with field-specific details
            if (error.response?.status === 400) {
                const validationErrors = error.response.data?.validationErrors || []
                const profileError: ProfileApiError = {
                    message: error.response.data?.message || 'Validierungsfehler',
                    validationErrors: validationErrors
                }
                throw profileError
            }

            // Handle authentication errors
            if (error.response?.status === 401) {
                throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
            }

            // Handle authorization errors
            if (error.response?.status === 403) {
                throw new Error('Keine Berechtigung zum Aktualisieren des Profils.')
            }

            // Handle user not found
            if (error.response?.status === 404) {
                throw new Error('Benutzerprofil nicht gefunden.')
            }

            // Handle server errors
            if (error.response?.status >= 500) {
                throw new Error('Serverfehler beim Aktualisieren des Profils. Bitte versuchen Sie es später erneut.')
            }

            // Handle network errors
            if (!error.response) {
                throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
            }

            const errorMessage = error.response?.data?.message || 'Fehler beim Aktualisieren des Profils'
            throw new Error(errorMessage)
        }
    },

    /**
     * Change user password
     * Changes the current user's password with proper validation and security checks
     * 
     * @param data - Password change data (currentPassword, newPassword, confirmPassword)
     * @returns Promise<void> - Resolves on successful password change
     * @throws Error with specific message for different validation and error scenarios
     */
    async changePassword(data: ChangePasswordData): Promise<void> {
        try {
            await apiClient.post('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
                confirmPassword: data.confirmPassword
            })
        } catch (error: any) {
            // Handle validation errors with specific password-related messages
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.message

                // Handle specific password validation errors
                if (errorMessage?.includes('current password') || errorMessage?.includes('aktuelles Passwort')) {
                    throw new Error('Das aktuelle Passwort ist falsch.')
                }
                if (errorMessage?.includes('password confirmation') || errorMessage?.includes('Passwort-Bestätigung')) {
                    throw new Error('Die Passwort-Bestätigung stimmt nicht überein.')
                }
                if (errorMessage?.includes('password length') || errorMessage?.includes('8 characters') || errorMessage?.includes('8 Zeichen')) {
                    throw new Error('Das neue Passwort muss mindestens 8 Zeichen lang sein.')
                }
                if (errorMessage?.includes('password requirements') || errorMessage?.includes('Passwort-Anforderungen')) {
                    throw new Error('Das neue Passwort erfüllt nicht die Sicherheitsanforderungen.')
                }

                throw new Error(errorMessage || 'Ungültige Passwort-Daten')
            }

            // Handle authentication errors
            if (error.response?.status === 401) {
                throw new Error('Nicht authentifiziert. Bitte melden Sie sich erneut an.')
            }

            // Handle authorization errors
            if (error.response?.status === 403) {
                throw new Error('Keine Berechtigung zum Ändern des Passworts.')
            }

            // Handle user not found
            if (error.response?.status === 404) {
                throw new Error('Benutzerkonto nicht gefunden.')
            }

            // Handle server errors
            if (error.response?.status >= 500) {
                throw new Error('Serverfehler beim Ändern des Passworts. Bitte versuchen Sie es später erneut.')
            }

            // Handle network errors
            if (!error.response) {
                throw new Error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
            }

            const errorMessage = error.response?.data?.message || 'Fehler beim Ändern des Passworts'
            throw new Error(errorMessage)
        }
    }
}

export default profileApi