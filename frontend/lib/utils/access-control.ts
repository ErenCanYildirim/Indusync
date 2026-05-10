/**
 * Access Control Utilities for Terms & Conditions
 * 
 * This module provides utilities for managing access control and authorization
 * for Terms & Conditions documents with proper security checks and audit logging.
 */


import { termsConditionsApi } from '@/lib/api/terms-conditions'
import type { AccessContext } from '@/lib/types/terms-conditions'
import { User } from '../api'

/**
 * User roles for access control
 */
export enum UserRole {
    ADMIN = 'ADMIN',
    USER = 'USER',
    COMPANY_OWNER = 'COMPANY_OWNER',
    COMPANY_MEMBER = 'COMPANY_MEMBER',
    GUEST = 'GUEST'
}

/**
 * Access permissions for different operations
 */
export interface AccessPermissions {
    canView: boolean
    canUpload: boolean
    canDelete: boolean
    canManage: boolean
    reason?: string
}

/**
 * User context for access control decisions
 */
export interface UserContext {
    userId: string
    companyId?: string
    roles: UserRole[]
    isAuthenticated: boolean
}

/**
 * Access control configuration
 */
interface AccessControlConfig {
    requireAuthentication: boolean
    allowedRoles: UserRole[]
    requireCompanyMembership: boolean
    auditAccess: boolean
}

/**
 * Default access control configurations for different operations
 */
const ACCESS_CONTROL_CONFIGS: Record<string, AccessControlConfig> = {
    view: {
        requireAuthentication: true,
        allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_MEMBER],
        requireCompanyMembership: false, // Can view other companies' T&C
        auditAccess: true
    },
    upload: {
        requireAuthentication: true,
        allowedRoles: [UserRole.USER, UserRole.ADMIN, UserRole.COMPANY_OWNER, UserRole.COMPANY_MEMBER],
        requireCompanyMembership: true, // Can only upload for own company
        auditAccess: true
    },
    delete: {
        requireAuthentication: true,
        allowedRoles: [UserRole.ADMIN, UserRole.COMPANY_OWNER],
        requireCompanyMembership: true, // Can only delete own company's T&C
        auditAccess: true
    },
    manage: {
        requireAuthentication: true,
        allowedRoles: [UserRole.ADMIN, UserRole.COMPANY_OWNER],
        requireCompanyMembership: true, // Can only manage own company's T&C
        auditAccess: true
    }
}

/**
 * Access control error types
 */
export class AccessControlError extends Error {
    constructor(
        public code: string,
        message: string,
        public details?: Record<string, any>
    ) {
        super(message)
        this.name = 'AccessControlError'
    }
}

/**
 * Check if user has permission for a specific operation
 */
export function checkAccess(
    operation: keyof typeof ACCESS_CONTROL_CONFIGS,
    userContext: UserContext,
    targetCompanyId?: string 
): AccessPermissions {
    const config = ACCESS_CONTROL_CONFIGS[operation]

    if(!config) {
        return {
            canView: false,
            canUpload: false,
            canDelete: false,
            canManage: false,
            reason: 'Unknown operation'
        }
    }

    // Check authentication requirement
    if (config.requireAuthentication && !userContext.isAuthenticated) {
        return {
            canView: false,
            canUpload: false,
            canDelete: false,
            canManage: false,
            reason: 'Authentication required'
        }
    }

    // Check role requirements
    const hasRequiredRole = config.allowedRoles.some(role =>
        userContext.roles.includes(role)
    )

     if (!hasRequiredRole) {
        return {
            canView: false,
            canUpload: false,
            canDelete: false,
            canManage: false,
            reason: 'Insufficient role permissions'
        }
    }

    // Check company membership requirement
    if (config.requireCompanyMembership && targetCompanyId) {
        const isCompanyMember = userContext.companyId === targetCompanyId
        const isAdmin = userContext.roles.includes(UserRole.ADMIN)

        if (!isCompanyMember && !isAdmin) {
            return {
                canView: false,
                canUpload: false,
                canDelete: false,
                canManage: false,
                reason: 'Company membership required'
            }
        }
    }

    // Grant permissions based on operation
    const permissions: AccessPermissions = {
        canView: operation === 'view',
        canUpload: operation === 'upload',
        canDelete: operation === 'delete',
        canManage: operation === 'manage'
    }

    return permissions
}


/**
 * Check if user can view Terms & Conditions for a company
 */
export function canViewTermsConditions(
    userContext: UserContext,
    companyId: string
): AccessPermissions {
    return checkAccess('view', userContext, companyId)
}


/**
 * Check if user can upload Terms & Conditions for a company
 */
export function canUploadTermsConditions(
    userContext: UserContext,
    companyId: string
): AccessPermissions {
    return checkAccess('upload', userContext, companyId)
}


/**
 * Check if user can delete Terms & Conditions for a company
 */
export function canDeleteTermsConditions(
    userContext: UserContext,
    companyId: string
): AccessPermissions {
    return checkAccess('delete', userContext, companyId)
}


/**
 * Check if user can manage Terms & Conditions for a company
 */
export function canManageTermsConditions(
    userContext: UserContext,
    companyId: string
): AccessPermissions {
    return checkAccess('manage', userContext, companyId)
}


/**
 * Secure document access with automatic audit logging
 */
export async function secureDocumentAccess(
    companyId: string,
    userContext: UserContext,
    accessContext: AccessContext,
    orderId?: string
): Promise<{ success: boolean, documentUrl?: string, error?: string }> {
    try {
        // Check access permissions
        const permissions = canViewTermsConditions(userContext, companyId)

        if (!permissions.canView) {
            throw new AccessControlError(
                'ACCESS_DENIED',
                permissions.reason || 'Access denied',
                { companyId, userId: userContext.userId, accessContext }
            )
        }

        // Get document with automatic access tracking
        const result = await termsConditionsApi.getTermsConditionsWithTracking(
            companyId,
            accessContext,
            orderId
        )

        if (!result.document || !result.url) {
            return {
                success: false,
                error: 'Document not found or not available'
            }
        }

        return {
            success: true,
            documentUrl: result.url
        }

    } catch (error) {
        console.error('Secure document access failed:', error)

        if (error instanceof AccessControlError) {
            return {
                success: false,
                error: error.message
            }
        }

        return {
            success: false,
            error: 'Failed to access document'
        }
    }
}


/**
 * Rate limiting for document access
 */
class DocumentAccessRateLimiter {
    private accessCounts: Map<string, { count: number, resetTime: number }> = new Map()
    private readonly maxAccess = 50 // Max accesses per window
    private readonly windowMs = 60 * 60 * 1000 // 1 hour window

    checkRateLimit(userId: string, documentId: string): boolean {
        const key = `${userId}:${documentId}`
        const now = Date.now()
        const record = this.accessCounts.get(key)

        if (!record || now > record.resetTime) {
            // Reset or create new record
            this.accessCounts.set(key, {
                count: 1,
                resetTime: now + this.windowMs
            })
            return true
        }

        if (record.count >= this.maxAccess) {
            return false // Rate limit exceeded
        }

        record.count++
        return true
    }

    getRemainingAccess(userId: string, documentId: string): number {
        const key = `${userId}:${documentId}`
        const record = this.accessCounts.get(key)

        if (!record || Date.now() > record.resetTime) {
            return this.maxAccess
        }

        return Math.max(0, this.maxAccess - record.count)
    }
}

const accessRateLimiter = new DocumentAccessRateLimiter()


/**
 * Check rate limit for document access
 */
export function checkDocumentAccessRateLimit(
    userId: string,
    documentId: string
): { allowed: boolean, remaining: number } {
    const allowed = accessRateLimiter.checkRateLimit(userId, documentId)
    const remaining = accessRateLimiter.getRemainingAccess(userId, documentId)

    return { allowed, remaining }
}

/**
 * Audit log entry for access attempts
 */
export interface AccessAuditLog {
    timestamp: string
    userId: string
    companyId: string
    documentId?: string
    accessContext: AccessContext
    orderId?: string
    success: boolean
    reason?: string
    ipAddress?: string
    userAgent?: string
}

/**
 * Log access attempt for audit purposes
 */
export function logAccessAttempt(
    userContext: UserContext,
    companyId: string,
    accessContext: AccessContext,
    success: boolean,
    reason?: string,
    orderId?: string
): AccessAuditLog {
    const auditLog: AccessAuditLog = {
        timestamp: new Date().toISOString(),
        userId: userContext.userId,
        companyId,
        accessContext,
        orderId,
        success,
        reason,
        userAgent: navigator.userAgent
    }

    // In production, this would be sent to a logging service
    console.log('Access attempt logged:', auditLog)

    return auditLog
}

/**
 * Validate user context for completeness
 */
export function validateUserContext(userContext: UserContext): boolean {
    return !!(
        userContext.userId &&
        Array.isArray(userContext.roles) &&
        userContext.roles.length > 0 &&
        typeof userContext.isAuthenticated === 'boolean'
    )
}

/**
 * Get user context from authentication state
 * This would integrate with your actual authentication system
 */
export function getUserContext(): UserContext {
    // Placeholder implementation - replace with actual auth integration
    return {
        userId: 'current-user-id',
        companyId: 'current-company-id',
        roles: [UserRole.USER],
        isAuthenticated: true
    }
}


/**
 * Security headers for document requests
 */
export function getSecurityHeaders(): Record<string, string> {
    return {
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
}

/**
 * Sanitize user input for audit logging
 */
export function sanitizeAuditInput(input: string): string {
    return input
        .replace(/[<>]/g, '') // Remove potential HTML
        .replace(/['"]/g, '') // Remove quotes
        .substring(0, 500) // Limit length
        .trim()
}