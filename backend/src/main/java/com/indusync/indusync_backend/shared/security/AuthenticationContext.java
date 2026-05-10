package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

/**
 * Value object representing the authentication context for a user.
 * Contains all relevant information extracted from JWT token.
 *
 * @param userId           The authenticated user's ID
 * @param currentCompanyId The current company ID the user is operating under
 * @param email            The user's email address
 * @param accountType      The user's account type (PERSONAL, BUSINESS)
 * @param roles            The user's roles
 * @param token            The JWT token string
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record AuthenticationContext(UUID userId, UUID currentCompanyId, String email, String accountType,
                                    List<String> roles, String token) {
    /**
     * Check if the user has a valid company context
     */
    public boolean hasValidCompanyContext() {
        return currentCompanyId != null;
    }

    /**
     * Check if the user has a specific role
     */
    public boolean hasRole(String role) {
        return roles != null && roles.contains(role);
    }

    /**
     * Check if this is a business account
     */
    public boolean isBusinessAccount() {
        return "BUSINESS".equalsIgnoreCase(accountType);
    }
}