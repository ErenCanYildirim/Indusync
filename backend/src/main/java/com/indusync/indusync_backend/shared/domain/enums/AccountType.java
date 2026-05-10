package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Enumeration representing the type of user account in the IndusSync system.
 * <p>
 * This enum distinguishes between:
 * - PERSONAL: Individual/private users
 * - BUSINESS: Company/business users who can create and manage companies
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum AccountType {

    /**
     * Personal/individual user account.
     * These users cannot create companies but can participate in the platform.
     */
    PERSONAL("Privatkunde"),

    /**
     * Business user account.
     * These users can create and manage companies, register as
     * Auftraggeber/Auftragnehmer.
     */
    BUSINESS("Unternehmen");

    private final String displayName;

    /**
     * Constructor for AccountType enum.
     *
     * @param displayName the German display name for the account type
     */
    AccountType(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Gets the German display name for this account type.
     *
     * @return the display name in German
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Checks if this account type can create companies.
     *
     * @return true if this account type can create companies
     */
    public boolean canCreateCompanies() {
        return this == BUSINESS;
    }

    /**
     * Gets the account type from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding AccountType
     * @throws IllegalArgumentException if the value doesn't match any account type
     */
    public static AccountType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Account type value cannot be null or empty");
        }

        try {
            return AccountType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid account type: " + value +
                    ". Valid values are: PERSONAL, BUSINESS");
        }
    }
}