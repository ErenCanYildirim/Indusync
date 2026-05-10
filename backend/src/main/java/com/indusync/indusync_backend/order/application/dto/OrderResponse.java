package com.indusync.indusync_backend.order.application.dto;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.shared.domain.enums.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Response DTO for order information.
 * <p>
 * Enhanced response supporting all frontend requirements:
 * - Complete order information and status
 * - Contact and location details
 * - Categories, industries, and placement types
 * - Skills, requirements, and certifications
 * - Timeline, urgency, and budget information
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record OrderResponse(
        // === Core Order Information ===
        UUID id,
        String title,
        String description,
        OrderStatus status,
        String statusDisplayName,
        UUID companyId,
        UUID providerId,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,

        // === Contact Information ===
        String contactName,
        String contactEmail,
        String contactPhone,

        // === Location & Service Details ===
        String street,
        String houseNumber,
        String postalCode,
        String city,
        String country,
        String fullAddress,
        Double latitude,
        Double longitude,
        Integer searchRadiusKm,

        // === Categories & Classification ===
        OrderCategory primaryCategory,
        String primaryCategoryDisplayName,
        List<OrderCategory> additionalCategories,
        Set<Industry> targetIndustries,
        List<String> targetIndustryDisplayNames,
        Set<PlacementType> placementTypes,
        List<String> placementTypeDisplayNames,

        // === Skills & Requirements ===
        List<String> requiredSpecializations,
        List<String> requiredSkills,
        List<String> requiredVerifications,
        List<String> requiredCertifications,

        // === Timeline & Urgency ===
        Urgency urgency,
        String urgencyDisplayName,
        LocalDateTime startDate,
        LocalDateTime deadline,
        Integer responseTimeHours,
        boolean isOverdue,
        boolean isUrgent,

        // === Financial ===
        BigDecimal budget,
        boolean hasBudget,

        // === Lifecycle Timestamps ===
        LocalDateTime publishedAt,
        LocalDateTime completedAt,

        // === Status Flags ===
        boolean isDraft,
        boolean isPublished,
        boolean isFinal,
        boolean canBeModified) {

    /**
     * Creates an OrderResponse from an Order entity.
     *
     * @param order the order entity
     * @return OrderResponse DTO
     */
    public static OrderResponse fromOrder(Order order) {
        return new OrderResponse(
                // Core order information
                order.getId(),
                order.getTitle(),
                order.getDescription(),
                order.getStatus(),
                order.getStatusDisplayName(),
                order.getCompanyId(),
                order.getProviderId(),
                order.getCreatedAt(),
                order.getUpdatedAt(),

                // Contact information
                order.getContactName(),
                order.getContactEmail(),
                order.getContactPerson() != null ? order.getContactPerson().getPhone() : null,

                // Location & service details
                order.getServiceAddress() != null ? order.getServiceAddress().getStreet() : null,
                order.getServiceAddress() != null ? order.getServiceAddress().getHouseNumber() : null,
                order.getServiceAddress() != null ? order.getServiceAddress().getPostalCode() : null,
                order.getServiceAddress() != null ? order.getServiceAddress().getCity() : null,
                order.getServiceAddress() != null ? order.getServiceAddress().getCountry() : null,
                order.getServiceAddress() != null ? order.getServiceAddress().getFormattedAddress() : null,
                order.getLocation() != null ? order.getLocation().getLatitude().doubleValue() : null,
                order.getLocation() != null ? order.getLocation().getLongitude().doubleValue() : null,
                order.getSearchRadiusKm(),

                // Categories & classification
                order.getPrimaryCategory(),
                order.getPrimaryCategory() != null ? order.getPrimaryCategory().getDisplayName() : null,
                parseAdditionalCategories(order.getSecondaryCategories()),
                order.getTargetIndustries(),
                order.getTargetIndustries() != null ? order.getTargetIndustries().stream()
                        .map(Industry::getDisplayName)
                        .collect(Collectors.toList()) : List.of(),
                order.getPlacementTypes(),
                order.getPlacementTypes() != null ? order.getPlacementTypes().stream()
                        .map(PlacementType::getDisplayName)
                        .collect(Collectors.toList()) : List.of(),

                // Skills & requirements
                parseStringList(order.getRequiredSpecializations()),
                parseStringList(order.getRequiredSkills()),
                parseStringList(order.getRequiredVerifications()),
                parseStringList(order.getRequiredCertifications()),

                // Timeline & urgency
                order.getUrgency(),
                order.getUrgency() != null ? order.getUrgency().getDisplayName() : null,
                order.getStartDate(),
                order.getDeadline(),
                order.getResponseTimeHours(),
                order.isOverdue(),
                order.isUrgent(),

                // Financial
                order.getBudget(),
                order.getBudget() != null && order.getBudget().compareTo(BigDecimal.ZERO) > 0,

                // Lifecycle timestamps
                order.getPublishedAt(),
                order.getCompletedAt(),

                // Status flags
                order.isDraft(),
                order.isPublished(),
                order.isFinal(),
                order.canBeModified());


    }

    /**
     * Helper method to parse comma-separated string into list.
     */
    private static List<String> parseStringList(String commaSeparatedString) {
        if (commaSeparatedString == null || commaSeparatedString.trim().isEmpty()) {
            return List.of();
        }
        return Arrays.stream(commaSeparatedString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Helper method to parse additional categories from comma-separated string.
     */
    private static List<OrderCategory> parseAdditionalCategories(String commaSeparatedCategories) {
        if (commaSeparatedCategories == null || commaSeparatedCategories.trim().isEmpty()) {
            return List.of();
        }
        return Arrays.stream(commaSeparatedCategories.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(categoryName -> {
                    try {
                        return OrderCategory.valueOf(categoryName);
                    } catch (IllegalArgumentException e) {
                        return OrderCategory.OTHER;
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * Gets the formatted contact information.
     *
     * @return formatted contact string
     */
    public String getFormattedContact() {
        StringBuilder sb = new StringBuilder();
        if (contactName != null) {
            sb.append(contactName);
        }
        if (contactEmail != null) {
            if (sb.length() > 0)
                sb.append(" ");
            sb.append("(").append(contactEmail);
            if (contactPhone != null) {
                sb.append(", ").append(contactPhone);
            }
            sb.append(")");
        }
        return sb.toString();
    }

    /**
     * Gets the formatted address for display.
     *
     * @return formatted address string
     */
    public String getDisplayAddress() {
        if (fullAddress != null) {
            return fullAddress;
        }
        // Fallback to constructing address
        StringBuilder sb = new StringBuilder();
        if (street != null)
            sb.append(street);
        if (houseNumber != null)
            sb.append(" ").append(houseNumber);
        if (postalCode != null || city != null) {
            sb.append(", ");
            if (postalCode != null)
                sb.append(postalCode).append(" ");
            if (city != null)
                sb.append(city);
        }
        return sb.toString();
    }

    /**
     * Gets days until deadline.
     *
     * @return days until deadline, or null if no deadline
     */
    public Long getDaysUntilDeadline() {
        if (deadline == null)
            return null;
        return java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), deadline);
    }

    /**
     * Checks if the order has any requirements specified.
     *
     * @return true if order has specializations, skills, verifications, or
     *         certifications
     */
    public boolean hasRequirements() {
        return !requiredSpecializations.isEmpty() ||
                !requiredSkills.isEmpty() ||
                !requiredVerifications.isEmpty() ||
                !requiredCertifications.isEmpty();
    }

    /**
     * Checks if the order has complete contact information.
     *
     * @return true if name and email are present
     */
    public boolean hasCompleteContact() {
        return contactName != null && !contactName.trim().isEmpty() &&
                contactEmail != null && !contactEmail.trim().isEmpty();
    }

    /**
     * Checks if the order has geographic coordinates.
     *
     * @return true if latitude and longitude are present
     */
    public boolean hasCoordinates() {
        return latitude != null && longitude != null;
    }
}