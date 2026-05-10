package com.indusync.indusync_backend.order.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.indusync.indusync_backend.order.api.dto.MatchingPreviewRequestDto;
import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureWebMvc
@ActiveProfiles("test")
@Transactional
class MatchingPreviewIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MatchingQueryRepository matchingQueryRepository;

    @Autowired
    private MatchingResultRepository matchingResultRepository;

    @Autowired
    private CompanyRepository companyRepository;

    private UUID companyId;
    private Company testCompany;
    private MatchingPreviewRequestDto testRequestDto;

    @BeforeEach
    void setUp() {
        // Create test company
        testCompany = new Company();
        testCompany.setName("Test Company");
        testCompany.setDescription("Test Description");
        testCompany.setVerified(true);
        testCompany.setAddress(new Address("Test St", "1", "12345", "Berlin", "Germany"));
        testCompany.setLocation(new GeoLocation(new BigDecimal("52.5200"), new BigDecimal("13.4050")));
        testCompany = companyRepository.save(testCompany);
        companyId = testCompany.getId();

        // Create test request DTO
        testRequestDto = new MatchingPreviewRequestDto();
        testRequestDto.setPrimaryCategory(OrderCategory.CONSTRUCTION);
        testRequestDto.setTargetIndustries(Set.of("CONSTRUCTION", "PLUMBING"));
        testRequestDto.setPlacementTypes(Set.of("FULL_TIME"));
        testRequestDto.setRequiredSpecializations(Set.of("Plumbing", "Electrical"));
        testRequestDto.setRequiredCertifications(Set.of("Master Plumber"));
        testRequestDto.setRequiredVerifications(Set.of("Insurance"));
        testRequestDto.setLatitude(new BigDecimal("52.5200"));
        testRequestDto.setLongitude(new BigDecimal("13.4050"));
        testRequestDto.setSearchRadiusKm(50);
        testRequestDto.setUrgency(Urgency.HIGH);
        testRequestDto.setStartDate(LocalDateTime.now().plusDays(7));
        testRequestDto.setDeadline(LocalDateTime.now().plusDays(30));
        testRequestDto.setBudget(new BigDecimal("10000.00"));
    }

    @Test
    void matchingQueryRepository_SaveAndFind() {
        // Arrange
        MatchingQuery query = MatchingQuery.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .targetIndustries(Set.of("CONSTRUCTION"))
                .placementTypes(Set.of("FULL_TIME"))
                .requiredSpecializations(Set.of("Plumbing"))
                .requiredCertifications(Set.of("Master Plumber"))
                .requiredVerifications(Set.of("Insurance"))
                .latitude(new BigDecimal("52.5200"))
                .longitude(new BigDecimal("13.4050"))
                .searchRadiusKm(50)
                .urgency(Urgency.HIGH)
                .startDate(LocalDateTime.now().plusDays(7))
                .deadline(LocalDateTime.now().plusDays(30))
                .budget(new BigDecimal("10000.00"))
                .queryPayload("{\"test\": \"payload\"}")
                .totalMatches(0)
                .build();

        // Act
        MatchingQuery savedQuery = matchingQueryRepository.save(query);

        // Assert
        assertNotNull(savedQuery.getId());
        assertEquals(companyId, savedQuery.getCompanyId());
        assertEquals(OrderCategory.CONSTRUCTION, savedQuery.getPrimaryCategory());
        assertEquals(50, savedQuery.getSearchRadiusKm());
        assertNotNull(savedQuery.getCreatedAt());
    }

    @Test
    void matchingQueryRepository_FindByCompanyId() {
        // Arrange
        MatchingQuery query1 = createAndSaveTestQuery();
        MatchingQuery query2 = createAndSaveTestQuery();
        MatchingQuery query3 = createAndSaveTestQuery();

        // Act
        var results = matchingQueryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);

        // Assert
        assertEquals(3, results.size());
        assertTrue(results.stream().allMatch(q -> q.getCompanyId().equals(companyId)));
        // Should be ordered by creation date descending
        assertTrue(results.get(0).getCreatedAt().isAfter(results.get(1).getCreatedAt()) ||
                   results.get(0).getCreatedAt().equals(results.get(1).getCreatedAt()));
    }

    @Test
    void matchingResultRepository_SaveAndFind() {
        // Arrange
        MatchingQuery query = createAndSaveTestQuery();
        UUID providerId = UUID.randomUUID();
        
        MatchingResult result = MatchingResult.builder()
                .matchingQuery(query)
                .providerCompanyId(providerId)
                .matchScore(new BigDecimal("0.850"))
                .distanceKm(new BigDecimal("25.5"))
                .industryScore(new BigDecimal("0.8"))
                .skillsScore(new BigDecimal("0.9"))
                .contractScore(new BigDecimal("0.7"))
                .certificatesScore(new BigDecimal("0.6"))
                .verificationScore(new BigDecimal("0.8"))
                .radiusScore(new BigDecimal("0.9"))
                .build();

        // Act
        MatchingResult savedResult = matchingResultRepository.save(result);

        // Assert
        assertNotNull(savedResult.getId());
        assertEquals(query.getId(), savedResult.getMatchingQuery().getId());
        assertEquals(providerId, savedResult.getProviderCompanyId());
        assertEquals(new BigDecimal("0.850"), savedResult.getMatchScore());
        assertNotNull(savedResult.getCreatedAt());
    }

    @Test
    void matchingResultRepository_FindByQueryId() {
        // Arrange
        MatchingQuery query = createAndSaveTestQuery();
        MatchingResult result1 = createAndSaveTestResult(query, new BigDecimal("0.850"));
        MatchingResult result2 = createAndSaveTestResult(query, new BigDecimal("0.650"));

        // Act
        var results = matchingResultRepository.findByMatchingQueryIdOrderByMatchScoreDesc(query.getId());

        // Assert
        assertEquals(2, results.size());
        assertTrue(results.stream().allMatch(r -> r.getMatchingQuery().getId().equals(query.getId())));
        // Should be ordered by match score descending
        assertTrue(results.get(0).getMatchScore().compareTo(results.get(1).getMatchScore()) >= 0);
    }

    @Test
    void historyLimitEnforcement() {
        // Arrange - Create 5 queries to exceed the limit of 3
        for (int i = 0; i < 5; i++) {
            createAndSaveTestQuery();
            // Add small delay to ensure different timestamps
            try {
                Thread.sleep(10);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }

        // Act - Create another query which should trigger cleanup
        createAndSaveTestQuery();

        // Assert - Should only have 3 queries remaining
        var remainingQueries = matchingQueryRepository.findByCompanyIdOrderByCreatedAtDesc(companyId);
        assertTrue(remainingQueries.size() <= 3, "Should have at most 3 queries after cleanup");
    }

    @Test
    void elementCollectionMapping() {
        // Arrange
        MatchingQuery query = MatchingQuery.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .targetIndustries(Set.of("CONSTRUCTION", "PLUMBING", "ELECTRICAL"))
                .placementTypes(Set.of("FULL_TIME", "PART_TIME"))
                .requiredSpecializations(Set.of("Plumbing", "Electrical", "HVAC"))
                .requiredCertifications(Set.of("Master Plumber", "Electrical License"))
                .requiredVerifications(Set.of("Insurance", "Bonding"))
                .latitude(new BigDecimal("52.5200"))
                .longitude(new BigDecimal("13.4050"))
                .searchRadiusKm(50)
                .urgency(Urgency.HIGH)
                .queryPayload("{\"test\": \"payload\"}")
                .totalMatches(0)
                .build();

        // Act
        MatchingQuery savedQuery = matchingQueryRepository.save(query);
        MatchingQuery foundQuery = matchingQueryRepository.findById(savedQuery.getId()).orElse(null);

        // Assert
        assertNotNull(foundQuery);
        assertEquals(3, foundQuery.getTargetIndustries().size());
        assertTrue(foundQuery.getTargetIndustries().contains("CONSTRUCTION"));
        assertTrue(foundQuery.getTargetIndustries().contains("PLUMBING"));
        assertTrue(foundQuery.getTargetIndustries().contains("ELECTRICAL"));
        
        assertEquals(2, foundQuery.getPlacementTypes().size());
        assertTrue(foundQuery.getPlacementTypes().contains("FULL_TIME"));
        assertTrue(foundQuery.getPlacementTypes().contains("PART_TIME"));
        
        assertEquals(3, foundQuery.getRequiredSpecializations().size());
        assertEquals(2, foundQuery.getRequiredCertifications().size());
        assertEquals(2, foundQuery.getRequiredVerifications().size());
    }

    @Test
    void cascadeDeleteBehavior() {
        // Arrange
        MatchingQuery query = createAndSaveTestQuery();
        MatchingResult result1 = createAndSaveTestResult(query, new BigDecimal("0.850"));
        MatchingResult result2 = createAndSaveTestResult(query, new BigDecimal("0.650"));

        // Verify initial state
        assertEquals(2, matchingResultRepository.findByMatchingQueryId(query.getId()).size());

        // Act - Delete the query
        matchingQueryRepository.delete(query);

        // Assert - Results should be deleted due to cascade
        assertEquals(0, matchingResultRepository.findByMatchingQueryId(query.getId()).size());
    }

    // Helper methods
    private MatchingQuery createAndSaveTestQuery() {
        MatchingQuery query = MatchingQuery.builder()
                .companyId(companyId)
                .primaryCategory(OrderCategory.CONSTRUCTION)
                .targetIndustries(Set.of("CONSTRUCTION"))
                .placementTypes(Set.of("FULL_TIME"))
                .requiredSpecializations(Set.of("Plumbing"))
                .requiredCertifications(Set.of("Master Plumber"))
                .requiredVerifications(Set.of("Insurance"))
                .latitude(new BigDecimal("52.5200"))
                .longitude(new BigDecimal("13.4050"))
                .searchRadiusKm(50)
                .urgency(Urgency.HIGH)
                .startDate(LocalDateTime.now().plusDays(7))
                .deadline(LocalDateTime.now().plusDays(30))
                .budget(new BigDecimal("10000.00"))
                .queryPayload("{\"test\": \"payload\"}")
                .totalMatches(0)
                .build();
        
        return matchingQueryRepository.save(query);
    }

    private MatchingResult createAndSaveTestResult(MatchingQuery query, BigDecimal score) {
        MatchingResult result = MatchingResult.builder()
                .matchingQuery(query)
                .providerCompanyId(UUID.randomUUID())
                .matchScore(score)
                .distanceKm(new BigDecimal("25.5"))
                .industryScore(new BigDecimal("0.8"))
                .skillsScore(new BigDecimal("0.9"))
                .contractScore(new BigDecimal("0.7"))
                .certificatesScore(new BigDecimal("0.6"))
                .verificationScore(new BigDecimal("0.8"))
                .radiusScore(new BigDecimal("0.9"))
                .build();
        
        return matchingResultRepository.save(result);
    }
} 