package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Enumeration representing roles that users can have within a company.
 * <p>
 * This enum defines the hierarchy and permissions within company organizations:
 * - OWNER: Full control and ownership rights
 * - ADMIN: Administrative privileges
 * - MANAGER: Management responsibilities
 * - EMPLOYEE: Standard employee access
 * - VIEWER: Read-only access
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum CompanyMemberRole {
    
    /**
     * Company owner with full control.
     * - All permissions
     * - Can delete company
     * - Can transfer ownership
     * - Cannot be removed by others
     */
    OWNER("Inhaber"),
    
    /**
     * Administrator with high-level management rights.
     * - Can manage employees
     * - Can manage company settings
     * - Can view financials
     * - Can assign projects
     */
    ADMIN("Administrator"),
    
    /**
     * Manager with operational responsibilities.
     * - Can assign projects
     * - Can manage some employees
     * - Limited financial access
     * - Cannot change core settings
     */
    MANAGER("Manager"),
    
    /**
     * Standard employee with basic access.
     * - Can view assigned projects
     * - Can update project status
     * - Cannot manage others
     * - Limited company information access
     */
    EMPLOYEE("Mitarbeiter"),
    
    /**
     * Read-only access for external stakeholders.
     * - Can view basic company information
     * - Cannot modify anything
     * - Cannot see sensitive data
     * - Useful for partners/contractors
     */
    VIEWER("Betrachter");

    private final String displayName;

    /**
     * Constructor for CompanyMemberRole enum.
     *
     * @param displayName the German display name for the role
     */
    CompanyMemberRole(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Gets the German display name for this role.
     *
     * @return the display name in German
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the hierarchy level (lower number = higher authority).
     *
     * @return hierarchy level (0 = highest)
     */
    public int getHierarchyLevel() {
        return switch (this) {
            case OWNER -> 0;
            case ADMIN -> 1;
            case MANAGER -> 2;
            case EMPLOYEE -> 3;
            case VIEWER -> 4;
        };
    }

    /**
     * Checks if this role can manage users with the specified role.
     *
     * @param targetRole the role to check against
     * @return true if can manage the target role
     */
    public boolean canManage(CompanyMemberRole targetRole) {
        if (targetRole == null) {
            return false;
        }
        
        // Owner cannot be managed by anyone
        if (targetRole == OWNER) {
            return false;
        }
        
        // Can only manage roles with higher hierarchy level (lower authority)
        return this.getHierarchyLevel() < targetRole.getHierarchyLevel();
    }

    /**
     * Checks if this role can view financials.
     *
     * @return true if can view financial information
     */
    public boolean canViewFinancials() {
        return this == OWNER || this == ADMIN;
    }

    /**
     * Checks if this role can manage company settings.
     *
     * @return true if can manage settings
     */
    public boolean canManageCompanySettings() {
        return this == OWNER || this == ADMIN;
    }

    /**
     * Checks if this role can create orders.
     *
     * @return true if can create orders
     */
    public boolean canCreateOrders() {
        return this == OWNER || this == ADMIN || this == MANAGER;
    }

    /**
     * Checks if this role can assign projects.
     *
     * @return true if can assign projects
     */
    public boolean canAssignProjects() {
        return this == OWNER || this == ADMIN || this == MANAGER;
    }

    /**
     * Checks if this role can manage employees.
     *
     * @return true if can manage employees
     */
    public boolean canManageEmployees() {
        return this == OWNER || this == ADMIN;
    }

    /**
     * Checks if this role can invite new members.
     *
     * @return true if can invite new members
     */
    public boolean canInviteMembers() {
        return this == OWNER || this == ADMIN;
    }

    /**
     * Checks if this role can remove members.
     *
     * @param targetRole the role of the member to be removed
     * @return true if can remove the member
     */
    public boolean canRemoveMember(CompanyMemberRole targetRole) {
        // Cannot remove owner
        if (targetRole == OWNER) {
            return false;
        }
        
        // Owner and admin can remove others (except owner)
        return (this == OWNER || this == ADMIN) && canManage(targetRole);
    }

    /**
     * Checks if this is an administrative role.
     *
     * @return true if role has administrative privileges
     */
    public boolean isAdministrative() {
        return this == OWNER || this == ADMIN;
    }

    /**
     * Checks if this is a management role.
     *
     * @return true if role has management privileges
     */
    public boolean isManagement() {
        return this == OWNER || this == ADMIN || this == MANAGER;
    }

    /**
     * Gets the member role from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding CompanyMemberRole
     * @throws IllegalArgumentException if the value doesn't match any role
     */
    public static CompanyMemberRole fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Company member role value cannot be null or empty");
        }
        
        try {
            return CompanyMemberRole.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid company member role: " + value + 
                ". Valid values are: " + java.util.Arrays.toString(CompanyMemberRole.values()));
        }
    }

    /**
     * Gets roles that can be managed by this role.
     *
     * @return array of manageable roles
     */
    public CompanyMemberRole[] getManageableRoles() {
        return switch (this) {
            case OWNER -> new CompanyMemberRole[]{ADMIN, MANAGER, EMPLOYEE, VIEWER};
            case ADMIN -> new CompanyMemberRole[]{MANAGER, EMPLOYEE, VIEWER};
            case MANAGER -> new CompanyMemberRole[]{EMPLOYEE, VIEWER};
            case EMPLOYEE, VIEWER -> new CompanyMemberRole[]{};
        };
    }

    /**
     * Gets the default role for new company members.
     *
     * @return default role for new members
     */
    public static CompanyMemberRole getDefaultRole() {
        return EMPLOYEE;
    }

    /**
     * Gets roles suitable for invitation by external users.
     *
     * @return array of invitable roles
     */
    public static CompanyMemberRole[] getInvitableRoles() {
        return new CompanyMemberRole[]{ADMIN, MANAGER, EMPLOYEE, VIEWER};
    }
} 