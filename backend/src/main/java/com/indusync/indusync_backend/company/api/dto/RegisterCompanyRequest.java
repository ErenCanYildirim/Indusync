package com.indusync.indusync_backend.company.api.dto;

import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * REST API request DTO for company registration.
 * <p>
 * This DTO represents the JSON payload sent from the frontend
 * for company registration requests. It supports both simple company
 * registration and detailed Auftragnehmer registration with all
 * necessary fields for the multi-step registration stepper.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class RegisterCompanyRequest {

    // Core company information
    @NotBlank(message = "Firmenname ist erforderlich")
    @Size(max = 200, message = "Firmenname darf maximal 200 Zeichen lang sein")
    private String companyName;

    @NotBlank(message = "Unternehmensform ist erforderlich")
    private String companyType;

    @Size(max = 20, message = "Steuernummer darf maximal 20 Zeichen lang sein")
    private String taxId;

    @Size(max = 50, message = "Handelsregisternummer darf maximal 50 Zeichen lang sein")
    private String registrationNumber;

    // Primary address fields
    @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein")
    private String street;

    @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein")
    private String houseNumber;

    @Pattern(regexp = "^[0-9]{5}$", message = "Postleitzahl muss 5 Ziffern haben")
    private String postalCode;

    @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein")
    private String city;

    @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein")
    private String country;

    // Contact information
    @Email(message = "Ungültiges E-Mail-Format")
    @Size(max = 255, message = "E-Mail darf maximal 255 Zeichen lang sein")
    private String contactEmail;

    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPhone;

    @Size(max = 255, message = "Website darf maximal 255 Zeichen lang sein")
    private String website;

    // Business roles - these determine the registration flow
    private Boolean isAuftraggeber;
    private Boolean isAuftragnehmer;

    // ========== AUFTRAGNEHMER-SPECIFIC FIELDS ==========
    // These fields are used when isAuftragnehmer = true

    // Company details for Auftragnehmer
    @Size(max = 200, message = "Unternehmensname darf maximal 200 Zeichen lang sein")
    private String companyDetailsName;

    // Company headquarters address (separate from primary address)
    @Size(max = 200, message = "Firmenadresse darf maximal 200 Zeichen lang sein")
    private String companyAddress;

    @Pattern(regexp = "^[0-9]{5}$", message = "Postleitzahl muss 5 Ziffern haben")
    private String companyPostalCode;

    @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein")
    private String companyCity;

    // Work radius and geographic coverage
    private String workRadius; // e.g., "5km", "25km", "100km"

    @Min(value = 1, message = "Arbeitsradius muss mindestens 1 km betragen")
    @Max(value = 1000, message = "Arbeitsradius darf maximal 1000 km betragen")
    private Integer workRadiusKm; // numeric version for backend processing

    // Country selection for international work
    private String countrySelection; // e.g., "germany", "austria", "switzerland"

    // Contact information for the company
    @Min(value = 1, message = "Kontaktpersonenanzahl muss mindestens 1 betragen")
    private Integer contactPersonCount;

    @Size(max = 200, message = "Kontaktpersonenname darf maximal 200 Zeichen lang sein")
    private String contactPersonName;

    @Size(max = 100, message = "Abteilung darf maximal 100 Zeichen lang sein")
    private String contactDepartment;

    @Email(message = "Ungültiges E-Mail-Format für Kontakt")
    @Size(max = 255, message = "Kontakt-E-Mail darf maximal 255 Zeichen lang sein")
    private String contactPersonEmail;

    @Size(max = 20, message = "Kontakt-Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPersonPhone;

    // Employee count
    @Min(value = 1, message = "Mitarbeiteranzahl muss mindestens 1 betragen")
    @Max(value = 100000, message = "Mitarbeiteranzahl darf maximal 100.000 betragen")
    private Integer employeeCount;

    // Business capabilities and specializations
    private List<String> specializations;
    private List<String> industries;
    private List<String> orderCategories;

    // Company description
    @Size(max = 600, message = "Unternehmensbeschreibung darf maximal 600 Zeichen lang sein")
    private String companyDescription;

    // File uploads for verification
    private String companyVerificationFile; // Company proof document
    private String companyCertificatesFile; // Company certificates

    // ========== EXISTING BUSINESS FIELDS ==========
    // Additional business details
    @Size(max = 5000, message = "Beschreibung darf maximal 5000 Zeichen lang sein")
    private String description;

    @Size(max = 500, message = "Öffnungszeiten dürfen maximal 500 Zeichen lang sein")
    private String businessHours;

    @Min(value = 1800, message = "Gründungsjahr muss nach 1800 liegen")
    @Max(value = 2100, message = "Gründungsjahr darf nicht in der Zukunft liegen")
    private Integer foundedYear;

    @Min(value = 0, message = "Jahresumsatz darf nicht negativ sein")
    private Long annualRevenue;

    @Size(max = 20, message = "USt-IdNr. darf maximal 20 Zeichen lang sein")
    private String vatNumber;

    private List<String> certifications;
    private Boolean insuranceCoverage;

    @Size(max = 500, message = "Logo-URL darf maximal 500 Zeichen lang sein")
    private String logoUrl;

    /**
     * Validates that at least one business role is specified.
     *
     * @return true if at least one role is specified
     */
    public boolean hasValidBusinessRole() {
        return Boolean.TRUE.equals(isAuftraggeber) || Boolean.TRUE.equals(isAuftragnehmer);
    }

    /**
     * Checks if all required address fields are present.
     *
     * @return true if address is complete
     */
    public boolean hasCompleteAddress() {
        return street != null && !street.trim().isEmpty() &&
                city != null && !city.trim().isEmpty() &&
                postalCode != null && !postalCode.trim().isEmpty();
    }

    /**
     * Checks if Auftragnehmer-specific required fields are present.
     *
     * @return true if Auftragnehmer data is complete
     */
    public boolean hasCompleteAuftragnehmberData() {
        if (!Boolean.TRUE.equals(isAuftragnehmer)) {
            return true; // Not an Auftragnehmer, so no specific requirements
        }

        return companyDetailsName != null && !companyDetailsName.trim().isEmpty() &&
                companyAddress != null && !companyAddress.trim().isEmpty() &&
                companyPostalCode != null && !companyPostalCode.trim().isEmpty() &&
                companyCity != null && !companyCity.trim().isEmpty() &&
                employeeCount != null &&
                contactPersonName != null && !contactPersonName.trim().isEmpty() &&
                companyDescription != null && !companyDescription.trim().isEmpty() &&
                companyVerificationFile != null && !companyVerificationFile.trim().isEmpty();
    }

    /**
     * Gets a display name for the business role.
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
     * Converts work radius string to kilometers.
     *
     * @return work radius in kilometers
     */
    public Integer getWorkRadiusInKm() {
        if (workRadiusKm != null) {
            return workRadiusKm;
        }

        if (workRadius != null) {
            try {
                // Extract number from strings like "5km", "25km"
                String numStr = workRadius.replaceAll("[^0-9]", "");
                return Integer.parseInt(numStr);
            } catch (NumberFormatException e) {
                return null;
            }
        }

        return null;
    }
}