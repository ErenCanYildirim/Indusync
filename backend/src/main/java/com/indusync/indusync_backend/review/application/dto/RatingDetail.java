package com.indusync.indusync_backend.review.application.dto;

import com.indusync.indusync_backend.review.domain.ReviewRating;

/**
 * DTO representing detailed rating information for a specific category within a
 * review.
 * Contains the score, comment, and quality level for individual category
 * ratings.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record RatingDetail(
        /**
         * The rating category.
         */
        ReviewRating.Category category,

        /**
         * The numerical score for this category.
         * Range: 0 to 100
         */
        Integer score,

        /**
         * Optional comment explaining the rating.
         * May be null or empty if no comment was provided.
         */
        String comment,

        /**
         * Quality level description based on the score.
         * Examples: "Exzellent", "Sehr gut", "Gut", etc.
         */
        String qualityLevel) {
    /**
     * Creates a RatingDetail from a ReviewRating entity.
     *
     * @param reviewRating the ReviewRating entity
     * @return RatingDetail with calculated quality level
     */
    public static RatingDetail from(ReviewRating reviewRating) {
        return new RatingDetail(
                reviewRating.getCategory(),
                reviewRating.getScore(),
                reviewRating.getComment(),
                reviewRating.getQualityLevel());
    }

    /**
     * Creates a RatingDetail with explicit values.
     *
     * @param category the rating category
     * @param score    the numerical score
     * @param comment  the optional comment
     * @return RatingDetail with calculated quality level
     */
    public static RatingDetail of(ReviewRating.Category category, Integer score, String comment) {
        String qualityLevel = calculateQualityLevel(score);
        return new RatingDetail(category, score, comment, qualityLevel);
    }

    /**
     * Calculates the quality level based on the score.
     *
     * @param score the numerical score
     * @return quality level description
     */
    private static String calculateQualityLevel(Integer score) {
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

    /**
     * Checks if this rating is considered positive.
     *
     * @return true if score is 70 or higher
     */
    public boolean isPositive() {
        return score != null && score >= 70;
    }

    /**
     * Checks if this rating is considered negative.
     *
     * @return true if score is below 50
     */
    public boolean isNegative() {
        return score != null && score < 50;
    }

    /**
     * Checks if a comment is provided.
     *
     * @return true if comment is not null and not empty
     */
    public boolean hasComment() {
        return comment != null && !comment.trim().isEmpty();
    }
}