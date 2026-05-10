package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST API response DTO for order listings (summary view).
 * Updated to support comprehensive order fields.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class OrderListResponse {

    // === Core Information ===
    private UUID id;
    private String title;
    private String description; // truncated for list view
    private OrderStatus status;

    // === Location ===
    private String city;
    private String postalCode;
    private String fullAddress;
    private Integer searchRadiusKm;

    // === Categories & Classification ===
    private OrderCategory primaryCategory;
    private Urgency urgency;

    // === Timeline & Financial ===
    private BigDecimal budget;
    private LocalDateTime deadline;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;

    // === Company Context ===
    private UUID companyId;
    private String companyName;

    // === Provider View ===
    private Double distanceKm;
    private List<String> requiredSkills;

    private Long applicationsCount;

    /**
     * Truncates description for list display.
     */
    public String getTruncatedDescription() {
        if (description == null)
            return null;
        return description.length() > 150
                ? description.substring(0, 147) + "..."
                : description;
    }

    /**
     * Gets the status display name.
     */
    public String getStatusDisplayName() {
        return status != null ? status.getDisplayName() : "";
    }

    /**
     * Gets the category display name.
     */
    public String getCategoryDisplayName() {
        return primaryCategory != null ? primaryCategory.getDisplayName() : "";
    }

    /**
     * Gets the urgency display name.
     */
    public String getUrgencyDisplayName() {
        return urgency != null ? urgency.getDisplayName() : "";
    }

    /**
     * Checks if the order has budget information.
     */
    public boolean hasBudget() {
        return budget != null && budget.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Checks if the order is urgent.
     */
    public boolean isUrgent() {
        return urgency == Urgency.HIGH || urgency == Urgency.URGENT;
    }

    /**
     * Checks if the order has a deadline.
     */
    public boolean hasDeadline() {
        return deadline != null;
    }

    /**
     * Gets the formatted budget for display.
     */
    public String getFormattedBudget() {
        if (!hasBudget()) return "Budget nicht angegeben";
        return String.format("€ %,.2f", budget);
    }
}