package com.indusync.indusync_backend.review.application.dto;

/**
 * Enumeration representing the role of a company in an order context.
 * Used to distinguish between companies acting as clients (order creators)
 * and providers (order fulfillment companies).
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum CompanyRole {
    /**
     * Company acting as a client - the one who created and published the order.
     */
    CLIENT("Client"),

    /**
     * Company acting as a service provider - the one who fulfilled the order.
     */
    PROVIDER("Provider");

    private final String displayName;

    CompanyRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}