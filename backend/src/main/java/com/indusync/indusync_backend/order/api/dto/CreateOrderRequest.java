package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * REST API request DTO for creating orders.
 * Updated to support all comprehensive order fields.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class CreateOrderRequest {

    // === Core Order Information ===
    @NotBlank(message = "Titel ist erforderlich")
    @Size(max = 200, message = "Titel darf maximal 200 Zeichen lang sein")
    private String title;

    @NotBlank(message = "Beschreibung ist erforderlich")
    @Size(max = 2000, message = "Beschreibung darf maximal 2000 Zeichen lang sein")
    private String description;

    // === Contact Information ===
    @NotBlank(message = "Kontaktperson ist erforderlich")
    @Size(max = 100, message = "Kontaktperson darf maximal 100 Zeichen lang sein")
    private String contactName;

    @NotBlank(message = "E-Mail ist erforderlich")
    @Email(message = "Ungültiges E-Mail-Format")
    @Size(max = 150, message = "E-Mail darf maximal 150 Zeichen lang sein")
    private String contactEmail;

    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPhone;

    // === Service Address ===
    @NotBlank(message = "Straße ist erforderlich")
    @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein")
    private String street;

    @NotBlank(message = "Hausnummer ist erforderlich")
    @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein")
    private String houseNumber;

    @NotBlank(message = "Postleitzahl ist erforderlich")
    @Pattern(regexp = "^[0-9]{5}$", message = "Postleitzahl muss 5 Ziffern haben")
    private String postalCode;

    @NotBlank(message = "Stadt ist erforderlich")
    @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein")
    private String city;

    @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein")
    private String country;

    // === Geographic Coordinates ===
    @NotNull(message = "Breitengrad ist erforderlich")
    @DecimalMin(value = "-90.0", message = "Breitengrad muss zwischen -90 und 90 liegen")
    @DecimalMax(value = "90.0", message = "Breitengrad muss zwischen -90 und 90 liegen")
    private BigDecimal locationLat;

    @NotNull(message = "Längengrad ist erforderlich")
    @DecimalMin(value = "-180.0", message = "Längengrad muss zwischen -180 und 180 liegen")
    @DecimalMax(value = "180.0", message = "Längengrad muss zwischen -180 und 180 liegen")
    private BigDecimal locationLng;

    // === Matching Configuration ===
    @NotNull(message = "Suchradius ist erforderlich")
    @Min(value = 1, message = "Suchradius muss mindestens 1 km betragen")
    @Max(value = 1000, message = "Suchradius darf maximal 1000 km betragen")
    private Integer searchRadiusKm;

    // === Categories & Classification ===
    @NotNull(message = "Auftragskategorie ist erforderlich")
    private OrderCategory primaryCategory;

    private Set<OrderCategory> additionalCategories;

    @NotEmpty(message = "Mindestens eine Branche muss ausgewählt werden")
    private List<String> targetIndustries;

    @NotEmpty(message = "Mindestens eine Auftragsart muss ausgewählt werden")
    private List<String> placementTypes;

    // === Skills & Requirements ===
    @Size(max = 50, message = "Maximal 50 erforderliche Spezialisierungen erlaubt")
    private List<String> requiredSpecializations;

    @Size(max = 50, message = "Maximal 50 erforderliche Fähigkeiten erlaubt")
    private List<String> requiredSkills;

    @Size(max = 50, message = "Maximal 50 erforderliche Zertifizierungen erlaubt")
    private List<String> requiredVerifications;

    @Size(max = 50, message = "Maximal 50 erforderliche Nachweise erlaubt")
    private List<String> requiredCertifications;

    // === Timeline & Urgency ===
    private Urgency urgency;

    private LocalDateTime startDate;

    @Future(message = "Deadline muss in der Zukunft liegen")
    private LocalDateTime deadline;

    @Min(value = 1, message = "Antwortzeit muss mindestens 1 Stunde betragen")
    @Max(value = 720, message = "Antwortzeit darf maximal 720 Stunden betragen")
    private Integer responseTimeHours;

    // === Financial ===
    @DecimalMin(value = "0.01", message = "Budget muss positiv sein")
    @Digits(integer = 10, fraction = 2, message = "Budget ungültiges Format")
    private BigDecimal budget;

    /**
     * Validates that essential contact information is provided.
     */
    public boolean hasValidContactInfo() {
        return (contactName != null && !contactName.trim().isEmpty()) &&
                (contactEmail != null && !contactEmail.trim().isEmpty());
    }

    /**
     * Checks if address is complete for geocoding.
     */
    public boolean hasCompleteAddress() {
        return street != null && !street.trim().isEmpty() &&
                houseNumber != null && !houseNumber.trim().isEmpty() &&
                city != null && !city.trim().isEmpty() &&
                postalCode != null && !postalCode.trim().isEmpty();
    }

    /**
     * Gets the effective country (defaulting to Deutschland).
     */
    public String getEffectiveCountry() {
        return (country == null || country.trim().isEmpty()) ? "Germany" : country.trim();
    }

    /**
     * Gets the effective urgency (defaulting to MEDIUM).
     */
    public Urgency getEffectiveUrgency() {
        return urgency != null ? urgency : Urgency.MEDIUM;
    }

    /**
     * Checks if coordinates are provided.
     */
    public boolean hasCoordinates() {
        return locationLat != null && locationLng != null;
    }

    /**
     * Checks if budget is specified.
     */
    public boolean hasBudget() {
        return budget != null && budget.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Gets the full street address.
     */
    public String getFullStreetAddress() {
        if (street == null)
            return "";
        return houseNumber != null ? street + " " + houseNumber : street;
    }

    /**
     * Gets the formatted address for display.
     */
    public String getFormattedAddress() {
        StringBuilder sb = new StringBuilder();
        if (street != null)
            sb.append(street);
        if (houseNumber != null)
            sb.append(" ").append(houseNumber);
        sb.append(", ");
        if (postalCode != null)
            sb.append(postalCode).append(" ");
        if (city != null)
            sb.append(city);
        if (country != null && !country.equals("Germany")) {
            sb.append(", ").append(country);
        }
        return sb.toString();
    }
}