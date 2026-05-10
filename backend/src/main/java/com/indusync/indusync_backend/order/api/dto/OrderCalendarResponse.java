package com.indusync.indusync_backend.order.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for order calendar display
 * Contains only essential fields needed for calendar visualization
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderCalendarResponse {

    // === Core Information ===
    private UUID id;
    private String title;
    private String description;
    private OrderStatus status;

    // === Company Information ===
    private UUID companyId;
    private String companyName;
    private UUID providerId; // Only present for accepted orders

    // === Calendar-Required Dates ===
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startDate; // Required for calendar display

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime deadline; // Required for calendar display

    // === Additional Display Information ===
    private Urgency urgency;
    private String primaryCategory;
    private BigDecimal budget;
    private String city;
    private String fullAddress;

    // === Calendar-Specific Computed Fields ===
    private boolean isSpanning; // Whether order spans multiple days
    private int durationDays; // Duration in days
    private boolean isActive; // Whether order is currently active (today falls within date range)
    private boolean isOverdue; // Whether deadline has passed and order is not completed

    // === Provider Perspective Fields ===
    private Double distanceKm; // Distance from provider location (if applicable)

    /**
     * Factory method to create calendar response for client view
     */
    public static OrderCalendarResponse forClient(
            UUID id, String title, String description, OrderStatus status,
            UUID companyId, String companyName, UUID providerId,
            LocalDateTime startDate, LocalDateTime deadline,
            Urgency urgency, String primaryCategory, BigDecimal budget,
            String city, String fullAddress) {

        return OrderCalendarResponse.builder()
                .id(id)
                .title(title)
                .description(description)
                .status(status)
                .companyId(companyId)
                .companyName(companyName)
                .providerId(providerId)
                .startDate(startDate)
                .deadline(deadline)
                .urgency(urgency)
                .primaryCategory(primaryCategory)
                .budget(budget)
                .city(city)
                .fullAddress(fullAddress)
                .isSpanning(calculateIsSpanning(startDate, deadline))
                .durationDays(calculateDurationDays(startDate, deadline))
                .isActive(calculateIsActive(startDate, deadline))
                .isOverdue(calculateIsOverdue(deadline, status))
                .build();
    }

    /**
     * Factory method to create calendar response for provider view
     */
    public static OrderCalendarResponse forProvider(
            UUID id, String title, String description, OrderStatus status,
            UUID companyId, String companyName, UUID providerId,
            LocalDateTime startDate, LocalDateTime deadline,
            Urgency urgency, String primaryCategory, BigDecimal budget,
            String city, String fullAddress, Double distanceKm) {

        return OrderCalendarResponse.builder()
                .id(id)
                .title(title)
                .description(description)
                .status(status)
                .companyId(companyId)
                .companyName(companyName)
                .providerId(providerId)
                .startDate(startDate)
                .deadline(deadline)
                .urgency(urgency)
                .primaryCategory(primaryCategory)
                .budget(budget)
                .city(city)
                .fullAddress(fullAddress)
                .distanceKm(distanceKm)
                .isSpanning(calculateIsSpanning(startDate, deadline))
                .durationDays(calculateDurationDays(startDate, deadline))
                .isActive(calculateIsActive(startDate, deadline))
                .isOverdue(calculateIsOverdue(deadline, status))
                .build();
    }

    // === Helper Methods for Computed Fields ===

    private static boolean calculateIsSpanning(LocalDateTime startDate, LocalDateTime deadline) {
        if (startDate == null || deadline == null)
            return false;
        return !startDate.toLocalDate().equals(deadline.toLocalDate());
    }

    private static int calculateDurationDays(LocalDateTime startDate, LocalDateTime deadline) {
        if (startDate == null || deadline == null)
            return 0;
        return (int) java.time.Duration.between(
                startDate.toLocalDate().atStartOfDay(),
                deadline.toLocalDate().atStartOfDay()).toDays() + 1; // +1 to include both start and end dates
    }

    private static boolean calculateIsActive(LocalDateTime startDate, LocalDateTime deadline) {
        if (startDate == null || deadline == null)
            return false;
        LocalDateTime now = LocalDateTime.now();
        return !now.isBefore(startDate) && !now.isAfter(deadline);
    }

    private static boolean calculateIsOverdue(LocalDateTime deadline, OrderStatus status) {
        if (deadline == null)
            return false;
        if (status == OrderStatus.COMPLETED || status == OrderStatus.CANCELLED)
            return false;
        return LocalDateTime.now().isAfter(deadline);
    }
}