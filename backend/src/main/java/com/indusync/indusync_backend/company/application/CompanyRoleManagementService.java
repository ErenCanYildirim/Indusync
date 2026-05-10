package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.company.api.dto.CompanyRoleAdditionResponse;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing company business role additions and modifications.
 * <p>
 * This service provides functionality for:
 * - Adding business roles (Auftraggeber/Auftragnehmer) to existing companies
 * - Retrieving available roles that can be added
 * - Getting role requirements and validation information
 * - Authorization checks for role management operations
 * </p>
 * <p>
 * The service follows the existing registration flow patterns when adding
 * Auftragnehmer roles, ensuring consistency with the initial registration
 * process.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CompanyRoleManagementService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;

    /**
     * Adds a business role to an existing company with proper authorization checks.
     * <p>
     * This method:
     * - Validates user authorization to modify the company
     * - Checks if the role can be added (not already present)
     * - Validates role-specific data requirements
     * - Updates the company with the new role and associated data
     * - Returns appropriate success or error responses
     * </p>
     *
     * @param companyId the ID of the company to modify
     * @param role      the business role to add
     * @param request   the role addition request with required data
     * @param userId    the ID of the user making the request
     * @return response indicating success or failure with details
     * @throws IllegalArgumentException if parameters are invalid
     */
    public CompanyRoleAdditionResponse addBusinessRole(
            UUID companyId,
            BusinessRole role,
            AddBusinessRoleRequest request,
            UUID userId) {

        log.info("Adding business role {} to company {} by user {}", role, companyId, userId);

        // Validate input parameters first (throw exceptions for null parameters)
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }
        if (role == null) {
            throw new IllegalArgumentException("Business role cannot be null");
        }
        if (request == null) {
            throw new IllegalArgumentException("Role addition request cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        try {

            // Verify company exists
            Company company = companyRepository.findById(companyId)
                    .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

            // Verify user has authorization to modify this company
            if (!hasRoleManagementPermission(companyId, userId)) {
                log.warn("User {} attempted unauthorized role addition for company {}", userId, companyId);
                return CompanyRoleAdditionResponse.unauthorized();
            }

            // Check if role can be added
            if (!company.canAddRole(role)) {
                log.warn("Role {} cannot be added to company {} - already exists or invalid status",
                        role, companyId);
                return CompanyRoleAdditionResponse.roleAlreadyExists(role);
            }

            // Validate request data for the specific role
            try {
                company.validateRoleAdditionRequest(role, request);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid role addition request for company {}: {}", companyId, e.getMessage());
                return CompanyRoleAdditionResponse.validationError(
                        "Ungültige Daten für Rollenhinzufügung: " + e.getMessage(),
                        null);
            }

            // Add the role to the company
            company.addBusinessRole(role, request);

            // Determine if verification is required (for Auftragnehmer role)
            boolean requiresVerification = role == BusinessRole.AUFTRAGNEHMER;
            // Note: We don't change company status here as ACTIVE companies should remain
            // ACTIVE
            // Verification is handled separately by admin processes

            // Save the updated company
            company = companyRepository.save(company);

            log.info("Successfully added role {} to company {}", role, companyId);

            // Return success response
            return CompanyRoleAdditionResponse.success(
                    company.getId(),
                    company.getName(),
                    role,
                    company.getIsAuftraggeber(),
                    company.getIsAuftragnehmer(),
                    company.getStatus(),
                    requiresVerification);

        } catch (CompanyNotFoundException e) {
            log.warn("Company not found during role addition: {}", e.getMessage());
            return CompanyRoleAdditionResponse.companyNotFound();

        } catch (IllegalArgumentException e) {
            log.warn("Invalid argument during role addition: {}", e.getMessage());
            return CompanyRoleAdditionResponse.error("Ungültige Parameter: " + e.getMessage());

        } catch (IllegalStateException e) {
            log.warn("Invalid state during role addition: {}", e.getMessage());
            return CompanyRoleAdditionResponse.error("Rolle kann nicht hinzugefügt werden: " + e.getMessage());

        } catch (Exception e) {
            log.error("Unexpected error during role addition for company {}", companyId, e);
            return CompanyRoleAdditionResponse.error("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    /**
     * Gets the list of business roles that can be added to a company.
     * <p>
     * This method checks the current company status and existing roles
     * to determine which additional roles can be added.
     * </p>
     *
     * @param companyId the ID of the company
     * @param userId    the ID of the user making the request
     * @return list of roles that can be added
     * @throws CompanyNotFoundException    if company is not found
     * @throws UnauthorizedAccessException if user lacks permission
     */
    public List<BusinessRole> getAvailableRoles(UUID companyId, UUID userId) {
        log.info("Getting available roles for company {} by user {}", companyId, userId);

        // Validate input parameters
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        // Verify company exists
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Verify user has permission to view role information
        if (!hasRoleViewPermission(companyId, userId)) {
            throw new UnauthorizedAccessException(
                    "Keine Berechtigung zum Anzeigen der Rolleninformationen");
        }

        List<BusinessRole> availableRoles = new ArrayList<>();

        // Check each role to see if it can be added
        for (BusinessRole role : BusinessRole.values()) {
            if (company.canAddRole(role)) {
                availableRoles.add(role);
            }
        }

        log.info("Found {} available roles for company {}", availableRoles.size(), companyId);
        return availableRoles;
    }

    /**
     * Gets the requirements for adding a specific business role.
     * <p>
     * This method returns information about what data is required
     * when adding a specific role, helping the frontend display
     * appropriate forms and validation messages.
     * </p>
     *
     * @param companyId the ID of the company
     * @param role      the business role to get requirements for
     * @param userId    the ID of the user making the request
     * @return role requirements information
     * @throws CompanyNotFoundException    if company is not found
     * @throws UnauthorizedAccessException if user lacks permission
     * @throws IllegalArgumentException    if role is invalid
     */
    public RoleRequirements getRoleRequirements(UUID companyId, BusinessRole role, UUID userId) {
        log.info("Getting role requirements for role {} on company {} by user {}", role, companyId, userId);

        // Validate input parameters
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }
        if (role == null) {
            throw new IllegalArgumentException("Business role cannot be null");
        }
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }

        // Verify company exists
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Verify user has permission to view role information
        if (!hasRoleViewPermission(companyId, userId)) {
            throw new UnauthorizedAccessException(
                    "Keine Berechtigung zum Anzeigen der Rolleninformationen");
        }

        // Build role requirements based on the role type
        return buildRoleRequirements(role, company);
    }

    /**
     * Builds role requirements information for a specific business role.
     * <p>
     * This method defines what fields are required and optional
     * for each role type, following the same patterns as the
     * initial registration process.
     * </p>
     *
     * @param role    the business role
     * @param company the company (for context-specific requirements)
     * @return role requirements information
     */
    private RoleRequirements buildRoleRequirements(BusinessRole role, Company company) {
        switch (role) {
            case AUFTRAGGEBER:
                return RoleRequirements.builder()
                        .role(role)
                        .displayName(role.getDisplayName())
                        .description(role.getRoleDescription())
                        .requiredFields(List.of()) // No additional required fields for AG
                        .optionalFields(List.of(
                                "contactPersonName",
                                "contactPersonEmail",
                                "contactPersonPhone"))
                        .followsRegistrationFlow(false)
                        .requiresVerification(false)
                        .canBeAdded(company.canAddRole(role))
                        .build();

            case AUFTRAGNEHMER:
                return RoleRequirements.builder()
                        .role(role)
                        .displayName(role.getDisplayName())
                        .description(role.getRoleDescription())
                        .requiredFields(List.of(
                                "specializations",
                                "industries",
                                "workRadiusKm",
                                "description",
                                "contactPersonName",
                                "contactPersonEmail",
                                "employeeCount",
                                "verificationDocumentUrl"))
                        .optionalFields(List.of(
                                "orderCategories",
                                "contactPersonPhone",
                                "businessHours",
                                "certifications",
                                "certificatesDocumentUrl"))
                        .followsRegistrationFlow(true)
                        .requiresVerification(true)
                        .canBeAdded(company.canAddRole(role))
                        .build();

            default:
                throw new IllegalArgumentException("Unknown business role: " + role);
        }
    }

    /**
     * Checks if a user has permission to manage roles for a company.
     * <p>
     * Role management permission is granted to:
     * - Company owners
     * - Company managers
     * - Members with company settings management permission
     * </p>
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if user has role management permission
     */
    private boolean hasRoleManagementPermission(UUID companyId, UUID userId) {
        Optional<CompanyMember> membership = companyMemberRepository
                .findByCompanyIdAndUserId(companyId, userId);

        if (membership.isEmpty() || !membership.get().getActive()) {
            return false;
        }

        CompanyMember member = membership.get();
        return member.getRole() == CompanyMemberRole.OWNER ||
                member.getRole() == CompanyMemberRole.MANAGER ||
                Boolean.TRUE.equals(member.getCanManageCompanySettings());
    }

    /**
     * Checks if a user has permission to view role information for a company.
     * <p>
     * Role view permission is granted to:
     * - Company owners
     * - Company managers
     * - Any active company member (for basic role information)
     * </p>
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if user has role view permission
     */
    private boolean hasRoleViewPermission(UUID companyId, UUID userId) {
        Optional<CompanyMember> membership = companyMemberRepository
                .findByCompanyIdAndUserId(companyId, userId);

        return membership.isPresent() && membership.get().getActive();
    }

    // Exception classes

    /**
     * Exception thrown when a company is not found.
     */
    public static class CompanyNotFoundException extends RuntimeException {
        public CompanyNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when a user lacks authorization for an operation.
     */
    public static class UnauthorizedAccessException extends RuntimeException {
        public UnauthorizedAccessException(String message) {
            super(message);
        }
    }

    // DTOs

    /**
     * DTO containing information about role requirements.
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class RoleRequirements {
        /**
         * The business role these requirements apply to
         */
        private BusinessRole role;

        /**
         * Display name of the role in German
         */
        private String displayName;

        /**
         * Description of what this role enables
         */
        private String description;

        /**
         * List of field names that are required for this role
         */
        private List<String> requiredFields;

        /**
         * List of field names that are optional for this role
         */
        private List<String> optionalFields;

        /**
         * Whether this role follows the same flow as registration
         */
        private Boolean followsRegistrationFlow;

        /**
         * Whether adding this role requires verification
         */
        private Boolean requiresVerification;

        /**
         * Whether this role can currently be added to the company
         */
        private Boolean canBeAdded;

        /**
         * Gets the total number of required fields
         */
        public int getRequiredFieldCount() {
            return requiredFields != null ? requiredFields.size() : 0;
        }

        /**
         * Gets the total number of optional fields
         */
        public int getOptionalFieldCount() {
            return optionalFields != null ? optionalFields.size() : 0;
        }

        /**
         * Checks if a specific field is required
         */
        public boolean isFieldRequired(String fieldName) {
            return requiredFields != null && requiredFields.contains(fieldName);
        }

        /**
         * Checks if a specific field is optional
         */
        public boolean isFieldOptional(String fieldName) {
            return optionalFields != null && optionalFields.contains(fieldName);
        }
    }
}