package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.company.api.dto.CompanyDetailResponse;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.order.api.dto.CompanyMatchResponse;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.OrderMatchingService;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.UUID;

/**
 * REST controller for order matching and provider selection operations.
 * 
 * This controller handles:
 * - Provider acceptance of orders
 * - Client confirmation of provider selection
 * - Retrieving matched providers for orders
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/orders")
@Slf4j
@Tag(name = "Order Matching", description = "Order matching and provider selection operations")
public class OrderMatchingController extends BaseController {

    private final OrderFacadeService orderFacadeService;
    private final OrderMatchingService orderMatchingService;
    private final CompanyRepository companyRepository;

    public OrderMatchingController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderFacadeService orderFacadeService,
            OrderMatchingService orderMatchingService,
            CompanyRepository companyRepository) {
        super(authHelper, responseHelper);
        this.orderFacadeService = orderFacadeService;
        this.orderMatchingService = orderMatchingService;
        this.companyRepository = companyRepository;
    }

    /**
     * Provider accepts an order, signalling willingness to execute it.
     */
    @PostMapping("/{orderId}/accept")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Provider accepts order", description = "Provider company signals acceptance of the order (awaits client confirmation)")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "202", description = "Acceptance recorded"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Order or match not found")
    })
    public ResponseEntity<?> acceptOrderAsProvider(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        try {
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                return ResponseEntity.status(403).body("No valid company context found");
            }

            orderFacadeService.acceptByProvider(orderId, companyId);
            return ResponseEntity.status(202).build();

        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (OrderFacadeService.ValidationException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Client selects a provider for the order – final confirmation step.
     */
    @PostMapping("/{orderId}/provider-selection")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Client selects provider", description = "Client company confirms a provider for its order, transitioning it to IN_PROGRESS")
    public ResponseEntity<?> confirmProviderSelection(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            @RequestParam UUID providerId,
            Authentication authentication) {

        try {
            UUID clientCompanyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (clientCompanyId == null) {
                return ResponseEntity.status(403).body("No valid company context found");
            }

            orderFacadeService.confirmProviderSelection(orderId, providerId, clientCompanyId);
            return ResponseEntity.ok().build();

        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (OrderFacadeService.ValidationException | OrderFacadeService.UnauthorizedAccessException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Get matched providers for an order.
     */
    @GetMapping("/{orderId}/matches")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get matched providers for order", description = "Retrieves the list of service provider companies that the matching algorithm has identified for this order. Accessible only to the company that created the order.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Matched providers retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<?> getOrderProviderMatches(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "matchScore,desc") String sort,
            Authentication authentication) {

        log.info("Fetching provider matches for order: {} page:{} size:{} sort:{}", orderId, page, size, sort);
        try {
            // Ensure the requesting company owns this order
            var token = getTokenFromAuthentication(authentication);
            if (token == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Authentication token missing");
            }
            UUID currentCompanyId = null;
            try {
                currentCompanyId = getCurrentCompanyId(authentication);
            } catch (Exception e) {
                log.error("Error extracting company ID from token", e);
            }
            if (currentCompanyId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("No valid company context found");
            }

            // Retrieve order (includes authorization – but also need to ensure ownership)
            var orderResponse = orderFacadeService.getOrder(orderId, authentication);
            if (!currentCompanyId.equals(orderResponse.companyId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("You are not allowed to view matches for this order");
            }

            // Parse sort parameter
            Sort sortObj = parseSortParameter(sort);
            Pageable pageable = PageRequest.of(page, size, sortObj);

            // Fetch matches (paginated)
            Page<OrderMatch> matchesPage = orderMatchingService.getOrderMatches(orderId, pageable);
            Page<CompanyMatchResponse> responses = matchesPage.map(this::toCompanyMatchResponse);

            log.info("Returning {} provider matches (page {}/{}) for order {}", responses.getTotalElements(), page,
                    responses.getTotalPages(), orderId);

            // Create ApiResponse wrapper to match frontend expectations
            var apiResponse = new HashMap<String, Object>();
            apiResponse.put("data", responses.getContent());
            apiResponse.put("page", responses.getNumber());
            apiResponse.put("size", responses.getSize());
            apiResponse.put("totalElements", responses.getTotalElements());
            apiResponse.put("totalPages", responses.getTotalPages());
            apiResponse.put("first", responses.isFirst());
            apiResponse.put("last", responses.isLast());

            return ResponseEntity.ok(apiResponse);

        } catch (OrderFacadeService.OrderNotFoundException e) {
            log.warn("Order not found when fetching matches: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access when fetching matches: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error fetching provider matches for order {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving provider matches");
        }
    }

    /**
     * Get companies that have expressed interest in the order.
     * Accessible only to the company that created the order.
     */
    @GetMapping("/{orderId}/interested-providers")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get interested providers for order", description = "Returns the list of matched providers that have expressed interest in this order. Visible only to the owning company.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Interested providers retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<?> getInterestedProviders(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        try {
            var matches = orderFacadeService.getInterestedProviders(orderId, authentication);
            // Map to CompanyMatchResponse (same shape as matches endpoint)
            var responses = matches.stream().map(this::toCompanyMatchResponse).toList();

            var body = new java.util.HashMap<String, Object>();
            body.put("data", responses);
            body.put("totalElements", responses.size());
            return ResponseEntity.ok(body);
        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            log.error("Error fetching interested providers for order {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving interested providers");
        }
    }

    // === Helper Methods ===

    /**
     * Parses the sort parameter string into a Spring Data Sort object.
     * Supports sorting by OrderMatch fields and nested company fields.
     * 
     * @param sortParam format: "field,direction" or just "field" (defaults to desc)
     * @return Spring Data Sort object
     */
    private Sort parseSortParameter(String sortParam) {
        if (sortParam == null || sortParam.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "matchScore");
        }

        String[] parts = sortParam.split(",");
        String field = parts[0].trim();
        String direction = parts.length > 1 ? parts[1].trim() : "desc";

        Sort.Direction sortDirection = "asc".equalsIgnoreCase(direction)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;

        // Map frontend field names to entity field names
        String entityField = mapSortField(field);

        return Sort.by(sortDirection, entityField);
    }

    /**
     * Maps frontend sort field names to actual entity field names.
     * 
     * @param frontendField the field name from frontend
     * @return the corresponding entity field name
     */
    private String mapSortField(String frontendField) {
        return switch (frontendField) {
            case "companyName" -> "providerId"; // Will need custom handling for company name
            case "matchScore" -> "matchScore";
            case "viewedAt" -> "viewedAt";
            case "respondedAt" -> "respondedAt";
            case "matchedAt" -> "matchedAt";
            case "distanceKm" -> "distanceKm";
            default -> "matchScore"; // Default fallback
        };
    }

    /**
     * Converts OrderMatch entity into CompanyMatchResponse.
     */
    private CompanyMatchResponse toCompanyMatchResponse(OrderMatch match) {
        CompanyDetailResponse companyDetails = null;
        try {
            companyDetails = companyRepository.findById(match.getProviderId())
                    .map(CompanyDetailResponse::from)
                    .orElse(null);
        } catch (Exception e) {
            log.error("Error loading company details for provider {}", match.getProviderId(), e);
        }

        return CompanyMatchResponse.builder()
                .providerId(match.getProviderId())
                .company(companyDetails)
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
                .notificationSent(match.getNotificationSent())
                .isHighQuality(match.isHighQualityMatch())
                .viewedAt(match.getViewedAt())
                .respondedAt(match.getRespondedAt())
                .interested(match.getInterested())
                .build();
    }

    /**
     * Extracts JWT token from Spring Security Authentication object.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }

    /**
     * Helper method to extract company id from authentication.
     */
    private UUID getCurrentCompanyIdFromAuthentication(Authentication authentication) {
        return getCurrentCompanyId(authentication);
    }
}