package com.indusync.indusync_backend.company.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;import java.util.Map;
import java.util.UUID;

/**
 * Response DTO for company role addition operations.
 * <p>
 * This DTO represents the response returned by the API when companies
 * add new business roles. It includes success/error information,
 * updated company role status, and any validation messages.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class CompanyRoleAdditionResponse {

    // Company identification
    private UUID companyId;
    private String companyName;

    // Role addition details
    private BusinessRole addedRole;
    private Boolean isAuftraggeber;
    private Boolean isAuftragnehmer;
    private LocalDateTime addedAt;

    // Company status after role addition
    private CompanyStatus status;
    private Boolean requiresVerification;

    // Response metadata
    private Boolean success;
    private String message;
    private String errorCode;
    private Map<String, String> fieldErrors;

    // Additional context
    private String businessRoleDescription;
    private Boolean canEdit;
    private Boolean canManage;

    /**
     * Gets the complete business role description based on current roles.
     *
     * @return formatted role description
     */
    public String getBusinessRoleDescription() {
        if (businessRoleDescription != null) {
            return businessRoleDescription;
        }

        if (Boolean.TRUE.equals(isAuftraggeber) && Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftraggeber und Auftragnehmer";
        } else if (Boolean.TRUE.equals(isAuftraggeber)) {
            return "Auftraggeber";
        } else if (Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftragnehmer";
        }
        return "Keine Rolle definiert";
    }

    /**
     * Gets a user-friendly status message.
     *
     * @return formatted status message
     */
    public String getStatusMessage() {
        if (status == null) {
            return "Unbekannt";
        }

        return switch (status) {
            case PENDING -> "Wartet auf Verifizierung";
            case ACTIVE -> "Aktiv und einsatzbereit";
            case SUSPENDED -> "Vorübergehend gesperrt";
            case INACTIVE -> "Inaktiv";
        };
    }

    /**
     * Checks if the role addition was successful.
     *
     * @return true if successful
     */
    public boolean isSuccessful() {
        return Boolean.TRUE.equals(success);
    }

    /**
     * Checks if there are validation errors.
     *
     * @return true if validation errors exist
     */
    public boolean hasValidationErrors() {
        return fieldErrors != null && !fieldErrors.isEmpty();
    }

    /**
     * Gets the number of validation errors.
     *
     * @return count of validation errors
     */
    public int getValidationErrorCount() {
        return fieldErrors != null ? fieldErrors.size() : 0;
    }

    /**
     * Creates a successful response.
     *
     * @param companyId the company ID
     * @param companyName the company name
     * @param addedRole the role that was added
     * @param isAuftraggeber current Auftraggeber status
     * @param isAuftragnehmer current Auftragnehmer status
     * @param status company status
     * @param requiresVerification whether verification is needed
     * @return successful response
     */
    public static CompanyRoleAdditionResponse success(
            UUID companyId,
            String companyName,
            BusinessRole addedRole,
            Boolean isAuftraggeber,
            Boolean isAuftragnehmer,
            CompanyStatus status,
            Boolean requiresVerification) {
        
        String message = String.format("Geschäftsrolle '%s' wurde erfolgreich hinzugefügt", 
                addedRole.getDisplayName());
        
        if (Boolean.TRUE.equals(requiresVerification)) {
            message += ". Verifizierung erforderlich.";
        }

        return CompanyRoleAdditionResponse.builder()
                .companyId(companyId)
                .companyName(companyName)
                .addedRole(addedRole)
                .isAuftraggeber(isAuftraggeber)
                .isAuftragnehmer(isAuftragnehmer)
                .addedAt(LocalDateTime.now())
                .status(status)
                .requiresVerification(requiresVerification)
                .success(true)
                .message(message)
                .canEdit(true)
                .canManage(true)
                .build();
    }

    /**
     * Creates an error response with a general message.
     *
     * @param message the error message
     * @return error response
     */
    public static CompanyRoleAdditionResponse error(String message) {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message(message)
                .canEdit(false)
                .canManage(false)
                .build();
    }

    /**
     * Creates an error response with an error code.
     *
     * @param message the error message
     * @param errorCode the error code
     * @return error response
     */
    public static CompanyRoleAdditionResponse error(String message, String errorCode) {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .canEdit(false)
                .canManage(false)
                .build();
    }

    /**
     * Creates a validation error response.
     *
     * @param message the error message
     * @param fieldErrors map of field-specific errors
     * @return validation error response
     */
    public static CompanyRoleAdditionResponse validationError(String message, Map<String, String> fieldErrors) {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message(message)
                .errorCode("VALIDATION_ERROR")
                .fieldErrors(fieldErrors)
                .canEdit(true)
                .canManage(false)
                .build();
    }

    /**
     * Creates an unauthorized error response.
     *
     * @return unauthorized error response
     */
    public static CompanyRoleAdditionResponse unauthorized() {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message("Sie sind nicht berechtigt, Geschäftsrollen für dieses Unternehmen zu ändern")
                .errorCode("UNAUTHORIZED")
                .canEdit(false)
                .canManage(false)
                .build();
    }

    /**
     * Creates a role already exists error response.
     *
     * @param role the role that already exists
     * @return role exists error response
     */
    public static CompanyRoleAdditionResponse roleAlreadyExists(BusinessRole role) {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message(String.format("Das Unternehmen hat bereits die Rolle '%s'", role.getDisplayName()))
                .errorCode("ROLE_ALREADY_EXISTS")
                .canEdit(true)
                .canManage(false)
                .build();
    }

    /**
     * Creates a company not found error response.
     *
     * @return company not found error response
     */
    public static CompanyRoleAdditionResponse companyNotFound() {
        return CompanyRoleAdditionResponse.builder()
                .success(false)
                .message("Unternehmen nicht gefunden")
                .errorCode("COMPANY_NOT_FOUND")
                .canEdit(false)
                .canManage(false)
                .build();
    }
}