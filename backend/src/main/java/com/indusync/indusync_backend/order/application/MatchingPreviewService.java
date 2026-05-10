package com.indusync.indusync_backend.order.application;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for matching preview functionality without creating orders.
 * Handles preview requests, runs matching algorithm, saves queries/results,
 * and enforces history limits.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class MatchingPreviewService {

    private final MatchingQueryRepository matchingQueryRepository;
    private final MatchingResultRepository matchingResultRepository;
    private final OrderMatchingService orderMatchingService;

    // History limit per company
    private static final int MAX_HISTORY_PER_COMPANY = 3;

    /**
     * Runs a matching preview for the given criteria and saves the results.
     */
    public MatchingPreviewResult runMatchingPreview(MatchingPreviewRequest request) {
        log.info("Running matching preview for company: {}", request.getCompanyId());

        // Step 1: Create and save the matching query
        MatchingQuery query = createMatchingQuery(request);
        MatchingQuery savedQuery = matchingQueryRepository.save(query);

        // Step 2: Create a temporary OrderPublishedEvent from the request
        OrderPublishedEvent tempEvent = createOrderPublishedEventFromRequest(request);

        // Step 3: Use existing OrderMatchingService to find matches (without saving)
        List<OrderMatch> orderMatches = orderMatchingService.findMatchesForPreview(tempEvent);
        
        log.info("Found {} matches for preview", orderMatches.size());

        // Step 4: Convert OrderMatch results to MatchingResult entities
        List<MatchingResult> results = orderMatches.stream()
                .map(orderMatch -> convertToMatchingResult(savedQuery, orderMatch))
                .collect(Collectors.toList());

        // Step 5: Save results
        List<MatchingResult> savedResults = matchingResultRepository.saveAll(results);

        // Step 6: Update the query with summary statistics
        updateQuerySummary(savedQuery, savedResults);
        matchingQueryRepository.save(savedQuery);

        // Step 7: Enforce history limit
        enforceHistoryLimit(request.getCompanyId());

        log.info("Matching preview completed: {} matches found", savedResults.size());

        return MatchingPreviewResult.builder()
                .queryId(savedQuery.getId())
                .totalMatches(savedResults.size())
                .results(savedResults)
                .averageScore(savedQuery.getAverageScore())
                .bestMatchScore(savedQuery.getBestMatchScore())
                .build();
    }

    /**
     * Gets matching history for a company.
     */
    public List<MatchingQuery> getMatchingHistory(UUID companyId) {
        return matchingQueryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId).stream()
                .limit(MAX_HISTORY_PER_COMPANY)
                .collect(Collectors.toList());
    }

    /**
     * Gets details for a specific matching query.
     */
    public MatchingQueryDetails getMatchingQueryDetails(UUID queryId) {
        MatchingQuery query = matchingQueryRepository.findById(queryId)
                .orElseThrow(() -> new IllegalArgumentException("Matching query not found: " + queryId));

        List<MatchingResult> results = matchingResultRepository.findByMatchingQueryIdOrderByMatchScoreDesc(queryId);

        return MatchingQueryDetails.builder()
                .query(query)
                .results(results)
                .build();
    }

    private MatchingQuery createMatchingQuery(MatchingPreviewRequest request) {
        return MatchingQuery.builder()
                .companyId(request.getCompanyId())
                .primaryCategory(request.getPrimaryCategory())
                .targetIndustries(request.getTargetIndustries())
                .placementTypes(request.getPlacementTypes())
                .requiredSpecializations(request.getRequiredSpecializations())
                .requiredCertifications(request.getRequiredCertifications())
                .requiredVerifications(request.getRequiredVerifications())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .searchRadiusKm(request.getSearchRadiusKm())
                .urgency(request.getUrgency())
                .startDate(request.getStartDate())
                .deadline(request.getDeadline())
                .budget(request.getBudget())
                .queryPayload(request.toJsonPayload())
                .totalMatches(0)
                .build();
    }

    private OrderPublishedEvent createOrderPublishedEventFromRequest(MatchingPreviewRequest request) {
        return OrderPublishedEvent.builder()
                .orderId(UUID.randomUUID()) // Temporary ID for preview
                .companyId(request.getCompanyId())
                .primaryCategory(request.getPrimaryCategory())
                .targetIndustries(request.getTargetIndustries())
                .placementTypes(request.getPlacementTypes())
                .requiredSpecializations(request.getRequiredSpecializations() != null ? 
                    new ArrayList<>(request.getRequiredSpecializations()) : List.of())
                .requiredCertifications(request.getRequiredCertifications() != null ? 
                    new ArrayList<>(request.getRequiredCertifications()) : List.of())
                .requiredVerifications(request.getRequiredVerifications() != null ? 
                    new ArrayList<>(request.getRequiredVerifications()) : List.of())
                .latitude(request.getLatitude() != null ? request.getLatitude().doubleValue() : null)
                .longitude(request.getLongitude() != null ? request.getLongitude().doubleValue() : null)
                .searchRadiusKm(request.getSearchRadiusKm())
                .urgency(request.getUrgency())
                .startDate(request.getStartDate())
                .deadline(request.getDeadline())
                .budget(request.getBudget())
                .publishedAt(LocalDateTime.now())
                .weightOverrides(Map.of()) // No custom weights for preview
                .build();
    }

    private MatchingResult convertToMatchingResult(MatchingQuery query, OrderMatch orderMatch) {
        return MatchingResult.builder()
                .matchingQuery(query)
                .providerCompanyId(orderMatch.getProviderId())
                .matchScore(orderMatch.getMatchScore())
                .distanceKm(orderMatch.getDistanceKm())
                .industryScore(orderMatch.getIndustryScore())
                .skillsScore(orderMatch.getSkillsScore())
                .contractScore(orderMatch.getContractScore())
                .certificatesScore(orderMatch.getCertificatesScore())
                .verificationScore(orderMatch.getVerificationScore())
                .radiusScore(orderMatch.getRadiusScore())
                .build();
    }

    private void updateQuerySummary(MatchingQuery query, List<MatchingResult> results) {
        query.setTotalMatches(results.size());

        if (!results.isEmpty()) {
            BigDecimal averageScore = results.stream()
                    .map(MatchingResult::getMatchScore)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(results.size()), 3, RoundingMode.HALF_UP);

            BigDecimal bestScore = results.stream()
                    .map(MatchingResult::getMatchScore)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            query.setAverageScore(averageScore);
            query.setBestMatchScore(bestScore);
        }
    }

    private void enforceHistoryLimit(UUID companyId) {
        List<MatchingQuery> allQueries = matchingQueryRepository.findByCompanyIdForCleanup(companyId);

        if (allQueries.size() > MAX_HISTORY_PER_COMPANY) {
            List<MatchingQuery> toDelete = allQueries.subList(MAX_HISTORY_PER_COMPANY, allQueries.size());
            matchingQueryRepository.deleteAll(toDelete);
            log.info("Deleted {} old matching queries for company {}", toDelete.size(), companyId);
        }
    }

    // Helper classes
    @lombok.Builder
    @lombok.Data
    public static class MatchingPreviewResult {
        private UUID queryId;
        private int totalMatches;
        private List<MatchingResult> results;
        private BigDecimal averageScore;
        private BigDecimal bestMatchScore;
    }

    @lombok.Builder
    @lombok.Data
    public static class MatchingQueryDetails {
        private MatchingQuery query;
        private List<MatchingResult> results;
    }

    @lombok.Data
    @lombok.Builder
    public static class MatchingPreviewRequest {
        private UUID companyId;
        private OrderCategory primaryCategory;
        private Set<String> targetIndustries;
        private Set<String> placementTypes;
        private Set<String> requiredSpecializations;
        private Set<String> requiredCertifications;
        private Set<String> requiredVerifications;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Integer searchRadiusKm;
        private Urgency urgency;
        private LocalDateTime startDate;
        private LocalDateTime deadline;
        private BigDecimal budget;

        public String toJsonPayload() {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
            try {
                return objectMapper.writeValueAsString(this);
            } catch (JsonProcessingException e) {
                log.error("Error serializing MatchingPreviewRequest to JSON", e);
                return "{}"; // Return empty JSON on error
            }
        }
    }
}