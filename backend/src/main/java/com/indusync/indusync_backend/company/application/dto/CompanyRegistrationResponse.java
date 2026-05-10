package com.indusync.indusync_backend.company.application.dto;

import com.indusync.indusync_backend.company.api.dto.CompanyDocument;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for company registration operations.
 * <p>
 * This DTO contains the result of a company registration request,
 * including the created company information and membership details.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class CompanyRegistrationResponse {

    private UUID companyId;

    private String companyName;

    private CompanyStatus status;

    private CompanyMemberRole membershipRole;

    private Boolean isAuftraggeber;

    private Boolean isAuftragnehmer;

    private LocalDateTime registeredAt;

    private String message;

    private List<CompanyDocument> documents;

    /**
     * Gets a user-friendly status message based on the company status.
     *
     * @return formatted status message
     */
    public String getStatusMessage() {
        if (status == null) {
            return "Unbekannter Status";
        }
        return switch (status) {
            case PENDING -> "Unternehmen wurde registriert und wartet auf Verifizierung";
            case ACTIVE -> "Unternehmen ist aktiv und einsatzbereit";
            case SUSPENDED -> "Unternehmen ist vorübergehend gesperrt";
            case INACTIVE -> "Unternehmen ist inaktiv";
            default -> "Unbekannter Status";
        };
    }

    /**
     * Gets the business role description.
     *
     * @return formatted role description
     */
    public String getBusinessRoleDescription() {
        if (Boolean.TRUE.equals(isAuftraggeber) && Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftraggeber und Auftragnehmer";
        } else if (Boolean.TRUE.equals(isAuftraggeber)) {
            return "Auftraggeber";
        } else if (Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftragnehmer";
        }
        return "Rolle nicht definiert";
    }

    /**
     * Checks if the company registration was successful.
     *
     * @return true if registration was successful
     */
    public boolean isSuccessful() {
        return companyId != null && status != null;
    }

    /**
     * Creates a success response for company registration.
     *
     * @param companyId       the created company ID
     * @param companyName     the company name
     * @param status          the company status
     * @param membershipRole  the user's role in the company
     * @param isAuftraggeber  whether company is Auftraggeber
     * @param isAuftragnehmer whether company is Auftragnehmer
     * @return success response
     */
    public static CompanyRegistrationResponse success(UUID companyId, String companyName,
            CompanyStatus status, CompanyMemberRole membershipRole,
            Boolean isAuftraggeber, Boolean isAuftragnehmer) {
        return CompanyRegistrationResponse.builder()
                .companyId(companyId)
                .companyName(companyName)
                .status(status)
                .membershipRole(membershipRole)
                .isAuftraggeber(isAuftraggeber)
                .isAuftragnehmer(isAuftragnehmer)
                .registeredAt(LocalDateTime.now())
                .message("Unternehmen erfolgreich registriert")
                .build();
    }

    /**
     * Creates an error response for company registration.
     *
     * @param errorMessage the error message
     * @return error response
     */
    public static CompanyRegistrationResponse error(String errorMessage) {
        return CompanyRegistrationResponse.builder()
                .message(errorMessage)
                .registeredAt(LocalDateTime.now())
                .build();
    }
}