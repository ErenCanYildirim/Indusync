package com.indusync.indusync_backend.review.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO representing comprehensive review details for a specific order.
 * Contains all reviews (bidirectional if available) for detailed review page display.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record OrderReviewDetails(
        /**
         * Unique identifier of the order.
         */
        UUID orderId,

        /**
         * Name/title of the project/order.
         */
        String projectName,

        /**
         * Date when the project was completed.
         */
        LocalDateTime completionDate,

        /**
         * List of all reviews for this order.
         * May include bidirectional reviews (client reviewing provider and vice versa).
         * Typically contains 1-2 reviews per order.
         */
        List<DetailedReview> reviews
) {
    /**
     * Creates OrderReviewDetails with a single review.
     *
     * @param orderId        the order ID
     * @param projectName    the project name
     * @param completionDate the completion date
     * @param review         the single review
     * @return OrderReviewDetails with single review
     */
    public static OrderReviewDetails withSingleReview(UUID orderId, String projectName,
                                                    LocalDateTime completionDate, DetailedReview review) {
        return new OrderReviewDetails(orderId, projectName, completionDate, List.of(review));
    }

    /**
     * Creates OrderReviewDetails with multiple reviews.
     *
     * @param orderId        the order ID
     * @param projectName    the project name
     * @param completionDate the completion date
     * @param reviews        the list of reviews
     * @return OrderReviewDetails with multiple reviews
     */
    public static OrderReviewDetails withMultipleReviews(UUID orderId, String projectName,
                                                       LocalDateTime completionDate, List<DetailedReview> reviews) {
        return new OrderReviewDetails(orderId, projectName, completionDate, reviews);
    }

    /**
     * Creates empty OrderReviewDetails for orders with no reviews.
     *
     * @param orderId        the order ID
     * @param projectName    the project name
     * @param completionDate the completion date
     * @return OrderReviewDetails with empty review list
     */
    public static OrderReviewDetails empty(UUID orderId, String projectName, LocalDateTime completionDate) {
        return new OrderReviewDetails(orderId, projectName, completionDate, List.of());
    }

    /**
     * Checks if this order has any reviews.
     *
     * @return true if reviews list is not empty
     */
    public boolean hasReviews() {
        return !reviews.isEmpty();
    }

    /**
     * Gets the number of reviews for this order.
     *
     * @return count of reviews
     */
    public int getReviewCount() {
        return reviews.size();
    }

    /**
     * Checks if this order has bidirectional reviews.
     * Bidirectional means both client and provider reviewed each other.
     *
     * @return true if there are reviews for both CLIENT and PROVIDER roles
     */
    public boolean hasBidirectionalReviews() {
        if (reviews.size() < 2) {
            return false;
        }

        boolean hasClientReview = reviews.stream()
                .anyMatch(review -> review.revieweeRole() == CompanyRole.CLIENT);
        boolean hasProviderReview = reviews.stream()
                .anyMatch(review -> review.revieweeRole() == CompanyRole.PROVIDER);

        return hasClientReview && hasProviderReview;
    }

    /**
     * Gets reviews where the specified company was the reviewee.
     *
     * @param companyId the company ID to filter by
     * @return list of reviews where the company was reviewed
     */
    public List<DetailedReview> getReviewsForCompany(UUID companyId) {
        return reviews.stream()
                .filter(review -> review.revieweeCompanyId().equals(companyId))
                .toList();
    }

    /**
     * Gets reviews where the specified company was the reviewer.
     *
     * @param companyId the company ID to filter by
     * @return list of reviews submitted by the company
     */
    public List<DetailedReview> getReviewsByCompany(UUID companyId) {
        return reviews.stream()
                .filter(review -> review.reviewerCompanyId().equals(companyId))
                .toList();
    }

    /**
     * Calculates the average overall rating across all reviews for this order.
     *
     * @return average overall rating, or null if no reviews have ratings
     */
    public Double getAverageOverallRating() {
        if (reviews.isEmpty()) {
            return null;
        }

        double sum = reviews.stream()
                .map(DetailedReview::getOverallRating)
                .filter(rating -> rating != null)
                .mapToDouble(Double::doubleValue)
                .sum();

        long count = reviews.stream()
                .map(DetailedReview::getOverallRating)
                .filter(rating -> rating != null)
                .count();

        return count > 0 ? sum / count : null;
    }
}