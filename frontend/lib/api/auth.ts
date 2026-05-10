import { apiClient } from './client'
import type {
    LoginRequest,
    RegisterRequest,
    AuthResponse,
    UserProfile
} from './types'
import type {
    UpdateProfileData,
    ChangePasswordData
} from '@/lib/types/profile'
import { createFormDataClient } from './client'
import { profileApi } from './profile'

/**
 * Authentication API endpoints
 */
export const authApi = {
    /**
     * Login user with email and password
     */
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/login', data)
        return response.data
    },

    /**
     * Register a new user with optional file uploads
     */
    register: async (
        data: RegisterRequest,
        files?: { verificationFile?: File; certificatesFile?: File }
    ): Promise<AuthResponse> => {
        // Always create a FormData payload. Backend expects multipart even ohne Dateien.

        const formData = new FormData();

        // Append primitive / array fields
        Object.entries(data).forEach(([key, value]) => {
            if (value === undefined || value === null) return;

            // Skip file objects (handled separately)
            if (key.startsWith('_')) return;

            if (Array.isArray(value)) {
                // Einfach als kommaseparierte Liste übertragen (Backend kann splitten)
                if (value.length) {
                    formData.append(key, value.join(','));
                }
            } else if (typeof value === 'number') {
                // Handle numeric values (like latitude/longitude)
                formData.append(key, value.toString());
            } else {
                formData.append(key, String(value));
            }
        });

        // Append optional Dateien from files parameter or from data object
        const verificationFile = files?.verificationFile || (data as any)._verificationFile;
        const certificatesFile = files?.certificatesFile || (data as any)._certificatesFile;

        if (verificationFile instanceof File) {
            formData.append('companyVerificationFile', verificationFile);
        }
        if (certificatesFile instanceof File) {
            formData.append('companyCertificatesFile', certificatesFile);
        }

        // Verwende separaten Axios-Client ohne Default-JSON-Header, damit multipart korrekt gesendet wird
        const formClient = createFormDataClient();
        const response = await formClient.post('/auth/register', formData);
        return response.data;
    },

    /**
     * Logout current user
     */
    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout')
    },

    /**
     * Get current user profile
     * Enhanced to use the dedicated profile API service
     */
    getCurrentUser: async (): Promise<UserProfile> => {
        return await profileApi.getProfile()
    },

    /**
     * Refresh authentication token
     */
    refreshToken: async (): Promise<AuthResponse> => {
        const response = await apiClient.post('/auth/refresh')
        return response.data
    },

    /**
     * Check if current token is valid
     */
    checkAuth: async (): Promise<void> => {
        await apiClient.get('/auth/check')
    },

    /**
     * Verify email address
     */
    verifyEmail: async (token: string): Promise<void> => {
        // The backend expects a GET request with the verification token as query param
        await apiClient.get('/auth/verify-email', {
            params: { token },
        })
    },

    /**
     * Request password reset
     */
    requestPasswordReset: async (email: string): Promise<void> => {
        await apiClient.post('/auth/forgot-password', null, {
            params: { email }
        })
    },    /**
     * Reset password with token
     */
    resetPassword: async (token: string, newPassword: string, confirmPassword: string): Promise<void> => {
        await apiClient.post('/auth/reset-password', {
            token,
            newPassword,
            confirmPassword
        })
    },    /**
     * Change user password (when logged in)
     * Enhanced to use the dedicated profile API service with proper validation
     */
    changePassword: async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<void> => {
        return await profileApi.changePassword({
            currentPassword,
            newPassword,
            confirmPassword
        })
    },

    /**
     * Update user profile
     * Enhanced to use the dedicated profile API service for profile updates
     */
    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        // Convert the partial UserProfile to UpdateProfileData format
        const updateData: UpdateProfileData = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            phone: data.phone,
            website: data.website,
            emailNotifications: false // Default value since UserProfile doesn't include this field
        }
        return await profileApi.updateProfile(updateData)
    },

    /**
     * Delete user account
     */
    deleteAccount: async (password: string): Promise<void> => {
        await apiClient.delete('/auth/account', {
            data: { password }
        })
    },

    /**
     * Resend email verification
     */
    resendEmailVerification: async (email: string): Promise<void> => {
        // Backend endpoint expects the email as a query param
        await apiClient.post('/auth/resend-verification-email', null, {
            params: { email },
        })
    }
}

export default authApi