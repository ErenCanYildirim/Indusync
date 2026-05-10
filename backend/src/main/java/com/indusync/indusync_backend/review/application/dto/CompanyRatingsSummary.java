package com.indusync.indusync_backend.review.application.dto;

import com.indusync.indusync_backend.review.domain.ReviewRating;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * DTO representing comprehensive company ratings summary for display on company
 * profile.
 * Contains overall rating, category breakdowns, and recent project information.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record CompanyRatingsSummary(
        /**
         * Unique identifier of the company being rated.
         */
        UUID companyId,

        /**
         * Overall average rating across all categories and reviews.
         * Calculated as the average of all category averages.
         * Range: 0.0 to 100.0, null if no reviews exist.
         */
        Double overallRating,

        /**
         * Total number of reviews received by this company.
         * Includes reviews from both CLIENT and PROVIDER roles.
         */
        Integer totalReviews,

        /**
         * Total number of completed orders where this company participated.
         * Includes orders where company acted as both client and provider.
         */
        Integer completedOrders,

        /**
         * Map of category ratings showing performance in each area.
         * Key: ReviewRating.Category, Value: CategoryRating with averages and counts.
         */
        Map<ReviewRating.Category, CategoryRating> categoryRatings,

        /**
         * List of recent completed projects with their ratings.
         * Limited to most recent projects for summary display.
         * Typically shows 3-5 most recent projects.
         */
        List<ProjectReviewSummary> recentProjects) {
    /**
     * Creates a CompanyRatingsSummary with calculated overall rating.
     *
     * @param companyId       the company ID
     * @param totalReviews    total number of reviews
     * @param completedOrders total number of completed orders
     * @param categoryRatings map of category ratings
     * @param recentProjects  list of recent projects
     * @return CompanyRatingsSummary with calculated overall rating
     */
    public static CompanyRatingsSummary of(UUID companyId, Integer totalReviews, Integer completedOrders,
            Map<ReviewRating.Category, CategoryRating> categoryRatings,
            List<ProjectReviewSummary> recentProjects) {
        Double overallRating = calculateOverallRating(categoryRatings);
        return new CompanyRatingsSummary(companyId, overallRating, totalReviews, completedOrders,
                categoryRatings, recentProjects);
    }

    /**
     * Creates an empty CompanyRatingsSummary for companies with no reviews.
     *
     * @param companyId the company ID
     * @return CompanyRatingsSummary with zero values and empty collections
     */
    public static CompanyRatingsSummary empty(UUID companyId) {
        return new CompanyRatingsSummary(companyId, null, 0, 0, Map.of(), List.of());
    }

    /**
     * Calculates the overall rating as the average of all category averages.
     *
     * @param categoryRatings map of category ratings
     * @return overall rating or null if no categories have ratings
     */
    private static Double calculateOverallRating(Map<ReviewRating.Category, CategoryRating> categoryRatings) {
        if (categoryRatings.isEmpty()) {
            return null;
        }

        double sum = categoryRatings.values().stream()
                .filter(rating -> rating.averageScore() != null)
                .mapToDouble(CategoryRating::averageScore)
                .sum();

        long count = categoryRatings.values().stream()
                .filter(rating -> rating.averageScore() != null)
                .count();

        return count > 0 ? sum / count : null;
    }

    /**
     * Checks if the company has any reviews.
     *
     * @return true if totalReviews is greater than 0
     */
    public boolean hasReviews() {
        return totalReviews != null && totalReviews > 0;
    }

    /**
     * Gets the quality level description for the overall rating.
     *
     * @return quality level string
     */
    public String getOverallQualityLevel() {
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
}