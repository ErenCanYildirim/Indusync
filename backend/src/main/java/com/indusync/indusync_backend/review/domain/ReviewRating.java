package com.indusync.indusync_backend.review.domain;

import com.indusync.indusync_backend.shared.domain.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * ReviewRating entity representing individual category ratings within a review.
 * <p>
 * This entity supports:
 * - 8 predefined rating categories
 * - Score validation (0-100 range)
 * - Optional comments for each rating
 * - Unique constraint per review-category combination
 * - Proper indexing for performance
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Entity
@Table(name = "review_ratings", schema = "review", uniqueConstraints = {
        @UniqueConstraint(name = "unique_review_category", columnNames = { "review_id", "category" })
}, indexes = {
        @Index(name = "idx_review_ratings_review_id", columnList = "review_id"),
        @Index(name = "idx_review_ratings_category", columnList = "category"),
        @Index(name = "idx_review_ratings_score", columnList = "score")
})
public class ReviewRating extends BaseEntity {

    /**
     * Enumeration of available rating categories.
     * These categories cover all aspects of business collaboration.
     */
    public enum Category {
        COMMUNICATION("Kommunikation"),
        RESPONSE_TIME("Antwortzeit"),
        PUNCTUALITY("Termintreue"),
        QUALITY("Qualität der Arbeit"),
        BUDGET("Budgettreue"),
        FLEXIBILITY("Flexibilität"),
        DOCUMENTATION("Dokumentation und Reporting"),
        OVERALL_SATISFACTION("Generelle Zufriedenheit");

        private final String displayName;

        Category(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }
    }

    /**
     * The review this rating belongs to.
     * Many-to-one relationship with lazy loading.
     */
    @NotNull(message = "Review ist erforderlich")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", columnDefinition = "uuid", nullable = false)
    private Review review;

    /**
     * The category being rated.
     * Stored as string in database with enum validation.
     */
    @NotNull(message = "Kategorie ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private Category category;

    /**
     * The numerical score for this category.
     * Must be between 0 and 100 inclusive.
     */
    @NotNull(message = "Bewertung ist erforderlich")
    @Min(value = 0, message = "Bewertung muss mindestens 0 sein")
    @Max(value = 100, message = "Bewertung darf höchstens 100 sein")
    @Column(name = "score", nullable = false)
    private Integer score;

    /**
     * Optional comment explaining the rating.
     * Limited to 1000 characters.
     */
    @Size(max = 1000, message = "Kommentar darf maximal 1000 Zeichen lang sein")
    @Column(name = "comment", length = 1000)
    private String comment;

    /**
     * Default constructor for JPA.
     */
    public ReviewRating() {
        super();
    }

    /**
     * Constructor for creating a new rating.
     *
     * @param review   the review this rating belongs to
     * @param category the category being rated
     * @param score    the numerical score (0-100)
     * @param comment  optional comment
     */
    public ReviewRating(Review review, Category category, Integer score, String comment) {
        super();
        this.review = review;
        this.category = category;
        this.score = score;
        this.comment = comment;
    }

    /**
     * Business logic: Check if this is a positive rating.
     *
     * @return true if score is 70 or higher
     */
    public boolean isPositive() {
        return score != null && score >= 70;
    }

    /**
     * Business logic: Check if this is a negative rating.
     *
     * @return true if score is below 50
     */
    public boolean isNegative() {
        return score != null && score < 50;
    }

    /**
     * Business logic: Get the rating quality level.
     *
     * @return string representation of the rating quality
     */
    public String getQualityLevel() {
        if (score == null)
            return "Nicht bewertet";
        if (score >= 90)
            return "Exzellent";
        if (score >= 80)
            return "Sehr gut";
        if (score >= 70)
            return "Gut";
        if (score >= 60)
            return "Befriedigend";
        if (score >= 50)
            return "Ausreichend";
        if (score >= 40)
            return "Mangelhaft";
        return "Ungenügend";
    }

    @Override
    public String toString() {
        return String.format("ReviewRating{id=%s, category=%s, score=%d, hasComment=%s}",
                getId(), category, score, comment != null && !comment.trim().isEmpty());
    }
}