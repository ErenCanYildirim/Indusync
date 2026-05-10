package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a match between an order and a potential service provider
 * company.
 * <p>
 * Stores matching results with scores and metadata for efficient order board
 * queries.
 * Each match represents a potential provider for a specific order.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Entity
@Table(name = "order_matches", schema = "\"order\"", indexes = {
        @Index(name = "idx_order_matches_order_id", columnList = "order_id"),
        @Index(name = "idx_order_matches_provider_id", columnList = "provider_id"),
        @Index(name = "idx_order_matches_score", columnList = "match_score"),
        @Index(name = "idx_order_matches_matched_at", columnList = "matched_at"),
        @Index(name = "idx_order_matches_notified", columnList = "notification_sent"),
        @Index(name = "idx_order_matches_viewed", columnList = "viewed_at")
})
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderMatch extends AuditableEntity {

    /**
     * The order that was matched.
     */
    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    /**
     * The provider company that was matched to the order.
     */
    @Column(name = "provider_id", nullable = false)
    private UUID providerId;

    /**
     * Overall match score (0.0 - 1.0) based on the scoring algorithm.
     */
    @Column(name = "match_score", nullable = false, precision = 4, scale = 3)
    private BigDecimal matchScore;

    /**
     * Distance from provider to order location in kilometers.
     */
    @Column(name = "distance_km", precision = 6, scale = 2)
    private BigDecimal distanceKm;

    // === Detailed Score Breakdown ===

    /**
     * Score for industry match (0.0 - 1.0).
     */
    @Column(name = "industry_score", precision = 4, scale = 3)
    private BigDecimal industryScore;

    /**
     * Score for skills/specializations match (0.0 - 1.0).
     */
    @Column(name = "skills_score", precision = 4, scale = 3)
    private BigDecimal skillsScore;

    /**
     * Score for contract type compatibility (0.0 - 1.0).
     */
    @Column(name = "contract_score", precision = 4, scale = 3)
    private BigDecimal contractScore;

    /**
     * Score for certificates match (0.0 - 1.0).
     */
    @Column(name = "certificates_score", precision = 4, scale = 3)
    private BigDecimal certificatesScore;

    /**
     * Score for verification status (0.0 - 1.0).
     */
    @Column(name = "verification_score", precision = 4, scale = 3)
    private BigDecimal verificationScore;

    /**
     * Score for operational radius compatibility (0.0 - 1.0).
     */
    @Column(name = "radius_score", precision = 4, scale = 3)
    private BigDecimal radiusScore;

    // === Matching Metadata ===

    /**
     * When this match was created by the matching algorithm.
     */
    @Column(name = "matched_at", nullable = false)
    private LocalDateTime matchedAt;

    /**
     * Whether a notification has been sent to the provider about this match.
     */
    @Builder.Default
    @Column(name = "notification_sent", nullable = false)
    private Boolean notificationSent = false;

    /**
     * When the notification was sent.
     */
    @Column(name = "notification_sent_at")
    private LocalDateTime notificationSentAt;

    /**
     * Whether the provider has viewed this order.
     */
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;

    /**
     * Whether the provider has expressed interest in this order.
     */
    @Column(name = "interested")
    private Boolean interested;

    /**
     * When the provider responded (viewed or expressed interest).
     */
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    /**
     * True when the client has selected this provider for the order.
     */
    @Builder.Default
    @Column(name = "accepted", nullable = false)
    private Boolean accepted = false;

    /**
     * Timestamp when the provider was accepted by the client.
     */
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    // === Relationships ===

    /**
     * The order this match relates to.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private Order order;

    // Note: We don't include Company relationship to avoid circular dependencies
    // Company information should be fetched separately when needed

    // === Business Methods ===

    /**
     * Marks this match as having been viewed by the provider.
     */
    public void markAsViewed() {
        this.viewedAt = LocalDateTime.now();
        if (this.respondedAt == null) {
            this.respondedAt = this.viewedAt;
        }
    }

    /**
     * Marks this match as having interest expressed by the provider.
     */
    public void markAsInterested() {
        this.interested = true;
        this.respondedAt = LocalDateTime.now();
        if (this.viewedAt == null) {
            this.viewedAt = this.respondedAt;
        }
    }

    /**
     * Marks the notification as sent.
     */
    public void markNotificationSent() {
        this.notificationSent = true;
        this.notificationSentAt = LocalDateTime.now();
    }

    /**
     * Gets the match score as a percentage (0-100).
     */
    public int getMatchScorePercentage() {
        return matchScore != null ? matchScore.multiply(BigDecimal.valueOf(100)).intValue() : 0;
    }

    /**
     * Checks if this is a high-quality match (score >= 0.7).
     */
    public boolean isHighQualityMatch() {
        return matchScore != null && matchScore.compareTo(BigDecimal.valueOf(0.7)) >= 0;
    }

    /**
     * Checks if the provider has engaged with this match.
     */
    public boolean hasProviderEngaged() {
        return viewedAt != null || (interested != null && interested);
    }

    /**
     * Marks this match as accepted by the client.
     */
    public void markAsAccepted() {
        this.accepted = true;
        this.acceptedAt = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return String.format("OrderMatch{orderId=%s, providerId=%s, score=%.2f, distance=%.1fkm}",
                orderId, providerId,
                matchScore != null ? matchScore.doubleValue() : 0.0,
                distanceKm != null ? distanceKm.doubleValue() : 0.0);
    }
}