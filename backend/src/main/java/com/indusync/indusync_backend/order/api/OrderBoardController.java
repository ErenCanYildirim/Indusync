package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.order.api.dto.OrderDetailResponse;
import com.indusync.indusync_backend.order.api.dto.OrderMatchResponse;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.OrderMatchingService;
import com.indusync.indusync_backend.order.application.OrderNotificationService;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.domain.OrderMatch;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * REST controller for order discovery and matching by service providers.
 * <p>
 * This controller provides endpoints for AUFTRAGNEHMER (service provider)
 * companies to:
 * - Discover available published orders in their area
 * - Filter orders by categories, location, and other criteria
 * - View detailed order information for potential matching
 * - Access pre-computed match scores for enhanced order board experience
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/order-board")
@Slf4j
@Tag(name = "Order Board", description = "Order discovery for service providers")
public class OrderBoardController extends BaseController {

    private final OrderFacadeService orderFacadeService;
    private final OrderMatchingService orderMatchingService;
    private final OrderNotificationService orderNotificationService;
    private final OrderMapper orderMapper;
    private final CompanyManagementService companyManagementService;

    public OrderBoardController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderFacadeService orderFacadeService,
            OrderMatchingService orderMatchingService,
            OrderNotificationService orderNotificationService,
            OrderMapper orderMapper,
            CompanyManagementService companyManagementService) {
        super(authHelper, responseHelper);
        this.orderFacadeService = orderFacadeService;
        this.orderMatchingService = orderMatchingService;
        this.orderNotificationService = orderNotificationService;
        this.orderMapper = orderMapper;
        this.companyManagementService = companyManagementService;
    }

    @GetMapping("/available/{orderId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "View available order details", description = "Retrieves detailed information about a specific published order for potential service providers")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Order not found or not available")
    })
    public ResponseEntity<OrderDetailResponse> getAvailableOrderDetails(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        log.info("Getting available order details for ID: {}", orderId);

        try {
            OrderResponse orderResponse = orderFacadeService.getAvailableOrderDetails(orderId, authentication);
            OrderDetailResponse response = orderMapper.toDetailResponse(orderResponse);

            response.setCompanyName(companyManagementService.findCompanyNameById(response.getCompanyId()));

            return ResponseEntity.ok(response);

        } catch (OrderFacadeService.OrderNotFoundException e) {
            log.warn("Available order not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();

        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to available order: {}", e.getMessage());
            return ResponseEntity.status(403).build();

        } catch (Exception e) {
            log.error("Error retrieving available order with ID: {}", orderId, e);
            return ResponseEntity.status(500).build();
        }
    }

    /**
     * Finds matched orders for the authenticated provider with computed scores.
     * This endpoint uses pre-computed matches for better performance and includes
     * match scores to help providers prioritize opportunities.
     */
    @GetMapping("/matches")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get matched orders with scores", description = "Retrieves orders that have been matched to the authenticated service provider with computed compatibility scores")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Matched orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied - only service providers can access")
    })
    public ResponseEntity<?> getMatchedOrders(
            @Parameter(description = "Minimum match score (0.0-1.0)") @RequestParam(defaultValue = "0.0") BigDecimal minScore,

            @Parameter(description = "Only show unviewed matches") @RequestParam(defaultValue = "false") boolean unviewedOnly,

            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,

            Authentication authentication) {

        log.info("Getting matched orders for service provider, minScore: {}, unviewedOnly: {}",
                minScore, unviewedOnly);

        try {
            // Extract company ID from authentication
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                return ResponseEntity.status(403).body("No valid company context found");
            }

            Pageable pageable = PageRequest.of(page, size,
                    Sort.by(Sort.Direction.DESC, "matchScore", "matchedAt"));

            // Get matches using the OrderMatchingService
            Page<OrderMatch> matches;

            if (unviewedOnly) {
                matches = orderMatchingService.getUnviewedMatchesForProvider(companyId, pageable);
            } else if (minScore.compareTo(BigDecimal.valueOf(0.7)) >= 0) {
                matches = orderMatchingService.getHighQualityMatchesForProvider(companyId, minScore, pageable);
            } else {
                matches = orderMatchingService.getAvailableOrdersForProvider(companyId, pageable);
            }

            // Convert to enhanced response with match scores
            Page<OrderMatchResponse> responses = matches.map(match -> toOrderMatchResponse(match, authentication));

            log.info("Found {} matched orders for provider: {}", responses.getTotalElements(), companyId);
            return ResponseEntity.ok(responses);

        } catch (Exception e) {
            log.error("Error getting matched orders", e);
            return ResponseEntity.status(500).body("Error retrieving matched orders: " + e.getMessage());
        }
    }

    /**
     * Marks an order match as viewed by the provider.
     */
    @PostMapping("/matches/{orderId}/view")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Mark order match as viewed", description = "Records that the provider has viewed this order match")
    public ResponseEntity<?> markOrderViewed(
            @PathVariable UUID orderId,
            Authentication authentication) {

        try {
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                return ResponseEntity.status(403).body("No valid company context found");
            }

            orderNotificationService.markOrderMatchViewed(orderId, companyId);
            log.info("Marked order {} as viewed by provider {}", orderId, companyId);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error marking order as viewed", e);
            return ResponseEntity.status(500).body("Error marking order as viewed");
        }
    }

    /**
     * Marks provider interest in an order match.
     */
    @PostMapping("/matches/{orderId}/interest")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Express interest in order", description = "Records that the provider is interested in this order")
    public ResponseEntity<?> expressInterest(
            @PathVariable UUID orderId,
            Authentication authentication) {

        try {
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                return ResponseEntity.status(403).body("No valid company context found");
            }

            orderNotificationService.markProviderInterest(orderId, companyId);
            log.info("Marked provider {} as interested in order {}", companyId, orderId);

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error expressing interest in order", e);
            return ResponseEntity.status(500).body("Error expressing interest");
        }
    }

    // === Helper Methods ===

    /**
     * Extracts company ID from authentication context.
     */
    private UUID getCurrentCompanyIdFromAuthentication(Authentication authentication) {
        return getCurrentCompanyId(authentication);
    }

    /**
     * Extracts JWT token from authentication.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }

    /**
     * Converts OrderMatch to OrderMatchResponse with order details.
     */
    private OrderMatchResponse toOrderMatchResponse(OrderMatch match, Authentication authentication) {
        try {
            // Get order details with authentication context
            OrderResponse orderResponse = orderFacadeService.getOrder(match.getOrderId(), authentication);

            // Create detail response
            OrderDetailResponse detailResponse = orderMapper.toDetailResponse(orderResponse);

            // Fetch and set a company name
            if (orderResponse.companyId() != null) {
                detailResponse.setCompanyName(companyManagementService.findCompanyNameById(orderResponse.companyId()));
            }

            return OrderMatchResponse.builder()
                    .orderId(match.getOrderId())
                    .order(detailResponse)
                    .matchScore(match.getMatchScore())
                    .matchScorePercentage(match.getMatchScorePercentage())
                    .distanceKm(match.getDistanceKm())
                    .industryScore(match.getIndustryScore())
                    .skillsScore(match.getSkillsScore())
                    .contractScore(match.getContractScore())
                    .certificatesScore(match.getCertificatesScore())
                    .verificationScore(match.getVerificationScore())
                    .radiusScore(match.getRadiusScore())
                    .matchedAt(match.getMatchedAt())
                    .viewed(match.getViewedAt() != null)
                    .viewedAt(match.getViewedAt())
                    .interested(match.getInterested())
                    .accepted(match.getAccepted())
                    .acceptedAt(match.getAcceptedAt())
                    .respondedAt(match.getRespondedAt())
                    .isHighQuality(match.isHighQualityMatch())
                    .build();
        } catch (Exception e) {
            log.error("Error converting OrderMatch to response for order: {}", match.getOrderId(), e);
            // Return a minimal response if order details can't be loaded
            return OrderMatchResponse.builder()
                    .orderId(match.getOrderId())
                    .matchScore(match.getMatchScore())
                    .matchScorePercentage(match.getMatchScorePercentage())
                    .distanceKm(match.getDistanceKm())
                    .matchedAt(match.getMatchedAt())
                    .viewed(match.getViewedAt() != null)
                    .interested(match.getInterested())
                    .isHighQuality(match.isHighQualityMatch())
                    .build();
        }
    }
}