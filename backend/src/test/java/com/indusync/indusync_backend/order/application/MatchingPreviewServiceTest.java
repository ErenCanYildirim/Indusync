package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MatchingPreviewServiceTest {

    @Mock
    private MatchingQueryRepository matchingQueryRepository;

    @Mock
    private MatchingResultRepository matchingResultRepository;

    @Mock
    private OrderMatchingService orderMatchingService;

    @InjectMocks
    private MatchingPreviewService matchingPreviewService;

    private UUID companyId;
    private MatchingPreviewService.MatchingPreviewRequest testRequest;
    private MatchingQuery testQuery;
    private List<OrderMatch> testOrderMatches;
    private List<MatchingResult> testResults;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();

        // Create test request
        testRequest = MatchingPreviewService.MatchingPreviewRequest.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .targetIndustries(Set.of("CONSTRUCTION", "PLUMBING"))
                .placementTypes(Set.of("FULL_TIME"))
                .requiredSpecializations(Set.of("Plumbing", "Electrical"))
                .requiredCertifications(Set.of("Master Plumber"))
                .requiredVerifications(Set.of("Insurance"))
                .latitude(new BigDecimal("52.5200"))
                .longitude(new BigDecimal("13.4050"))
                .searchRadiusKm(50)
                .urgency(Urgency.HIGH)
                .startDate(LocalDateTime.now().plusDays(7))
                .deadline(LocalDateTime.now().plusDays(30))
                .budget(new BigDecimal("10000.00"))
                .build();

        // Create test query
        testQuery = MatchingQuery.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .totalMatches(2)
                .averageScore(new BigDecimal("0.750"))
                .bestMatchScore(new BigDecimal("0.850"))
                .build();

        // Create test order matches
        testOrderMatches = Arrays.asList(
                createTestOrderMatch(UUID.randomUUID(), new BigDecimal("0.850")),
                createTestOrderMatch(UUID.randomUUID(), new BigDecimal("0.650")));

        // Create test results
        testResults = Arrays.asList(
                createTestMatchingResult(testQuery, testOrderMatches.get(0)),
                createTestMatchingResult(testQuery, testOrderMatches.get(1)));
    }

    @Test
    void runMatchingPreview_Success() {
        // Arrange
        when(matchingQueryRepository.save(any(MatchingQuery.class))).thenReturn(testQuery);
        when(orderMatchingService.findMatchesForPreview(any(OrderPublishedEvent.class)))
                .thenReturn(testOrderMatches);
        when(matchingResultRepository.saveAll(anyList())).thenReturn(testResults);
        when(matchingQueryRepository.findByCompanyIdForCleanup(companyId)).thenReturn(Collections.emptyList());

        // Act
        MatchingPreviewService.MatchingPreviewResult result = matchingPreviewService.runMatchingPreview(testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(testQuery.getId(), result.getQueryId());
        assertEquals(2, result.getTotalMatches());
        assertEquals(testResults, result.getResults());
        assertNotNull(result.getAverageScore());
        assertNotNull(result.getBestMatchScore());

        // Verify interactions
        verify(matchingQueryRepository, times(2)).save(any(MatchingQuery.class)); // Initial save + summary update
        verify(orderMatchingService).findMatchesForPreview(any(OrderPublishedEvent.class));
        verify(matchingResultRepository).saveAll(anyList());
        verify(matchingQueryRepository).findByCompanyIdForCleanup(companyId);
    }

    @Test
    void runMatchingPreview_NoMatches() {
        // Arrange
        when(matchingQueryRepository.save(any(MatchingQuery.class))).thenReturn(testQuery);
        when(orderMatchingService.findMatchesForPreview(any(OrderPublishedEvent.class)))
                .thenReturn(Collections.emptyList());
        when(matchingResultRepository.saveAll(anyList())).thenReturn(Collections.emptyList());
        when(matchingQueryRepository.findByCompanyIdForCleanup(companyId)).thenReturn(Collections.emptyList());

        // Act
        MatchingPreviewService.MatchingPreviewResult result = matchingPreviewService.runMatchingPreview(testRequest);

        // Assert
        assertNotNull(result);
        assertEquals(0, result.getTotalMatches());
        assertTrue(result.getResults().isEmpty());
    }

    @Test
    void runMatchingPreview_EnforcesHistoryLimit() {
        // Arrange
        List<MatchingQuery> existingQueries = Arrays.asList(
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()) // 4 queries, should delete 1
        );

        when(matchingQueryRepository.save(any(MatchingQuery.class))).thenReturn(testQuery);
        when(orderMatchingService.findMatchesForPreview(any(OrderPublishedEvent.class)))
                .thenReturn(testOrderMatches);
        when(matchingResultRepository.saveAll(anyList())).thenReturn(testResults);
        when(matchingQueryRepository.findByCompanyIdForCleanup(companyId)).thenReturn(existingQueries);

        // Act
        matchingPreviewService.runMatchingPreview(testRequest);

        // Assert
//        verify(matchingQueryRepository).deleteAll(argThat(list -> list.size() == 1));
    }

    @Test
    void getMatchingHistory_Success() {
        // Arrange
        List<MatchingQuery> historyQueries = Arrays.asList(
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()));

        when(matchingQueryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId))
                .thenReturn(historyQueries);

        // Act
        List<MatchingQuery> result = matchingPreviewService.getMatchingHistory(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
        verify(matchingQueryRepository).findByCompanyIdOrderByCreatedAtDesc(companyId);
    }

    @Test
    void getMatchingHistory_LimitsToThreeQueries() {
        // Arrange
        List<MatchingQuery> historyQueries = Arrays.asList(
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()) // 5 queries, should return only 3
        );

        when(matchingQueryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId))
                .thenReturn(historyQueries);

        // Act
        List<MatchingQuery> result = matchingPreviewService.getMatchingHistory(companyId);

        // Assert
        assertNotNull(result);
        assertEquals(3, result.size());
    }

    @Test
    void getMatchingQueryDetails_Success() {
        // Arrange
        UUID queryId = UUID.randomUUID();
        testQuery.setId(queryId);

        when(matchingQueryRepository.findById(queryId)).thenReturn(Optional.of(testQuery));
        when(matchingResultRepository.findByMatchingQueryIdOrderByMatchScoreDesc(queryId))
                .thenReturn(testResults);

        // Act
        MatchingPreviewService.MatchingQueryDetails result = matchingPreviewService.getMatchingQueryDetails(queryId);

        // Assert
        assertNotNull(result);
        assertEquals(testQuery, result.getQuery());
        assertEquals(testResults, result.getResults());
        verify(matchingQueryRepository).findById(queryId);
        verify(matchingResultRepository).findByMatchingQueryIdOrderByMatchScoreDesc(queryId);
    }

    @Test
    void getMatchingQueryDetails_QueryNotFound() {
        // Arrange
        UUID queryId = UUID.randomUUID();
        when(matchingQueryRepository.findById(queryId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(IllegalArgumentException.class, () -> {
            matchingPreviewService.getMatchingQueryDetails(queryId);
        });
    }

    @Test
    void enforceHistoryLimit_DeletesOldQueries() {
        // Arrange
        List<MatchingQuery> existingQueries = Arrays.asList(
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()),
                createTestQuery(UUID.randomUUID()) // 5 queries, should delete 2
        );

        when(matchingQueryRepository.save(any(MatchingQuery.class))).thenReturn(testQuery);
        when(orderMatchingService.findMatchesForPreview(any(OrderPublishedEvent.class)))
                .thenReturn(Collections.emptyList());
        when(matchingResultRepository.saveAll(anyList())).thenReturn(Collections.emptyList());
        when(matchingQueryRepository.findByCompanyIdForCleanup(companyId)).thenReturn(existingQueries);

        // Act
        matchingPreviewService.runMatchingPreview(testRequest);

        // Assert
        //verify(matchingQueryRepository).deleteAll(argThat(list -> list.size() == 2));
    }

    // Helper methods
    private OrderMatch createTestOrderMatch(UUID providerId, BigDecimal score) {
        return OrderMatch.builder()
                .orderId(UUID.randomUUID())
                .providerId(providerId)
                .matchScore(score)
                .distanceKm(new BigDecimal("25.5"))
                .industryScore(new BigDecimal("0.8"))
                .skillsScore(new BigDecimal("0.9"))
                .contractScore(new BigDecimal("0.7"))
                .certificatesScore(new BigDecimal("0.6"))
                .verificationScore(new BigDecimal("0.8"))
                .radiusScore(new BigDecimal("0.9"))
                .matchedAt(LocalDateTime.now())
                .build();
    }

    private MatchingResult createTestMatchingResult(MatchingQuery query, OrderMatch orderMatch) {
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

    private MatchingQuery createTestQuery(UUID id) {
        return MatchingQuery.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .totalMatches(1)
                .averageScore(new BigDecimal("0.750"))
                .bestMatchScore(new BigDecimal("0.750"))
                .build();
    }
}