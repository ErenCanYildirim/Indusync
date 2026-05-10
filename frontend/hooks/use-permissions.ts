"use client"

import { useAuth } from '@/lib/hooks/useAuth'
import { hasPermission, CompanyPermission } from '@/lib/utils/permissions'
import { useCallback } from 'react'

/**
 * Hook to check user permissions in their current company
 */
export function usePermissions() {
    const { user } = useAuth()

    const checkPermission = useCallback((permission: CompanyPermission): boolean => {
        return hasPermission(user?.currentCompanyMembership, permission)
    }, [user?.currentCompanyMembership])

    const hasRole = useCallback((roles: string[]): boolean => {
        if (!user?.currentCompanyMembership) return false
        return roles.includes(user.currentCompanyMembership.role)
    }, [user?.currentCompanyMembership])

    const canManageUsers = useCallback((): boolean => {
        return checkPermission('MANAGE_EMPLOYEES')
    }, [checkPermission])

    const canCreateOrders = useCallback((): boolean => {
        return checkPermission('CREATE_ORDERS')
    }, [checkPermission])

    const canViewFinancials = useCallback((): boolean => {
        return checkPermission('VIEW_FINANCIALS')
    }, [checkPermission])

    const canManageCompany = useCallback((): boolean => {
        return checkPermission('MANAGE_COMPANY_SETTINGS')
    }, [checkPermission])

    const canAssignProjects = useCallback((): boolean => {
        return checkPermission('ASSIGN_PROJECTS')
    }, [checkPermission])

    return {
        checkPermission,
        hasRole,
        canManageUsers,
        canCreateOrders,
        canViewFinancials,
        canManageCompany,
        canAssignProjects,
        currentMembership: user?.currentCompanyMembership,
        isBusinessUser: user?.accountType === 'BUSINESS'
    }
}