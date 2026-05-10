package com.indusync.indusync_backend.order.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing an order match with computed scores and order details.
 * Used by the Order Board API to show providers their matched orders
 * with compatibility scores and engagement tracking.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class OrderMatchResponse {

    /**
     * The order ID that was matched.
     */
    private UUID orderId;

    /**
     * Complete order details (optional - may be null if not loaded).
     */
    private OrderDetailResponse order;

    // === Match Scoring ===

    /**
     * Overall match score (0.0 - 1.0).
     */
    private BigDecimal matchScore;

    /**
     * Match score as percentage (0-100).
     */
    private Integer matchScorePercentage;

    /**
     * Distance from provider to order location in kilometers.
     */
    private BigDecimal distanceKm;

    // === Detailed Score Breakdown ===

    /**
     * Industry compatibility score (0.0 - 1.0).
     */
    private BigDecimal industryScore;

    /**
     * Skills/specializations compatibility score (0.0 - 1.0).
     */
    private BigDecimal skillsScore;

    /**
     * Contract type compatibility score (0.0 - 1.0).
     */
    private BigDecimal contractScore;

    /**
     * Certificates compatibility score (0.0 - 1.0).
     */
    private BigDecimal certificatesScore;

    /**
     * Verification status score (0.0 - 1.0).
     */
    private BigDecimal verificationScore;

    /**
     * Operational radius compatibility score (0.0 - 1.0).
     */
    private BigDecimal radiusScore;

    // === Match Metadata ===

    /**
     * When this match was computed.
     */
    private LocalDateTime matchedAt;

    /**
     * Whether the provider has viewed this match.
     */
    private Boolean viewed;

    /**
     * When the provider viewed this match.
     */
    private LocalDateTime viewedAt;

    /**
     * Whether the provider expressed interest.
     */
    private Boolean interested;

    /**
     * When the provider responded (viewed or expressed interest).
     */
    private LocalDateTime respondedAt;

    /**
     * Whether the provider has been accepted by the client.
     */
    private Boolean accepted;

    /**
     * When the provider was accepted by the client.
     */
    private LocalDateTime acceptedAt;

    // === Computed Properties ===

    /**
     * Whether this is considered a high-quality match (score >= 0.7).
     */
    private Boolean isHighQuality;

    /**
     * Match quality level based on score.
     */
    public String getMatchQuality() {
        if (matchScore == null)
            return "Unknown";

        double score = matchScore.doubleValue();
        if (score >= 0.9)
            return "Excellent";
        if (score >= 0.7)
            return "High";
        if (score >= 0.5)
            return "Good";
        if (score >= 0.3)
            return "Fair";
        return "Low";
    }

    /**
     * Gets the primary reason for the match quality.
     */
    public String getMatchReason() {
        if (industryScore != null && industryScore.compareTo(BigDecimal.valueOf(0.8)) >= 0) {
            return "Industry expertise match";
        }
        if (skillsScore != null && skillsScore.compareTo(BigDecimal.valueOf(0.8)) >= 0) {
            return "Skills compatibility";
        }
        if (radiusScore != null && radiusScore.compareTo(BigDecimal.valueOf(0.8)) >= 0) {
            return "Geographic proximity";
        }
        if (certificatesScore != null && certificatesScore.compareTo(BigDecimal.valueOf(0.8)) >= 0) {
            return "Certification requirements met";
        }
        return "General compatibility";
    }

    /**
     * Whether this match requires provider attention.
     */
    public Boolean requiresAttention() {
        return !Boolean.TRUE.equals(viewed) && Boolean.TRUE.equals(isHighQuality);
    }
}