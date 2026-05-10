package com.indusync.indusync_backend.order.application.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Command for updating existing orders.
 * Contains all the same fields as CreateOrderCommand but with optional values
 * to support partial updates.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record UpdateOrderCommand(
        // Order ID (required for updates)
        UUID orderId,
        
        // Basic Information (optional)
        String title,
        String description,

        // Contact Information (optional)
        String contactName,
        String contactEmail,
        String contactPhone,

        // Service Address (optional)
        String street,
        String houseNumber,
        String postalCode,
        String city,
        String country,

        // Geographic Information (optional)
        Double latitude,
        Double longitude,
        Integer searchRadiusKm,

        // Order Classification (optional)
        OrderCategory primaryCategory,
        List<OrderCategory> additionalCategories,
        List<Industry> targetIndustries,
        List<PlacementType> placementTypes,

        // Requirements (optional)
        List<String> requiredSpecializations,
        List<String> requiredSkills,
        List<String> requiredVerifications,
        List<String> requiredCertifications,

        // Timeline and Budget (optional)
        LocalDateTime startDate,
        LocalDateTime deadline,
        Urgency urgency,
        Integer responseTimeHours,
        BigDecimal budget
) {

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
               latitude != null || longitude != null || searchRadiusKm != null ||
               primaryCategory != null || additionalCategories != null ||
               targetIndustries != null || placementTypes != null ||
               requiredSpecializations != null || requiredSkills != null ||
               requiredVerifications != null || requiredCertifications != null ||
               startDate != null || deadline != null || urgency != null ||
               responseTimeHours != null || budget != null;
    }
} 