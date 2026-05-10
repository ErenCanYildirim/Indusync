//package com.indusync.indusync_backend.order.api;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.indusync.indusync_backend.company.domain.Company;
//import com.indusync.indusync_backend.company.domain.CompanyRepository;
//import com.indusync.indusync_backend.order.api.dto.MatchingPreviewRequestDto;
//import com.indusync.indusync_backend.order.application.MatchingPreviewService;
//import com.indusync.indusync_backend.order.domain.MatchingQuery;
//import com.indusync.indusync_backend.order.domain.MatchingResult;
//import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
//import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
//import com.indusync.indusync_backend.shared.domain.enums.Urgency;
//import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
//import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
//import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//import org.springframework.http.MediaType;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.math.BigDecimal;
//import java.time.LocalDateTime;
//import java.util.*;
//
//import static org.mockito.ArgumentMatchers.*;
//import static org.mockito.Mockito.*;
//import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
//@WebMvcTest(MatchingPreviewController.class)
//class MatchingPreviewControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @MockBean
//    private MatchingPreviewService matchingPreviewService;
//
//    @MockBean
//    private CompanyRepository companyRepository;
//
//    @MockBean
//    private JwtAuthenticationHelper authHelper;
//
//    @MockBean
//    private ApiResponseHelper responseHelper;
//
//    @MockBean
//    private Authentication authentication;
//
//    private UUID companyId;
//    private MatchingPreviewRequestDto testRequestDto;
//    private MatchingQuery testQuery;
//    private List<MatchingResult> testResults;
//    private Company testCompany;
//
//    @BeforeEach
//    void setUp() {
//        companyId = UUID.randomUUID();
//
//        // Create test request DTO
//        testRequestDto = new MatchingPreviewRequestDto();
//        testRequestDto.setPrimaryCategory(OrderCategory.CONSTRUCTION);
//        testRequestDto.setTargetIndustries(Set.of("CONSTRUCTION", "PLUMBING"));
//        testRequestDto.setPlacementTypes(Set.of("FULL_TIME"));
//        testRequestDto.setRequiredSpecializations(Set.of("Plumbing", "Electrical"));
//        testRequestDto.setRequiredCertifications(Set.of("Master Plumber"));
//        testRequestDto.setRequiredVerifications(Set.of("Insurance"));
//        testRequestDto.setLatitude(new BigDecimal("52.5200"));
//        testRequestDto.setLongitude(new BigDecimal("13.4050"));
//        testRequestDto.setSearchRadiusKm(50);
//        testRequestDto.setUrgency(Urgency.HIGH);
//        testRequestDto.setStartDate(LocalDateTime.now().plusDays(7));
//        testRequestDto.setDeadline(LocalDateTime.now().plusDays(30));
//        testRequestDto.setBudget(new BigDecimal("10000.00"));
//
//        // Create test query
//        testQuery = MatchingQuery.builder()
//                .id(UUID.randomUUID())
//                .companyId(companyId)
//                .primaryCategory(OrderCategory.CONSTRUCTION)
//                .totalMatches(2)
//                .averageScore(new BigDecimal("0.750"))
//                .bestMatchScore(new BigDecimal("0.850"))
//                .build();
//
//        // Create test results
//        testResults = Arrays.asList(
//                createTestMatchingResult(testQuery, UUID.randomUUID(), new BigDecimal("0.850")),
//                createTestMatchingResult(testQuery, UUID.randomUUID(), new BigDecimal("0.650"))
//        );
//
//        // Create test company
//        testCompany = new Company();
//        testCompany.setId(UUID.randomUUID());
//        testCompany.setName("Test Company");
//        testCompany.setDescription("Test Description");
//        testCompany.setVerified(true);
//        testCompany.setAddress(new Address("Test St", "1", "12345", "Berlin", "Germany"));
//        testCompany.setLocation(new GeoLocation(new BigDecimal("52.5200"), new BigDecimal("13.4050")));
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void runMatchingPreview_Success() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//        when(matchingPreviewService.getMatchingHistory(companyId)).thenReturn(Collections.emptyList());
//
//        MatchingPreviewService.MatchingPreviewResult mockResult = MatchingPreviewService.MatchingPreviewResult.builder()
//                .queryId(testQuery.getId())
//                .totalMatches(2)
//                .results(testResults)
//                .averageScore(new BigDecimal("0.750"))
//                .bestMatchScore(new BigDecimal("0.850"))
//                .build();
//
//        when(matchingPreviewService.runMatchingPreview(any())).thenReturn(mockResult);
//        when(companyRepository.findById(any())).thenReturn(Optional.of(testCompany));
//
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.queryId").value(testQuery.getId().toString()))
//                .andExpect(jsonPath("$.totalMatches").value(2))
//                .andExpect(jsonPath("$.averageScore").value(0.750))
//                .andExpect(jsonPath("$.bestMatchScore").value(0.850))
//                .andExpect(jsonPath("$.topMatches").isArray())
//                .andExpect(jsonPath("$.topMatches.length()").value(2))
//                .andExpect(jsonPath("$.message").value("Found 2 matching companies"));
//
//        verify(matchingPreviewService).runMatchingPreview(any());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void runMatchingPreview_QueryLimitExceeded() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//
//        List<MatchingQuery> existingQueries = Arrays.asList(
//                createTestQuery(UUID.randomUUID()),
//                createTestQuery(UUID.randomUUID()),
//                createTestQuery(UUID.randomUUID())
//        );
//        when(matchingPreviewService.getMatchingHistory(companyId)).thenReturn(existingQueries);
//
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isTooManyRequests())
//                .andExpect(jsonPath("$.message").value("Query limit exceeded. Maximum 3 preview queries allowed per company."))
//                .andExpect(jsonPath("$.totalMatches").value(0));
//
//        verify(matchingPreviewService, never()).runMatchingPreview(any());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void runMatchingPreview_NoCompanyContext() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(null);
//
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isForbidden())
//                .andExpect(jsonPath("$.message").value("No valid company context found"))
//                .andExpect(jsonPath("$.totalMatches").value(0));
//
//        verify(matchingPreviewService, never()).runMatchingPreview(any());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void runMatchingPreview_ValidationError() throws Exception {
//        // Arrange
//        testRequestDto.setSearchRadiusKm(-10); // Invalid negative value
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isBadRequest());
//
//        verify(matchingPreviewService, never()).runMatchingPreview(any());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void runMatchingPreview_ServiceException() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//        when(matchingPreviewService.getMatchingHistory(companyId)).thenReturn(Collections.emptyList());
//        when(matchingPreviewService.runMatchingPreview(any())).thenThrow(new RuntimeException("Service error"));
//
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isInternalServerError())
//                .andExpect(jsonPath("$.message").value("Error running matching preview: Service error"))
//                .andExpect(jsonPath("$.totalMatches").value(0));
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getMatchingHistory_Success() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//
//        List<MatchingQuery> historyQueries = Arrays.asList(
//                createTestQuery(UUID.randomUUID()),
//                createTestQuery(UUID.randomUUID())
//        );
//        when(matchingPreviewService.getMatchingHistory(companyId)).thenReturn(historyQueries);
//
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$").isArray())
//                .andExpect(jsonPath("$.length()").value(2))
//                .andExpect(jsonPath("$[0].queryId").exists())
//                .andExpect(jsonPath("$[0].createdAt").exists())
//                .andExpect(jsonPath("$[0].primaryCategory").value("CONSTRUCTION"))
//                .andExpect(jsonPath("$[0].totalMatches").value(1));
//
//        verify(matchingPreviewService).getMatchingHistory(companyId);
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getMatchingHistory_NoCompanyContext() throws Exception {
//        // Arrange
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(null);
//
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history"))
//                .andExpect(status().isForbidden());
//
//        verify(matchingPreviewService, never()).getMatchingHistory(any());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getMatchingQueryDetails_Success() throws Exception {
//        // Arrange
//        UUID queryId = UUID.randomUUID();
//        testQuery.setId(queryId);
//
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//
//        MatchingPreviewService.MatchingQueryDetails mockDetails = MatchingPreviewService.MatchingQueryDetails.builder()
//                .query(testQuery)
//                .results(testResults)
//                .build();
//
//        when(matchingPreviewService.getMatchingQueryDetails(queryId)).thenReturn(mockDetails);
//        when(companyRepository.findById(any())).thenReturn(Optional.of(testCompany));
//
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history/{queryId}", queryId))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.query.queryId").value(queryId.toString()))
//                .andExpect(jsonPath("$.query.primaryCategory").value("CONSTRUCTION"))
//                .andExpect(jsonPath("$.matches").isArray())
//                .andExpect(jsonPath("$.matches.length()").value(2));
//
//        verify(matchingPreviewService).getMatchingQueryDetails(queryId);
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getMatchingQueryDetails_QueryNotFound() throws Exception {
//        // Arrange
//        UUID queryId = UUID.randomUUID();
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//        when(matchingPreviewService.getMatchingQueryDetails(queryId))
//                .thenThrow(new IllegalArgumentException("Query not found"));
//
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history/{queryId}", queryId))
//                .andExpect(status().isNotFound());
//
//        verify(matchingPreviewService).getMatchingQueryDetails(queryId);
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getMatchingQueryDetails_UnauthorizedAccess() throws Exception {
//        // Arrange
//        UUID queryId = UUID.randomUUID();
//        UUID otherCompanyId = UUID.randomUUID();
//        testQuery.setId(queryId);
//        testQuery.setCompanyId(otherCompanyId); // Different company
//
//        when(authHelper.extractCurrentCompanyIdFromAuthentication(any())).thenReturn(companyId);
//
//        MatchingPreviewService.MatchingQueryDetails mockDetails = MatchingPreviewService.MatchingQueryDetails.builder()
//                .query(testQuery)
//                .results(testResults)
//                .build();
//
//        when(matchingPreviewService.getMatchingQueryDetails(queryId)).thenReturn(mockDetails);
//
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history/{queryId}", queryId))
//                .andExpect(status().isForbidden());
//
//        verify(matchingPreviewService).getMatchingQueryDetails(queryId);
//    }
//
//    @Test
//    void runMatchingPreview_Unauthorized() throws Exception {
//        // Act & Assert
//        mockMvc.perform(post("/v1/matching/preview")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(testRequestDto)))
//                .andExpect(status().isUnauthorized());
//
//        verify(matchingPreviewService, never()).runMatchingPreview(any());
//    }
//
//    @Test
//    void getMatchingHistory_Unauthorized() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history"))
//                .andExpect(status().isUnauthorized());
//
//        verify(matchingPreviewService, never()).getMatchingHistory(any());
//    }
//
//    @Test
//    void getMatchingQueryDetails_Unauthorized() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/v1/matching/history/{queryId}", UUID.randomUUID()))
//                .andExpect(status().isUnauthorized());
//
//        verify(matchingPreviewService, never()).getMatchingQueryDetails(any());
//    }
//
//    // Helper methods
//    private MatchingResult createTestMatchingResult(MatchingQuery query, UUID providerId, BigDecimal score) {
//        return MatchingResult.builder()
//                .matchingQuery(query)
//                .providerCompanyId(providerId)
//                .matchScore(score)
//                .distanceKm(new BigDecimal("25.5"))
//                .industryScore(new BigDecimal("0.8"))
//                .skillsScore(new BigDecimal("0.9"))
//                .contractScore(new BigDecimal("0.7"))
//                .certificatesScore(new BigDecimal("0.6"))
//                .verificationScore(new BigDecimal("0.8"))
//                .radiusScore(new BigDecimal("0.9"))
//                .build();
//    }
//
//    private MatchingQuery createTestQuery(UUID id) {
//        return MatchingQuery.builder()
//                .id(id)
//                .companyId(companyId)
//                .primaryCategory(OrderCategory.CONSTRUCTION)
//                .totalMatches(1)
//                .averageScore(new BigDecimal("0.750"))
//                .bestMatchScore(new BigDecimal("0.750"))
//                .build();
//    }
//}