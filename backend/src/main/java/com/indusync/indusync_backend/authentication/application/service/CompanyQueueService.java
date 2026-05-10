package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.api.dto.AuthenticationResponse;

import java.util.List;
import java.util.UUID;

/**
 * Query service interface for fetching company information during authentication.
 * <p>
 * This interface maintains proper module boundaries by providing a contract
 * for the authentication module to fetch company-related data without
 * directly depending on company module internals.
 * </p>
 */
public interface CompanyQueryService {

    /**
     * Fetches current company context for a business user.
     *
     * @param userId the user ID
     * @param currentCompanyId the current company ID from user entity
     * @return company context information or null if not applicable
     */
    AuthenticationResponse.CompanyContext getCurrentCompanyContext(UUID userId, UUID currentCompanyId);

    /**
     * Fetches all company memberships for a user.
     *
     * @param userId the user ID
     * @return list of company memberships
     */
    List<AuthenticationResponse.CompanyMembership> getUserCompanyMemberships(UUID userId);

    /**
     * Gets roles and permissions for user in a specific company.
     *
     * @param userId the user ID
     * @param companyId the company ID
     * @return list of roles and permissions
     */
    List<String> getUserRolesInCompany(UUID userId, UUID companyId);
} 