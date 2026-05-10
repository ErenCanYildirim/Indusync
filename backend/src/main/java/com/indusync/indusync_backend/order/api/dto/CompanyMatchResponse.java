package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.company.api.dto.CompanyDetailResponse;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a service provider company that matches a specific order.
 * <p>
 * Returned to AUFTRAGGEBER (client) companies so they can view which potential
 * AUFTRAGNEHMER (providers) have been identified by the matching algorithm.
 * </p>
 */
@Data
@Builder
public class CompanyMatchResponse {

    /**
     * The ID of the provider company that was matched.
     */
    private UUID providerId;

    /**
     * Detailed information about the provider company. Can be <code>null</code>
     * if the company could not be loaded.
     */
    private CompanyDetailResponse company;

    // === Match Scoring ===

    /** Overall match score (0.0 – 1.0). */
    private BigDecimal matchScore;

    /** Match score as percentage (0-100). */
    private Integer matchScorePercentage;

    /** Distance between provider and order location in kilometres. */
    private BigDecimal distanceKm;

    // === Detailed score breakdown (optional – useful for analytics/UI) ===
    private BigDecimal industryScore;
    private BigDecimal skillsScore;
    private BigDecimal contractScore;
    private BigDecimal certificatesScore;
    private BigDecimal verificationScore;
    private BigDecimal radiusScore;

    // === Metadata ===
    private LocalDateTime matchedAt;
    private Boolean notificationSent;
    private Boolean isHighQuality;

    // === Provider Activity Tracking ===
    /** When the provider viewed this order (null if not viewed). */
    private LocalDateTime viewedAt;

    /**
     * When the provider last had activity on this order (viewed or expressed
     * interest).
     */
    private LocalDateTime respondedAt;

    /** Whether the provider has expressed interest in this order. */
    private Boolean interested;
}