package com.indusync.indusync_backend.review.domain;

import com.indusync.indusync_backend.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;


/**
 * Review entity representing company reviews for completed orders.
 * <p>
 * This entity supports:
 * - Mutual review system between clients and providers
 * - One review per company per order (unique constraint)
 * - Automatic timestamp management via BaseEntity
 * - Proper indexing for performance
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */

@Getter
@Setter
@Entity
@Table(name = "reviews", schema = "review", uniqueConstraints = {
        @UniqueConstraint(name = "unique_order_reviewer", columnNames = { "order_id", "reviewer_company_id" })
}, indexes = {
        @Index(name = "idx_reviews_order_id", columnList = "order_id"),
        @Index(name = "idx_reviews_reviewer_company_id", columnList = "reviewer_company_id"),
        @Index(name = "idx_reviews_reviewee_company_id", columnList = "reviewee_company_id"),
        @Index(name = "idx_reviews_created_at", columnList = "created_at")
})
public class Review extends BaseEntity {

     /**
     * ID of the order being reviewed.
     * References orders.id with cascade delete.
     */
    @Column(name = "order_id", columnDefinition = "uuid", nullable = false)
    private UUID orderId;

    /**
     * ID of the company submitting the review.
     * References companies.id with cascade delete.
     */
    @Column(name = "reviewer_company_id", columnDefinition = "uuid", nullable = false)
    private UUID reviewerCompanyId;

    /**
     * ID of the company being reviewed.
     * References companies.id with cascade delete.
     */
    @Column(name = "reviewee_company_id", columnDefinition = "uuid", nullable = false)
    private UUID revieweeCompanyId;

    /**
     * List of ratings for different categories.
     * One-to-many relationship with cascade operations.
     */
    @OneToMany(mappedBy = "review", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<ReviewRating> ratings;

    /**
     * Default constructor for JPA.
     */
    public Review() {
        super();
    }

    /**
     * Constructor for creating a new review.
     *
     * @param orderId           ID of the order being reviewed
     * @param reviewerCompanyId ID of the company submitting the review
     * @param revieweeCompanyId ID of the company being reviewed
     */
    public Review(UUID orderId, UUID reviewerCompanyId, UUID revieweeCompanyId) {
        super();
        this.orderId = orderId;
        this.reviewerCompanyId = reviewerCompanyId;
        this.revieweeCompanyId = revieweeCompanyId;
    }

    /**
     * Business logic: Check if this review is for a specific order.
     *
     * @param orderId the order ID to check
     * @return true if this review is for the specified order
     */
    public boolean isForOrder(UUID orderId) {
        return this.orderId != null && this.orderId.equals(orderId);
    }

    /**
     * Business logic: Check if this review was submitted by a specific company.
     *
     * @param companyId the company ID to check
     * @return true if this review was submitted by the specified company
     */
    public boolean isSubmittedBy(UUID companyId) {
        return this.reviewerCompanyId != null && this.reviewerCompanyId.equals(companyId);
    }

    /**
     * Business logic: Check if this review is about a specific company.
     *
     * @param companyId the company ID to check
     * @return true if this review is about the specified company
     */
    public boolean isAbout(UUID companyId) {
        return this.revieweeCompanyId != null && this.revieweeCompanyId.equals(companyId);
    }

    @Override
    public String toString() {
        return String.format("Review{id=%s, orderId=%s, reviewerCompanyId=%s, revieweeCompanyId=%s}",
                getId(), orderId, reviewerCompanyId, revieweeCompanyId);
    }
}