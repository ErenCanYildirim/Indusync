package com.indusync.indusync_backend.company.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * REST API request DTO for adding business roles to existing companies.
 * <p>
 * This DTO represents the JSON payload sent from the frontend
 * when companies want to add new business roles (Auftraggeber or Auftragnehmer)
 * after their initial registration. It includes validation for role-specific
 * required fields, particularly for Auftragnehmer role additions.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class AddBusinessRoleRequest {

    @NotNull(message = "Geschäftsrolle ist erforderlich")
    private BusinessRole role;

    // ========== AUFTRAGNEHMER-SPECIFIC FIELDS ==========
    // These fields are required when adding Auftragnehmer role
    // Following the same pattern as the registration flow

    // Business capabilities and specializations
    private List<String> specializations;
    private List<String> industries;
    private List<String> orderCategories;

    // Work radius and geographic coverage
    @Min(value = 1, message = "Arbeitsradius muss mindestens 1 km betragen")
    @Max(value = 1000, message = "Arbeitsradius darf maximal 1000 km betragen")
    private Integer workRadiusKm;

    // Company description for Auftragnehmer services
    @Size(max = 600, message = "Unternehmensbeschreibung darf maximal 600 Zeichen lang sein")
    private String description;

    // Contact information updates
    @Size(max = 200, message = "Kontaktpersonenname darf maximal 200 Zeichen lang sein")
    private String contactPersonName;

    @Email(message = "Ungültiges E-Mail-Format für Kontakt")
    @Size(max = 255, message = "Kontakt-E-Mail darf maximal 255 Zeichen lang sein")
    private String contactPersonEmail;

    @Size(max = 20, message = "Kontakt-Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPersonPhone;

    // Employee count
    @Min(value = 1, message = "Mitarbeiteranzahl muss mindestens 1 betragen")
    @Max(value = 100000, message = "Mitarbeiteranzahl darf maximal 100.000 betragen")
    private Integer employeeCount;

    // Business hours
    @Size(max = 500, message = "Öffnungszeiten dürfen maximal 500 Zeichen lang sein")
    private String businessHours;

    // Certifications
    private List<String> certifications;

    // File uploads for verification (URLs after upload)
    private String verificationDocumentUrl;
    private String certificatesDocumentUrl;

    /**
     * Validates that all required fields for Auftragnehmer role are present.
     *
     * @return true if Auftragnehmer data is complete
     */
    public boolean hasCompleteAuftragnehmberData() {
        if (role != BusinessRole.AUFTRAGNEHMER) {
            return true; // Not adding Auftragnehmer role, so no specific requirements
        }

        return specializations != null && !specializations.isEmpty() &&
                industries != null && !industries.isEmpty() &&
                workRadiusKm != null &&
                description != null && !description.trim().isEmpty() &&
                contactPersonName != null && !contactPersonName.trim().isEmpty() &&
                contactPersonEmail != null && !contactPersonEmail.trim().isEmpty() &&
                employeeCount != null;
    }

    /**
     * Validates that verification documents are provided for Auftragnehmer role.
     * Auftraggeber (client) role doesn't require any documents.
     *
     * @return true if required documents are present
     */
    public boolean hasRequiredDocuments() {
        if (role != BusinessRole.AUFTRAGNEHMER) {
            return true; // Auftraggeber role doesn't require any documents
        }

        // For Auftragnehmer role, verification document is required
        return verificationDocumentUrl != null && !verificationDocumentUrl.trim().isEmpty();
    }

    /**
     * Gets a list of missing required fields for the specified role.
     *
     * @return list of missing field names
     */
    public List<String> getMissingRequiredFields() {
        if (role != BusinessRole.AUFTRAGNEHMER) {
            return List.of(); // No additional requirements for Auftraggeber
        }

        List<String> missing = new java.util.ArrayList<>();

        if (specializations == null || specializations.isEmpty()) {
            missing.add("specializations");
        }
        if (industries == null || industries.isEmpty()) {
            missing.add("industries");
        }
        if (workRadiusKm == null) {
            missing.add("workRadiusKm");
        }
        if (description == null || description.trim().isEmpty()) {
            missing.add("description");
        }
        if (contactPersonName == null || contactPersonName.trim().isEmpty()) {
            missing.add("contactPersonName");
        }
        if (contactPersonEmail == null || contactPersonEmail.trim().isEmpty()) {
            missing.add("contactPersonEmail");
        }
        if (employeeCount == null) {
            missing.add("employeeCount");
        }
        if (verificationDocumentUrl == null || verificationDocumentUrl.trim().isEmpty()) {
            missing.add("verificationDocumentUrl");
        }

        return missing;
    }

    /**
     * Checks if the request is valid for the specified role.
     *
     * @return true if request is valid
     */
    public boolean isValidForRole() {
        if (role == null) {
            return false;
        }

        return switch (role) {
            case AUFTRAGGEBER -> true; // Auftraggeber role has no additional requirements
            case AUFTRAGNEHMER -> hasCompleteAuftragnehmberData() && hasRequiredDocuments();
        };
    }

    /**
     * Gets the role description for display purposes.
     *
     * @return formatted role description
     */
    public String getRoleDescription() {
        return role != null ? role.getDisplayName() : "Unbekannte Rolle";
    }
}