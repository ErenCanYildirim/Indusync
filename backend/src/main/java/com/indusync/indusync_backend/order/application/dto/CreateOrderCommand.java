package com.indusync.indusync_backend.order.application.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Command for creating a new order.
 * <p>
 * Enhanced record supporting all frontend form fields:
 * - Basic order information (title, description)
 * - Contact information (multiple contacts supported)
 * - Service location details and geographic coordinates
 * - Categories, industries, and placement types
 * - Specializations and skill requirements
 * - Timeline, urgency, and budget information
 * - Document and certification requirements
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record CreateOrderCommand(
        // === Core Order Fields ===
        @NotBlank(message = "Auftragstitel ist erforderlich") @Size(max = 200, message = "Auftragstitel darf maximal 200 Zeichen lang sein") String title,

        @NotBlank(message = "Auftragsbeschreibung ist erforderlich") @Size(max = 2000, message = "Auftragsbeschreibung darf maximal 2000 Zeichen lang sein") String description,

        @NotNull(message = "Unternehmen ist erforderlich") UUID companyId,

        // === Contact Information ===
        @NotBlank(message = "Kontaktperson ist erforderlich") @Size(max = 100, message = "Name darf maximal 100 Zeichen lang sein") String contactName,

        @NotBlank(message = "E-Mail-Adresse ist erforderlich") @Email(message = "Gültige E-Mail-Adresse erforderlich") @Size(max = 150, message = "E-Mail-Adresse darf maximal 150 Zeichen lang sein") String contactEmail,

        @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein") String contactPhone,

        // Additional contact persons (for future extension)
        List<ContactPersonDto> additionalContacts,

        // === Service Address Fields ===
        @NotBlank(message = "Straße ist erforderlich") @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein") String street,

        @NotBlank(message = "Hausnummer ist erforderlich") @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein") String houseNumber,

        @NotBlank(message = "Postleitzahl ist erforderlich") @Pattern(regexp = "^[0-9]{5}$", message = "Postleitzahl muss 5 Ziffern haben") String postalCode,

        @NotBlank(message = "Stadt ist erforderlich") @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein") String city,

        @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein") String country,

        // === Geographic Coordinates ===
        @NotNull(message = "Breitengrad ist erforderlich") @DecimalMin(value = "-90.0", message = "Breitengrad muss zwischen -90 und 90 liegen") @DecimalMax(value = "90.0", message = "Breitengrad muss zwischen -90 und 90 liegen") Double latitude,

        @NotNull(message = "Längengrad ist erforderlich") @DecimalMin(value = "-180.0", message = "Längengrad muss zwischen -180 und 180 liegen") @DecimalMax(value = "180.0", message = "Längengrad muss zwischen -180 und 180 liegen") Double longitude,

        // === Matching Configuration ===
        @NotNull(message = "Suchradius ist erforderlich") @Min(value = 1, message = "Suchradius muss mindestens 1 km betragen") @Max(value = 1000, message = "Suchradius darf maximal 1000 km betragen") Integer searchRadiusKm,

        // === Categories & Classification ===
        @NotNull(message = "Auftragskategorie ist erforderlich") OrderCategory primaryCategory,

        Set<OrderCategory> additionalCategories,

        @NotEmpty(message = "Mindestens eine Branche muss ausgewählt werden") Set<Industry> targetIndustries,

        @NotEmpty(message = "Mindestens eine Auftragsart muss ausgewählt werden") Set<PlacementType> placementTypes,

        // === Skills & Requirements ===
        List<String> requiredSpecializations,

        List<String> requiredSkills,

        List<String> requiredVerifications,

        List<String> requiredCertifications,

        // === Timeline & Urgency ===
        Urgency urgency,

        LocalDateTime startDate,

        @Future(message = "Deadline muss in der Zukunft liegen") LocalDateTime deadline,

        @Min(value = 1, message = "Antwortzeit muss mindestens 1 Stunde betragen") @Max(value = 720, message = "Antwortzeit darf maximal 720 Stunden (30 Tage) betragen") Integer responseTimeHours,

        // === Financial ===
        @DecimalMin(value = "0.0", message = "Budget muss größer oder gleich 0 sein") @DecimalMax(value = "999999999.99", message = "Budget ist zu hoch") BigDecimal budget) {

    /**
     * Nested record for additional contact persons.
     */
    public record ContactPersonDto(
            @NotBlank(message = "Name ist erforderlich") @Size(max = 100, message = "Name darf maximal 100 Zeichen lang sein") String name,

            @NotBlank(message = "E-Mail ist erforderlich") @Email(message = "Gültige E-Mail-Adresse erforderlich") @Size(max = 150, message = "E-Mail darf maximal 150 Zeichen lang sein") String email,

            @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein") String phone) {
    }

    /**
     * Creates a CreateOrderCommand with minimal required fields (backwards
     * compatibility).
     *
     * @param title           the order title
     * @param description     the order description
     * @param companyId       the company ID
     * @param contactName     the contact person name
     * @param contactEmail    the contact email
     * @param street          the street name
     * @param houseNumber     the house number
     * @param postalCode      the postal code
     * @param city            the city name
     * @param latitude        the latitude coordinate
     * @param longitude       the longitude coordinate
     * @param searchRadiusKm  the search radius in kilometers
     * @param primaryCategory the primary category
     * @return a new CreateOrderCommand with minimal fields
     */
    public static CreateOrderCommand minimal(
            String title,
            String description,
            UUID companyId,
            String contactName,
            String contactEmail,
            String street,
            String houseNumber,
            String postalCode,
            String city,
            Double latitude,
            Double longitude,
            Integer searchRadiusKm,
            OrderCategory primaryCategory,
            Set<Industry> targetIndustries,
            Set<PlacementType> placementTypes) {
        return new CreateOrderCommand(
                title, description, companyId,
                contactName, contactEmail, null, null,
                street, houseNumber, postalCode, city, "Deutschland",
                latitude, longitude, searchRadiusKm,
                primaryCategory, null, targetIndustries, placementTypes,
                null, null, null, null,
                Urgency.MEDIUM, null, null, null, null);
    }

    /**
     * Gets the full street address.
     *
     * @return formatted street address
     */
    public String getFullStreetAddress() {
        return street + " " + houseNumber;
    }

    /**
     * Gets the formatted address.
     *
     * @return complete formatted address
     */
    public String getFormattedAddress() {
        String countryDisplay = (country == null || country.isEmpty()) ? "Deutschland" : country;
        return String.format("%s %s, %s %s, %s",
                street, houseNumber, postalCode, city, countryDisplay);
    }

    /**
     * Validates if this command represents a valid German address.
     *
     * @return true if this is a German address
     */
    public boolean isGermanAddress() {
        return country == null || country.isEmpty() ||
                "Deutschland".equals(country) || "Germany".equalsIgnoreCase(country);
    }

    /**
     * Gets the effective country (defaulting to Deutschland).
     *
     * @return the country name, defaulting to "Deutschland"
     */
    public String getEffectiveCountry() {
        return (country == null || country.trim().isEmpty()) ? "Deutschland" : country.trim();
    }

    /**
     * Gets the effective urgency (defaulting to MEDIUM).
     *
     * @return the urgency level, defaulting to MEDIUM
     */
    public Urgency getEffectiveUrgency() {
        return urgency != null ? urgency : Urgency.MEDIUM;
    }

    /**
     * Checks if the order has budget information.
     *
     * @return true if budget is specified and positive
     */
    public boolean hasBudget() {
        return budget != null && budget.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Checks if the order has a deadline.
     *
     * @return true if deadline is specified
     */
    public boolean hasDeadline() {
        return deadline != null;
    }

    /**
     * Checks if the order has additional contact persons.
     *
     * @return true if additional contacts are provided
     */
    public boolean hasAdditionalContacts() {
        return additionalContacts != null && !additionalContacts.isEmpty();
    }

    /**
     * Gets the total number of contact persons.
     *
     * @return total contacts (primary + additional)
     */
    public int getTotalContactCount() {
        int count = 1; // primary contact
        if (hasAdditionalContacts()) {
            count += additionalContacts.size();
        }
        return count;
    }

    /**
     * Checks if the order is urgent based on urgency level.
     *
     * @return true if urgency is HIGH or URGENT
     */
    public boolean isUrgent() {
        Urgency effectiveUrgency = getEffectiveUrgency();
        return effectiveUrgency == Urgency.HIGH || effectiveUrgency == Urgency.URGENT;
    }

    /**
     * Gets all categories (primary + additional).
     *
     * @return set of all categories
     */
    public Set<OrderCategory> getAllCategories() {
        Set<OrderCategory> allCategories = new java.util.HashSet<>();
        allCategories.add(primaryCategory);
        if (additionalCategories != null) {
            allCategories.addAll(additionalCategories);
        }
        return allCategories;
    }

    /**
     * Legacy constructor kept for tests that used the early MVP signature.
     * Delegates to the full constructor with sensible defaults.
     */
    public CreateOrderCommand(String title,
            String description,
            UUID companyId,
            String street,
            String houseNumber,
            String postalCode,
            String city,
            String country,
            Double latitude,
            Double longitude,
            Integer searchRadiusKm) {
        this(title, description, companyId,
                "", "", null, List.of(),
                street, houseNumber, postalCode, city,
                country != null ? country : "Deutschland",
                latitude, longitude, searchRadiusKm,
                OrderCategory.OTHER, Set.of(), Set.of(), Set.of(),
                List.of(), List.of(), List.of(), List.of(),
                Urgency.MEDIUM,
                null, null, null, null);
    }
}