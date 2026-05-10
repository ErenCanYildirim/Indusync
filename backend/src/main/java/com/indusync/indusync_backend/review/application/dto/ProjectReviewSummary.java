package com.indusync.indusync_backend.review.application.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a project review summary for display in company profile.
 * Contains essential information about completed projects with ratings and
 * company role context.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record ProjectReviewSummary(
        /**
         * Unique identifier of the order/project.
         */
        UUID orderId,

        /**
         * Name/title of the project.
         */
        String projectName,

        /**
         * Date when the project was completed.
         */
        LocalDateTime completionDate,

        /**
         * Overall rating for this project.
         * Average of all category ratings for this specific order.
         * Range: 0.0 to 100.0
         */
        Double overallRating,

        /**
         * Role of the company being viewed in this project.
         * CLIENT if they created the order, PROVIDER if they fulfilled it.
         */
        CompanyRole companyRole,

        /**
         * Current status of the project.
         * Should typically be "COMPLETED" for projects shown in reviews.
         */
        String status,

        /**
         * ID of the company that provided the review.
         * This is the reviewer, not the reviewee.
         */
        UUID reviewerCompanyId,

        /**
         * Name of the company that provided the review.
         * This is the reviewer, not the reviewee.
         */
        String reviewerCompanyName) {
    /**
     * Creates a ProjectReviewSummary for a company acting as CLIENT.
     *
     * @param orderId             the order ID
     * @param projectName         the project name
     * @param completionDate      the completion date
     * @param overallRating       the overall rating
     * @param status              the project status
     * @param reviewerCompanyId   the reviewer company ID
     * @param reviewerCompanyName the reviewer company name
     * @return ProjectReviewSummary with CLIENT role
     */
    public static ProjectReviewSummary forClient(UUID orderId, String projectName,
            LocalDateTime completionDate, Double overallRating,
            String status, UUID reviewerCompanyId,
            String reviewerCompanyName) {
        return new ProjectReviewSummary(orderId, projectName, completionDate, overallRating,
                CompanyRole.CLIENT, status, reviewerCompanyId, reviewerCompanyName);
    }

    /**
     * Creates a ProjectReviewSummary for a company acting as PROVIDER.
     *
     * @param orderId             the order ID
     * @param projectName         the project name
     * @param completionDate      the completion date
     * @param overallRating       the overall rating
     * @param status              the project status
     * @param reviewerCompanyId   the reviewer company ID
     * @param reviewerCompanyName the reviewer company name
     * @return ProjectReviewSummary with PROVIDER role
     */
    public static ProjectReviewSummary forProvider(UUID orderId, String projectName,
            LocalDateTime completionDate, Double overallRating,
            String status, UUID reviewerCompanyId,
            String reviewerCompanyName) {
        return new ProjectReviewSummary(orderId, projectName, completionDate, overallRating,
                CompanyRole.PROVIDER, status, reviewerCompanyId, reviewerCompanyName);
    }
}