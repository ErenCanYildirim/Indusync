/**
 * Permission utilities for role-based access control
 * Handles company role permissions for order creation and matching preview
 */

export type CompanyRole = 'CLIENT' | 'PROVIDER' | 'BOTH';

// Company membership roles from backend
export type CompanyMembershipRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'VIEWER';

// Individual permissions
export type CompanyPermission =
    | 'CREATE_ORDERS'
    | 'MANAGE_EMPLOYEES'
    | 'ASSIGN_PROJECTS'
    | 'VIEW_FINANCIALS'
    | 'MANAGE_COMPANY_SETTINGS';

export interface CompanyPermissions {
    canCreateOrders: boolean;
    canProvideServices: boolean;
    canBidOnOrders: boolean;
    canHireProviders: boolean;
    canUseMatchingPreview: boolean;
}

/**
 * Determines permissions based on company role
 */
export function getCompanyPermissions(role: CompanyRole): CompanyPermissions {
    return {
        canCreateOrders: role === 'CLIENT' || role === 'BOTH',
        canProvideServices: role === 'PROVIDER' || role === 'BOTH',
        canBidOnOrders: role === 'PROVIDER' || role === 'BOTH',
        canHireProviders: role === 'CLIENT' || role === 'BOTH',
        canUseMatchingPreview: role === 'CLIENT' || role === 'BOTH',
    };
}

/**
 * Checks if a company can create orders
 */
export function canCreateOrders(role: CompanyRole): boolean {
    return role === 'CLIENT' || role === 'BOTH';
}

/**
 * Checks if a company can use matching preview
 */
export function canUseMatchingPreview(role: CompanyRole): boolean {
    return role === 'CLIENT' || role === 'BOTH';
}

/**
 * Checks if a company can provide services
 */
export function canProvideServices(role: CompanyRole): boolean {
    return role === 'PROVIDER' || role === 'BOTH';
}

/**
 * Gets the display name for a company role
 */
export function getRoleDisplayName(role: CompanyRole | CompanyMembershipRole): string {
    const displayNames = {
        // Company roles
        CLIENT: 'Auftraggeber',
        PROVIDER: 'Auftragnehmer',
        BOTH: 'Beide',
        // Company membership roles
        OWNER: 'Inhaber',
        ADMIN: 'Administrator',
        MANAGER: 'Manager',
        EMPLOYEE: 'Mitarbeiter',
        VIEWER: 'Betrachter',
    };
    return displayNames[role as keyof typeof displayNames] || role;
}

/**
 * Gets the display name for a company permission
 */
export function getPermissionDisplayName(permission: CompanyPermission): string {
    const displayNames = {
        CREATE_ORDERS: 'Aufträge erstellen',
        MANAGE_EMPLOYEES: 'Mitarbeiter verwalten',
        ASSIGN_PROJECTS: 'Projekte zuweisen',
        VIEW_FINANCIALS: 'Finanzen einsehen',
        MANAGE_COMPANY_SETTINGS: 'Unternehmenseinstellungen verwalten',
    };
    return displayNames[permission] || permission;
}

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(userPermissions: CompanyPermission[], requiredPermission: CompanyPermission): boolean {
    return userPermissions.includes(requiredPermission);
}

/**
 * Determines the primary business activity for a role
 */
export function getPrimaryActivity(role: CompanyRole): string {
    const activities = {
        CLIENT: 'Aufträge erstellen und Dienstleister beauftragen',
        PROVIDER: 'Dienstleistungen anbieten und Aufträge erfüllen',
        BOTH: 'Sowohl Aufträge erstellen als auch Dienstleistungen anbieten',
    };
    return activities[role] || '';
}