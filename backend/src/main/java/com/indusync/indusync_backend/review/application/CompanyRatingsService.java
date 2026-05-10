package com.indusync.indusync_backend.review.application;

import com.indusync.indusync_backend.review.application.dto.*;
import com.indusync.indusync_backend.review.domain.*;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.company.application.CompanyManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


/**
 * Service for calculating and retrieving company ratings and reviews.
 * <p>
 * This service provides functionality for:
 * - Calculating overall company ratings from bidirectional reviews
 * - Retrieving paginated project reviews for companies
 * - Getting detailed review information for specific orders
 * - Handling edge cases like no reviews or missing data
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class CompanyRatingsService {

    private final ReviewRepository reviewRepository;
    private final OrderFacadeService orderFacadeService;
    private final CompanyManagementService companyManagementService;

    /**
     * Calculates and returns comprehensive company ratings summary.
     * Aggregates reviews where the company acted as both client and provider.
     *
     * @param companyId the company ID to calculate ratings for
     * @return CompanyRatingsSummary with overall and category ratings
     */
    public CompanyRatingsSummary getCompanyRatingsSummary(UUID companyId) {
        log.info("Calculating company ratings summary for company: {}", companyId);

        try {
            // Get all reviews where this company is the reviewee
            List<Review> companyReviews = getCompanyReviews(companyId);

            if (companyReviews.isEmpty()) {
                log.info("No reviews found for company: {}", companyId);
                return CompanyRatingsSummary.empty(companyId);
            }

            // Calculate category averages
            Map<ReviewRating.Category, CategoryRating> categoryRatings = calculateCategoryAverages(companyReviews);

            // Get completed orders count
            int completedOrders = getCompletedOrdersCount(companyId);

            // Get recent projects (limit to 5 most recent)
            List<ProjectReviewSummary> recentProjects = getRecentProjectReviews(companyId, 5);

            log.info("Calculated ratings for company: {} - {} reviews, {} completed orders",
                    companyId, companyReviews.size(), completedOrders);

            return CompanyRatingsSummary.of(
                    companyId,
                    companyReviews.size(),
                    completedOrders,
                    categoryRatings,
                    recentProjects);

        } catch (Exception e) {
            log.error("Error calculating company ratings summary for company: {}", companyId, e);
            return CompanyRatingsSummary.empty(companyId);
        }
    }

    /**
     * Retrieves paginated list of completed projects with ratings for a company.
     *
     * @param companyId the company ID
     * @param page      page number (0-based)
     * @param size      page size
     * @return paginated list of ProjectReviewSummary
     */
    public Page<ProjectReviewSummary> getCompanyProjectReviews(UUID companyId, int page, int size) {
        log.info("Getting project reviews for company: {} - page: {}, size: {}", companyId, page, size);

        try {
            Pageable pageable = PageRequest.of(page, size);

            // Get all reviews for this company with pagination
            List<Review> allReviews = getCompanyReviews(companyId);

            // Group reviews by order ID and convert to project summaries
            Map<UUID, List<Review>> reviewsByOrder = allReviews.stream()
                    .collect(Collectors.groupingBy(Review::getOrderId));

            List<ProjectReviewSummary> projectSummaries = new ArrayList<>();

            for (Map.Entry<UUID, List<Review>> entry : reviewsByOrder.entrySet()) {
                UUID orderId = entry.getKey();
                List<Review> orderReviews = entry.getValue();

                try {
                    // Get order details
                    OrderResponse order = orderFacadeService.getOrder(orderId);

                    // Find the review for this company (where company is reviewee)
                    Review companyReview = orderReviews.stream()
                            .filter(review -> review.getRevieweeCompanyId().equals(companyId))
                            .findFirst()
                            .orElse(null);

                    if (companyReview != null) {
                        ProjectReviewSummary summary = createProjectReviewSummary(order, companyReview, companyId);
                        projectSummaries.add(summary);
                    }

                } catch (Exception e) {
                    log.warn("Error processing order {} for company {}: {}", orderId, companyId, e.getMessage());
                    // Continue processing other orders
                }
            }

            // Sort by completion date (most recent first)
            projectSummaries.sort((a, b) -> b.completionDate().compareTo(a.completionDate()));

            // Apply pagination manually
            int start = page * size;
            int end = Math.min(start + size, projectSummaries.size());
            List<ProjectReviewSummary> pageContent = start < projectSummaries.size()
                    ? projectSummaries.subList(start, end)
                    : Collections.emptyList();

            return new org.springframework.data.domain.PageImpl<>(
                    pageContent, pageable, projectSummaries.size());

        } catch (Exception e) {
            log.error("Error getting project reviews for company: {}", companyId, e);
            return Page.empty(PageRequest.of(page, size));
        }
    }

    /**
     * Retrieves detailed review information for a specific order.
     *
     * @param orderId the order ID
     * @return OrderReviewDetails with all reviews for the order
     */
    public OrderReviewDetails getOrderReviewDetails(UUID orderId) {
        log.info("Getting order review details for order: {}", orderId);

        try {
            // Get order details
            OrderResponse order = orderFacadeService.getOrder(orderId);

            List<Review> orderReviews = reviewRepository.findByOrderId(orderId);

            if (orderReviews.isEmpty()) {
                log.info("No reviews found for order: {}", orderId);
                return OrderReviewDetails.empty(orderId, order.title(), order.completedAt());
            }

            // convert reviews to detailed review DTOs
             List<DetailedReview> detailedReviews = orderReviews.stream()
                    .map(this::convertToDetailedReview)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            log.info("Found {} reviews for order: {}", detailedReviews.size(), orderId);

            return OrderReviewDetails.withMultipleReviews(
                    orderId,
                    order.title(),
                    order.completedAt(),
                    detailedReviews);

        } catch (Exception e) {
            log.error("Error getting order review details for order: {}", orderId, e);
            // Return empty details with minimal information
            return OrderReviewDetails.empty(orderId, "Unknown Project", LocalDateTime.now());
        }
    }

    /**
     * Gets all reviews where the specified company is the reviewee.
     * This includes reviews from both CLIENT and PROVIDER roles.
     *
     * @param companyId the company ID
     * @return list of reviews where company is reviewee
     */
    private List<Review> getCompanyReviews(UUID companyId) {
        return reviewRepository.findByRevieweeCompanyId(companyId);
    }

     /**
     * Calculates category averages from a list of reviews.
     *
     * @param reviews list of reviews to calculate averages from
     * @return map of category ratings with averages and counts
     */
    private Map<ReviewRating.Category, CategoryRating> calculateCategoryAverages(List<Review> reviews) {
        Map<ReviewRating.Category, CategoryRating> categoryRatings = new EnumMap<>(ReviewRating.Category.class);

        // Initialize all categories
        for (ReviewRating.Category category : ReviewRating.Category.values()) {
            List<Integer> scores = new ArrayList<>();

            // Collect all scores for this category across all reviews
            for (Review review : reviews) {
                if (review.getRatings() != null) {
                    review.getRatings().stream()
                            .filter(rating -> rating.getCategory() == category)
                            .filter(rating -> rating.getScore() != null)
                            .forEach(rating -> scores.add(rating.getScore()));
                }
            }

            // Calculate average if we have scores
            if (!scores.isEmpty()) {
                double average = scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
                categoryRatings.put(category, CategoryRating.of(category, average, scores.size()));
            } else {
                // No ratings for this category
                categoryRatings.put(category, CategoryRating.of(category, null, 0));
            }
        }

        return categoryRatings;
    }

    /**
     * Gets the count of completed orders for a company.
     * This includes orders where the company acted as both client and provider.
     *
     * @param companyId the company ID
     * @return count of completed orders
     */
    private int getCompletedOrdersCount(UUID companyId) {
        try {
            List<UUID> completedOrderIds = reviewRepository.findCompletedOrdersByCompanyId(companyId);
            return completedOrderIds.size();
        } catch (Exception e) {
            log.warn("Error counting completed orders for company: {}", companyId, e);
            return 0;
        }
    }

    /**
     * Gets recent project reviews for a company (limited number).
     *
     * @param companyId the company ID
     * @param limit     maximum number of recent projects to return
     * @return list of recent project review summaries
     */
    private List<ProjectReviewSummary> getRecentProjectReviews(UUID companyId, int limit) {
        try {
            List<Review> companyReviews = getCompanyReviews(companyId);

            // Group by order and get the most recent reviews
            Map<UUID, Review> latestReviewsByOrder = companyReviews.stream()
                    .collect(Collectors.toMap(
                            Review::getOrderId,
                            review -> review,
                            (existing, replacement) -> existing.getCreatedAt().isAfter(replacement.getCreatedAt())
                                    ? existing
                                    : replacement));

            List<ProjectReviewSummary> recentProjects = new ArrayList<>();

            for (Review review : latestReviewsByOrder.values()) {
                try {
                    OrderResponse order = orderFacadeService.getOrder(review.getOrderId());
                    ProjectReviewSummary summary = createProjectReviewSummary(order, review, companyId);
                    recentProjects.add(summary);
                } catch (Exception e) {
                    log.warn("Error processing recent project for order: {}", review.getOrderId(), e);
                }
            }

            // Sort by completion date and limit
            return recentProjects.stream()
                    .sorted((a, b) -> b.completionDate().compareTo(a.completionDate()))
                    .limit(limit)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            log.warn("Error getting recent project reviews for company: {}", companyId, e);
            return Collections.emptyList();
        }
    }

    /**
     * Creates a ProjectReviewSummary from order and review data.
     *
     * @param order     the order response
     * @param review    the review
     * @param companyId the company ID being reviewed
     * @return ProjectReviewSummary
     */
    private ProjectReviewSummary createProjectReviewSummary(OrderResponse order, Review review, UUID companyId) {
        // Determine company role
        CompanyRole companyRole = determineCompanyRole(order, companyId);

        // Calculate the overall rating for this review
        Double overallRating = calculateReviewOverallRating(review);

        // Get a reviewer company name
        String reviewerCompanyName = companyManagementService.getCompanyName(review.getReviewerCompanyId());

        return new ProjectReviewSummary(
                order.id(),
                order.title(),
                order.completedAt() != null ? order.completedAt() : order.updatedAt(),
                overallRating,
                companyRole,
                order.status() != null ? order.status().name() : "UNKNOWN",
                review.getReviewerCompanyId(),
                reviewerCompanyName);
    }

    /**
     * Determines the role of a company in an order.
     *
     * @param order     the order
     * @param companyId the company ID
     * @return CompanyRole (CLIENT or PROVIDER)
     */
    private CompanyRole determineCompanyRole(OrderResponse order, UUID companyId) {
        if (companyId.equals(order.companyId())) {
            return CompanyRole.CLIENT;
        } else if (companyId.equals(order.providerId())) {
            return CompanyRole.PROVIDER;
        } else {
            // Fallback - this shouldn't happen in normal cases
            log.warn("Company {} is neither client nor provider for order {}", companyId, order.id());
            return CompanyRole.CLIENT;
        }
    }

     /**
     * Calculates the overall rating for a single review.
     *
     * @param review the review
     * @return overall rating or null if no ratings
     */
    private Double calculateReviewOverallRating(Review review) {
        if (review.getRatings() == null || review.getRatings().isEmpty()) {
            return null;
        }

        List<Integer> scores = review.getRatings().stream()
                .map(ReviewRating::getScore)
                .filter(Objects::nonNull)
                .toList();

        if (scores.isEmpty()) {
            return null;
        }

        return scores.stream().mapToInt(Integer::intValue).average().orElse(0.0);
    }

    /**
     * Converts a Review entity to a DetailedReview DTO.
     *
     * @param review the review entity
     * @return DetailedReview DTO or null if conversion fails
     */
    private DetailedReview convertToDetailedReview(Review review) {
        try {
            // Get company names
            String reviewerCompanyName = companyManagementService.getCompanyName(review.getReviewerCompanyId());
            String revieweeCompanyName = companyManagementService.getCompanyName(review.getRevieweeCompanyId());

            // Determine reviewee role
            CompanyRole revieweeRole = determineRevieweeRole(review);

            // Convert ratings to RatingDetail map
            Map<ReviewRating.Category, RatingDetail> ratingDetails = new EnumMap<>(ReviewRating.Category.class);

            if (review.getRatings() != null) {
                for (ReviewRating rating : review.getRatings()) {
                    ratingDetails.put(rating.getCategory(), RatingDetail.from(rating));
                }
            }

            return new DetailedReview(
                    review.getId(),
                    review.getReviewerCompanyId(),
                    reviewerCompanyName,
                    review.getRevieweeCompanyId(),
                    revieweeCompanyName,
                    revieweeRole,
                    review.getCreatedAt(),
                    ratingDetails);

        } catch (Exception e) {
            log.error("Error converting review to DetailedReview: {}", review.getId(), e);
            return null;
        }
    }

    /**
     * Determines the role of the reviewee company based on the order context.
     *
     * @param review the review
     * @return CompanyRole of the reviewee
     */
    private CompanyRole determineRevieweeRole(Review review) {
        try {
            OrderResponse order = orderFacadeService.getOrder(review.getOrderId());
            return determineCompanyRole(order, review.getRevieweeCompanyId());
        } catch (Exception e) {
            log.warn("Error determining reviewee role for review: {}, defaulting to CLIENT", review.getId(), e);
            // Default to CLIENT if we can't determine the role
            return CompanyRole.CLIENT;
        }
    }
}

