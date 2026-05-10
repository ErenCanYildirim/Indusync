package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
public class MatchingPreviewRequestDto {

    // companyId is obtained from authentication context, not from request
    private UUID companyId; // Internal use only, set by controller

    private OrderCategory primaryCategory;

    private Set<String> targetIndustries;

    private Set<String> placementTypes;

    private Set<String> requiredSpecializations;

    private Set<String> requiredCertifications;

    private Set<String> requiredVerifications;

    @DecimalMin(value = "-90.0", message = "Latitude must be between -90 and 90")
    @DecimalMax(value = "90.0", message = "Latitude must be between -90 and 90")
    private BigDecimal latitude;

    @DecimalMin(value = "-180.0", message = "Longitude must be between -180 and 180")
    @DecimalMax(value = "180.0", message = "Longitude must be between -180 and 180")
    private BigDecimal longitude;

    @Positive(message = "Search radius must be positive")
    @Max(value = 1000, message = "Search radius cannot exceed 1000km")
    private Integer searchRadiusKm;

    private Urgency urgency;

    private LocalDateTime startDate;

    private LocalDateTime deadline;

    @DecimalMin(value = "0.0", message = "Budget must be positive")
    private BigDecimal budget;
}