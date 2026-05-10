package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Enumeration representing the lifecycle status of a company in the IndusSync
 * system.
 * <p>
 * This enum tracks the company's journey from initial registration through
 * verification, active operation, and potential deactivation.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum CompanyStatus {

    /**
     * Company has been registered but not yet verified.
     * - Company can be edited
     * - Cannot create orders or receive assignments
     * - Awaiting document verification
     */
    PENDING("Ausstehend"),

    /**
     * Company is fully verified and operational.
     * - Can create orders and receive assignments
     * - Full platform functionality available
     * - Visible in search results
     */
    ACTIVE("Aktiv"),

    /**
     * Company is temporarily suspended.
     * - Cannot create new orders
     * - Cannot receive new assignments
     * - Existing orders continue
     * - Not visible in search results
     */
    SUSPENDED("Gesperrt"),

    /**
     * Company is permanently inactive.
     * - Cannot perform any operations
     * - Existing orders are cancelled
     * - Not visible anywhere
     * - Data retained for compliance
     */
    INACTIVE("Inaktiv");

    private final String displayName;

    /**
     * Constructor for CompanyStatus enum.
     *
     * @param displayName the German display name for the status
     */
    CompanyStatus(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Gets the German display name for this status.
     *
     * @return the display name in German
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Checks if the company can create orders in this status.
     *
     * @return true if orders can be created
     */
    public boolean canCreateOrders() {
        return this == ACTIVE;
    }

    /**
     * Checks if the company can receive order assignments in this status.
     *
     * @return true if assignments can be received
     */
    public boolean canReceiveAssignments() {
        return this == ACTIVE;
    }

    /**
     * Checks if the company is visible in search results.
     *
     * @return true if visible in search
     */
    public boolean isVisibleInSearch() {
        return this == ACTIVE;
    }

    /**
     * Checks if the company profile can be edited.
     *
     * @return true if profile is editable
     */
    public boolean isEditable() {
        return this == PENDING || this == ACTIVE || this == SUSPENDED;
    }

    /**
     * Checks if this is a temporary status that may change.
     *
     * @return true if status is temporary
     */
    public boolean isTemporary() {
        return this == PENDING || this == SUSPENDED;
    }

    /**
     * Checks if this status indicates the company is operational.
     *
     * @return true if operational
     */
    public boolean isOperational() {
        return this == ACTIVE;
    }

    /**
     * Gets the next logical status from the current one.
     * Used for workflow management.
     *
     * @return the next logical status, or null if no clear next status
     */
    public CompanyStatus getNextLogicalStatus() {
        return switch (this) {
            case PENDING -> ACTIVE; // After verification
            case SUSPENDED -> ACTIVE; // After resolving issues
            case ACTIVE, INACTIVE -> null; // No automatic next status
        };
    }

    /**
     * Gets valid status transitions from the current status.
     *
     * @return array of valid next statuses
     */
    public CompanyStatus[] getValidTransitions() {
        return switch (this) {
            case PENDING -> new CompanyStatus[] { ACTIVE, INACTIVE };
            case ACTIVE -> new CompanyStatus[] { SUSPENDED, INACTIVE };
            case SUSPENDED -> new CompanyStatus[] { ACTIVE, INACTIVE };
            case INACTIVE -> new CompanyStatus[] {}; // No transitions from inactive
        };
    }

    /**
     * Checks if transition to target status is valid.
     *
     * @param targetStatus the target status
     * @return true if transition is valid
     */
    public boolean canTransitionTo(CompanyStatus targetStatus) {
        if (targetStatus == null || targetStatus == this) {
            return false;
        }

        return switch (this) {
            case PENDING -> targetStatus == ACTIVE || targetStatus == INACTIVE;
            case ACTIVE -> targetStatus == SUSPENDED || targetStatus == INACTIVE;
            case SUSPENDED -> targetStatus == ACTIVE || targetStatus == INACTIVE;
            case INACTIVE -> false; // No transitions from inactive
        };
    }

    /**
     * Gets the company status from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding CompanyStatus
     * @throws IllegalArgumentException if the value doesn't match any status
     */
    public static CompanyStatus fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Company status value cannot be null or empty");
        }

        try {
            return CompanyStatus.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid company status: " + value);
        }
    }

    /**
     * Gets statuses that represent active company states.
     *
     * @return array of active statuses
     */
    public static CompanyStatus[] getActiveStatuses() {
        return new CompanyStatus[] { PENDING, ACTIVE, SUSPENDED };
    }

    /**
     * Gets statuses that require administrative attention.
     *
     * @return array of statuses needing attention
     */
    public static CompanyStatus[] getAttentionRequiredStatuses() {
        return new CompanyStatus[] { PENDING, SUSPENDED };
    }
}