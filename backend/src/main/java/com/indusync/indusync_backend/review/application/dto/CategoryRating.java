package com.indusync.indusync_backend.review.application.dto;

import com.indusync.indusync_backend.review.domain.ReviewRating;

/**
 * DTO representing individual category rating information for company ratings
 * display.
 * Contains aggregated rating data for a specific category across multiple
 * reviews.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record CategoryRating(
        ReviewRating.Category category,

        Double averageScore,

        Integer reviewCount,

        String qualityLevel) {
    /**
     * Creates a CategoryRating with calculated quality level.
     *
     * @param category     the rating category
     * @param averageScore the average score for this category
     * @param reviewCount  the number of reviews for this category
     * @return CategoryRating with appropriate quality level
     */
    public static CategoryRating of(ReviewRating.Category category, Double averageScore, Integer reviewCount) {
        String qualityLevel = calculateQualityLevel(averageScore);
        return new CategoryRating(category, averageScore, reviewCount, qualityLevel);
    }

    /**
     * Calculates the quality level based on the average score.
     *
     * @param score the average score
     * @return quality level description
     */
    private static String calculateQualityLevel(Double score) {
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
}