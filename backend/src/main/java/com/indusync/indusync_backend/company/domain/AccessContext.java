package com.indusync.indusync_backend.company.domain;

/**
 * Enumeration representing the different contexts where Terms & Conditions
 * documents can be accessed.
 * <p>
 * This enum is used for audit logging to track where and how T&C documents are
 * being accessed
 * throughout the application, providing valuable insights for compliance and
 * usage analytics.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum AccessContext {

    /**
     * Document accessed from an order detail page.
     * This occurs when users view T&C documents while reviewing order details,
     * typically during the order evaluation or application process.
     */
    ORDER_DETAIL("Order Detail Page", "Document accessed from order detail view"),

    /**
     * Document accessed from a company profile page.
     * This occurs when users view T&C documents while browsing company profiles,
     * typically during partner evaluation or general company research.
     */
    COMPANY_PROFILE("Company Profile Page", "Document accessed from company profile view"),

    /**
     * Document accessed during expression of interest process.
     * This occurs when service providers access client T&C documents while
     * expressing interest in orders, ensuring they understand terms before
     * applying.
     */
    EXPRESSION_OF_INTEREST("Expression of Interest", "Document accessed during order application process");

    private final String displayName;
    private final String description;

    /**
     * Constructor for AccessContext enum values.
     *
     * @param displayName user-friendly display name
     * @param description detailed description of the access context
     */
    AccessContext(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * Gets the user-friendly display name for this access context.
     *
     * @return the display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the detailed description of this access context.
     *
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Checks if this access context is related to order processing.
     *
     * @return true if the context is order-related
     */
    public boolean isOrderRelated() {
        return this == ORDER_DETAIL || this == EXPRESSION_OF_INTEREST;
    }

    /**
     * Checks if this access context requires order ID tracking.
     *
     * @return true if order ID should be logged for this context
     */
    public boolean requiresOrderId() {
        return isOrderRelated();
    }

    /**
     * Gets the access context from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding AccessContext
     * @throws IllegalArgumentException if the value doesn't match any context
     */
    public static AccessContext fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Access context value cannot be null or empty");
        }

        try {
            return AccessContext.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    String.format("Invalid access context: '%s'. Valid values are: %s",
                            value, java.util.Arrays.toString(AccessContext.values())));
        }
    }

    @Override
    public String toString() {
        return displayName;
    }
}