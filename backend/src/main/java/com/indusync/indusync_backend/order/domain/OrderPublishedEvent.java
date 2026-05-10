package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Event published when an order is published and becomes available for
 * matching.
 * <p>
 * This event contains all necessary information for the matching algorithm
 * to find suitable providers without needing to re-query the database.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record OrderPublishedEvent(
        UUID orderId,
        String title,
        String description,
        UUID companyId,
        String companyName,

        // Contact Information
        String contactName,
        String contactEmail,
        String contactPhone,

        // Location & Geography
        String city,
        String postalCode,
        Double latitude,
        Double longitude,
        Integer searchRadiusKm,

        // Categories & Requirements
        OrderCategory primaryCategory,
        List<String> secondaryCategories,
        Set<String> targetIndustries,
        Set<String> placementTypes,
        List<String> requiredSpecializations,
        List<String> requiredSkills,
        List<String> requiredVerifications,
        List<String> requiredCertifications,

        // Timeline & Priority
        Urgency urgency,
        LocalDateTime startDate,
        LocalDateTime deadline,
        Integer responseTimeHours,

        // Financial
        BigDecimal budget,

        // Metadata
        LocalDateTime publishedAt,

        // Optional custom weights for scoring categories (keys: industry, contract, verification, skills, certificates, radius)
        java.util.Map<String, java.math.BigDecimal> weightOverrides) {

    /**
     * Creates an OrderPublishedEvent from an Order entity.
     */
    public static OrderPublishedEvent fromOrder(Order order, String companyName) {
        return OrderPublishedEvent.builder()
                .orderId(order.getId())
                .title(order.getTitle())
                .description(order.getDescription())
                .companyId(order.getCompanyId())
                .companyName(companyName)
                .contactName(order.getContactName())
                .contactEmail(order.getContactEmail())
                .contactPhone(order.getContactPerson() != null ? order.getContactPerson().getPhone() : null)
                .city(order.getServiceAddress() != null ? order.getServiceAddress().getCity() : null)
                .postalCode(order.getServiceAddress() != null ? order.getServiceAddress().getPostalCode() : null)
                .latitude(order.getLocation() != null ? order.getLocation().getLatitude().doubleValue() : null)
                .longitude(order.getLocation() != null ? order.getLocation().getLongitude().doubleValue() : null)
                .searchRadiusKm(order.getSearchRadiusKm())
                .primaryCategory(order.getPrimaryCategory())
                .secondaryCategories(parseCommaSeparated(order.getSecondaryCategories()))
                .targetIndustries(order.getTargetIndustries().stream().map(Enum::name)
                        .collect(java.util.stream.Collectors.toSet()))
                .placementTypes(
                        order.getPlacementTypes().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet()))
                .requiredSpecializations(parseCommaSeparated(order.getRequiredSpecializations()))
                .requiredSkills(parseCommaSeparated(order.getRequiredSkills()))
                .requiredVerifications(parseCommaSeparated(order.getRequiredVerifications()))
                .requiredCertifications(parseCommaSeparated(order.getRequiredCertifications()))
                .urgency(order.getUrgency())
                .startDate(order.getStartDate())
                .deadline(order.getDeadline())
                .responseTimeHours(order.getResponseTimeHours())
                .budget(order.getBudget())
                .publishedAt(order.getPublishedAt())
                .weightOverrides(java.util.Map.of())
                .build();
    }

    private static List<String> parseCommaSeparated(String value) {
        if (value == null || value.trim().isEmpty()) {
            return List.of();
        }
        return Stream.of(value.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }
}