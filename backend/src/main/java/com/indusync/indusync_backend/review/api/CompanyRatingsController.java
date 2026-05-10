package com.indusync.indusync_backend.review.api;

import com.indusync.indusync_backend.review.application.CompanyRatingsService;
import com.indusync.indusync_backend.review.application.dto.CompanyRatingsSummary;
import com.indusync.indusync_backend.review.application.dto.OrderReviewDetails;
import com.indusync.indusync_backend.review.application.dto.ProjectReviewSummary;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for company ratings and reviews endpoints.
 * Provides public access to company rating summaries, project reviews, and
 * detailed review information.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1")
@Slf4j
public class CompanyRatingsController extends BaseController {

    private final CompanyRatingsService companyRatingsService;

    public CompanyRatingsController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            CompanyRatingsService companyRatingsService) {
        super(authHelper, responseHelper);
        this.companyRatingsService = companyRatingsService;
    }

     /**
     * Get comprehensive company ratings summary.
     * Returns overall rating, category breakdowns, and recent projects.
     * 
     * @param companyId      the company ID to get ratings for
     * @param authentication optional authentication context
     * @return CompanyRatingsSummary with ratings and recent projects
     */
    @GetMapping("/companies/{companyId}/ratings")
    public ResponseEntity<?> getCompanyRatings(
        @PathVariable UUID companyId,
        Authentication authentication 
    ) {
        String requestPath = getCurrentRequestPath();
        log.info("Getting company ratings for company: {}", companyId);

        try {
            //validate company ID
            if (companyId == null) {
                log.warn("Invalid company ID provided: null");
                return handleBadRequest("Ungültige Unternehmens-ID", requestPath);
            }

            //get company ratings summary
            CompanyRatingsSummary ratingsSummary = companyRatingsService.getCompanyRatingsSummary(companyId);

            if (ratingsSummary == null) {
                log.warn("Company ratings summary not found for company: {}", companyId);
                return handleNotFound("Unternehmensbewertungen nicht gefunden", requestPath);
            }

            log.info("Successfully retrieved ratings for company: {} - {} reviews",
                    companyId, ratingsSummary.totalReviews());

            return ResponseEntity.ok(ratingsSummary);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for company ratings: {}", e.getMessage());
            return handleBadRequest("Ungültige Anfrage: " + e.getMessage(), requestPath);
        } catch (Exception e) {
            log.error("Error retrieving company ratings for company: {}", companyId, e);
            return handleInternalServerError("Fehler beim Abrufen der Unternehmensbewertungen", requestPath);
        }
    }

    /**
     * Get a paginated list of completed projects with ratings for a company.
     * Returns project summaries with ratings and company role context.
     * 
     * @param companyId      the company ID to get project reviews for
     * @param page           page number (0-based, default: 0)
     * @param size           page size (default: 10, max: 50)
     * @param authentication optional authentication context
     * @return paginated list of ProjectReviewSummary
     */
    @GetMapping("/companies/{companyId}/project-reviews")
    public ResponseEntity<?> getCompanyProjectReviews(
            @PathVariable UUID companyId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        String requestPath = getCurrentRequestPath();
        log.info("Getting project reviews for company: {} - page: {}, size: {}", companyId, page, size);

        try {
            // Validate company ID
            if (companyId == null) {
                log.warn("Invalid company ID provided: null");
                return handleBadRequest("Ungültige Unternehmens-ID", requestPath);
            }

            // Validate pagination parameters
            if (page < 0) {
                log.warn("Invalid page number: {}", page);
                return handleBadRequest("Seitenzahl muss größer oder gleich 0 sein", requestPath);
            }

            if (size < 1 || size > 50) {
                log.warn("Invalid page size: {}", size);
                return handleBadRequest("Seitengröße muss zwischen 1 und 50 liegen", requestPath);
            }

            // Get paginated project reviews
            Page<ProjectReviewSummary> projectReviews = companyRatingsService.getCompanyProjectReviews(
                    companyId, page, size);

            log.info("Successfully retrieved {} project reviews for company: {} (page {}/{})",
                    projectReviews.getNumberOfElements(), companyId, page + 1, projectReviews.getTotalPages());

            return ResponseEntity.ok(projectReviews);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for project reviews: {}", e.getMessage());
            return handleBadRequest("Ungültige Anfrage: " + e.getMessage(), requestPath);
        } catch (Exception e) {
            log.error("Error retrieving project reviews for company: {}", companyId, e);
            return handleInternalServerError("Fehler beim Abrufen der Projektbewertungen", requestPath);
        }
    }

    /**
     * Get detailed review information for a specific order.
     * Returns comprehensive review details including all bidirectional reviews.
     * 
     * @param orderId        the order ID to get detailed reviews for
     * @param authentication optional authentication context
     * @return OrderReviewDetails with all reviews for the order
     */
    @GetMapping("/orders/{orderId}/reviews")
    public ResponseEntity<?> getOrderReviewDetails(
            @PathVariable UUID orderId,
            Authentication authentication) {

        String requestPath = getCurrentRequestPath();
        log.info("Getting order review details for order: {}", orderId);

        try {
            // Validate order ID
            if (orderId == null) {
                log.warn("Invalid order ID provided: null");
                return handleBadRequest("Ungültige Auftrags-ID", requestPath);
            }

            // Get detailed review information
            OrderReviewDetails reviewDetails = companyRatingsService.getOrderReviewDetails(orderId);

            if (reviewDetails == null) {
                log.warn("Order review details not found for order: {}", orderId);
                return handleNotFound("Auftragsbewertungen nicht gefunden", requestPath);
            }

            log.info("Successfully retrieved review details for order: {} - {} reviews",
                    orderId, reviewDetails.getReviewCount());

            return ResponseEntity.ok(reviewDetails);

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for order review details: {}", e.getMessage());
            return handleBadRequest("Ungültige Anfrage: " + e.getMessage(), requestPath);
        } catch (Exception e) {
            log.error("Error retrieving order review details for order: {}", orderId, e);
            return handleInternalServerError("Fehler beim Abrufen der Auftragsbewertungen", requestPath);
        }
    }
}