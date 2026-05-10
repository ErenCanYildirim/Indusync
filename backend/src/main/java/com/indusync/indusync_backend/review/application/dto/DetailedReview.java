package com.indusync.indusync_backend.review.application.dto;

import com.indusync.indusync_backend.review.domain.ReviewRating;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * DTO representing comprehensive review information for detailed review
 * display.
 * Contains all review details including ratings, comments, and company context.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record DetailedReview(
        /**
         * Unique identifier of the review.
         */
        UUID reviewId,

        /**
         * ID of the company that submitted the review.
         */
        UUID reviewerCompanyId,

        /**
         * Name of the company that submitted the review.
         */
        String reviewerCompanyName,

        /**
         * ID of the company being reviewed.
         */
        UUID revieweeCompanyId,

        /**
         * Name of the company being reviewed.
         */
        String revieweeCompanyName,

        /**
         * Role of the reviewee company in the order context.
         * CLIENT if they created the order, PROVIDER if they fulfilled it.
         */
        CompanyRole revieweeRole,

        /**
         * Date and time when the review was submitted.
         */
        LocalDateTime reviewDate,

        /**
         * Map of detailed ratings for each category.
         * Key: ReviewRating.Category, Value: RatingDetail with score and comment.
         */
        Map<ReviewRating.Category, RatingDetail> ratings) {
    /**
     * Creates a DetailedReview for a company acting as CLIENT.
     *
     * @param reviewId            the review ID
     * @param reviewerCompanyId   the reviewer company ID
     * @param reviewerCompanyName the reviewer company name
     * @param revieweeCompanyId   the reviewee company ID
     * @param revieweeCompanyName the reviewee company name
     * @param reviewDate          the review date
     * @param ratings             the detailed ratings map
     * @return DetailedReview with CLIENT role
     */
    public static DetailedReview forClient(UUID reviewId, UUID reviewerCompanyId, String reviewerCompanyName,
            UUID revieweeCompanyId, String revieweeCompanyName,
            LocalDateTime reviewDate, Map<ReviewRating.Category, RatingDetail> ratings) {
        return new DetailedReview(reviewId, reviewerCompanyId, reviewerCompanyName,
                revieweeCompanyId, revieweeCompanyName, CompanyRole.CLIENT, reviewDate, ratings);
    }

    /**
     * Creates a DetailedReview for a company acting as PROVIDER.
     *
     * @param reviewId            the review ID
     * @param reviewerCompanyId   the reviewer company ID
     * @param reviewerCompanyName the reviewer company name
     * @param revieweeCompanyId   the reviewee company ID
     * @param revieweeCompanyName the reviewee company name
     * @param reviewDate          the review date
     * @param ratings             the detailed ratings map
     * @return DetailedReview with PROVIDER role
     */
    public static DetailedReview forProvider(UUID reviewId, UUID reviewerCompanyId, String reviewerCompanyName,
            UUID revieweeCompanyId, String revieweeCompanyName,
            LocalDateTime reviewDate, Map<ReviewRating.Category, RatingDetail> ratings) {
        return new DetailedReview(reviewId, reviewerCompanyId, reviewerCompanyName,
                revieweeCompanyId, revieweeCompanyName, CompanyRole.PROVIDER, reviewDate, ratings);
    }

    /**
     * Calculates the overall rating for this review.
     *
     * @return average of all category ratings, or null if no ratings exist
     */
    public Double getOverallRating() {
        if (ratings.isEmpty()) {
            return null;
        }

        double sum = ratings.values().stream()
                .filter(rating -> rating.score() != null)
                .mapToDouble(rating -> rating.score().doubleValue())
                .sum();

        long count = ratings.values().stream()
                .filter(rating -> rating.score() != null)
                .count();

        return count > 0 ? sum / count : null;
    }

    /**
     * Gets the quality level description for the overall rating.
     *
     * @return quality level string
     */
    public String getOverallQualityLevel() {
        Double overallRating = getOverallRating();
        if (overallRating == null)
            return "Nicht bewertet";
        if (overallRating >= 90)
            return "Exzellent";
        if (overallRating >= 80)
            return "Sehr gut";
        if (overallRating >= 70)
            return "Gut";
        if (overallRating >= 60)
            return "Befriedigend";
        if (overallRating >= 50)
            return "Ausreichend";
        if (overallRating >= 40)
            return "Mangelhaft";
        return "Ungenügend";
    }

    /**
     * Checks if this review has any ratings.
     *
     * @return true if ratings map is not empty
     */
    public boolean hasRatings() {
        return !ratings.isEmpty();
    }

    /**
     * Gets the number of categories rated in this review.
     *
     * @return count of rated categories
     */
    public int getRatedCategoriesCount() {
        return (int) ratings.values().stream()
                .filter(rating -> rating.score() != null)
                .count();
    }
}