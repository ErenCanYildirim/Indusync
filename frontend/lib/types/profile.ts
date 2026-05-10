/**
 * TypeScript interfaces for user profile management functionality.
 * These interfaces match the backend DTOs and provide type safety for profile operations.
 */

// =============================================================================
// CORE PROFILE INTERFACES
// =============================================================================

/**
 * User profile interface matching backend UserDto structure.
 * Contains all user information returned by the backend API.
 */
export interface UserProfile {
    id: string
    email: string
    accountType: 'PERSONAL' | 'BUSINESS'
    firstName: string
    lastName: string
    fullName?: string
    phone?: string
    website?: string
    emailVerified: boolean
    emailVerifiedAt?: string
    active: boolean
    currentCompanyId?: string
    lastLoginAt?: string
    emailNotifications: boolean
    interests?: string[]
    referralSource?: string
    createdAt: string
    updatedAt: string

    // Company membership information
    companyMemberships?: CompanyMembershipDto[]
    currentCompanyMembership?: CompanyMembershipDto
}

/**
 * Company membership information for users.
 */
export interface CompanyMembershipDto {
    companyId: string
    companyName: string
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER'
    positionTitle?: string
    isPrimaryContact: boolean
    joinedAt: string
    active: boolean

    // Permission flags
    canCreateOrders: boolean
    canManageEmployees: boolean
    canAssignProjects: boolean
    canViewFinancials: boolean
    canManageCompanySettings: boolean
}

// =============================================================================
// FORM DATA INTERFACES
// =============================================================================

/**
 * Interface for profile update form data.
 * Matches the backend UpdateProfileRequest DTO structure.
 */
export interface UpdateProfileData {
    firstName: string
    lastName: string
    phone?: string
    website?: string
    emailNotifications: boolean
}

/**
 * Interface for password change form data.
 * Matches the backend ChangePasswordRequest DTO structure.
 */
export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Generic API error response structure.
 */
export interface ApiError {
    message: string
    code?: string
    details?: Record<string, any>
}

/**
 * Validation error response for form fields.
 * Used when backend returns field-specific validation errors.
 */
export interface ValidationError {
    field: string
    message: string
    code?: string
}

/**
 * Profile API error response with field-specific validation errors.
 */
export interface ProfileApiError extends ApiError {
    validationErrors?: ValidationError[]
}

/**
 * Success response for profile operations.
 */
export interface ProfileApiResponse<T = any> {
    data: T
    message?: string
    success: boolean
}

/**
 * Profile update response containing updated user data.
 */
export interface UpdateProfileResponse extends ProfileApiResponse<UserProfile> {
    data: UserProfile
}

/**
 * Password change response (typically empty on success).
 */
export interface ChangePasswordResponse extends ProfileApiResponse<void> {
    data: void
}

// =============================================================================
// HOOK RETURN TYPES
// =============================================================================

/**
 * Return type for the useProfile custom hook.
 */
export interface UseProfileReturn {
    user: UserProfile | null
    loading: boolean
    error: string | null
    updateProfile: (data: UpdateProfileData) => Promise<void>
    changePassword: (data: ChangePasswordData) => Promise<void>
    refreshProfile: () => Promise<void>
}

// =============================================================================
// FORM VALIDATION TYPES
// =============================================================================

/**
 * Form field validation state.
 */
export interface FieldValidation {
    isValid: boolean
    error?: string
}

/**
 * Profile form validation state.
 */
export interface ProfileFormValidation {
    firstName: FieldValidation
    lastName: FieldValidation
    phone: FieldValidation
    website: FieldValidation
    emailNotifications: FieldValidation
}

/**
 * Password form validation state.
 */
export interface PasswordFormValidation {
    currentPassword: FieldValidation
    newPassword: FieldValidation
    confirmPassword: FieldValidation
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Account type enum values.
 */
export type AccountType = 'PERSONAL' | 'BUSINESS'

/**
 * Profile update operation status.
 */
export type ProfileUpdateStatus = 'idle' | 'loading' | 'success' | 'error'

/**
 * Password change operation status.
 */
export type PasswordChangeStatus = 'idle' | 'loading' | 'success' | 'error'

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard to check if an error is a ProfileApiError.
 */
export function isProfileApiError(error: any): error is ProfileApiError {
    return error && typeof error === 'object' && 'message' in error
}

/**
 * Type guard to check if an error has validation errors.
 */
export function hasValidationErrors(error: any): error is ProfileApiError & { validationErrors: ValidationError[] } {
    return isProfileApiError(error) && Array.isArray(error.validationErrors)
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Account type display names.
 */
export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
    PERSONAL: 'Privatkunde',
    BUSINESS: 'Unternehmen'
} as const

/**
 * Profile form field names.
 */
export const PROFILE_FORM_FIELDS = {
    FIRST_NAME: 'firstName',
    LAST_NAME: 'lastName',
    PHONE: 'phone',
    WEBSITE: 'website',
    EMAIL_NOTIFICATIONS: 'emailNotifications'
} as const

/**
 * Password form field names.
 */
export const PASSWORD_FORM_FIELDS = {
    CURRENT_PASSWORD: 'currentPassword',
    NEW_PASSWORD: 'newPassword',
    CONFIRM_PASSWORD: 'confirmPassword'
} as const