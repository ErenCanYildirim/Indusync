//package com.indusync.indusync_backend.dashboard.api;
//
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.indusync.indusync_backend.dashboard.application.DashboardStatisticsService;
//import com.indusync.indusync_backend.dashboard.application.dto.DashboardStatistics;
//import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
//import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
//import com.indusync.indusync_backend.shared.security.AuthenticationContext;
//import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
//import org.springframework.http.MediaType;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.test.context.support.WithMockUser;
//import org.springframework.test.web.servlet.MockMvc;
//
//import java.time.LocalDate;
//import java.util.Arrays;
//import java.util.List;
//import java.util.Optional;
//import java.util.UUID;
//
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.eq;
//import static org.mockito.Mockito.when;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
//
///**
// * Unit tests for DashboardStatisticsController.
// * Tests the implementation of task 5: REST endpoints for dashboard statistics.
// */
//@WebMvcTest(DashboardStatisticsController.class)
//class DashboardStatisticsControllerTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @MockBean
//    private DashboardStatisticsService dashboardStatisticsService;
//
//    @MockBean
//    private JwtAuthenticationHelper jwtAuthenticationHelper;
//
//    @MockBean
//    private ApiResponseHelper apiResponseHelper;
//
//    private UUID testCompanyId;
//    private AuthenticationContext testAuthContext;
//
//    @BeforeEach
//    void setUp() {
//        testCompanyId = UUID.randomUUID();
//        testAuthContext = AuthenticationContext.builder()
//                .userId(UUID.randomUUID())
//                .currentCompanyId(testCompanyId)
//                .email("test@example.com")
//                .accountType("BUSINESS")
//                .roles(Arrays.asList("USER"))
//                .token("test-token")
//                .build();
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getDashboardStatistics_Success() throws Exception {
//        // Arrange
//        DashboardStatistics expectedStats = DashboardStatistics.of(5, 3, 10, 2.5);
//
//        when(jwtAuthenticationHelper.getAuthenticationContext(any(Authentication.class)))
//                .thenReturn(Optional.of(testAuthContext));
//        when(dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId))
//                .thenReturn(expectedStats);
//
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/statistics")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.activeOrders").value(5))
//                .andExpect(jsonPath("$.openApplications").value(3))
//                .andExpect(jsonPath("$.completedOrders").value(10))
//                .andExpect(jsonPath("$.averageResponseTimeDays").value(2.5))
//                .andExpect(jsonPath("$.averageResponseTimeDisplay").value("2.5 Tage"));
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getDashboardStatistics_NoCompanyContext() throws Exception {
//        // Arrange
//        AuthenticationContext authContextWithoutCompany = AuthenticationContext.builder()
//                .userId(UUID.randomUUID())
//                .currentCompanyId(null)
//                .email("test@example.com")
//                .accountType("BUSINESS")
//                .roles(Arrays.asList("USER"))
//                .token("test-token")
//                .build();
//
//        when(jwtAuthenticationHelper.getAuthenticationContext(any(Authentication.class)))
//                .thenReturn(Optional.of(authContextWithoutCompany));
//
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/statistics")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isForbidden());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getOrderActivityChart_Success() throws Exception {
//        // Arrange
//        List<OrderActivityData> expectedData = Arrays.asList(
//                OrderActivityData.of(LocalDate.now().minusDays(1), 2, 1),
//                OrderActivityData.of(LocalDate.now(), 3, 2)
//        );
//
//        when(jwtAuthenticationHelper.getAuthenticationContext(any(Authentication.class)))
//                .thenReturn(Optional.of(testAuthContext));
//        when(dashboardStatisticsService.getOrderActivityChart(testCompanyId, 30))
//                .thenReturn(expectedData);
//
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/activity-chart")
//                .param("days", "30")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.length()").value(2))
//                .andExpect(jsonPath("$[0].auftraege").value(2))
//                .andExpect(jsonPath("$[0].anfragen").value(1))
//                .andExpect(jsonPath("$[1].auftraege").value(3))
//                .andExpect(jsonPath("$[1].anfragen").value(2));
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getOrderActivityChart_DefaultDays() throws Exception {
//        // Arrange
//        List<OrderActivityData> expectedData = Arrays.asList(
//                OrderActivityData.of(LocalDate.now(), 1, 1)
//        );
//
//        when(jwtAuthenticationHelper.getAuthenticationContext(any(Authentication.class)))
//                .thenReturn(Optional.of(testAuthContext));
//        when(dashboardStatisticsService.getOrderActivityChart(testCompanyId, 30))
//                .thenReturn(expectedData);
//
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/activity-chart")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.length()").value(1));
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getOrderActivityChart_InvalidDays_TooLow() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/activity-chart")
//                .param("days", "0")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isBadRequest());
//    }
//
//    @Test
//    @WithMockUser(roles = "USER")
//    void getOrderActivityChart_InvalidDays_TooHigh() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/activity-chart")
//                .param("days", "400")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isBadRequest());
//    }
//
//    @Test
//    void getDashboardStatistics_Unauthorized() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/statistics")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isUnauthorized());
//    }
//
//    @Test
//    void getOrderActivityChart_Unauthorized() throws Exception {
//        // Act & Assert
//        mockMvc.perform(get("/api/dashboard/activity-chart")
//                .contentType(MediaType.APPLICATION_JSON))
//                .andExpect(status().isUnauthorized());
//    }
//}