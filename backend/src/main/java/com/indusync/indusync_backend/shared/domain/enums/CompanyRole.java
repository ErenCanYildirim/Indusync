package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Enumeration representing the role of a company in the IndusSync marketplace.
 * <p>
 * This enum defines whether a company acts as:
 * - CLIENT (Auftraggeber): Creates orders and hires service providers
 * - PROVIDER (Auftragnehmer): Provides services and fulfills orders
 * - BOTH: Can act in either capacity
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum CompanyRole {
    
    /**
     * Company acts as a client (Auftraggeber).
     * - Can create orders
     * - Can hire service providers
     * - Cannot provide services to others
     */
    CLIENT("Auftraggeber"),
    
    /**
     * Company acts as a service provider (Auftragnehmer).
     * - Can provide services
     * - Can bid on orders
     * - Cannot create orders for others
     */
    PROVIDER("Auftragnehmer"),
    
    /**
     * Company can act in both roles.
     * - Can create orders AND provide services
     * - Maximum flexibility in the marketplace
     * - Can switch between roles as needed
     */
    BOTH("Beide");

    private final String displayName;

    /**
     * Constructor for CompanyRole enum.
     *
     * @param displayName the German display name for the role
     */
    CompanyRole(String displayName) {
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
     * Checks if this role can create orders.
     *
     * @return true if orders can be created
     */
    public boolean canCreateOrders() {
        return this == CLIENT || this == BOTH;
    }

    /**
     * Checks if this role can provide services.
     *
     * @return true if services can be provided
     */
    public boolean canProvideServices() {
        return this == PROVIDER || this == BOTH;
    }

    /**
     * Checks if this role can bid on orders from other companies.
     *
     * @return true if can bid on orders
     */
    public boolean canBidOnOrders() {
        return this == PROVIDER || this == BOTH;
    }

    /**
     * Checks if this role can hire other service providers.
     *
     * @return true if can hire providers
     */
    public boolean canHireProviders() {
        return this == CLIENT || this == BOTH;
    }

    /**
     * Checks if this is a flexible role that allows multiple activities.
     *
     * @return true if role is flexible
     */
    public boolean isFlexible() {
        return this == BOTH;
    }

    /**
     * Gets the opposite role.
     * CLIENT -> PROVIDER, PROVIDER -> CLIENT, BOTH -> BOTH
     *
     * @return the opposite role
     */
    public CompanyRole getOppositeRole() {
        return switch (this) {
            case CLIENT -> PROVIDER;
            case PROVIDER -> CLIENT;
            case BOTH -> BOTH;
        };
    }

    /**
     * Checks if this role is compatible with another role for business relationships.
     * CLIENT is compatible with PROVIDER and BOTH
     * PROVIDER is compatible with CLIENT and BOTH
     * BOTH is compatible with all roles
     *
     * @param otherRole the other company's role
     * @return true if roles are compatible for business
     */
    public boolean isCompatibleWith(CompanyRole otherRole) {
        if (otherRole == null) {
            return false;
        }
        
        return switch (this) {
            case CLIENT -> otherRole == PROVIDER || otherRole == BOTH;
            case PROVIDER -> otherRole == CLIENT || otherRole == BOTH;
            case BOTH -> true; // Compatible with everyone
        };
    }

    /**
     * Gets the primary business activity for this role.
     *
     * @return description of primary activity
     */
    public String getPrimaryActivity() {
        return switch (this) {
            case CLIENT -> "Aufträge erstellen und Dienstleister beauftragen";
            case PROVIDER -> "Dienstleistungen anbieten und Aufträge erfüllen";
            case BOTH -> "Sowohl Aufträge erstellen als auch Dienstleistungen anbieten";
        };
    }

    /**
     * Gets the company role from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding CompanyRole
     * @throws IllegalArgumentException if the value doesn't match any role
     */
    public static CompanyRole fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Company role value cannot be null or empty");
        }
        
        try {
            return CompanyRole.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid company role: " + value);
        }
    }

    /**
     * Determines the appropriate role based on business capabilities.
     *
     * @param canCreateOrders true if company can create orders
     * @param canProvideServices true if company can provide services
     * @return the appropriate CompanyRole
     */
    public static CompanyRole determineRole(boolean canCreateOrders, boolean canProvideServices) {
        if (canCreateOrders && canProvideServices) {
            return BOTH;
        } else if (canCreateOrders) {
            return CLIENT;
        } else if (canProvideServices) {
            return PROVIDER;
        } else {
            return CLIENT; // Default
        }
    }

    /**
     * Gets roles that can interact with the given role.
     *
     * @param role the reference role
     * @return array of compatible roles
     */
    public static CompanyRole[] getCompatibleRoles(CompanyRole role) {
        if (role == null) {
            return new CompanyRole[0];
        }
        
        return switch (role) {
            case CLIENT -> new CompanyRole[]{PROVIDER, BOTH};
            case PROVIDER -> new CompanyRole[]{CLIENT, BOTH};
            case BOTH -> new CompanyRole[]{CLIENT, PROVIDER, BOTH};
        };
    }
} 