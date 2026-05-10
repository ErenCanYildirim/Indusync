package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request DTO for updating existing orders.
 * Contains the same fields as CreateOrderRequest but all fields are optional
 * to support partial updates.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class UpdateOrderRequest {

    @Size(max = 255, message = "Titel darf maximal 255 Zeichen lang sein")
    private String title;

    @Size(max = 2000, message = "Beschreibung darf maximal 2000 Zeichen lang sein")
    private String description;

    // === Contact Information ===
    @Size(max = 100, message = "Name des Ansprechpartners darf maximal 100 Zeichen lang sein")
    private String contactName;

    @Email(message = "E-Mail-Adresse ist ungültig")
    @Size(max = 100, message = "E-Mail-Adresse darf maximal 100 Zeichen lang sein")
    private String contactEmail;

    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    private String contactPhone;

    // === Service Address ===
    @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein")
    private String street;

    @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein")
    private String houseNumber;

    @Pattern(regexp = "^\\d{5}$", message = "Postleitzahl muss 5 Ziffern enthalten")
    private String postalCode;

    @Size(max = 50, message = "Stadt darf maximal 50 Zeichen lang sein")
    private String city;

    @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein")
    private String country;

    // === Geographic Information ===
    @DecimalMin(value = "-90.0", message = "Breitengrad muss zwischen -90 und 90 liegen")
    @DecimalMax(value = "90.0", message = "Breitengrad muss zwischen -90 und 90 liegen")
    private Double locationLat;

    @DecimalMin(value = "-180.0", message = "Längengrad muss zwischen -180 und 180 liegen")
    @DecimalMax(value = "180.0", message = "Längengrad muss zwischen -180 und 180 liegen")
    private Double locationLng;

    @Min(value = 1, message = "Suchradius muss mindestens 1 km betragen")
    @Max(value = 1000, message = "Suchradius darf maximal 1000 km betragen")
    private Integer searchRadiusKm;

    // === Order Classification ===
    private OrderCategory primaryCategory;

    @Size(max = 10, message = "Maximal 10 zusätzliche Kategorien erlaubt")
    private List<OrderCategory> additionalCategories;

    @Size(max = 20, message = "Maximal 20 Zielindustrien erlaubt")
    private List<String> targetIndustries;

    @Size(max = 10, message = "Maximal 10 Auftragsarten erlaubt")
    private List<String> placementTypes;

    // === Requirements (Optional) ===
    @Size(max = 50, message = "Maximal 50 erforderliche Spezialisierungen erlaubt")
    private List<String> requiredSpecializations;

    @Size(max = 50, message = "Maximal 50 erforderliche Fähigkeiten erlaubt")
    private List<String> requiredSkills;

    @Size(max = 50, message = "Maximal 50 erforderliche Zertifizierungen erlaubt")
    private List<String> requiredVerifications;

    @Size(max = 50, message = "Maximal 50 erforderliche Nachweise erlaubt")
    private List<String> requiredCertifications;

    // === Timeline and Budget ===
    private LocalDateTime startDate;

    private LocalDateTime deadline;

    private Urgency urgency;

    @Min(value = 1, message = "Antwortzeit muss mindestens 1 Stunde betragen")
    @Max(value = 8760, message = "Antwortzeit darf maximal 8760 Stunden (1 Jahr) betragen")
    private Integer responseTimeHours;

    @DecimalMin(value = "0.01", message = "Budget muss größer als 0 sein")
    @DecimalMax(value = "99999999.99", message = "Budget ist zu hoch")
    private BigDecimal budget;

    // === Helper Methods ===

    /**
     * Gets the effective country, defaulting to "Deutschland" if not specified.
     */
    public String getEffectiveCountry() {
        return country != null && !country.trim().isEmpty() ? country : "Deutschland";
    }

    /**
     * Gets the effective urgency, defaulting to MEDIUM if not specified.
     */
    public Urgency getEffectiveUrgency() {
        return urgency != null ? urgency : Urgency.MEDIUM;
    }

    /**
     * Checks if any field has been set (for partial update validation).
     */
    public boolean hasAnyFieldSet() {
        return title != null || description != null ||
                contactName != null || contactEmail != null || contactPhone != null ||
                street != null || houseNumber != null || postalCode != null ||
                city != null || country != null ||
                locationLat != null || locationLng != null || searchRadiusKm != null ||
                primaryCategory != null || additionalCategories != null ||
                targetIndustries != null || placementTypes != null ||
                requiredSpecializations != null || requiredSkills != null ||
                requiredVerifications != null || requiredCertifications != null ||
                startDate != null || deadline != null || urgency != null ||
                responseTimeHours != null || budget != null;
    }
}