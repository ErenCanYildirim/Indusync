"use client";

/**
 * Custom hook for checking user permissions
 * Provides easy access to role-based permissions throughout the app
 */

import { useAuth } from './useAuth';
import {
    canCreateOrders,
    canUseMatchingPreview,
    canProvideServices,
    getRoleDisplayName,
    getPrimaryActivity,
    type CompanyRole
} from '@/lib/utils/permissions';

export function usePermissions() {
    const {
        companyRole,
        companyPermissions,
        companyProfile,
        isLoadingCompanyProfile,
        companyProfileError,
        user
    } = useAuth();

    return {
        // Permission checks
        canCreateOrders: companyRole ? canCreateOrders(companyRole) : false,
        canUseMatchingPreview: companyRole ? canUseMatchingPreview(companyRole) : false,
        canProvideServices: companyRole ? canProvideServices(companyRole) : false,

        // Role information
        companyRole,
        roleDisplayName: companyRole ? getRoleDisplayName(companyRole) : null,
        primaryActivity: companyRole ? getPrimaryActivity(companyRole) : null,

        // Company profile data
        companyProfile,
        isLoadingCompanyProfile,
        companyProfileError,

        // Full permissions object
        permissions: companyPermissions,

        // Helper methods
        hasPermission: (permission: keyof typeof companyPermissions) => {
            return companyPermissions?.[permission] ?? false;
        },

        // Check if user is a client (can create orders)
        isClient: companyRole === 'CLIENT' || companyRole === 'BOTH',

        // Check if user is a provider (can provide services)
        isProvider: companyRole === 'PROVIDER' || companyRole === 'BOTH',

        // Check if user has both roles
        hasBothRoles: companyRole === 'BOTH',

        // Company role flags from company profile (company's role, not user's permissions)
        isAuftraggeber: companyProfile?.isAuftraggeber === true,
        isAuftragnehmer: companyProfile?.isAuftragnehmer === true,
    };
} 