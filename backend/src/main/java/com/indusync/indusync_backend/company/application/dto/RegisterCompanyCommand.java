package com.indusync.indusync_backend.company.application.dto;

import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.*;
import java.util.List;
import java.util.UUID;

/**
 * Command DTO for company registration requests.
 * <p>
 * This DTO contains all the information needed to register a new company,
 * including business details, contact information, capabilities, and roles.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class RegisterCompanyCommand {

    @NotNull(message = "Benutzer-ID ist erforderlich")
    private UUID userId;

    @NotBlank(message = "Firmenname ist erforderlich")
    @Size(max = 200, message = "Firmenname darf maximal 200 Zeichen lang sein")
    private String companyName;

    @NotNull(message = "Unternehmensform ist erforderlich")
    private CompanyType companyType;

    @Size(max = 20, message = "Steuernummer darf maximal 20 Zeichen lang sein")
    private String taxId;

    @Size(max = 50, message = "Handelsregisternummer darf maximal 50 Zeichen lang sein")
    private String registrationNumber;

    private Address address;

    @Email(message = "Ungültiges E-Mail-Format")
    @Size(max = 255, message = "E-Mail darf maximal 255 Zeichen lang sein")
    private String contactEmail;

    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPhone;

    @Size(max = 255, message = "Website darf maximal 255 Zeichen lang sein")
    private String website;

//    @Size(max = 5000, message = "Beschreibung darf maximal 5000 Zeichen lang sein")
    private String description;

    private GeoLocation location;

    @Min(value = 1, message = "Arbeitsradius muss mindestens 1 km betragen")
    @Max(value = 1000, message = "Arbeitsradius darf maximal 1000 km betragen")
    private Integer workRadiusKm;

    private List<String> specializations;

    private List<String> industries;

    private List<String> orderCategories;

    private Boolean isAuftraggeber;

    private Boolean isAuftragnehmer;

    @Size(max = 500, message = "Öffnungszeiten dürfen maximal 500 Zeichen lang sein")
    private String businessHours;

    @Min(value = 1800, message = "Gründungsjahr muss nach 1800 liegen")
    @Max(value = 2100, message = "Gründungsjahr darf nicht in der Zukunft liegen")
    private Integer foundedYear;

    @Min(value = 1, message = "Mitarbeiteranzahl muss mindestens 1 betragen")
    @Max(value = 100000, message = "Mitarbeiteranzahl darf maximal 100.000 betragen")
    private Integer employeeCount;

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
     * Checks if the company will act as both client and provider.
     *
     * @return true if both roles are specified
     */
    public boolean isBothRoles() {
        return Boolean.TRUE.equals(isAuftraggeber) && Boolean.TRUE.equals(isAuftragnehmer);
    }

    /**
     * Gets a display name for the business role.
     *
     * @return formatted role description
     */
    public String getBusinessRoleDescription() {
        if (isBothRoles()) {
            return "Auftraggeber und Auftragnehmer";
        } else if (Boolean.TRUE.equals(isAuftraggeber)) {
            return "Auftraggeber";
        } else if (Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftragnehmer";
        }
        return "Rolle nicht definiert";
    }

    /**
     * Validates that required fields for Auftragnehmer are present.
     *
     * @return true if Auftragnehmer requirements are met
     */
    public boolean hasValidAuftragnehmehrData() {
        if (!Boolean.TRUE.equals(isAuftragnehmer)) {
            return true; // Not an Auftragnehmer, so no specific requirements
        }

        // Auftragnehmer should have specializations and work radius
        return specializations != null && !specializations.isEmpty() && workRadiusKm != null;
    }

    /**
     * Creates a command for creating a default company during user registration.
     *
     * @param userId      the user ID
     * @param companyName the company name (optional)
     * @param companyType the company type (optional)
     * @return registration command for default company
     */
    public static RegisterCompanyCommand forDefaultCompany(UUID userId, String companyName, String companyType) {
        CompanyType type = CompanyType.EINZELUNTERNEHMEN;
        if (companyType != null) {
            try {
                type = CompanyType.valueOf(companyType.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Use default if invalid
            }
        }

        return RegisterCompanyCommand.builder()
                .userId(userId)
                .companyName(companyName != null ? companyName : "Mein Unternehmen")
                .companyType(type)
                .isAuftraggeber(true)
                .isAuftragnehmer(false)
                .build();
    }
}