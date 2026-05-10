package com.indusync.indusync_backend.company.api.dto;

/**
 * Enumeration representing business roles that can be added to a company.
 * <p>
 * This enum defines the specific business roles that companies can add
 * after their initial registration through the role management feature.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum BusinessRole {

    /**
     * Auftraggeber (Client) role.
     * Companies with this role can create orders and hire service providers.
     */
    AUFTRAGGEBER("Auftraggeber"),

    /**
     * Auftragnehmer (Contractor) role.
     * Companies with this role can provide services and fulfill orders.
     */
    AUFTRAGNEHMER("Auftragnehmer");

    private final String displayName;

    /**
     * Constructor for BusinessRole enum.
     *
     * @param displayName the German display name for the role
     */
    BusinessRole(String displayName) {
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
     * Gets the business role from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding BusinessRole
     * @throws IllegalArgumentException if the value doesn't match any role
     */
    public static BusinessRole fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Business role value cannot be null or empty");
        }

        try {
            return BusinessRole.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid business role: " + value);
        }
    }

    /**
     * Checks if this role requires additional specialization data.
     *
     * @return true if role requires specialization data
     */
    public boolean requiresSpecializationData() {
        return this == AUFTRAGNEHMER;
    }

    /**
     * Gets the description of what this role enables.
     *
     * @return description of role capabilities
     */
    public String getRoleDescription() {
        return switch (this) {
            case AUFTRAGGEBER -> "Ermöglicht das Erstellen von Aufträgen und Beauftragen von Dienstleistern";
            case AUFTRAGNEHMER -> "Ermöglicht das Anbieten von Dienstleistungen und Erfüllen von Aufträgen";
        };
    }
}