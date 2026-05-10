package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.order.api.dto.*;
import com.indusync.indusync_backend.order.application.MatchingPreviewService;
import com.indusync.indusync_backend.order.domain.MatchingQuery;
import com.indusync.indusync_backend.order.domain.MatchingResult;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for matching preview functionality without creating orders.
 * <p>
 * This controller handles:
 * - Running matching previews with query limits
 * - Retrieving matching history for companies
 * - Getting detailed results for specific queries
 * </p
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/matching")
@Slf4j
@Tag(name = "Matching Preview", description = "Matching preview operations without order creation")
public class MatchingPreviewController extends BaseController {

    private final MatchingPreviewService matchingPreviewService;
    private final CompanyRepository companyRepository;

    public MatchingPreviewController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            MatchingPreviewService matchingPreviewService,
            CompanyRepository companyRepository) {
        super(authHelper, responseHelper);
        this.matchingPreviewService = matchingPreviewService;
        this.companyRepository = companyRepository;
    }

    /**
     * Run a matching preview without creating an order.
     * Limited to 3 queries per company.
     */
    @PostMapping("/preview")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Run matching preview", description = "Runs a matching preview without creating an order. Limited to 3 queries per company.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Matching preview completed successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no valid company context"),
            @ApiResponse(responseCode = "429", description = "Too many requests - query limit exceeded"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<MatchingPreviewResponseDto> runMatchingPreview(
            @Valid @RequestBody MatchingPreviewRequestDto requestDto,
            Authentication authentication) {
        
        log.info("Matching preview request received");

        try {
            // Get company ID from the authentication context
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                log.warn("No valid company context found for matching preview");
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(MatchingPreviewResponseDto.builder()
                                .message("No valid company context found")
                                .totalMatches(0)
                                .build());
            }

            // Check if the company has exceeded the query limit
            List<MatchingQuery> existingQueries = matchingPreviewService.getMatchingHistory(companyId);
            if (existingQueries.size() >= 3) {
                log.warn("Company {} has exceeded matching preview query limit", companyId);
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(MatchingPreviewResponseDto.builder()
                                .message("Query limit exceeded. Maximum 3 preview queries allowed per company.")
                                .totalMatches(0)
                                .build());
            }

            // Set company ID from the authentication context
            requestDto.setCompanyId(companyId);

            // Convert DTO to service request
            MatchingPreviewService.MatchingPreviewRequest serviceRequest = convertToServiceRequest(requestDto);
            
            // Run the matching preview
            MatchingPreviewService.MatchingPreviewResult result = matchingPreviewService.runMatchingPreview(serviceRequest);
            
            // Convert to response DTO
            MatchingPreviewResponseDto responseDto = convertToResponseDto(result);
            
            log.info("Matching preview completed for company: {} - {} matches found", 
                    companyId, result.getTotalMatches());
            
            return ResponseEntity.ok(responseDto);
            
        } catch (Exception e) {
            log.error("Error running matching preview", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(MatchingPreviewResponseDto.builder()
                            .message("Error running matching preview: " + e.getMessage())
                            .totalMatches(0)
                            .build());
        }
    }

    /**
     * Get matching history for the authenticated company (last 3 queries).
     */
    @GetMapping("/history")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get matching history", description = "Retrieves the last 3 matching queries for the authenticated company")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Matching history retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no valid company context"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<List<MatchingQueryHistoryDto>> getMatchingHistory(
            Authentication authentication) {
        
        log.info("Matching history request received");

        try {
            // Get company ID from the authentication context
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                log.warn("No valid company context found for matching history");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<MatchingQuery> history = matchingPreviewService.getMatchingHistory(companyId);
            List<MatchingQueryHistoryDto> historyDto = history.stream()
                    .map(this::convertToHistoryDto)
                    .collect(Collectors.toList());
            
            log.info("Retrieved {} matching queries for company: {}", historyDto.size(), companyId);
            return ResponseEntity.ok(historyDto);
            
        } catch (Exception e) {
            log.error("Error getting matching history", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Get details for a specific matching query.
     */
    @GetMapping("/history/{queryId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get matching query details", description = "Retrieves detailed results for a specific matching query")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Query details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "403", description = "Forbidden - no valid company context"),
            @ApiResponse(responseCode = "404", description = "Query not found"),
            @ApiResponse(responseCode = "500", description = "Internal server error")
    })
    public ResponseEntity<MatchingQueryDetailsDto> getMatchingQueryDetails(
            @Parameter(description = "Matching query ID") @PathVariable UUID queryId,
            Authentication authentication) {
        
        log.info("Matching query details request for query: {}", queryId);

        try {
            // Get company ID from the authentication context
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            if (companyId == null) {
                log.warn("No valid company context found for query details");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            MatchingPreviewService.MatchingQueryDetails details = matchingPreviewService.getMatchingQueryDetails(queryId);
            
            // Verify the query belongs to the authenticated company
            if (!details.getQuery().getCompanyId().equals(companyId)) {
                log.warn("Company {} attempted to access query {} owned by company {}", 
                        companyId, queryId, details.getQuery().getCompanyId());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            
            MatchingQueryDetailsDto detailsDto = convertToDetailsDto(details);
            
            return ResponseEntity.ok(detailsDto);
            
        } catch (IllegalArgumentException e) {
            log.warn("Matching query not found: {}", queryId);
            return ResponseEntity.notFound().build();
            
        } catch (Exception e) {
            log.error("Error getting matching query details for query: {}", queryId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === Helper Methods ===

    /**
     * Extracts company ID from an authentication context.
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

    // === Conversion Methods ===

    private MatchingPreviewService.MatchingPreviewRequest convertToServiceRequest(MatchingPreviewRequestDto dto) {
        return MatchingPreviewService.MatchingPreviewRequest.builder()
                .companyId(dto.getCompanyId())
                .primaryCategory(dto.getPrimaryCategory())
                .targetIndustries(dto.getTargetIndustries())
                .placementTypes(dto.getPlacementTypes())
                .requiredSpecializations(dto.getRequiredSpecializations())
                .requiredCertifications(dto.getRequiredCertifications())
                .requiredVerifications(dto.getRequiredVerifications())
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .searchRadiusKm(dto.getSearchRadiusKm())
                .urgency(dto.getUrgency())
                .startDate(dto.getStartDate())
                .deadline(dto.getDeadline())
                .budget(dto.getBudget())
                .build();
    }

    private MatchingPreviewResponseDto convertToResponseDto(MatchingPreviewService.MatchingPreviewResult result) {
        // Get top 10 matches for response
        List<MatchingCompanyResponseDto> topMatches = result.getResults().stream()
                .limit(10)
                .map(this::convertToCompanyResponseDto)
                .collect(Collectors.toList());

        return MatchingPreviewResponseDto.builder()
                .queryId(result.getQueryId())
                .totalMatches(result.getTotalMatches())
                .averageScore(result.getAverageScore())
                .bestMatchScore(result.getBestMatchScore())
                .topMatches(topMatches)
                .message(result.getTotalMatches() > 0 ? 
                        "Found " + result.getTotalMatches() + " matching companies" : 
                        "No matching companies found")
                .build();
    }

    private MatchingCompanyResponseDto convertToCompanyResponseDto(MatchingResult result) {
        // Get company details for additional info
        Company company = companyRepository.findById(result.getProviderCompanyId()).orElse(null);
        
        return MatchingCompanyResponseDto.builder()
                .companyId(result.getProviderCompanyId())
                .companyName(company != null ? company.getName() : "Unknown Company")
                .matchScore(result.getMatchScore())
                .distanceKm(result.getDistanceKm())
                .industryScore(result.getIndustryScore())
                .skillsScore(result.getSkillsScore())
                .contractScore(result.getContractScore())
                .certificatesScore(result.getCertificatesScore())
                .verificationScore(result.getVerificationScore())
                .radiusScore(result.getRadiusScore())
                .city(company != null && company.getLocation() != null ? String.valueOf(company.getAddress()) : null)
                .description(company != null ? company.getDescription() : null)
                .verified(company != null ? company.getVerified() : false)
                .build();
    }

    private MatchingQueryHistoryDto convertToHistoryDto(MatchingQuery query) {
        return MatchingQueryHistoryDto.builder()
                .queryId(query.getId())
                .createdAt(query.getCreatedAt())
                .primaryCategory(query.getPrimaryCategory())
                .searchRadiusKm(query.getSearchRadiusKm())
                .totalMatches(query.getTotalMatches())
                .averageScore(query.getAverageScore())
                .bestMatchScore(query.getBestMatchScore())
                .build();
    }

    private MatchingQueryDetailsDto convertToDetailsDto(MatchingPreviewService.MatchingQueryDetails details) {
        List<MatchingCompanyResponseDto> matches = details.getResults().stream()
                .map(this::convertToCompanyResponseDto)
                .collect(Collectors.toList());

        return MatchingQueryDetailsDto.builder()
                .query(convertToHistoryDto(details.getQuery()))
                .matches(matches)
                .build();
    }
}