package com.indusync.indusync_backend.dashboard.application;

import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for DashboardStatisticsService order activity chart functionality.
 * Tests the complete implementation including database queries.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class DashboardStatisticsServiceIntegrationTest {

    @Autowired
    private DashboardStatisticsService dashboardStatisticsService;

    @Test
    void getOrderActivityChart_WithValidCompanyId_ReturnsDataWithoutErrors() {
        // Arrange
        UUID testCompanyId = UUID.randomUUID(); // Non-existent company for safety
        int days = 7;

        // Act
        List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Assert
        assertNotNull(result);
        assertEquals(days, result.size());
        
        // Verify all data points have valid structure
        for (OrderActivityData data : result) {
            assertNotNull(data.date());
            assertNotNull(data.dateDisplay());
            assertTrue(data.auftraege() >= 0);
            assertTrue(data.anfragen() >= 0);
            
            // Verify German date format
            assertTrue(data.dateDisplay().matches("\\d{2}\\.\\d{2}"));
        }
        
        // Verify dates are in ascending order
        for (int i = 1; i < result.size(); i++) {
            assertTrue(result.get(i).date().isAfter(result.get(i-1).date()));
        }
    }

    @Test
    void getOrderActivityChart_WithDifferentDayRanges_ReturnsCorrectNumberOfDays() {
        // Arrange
        UUID testCompanyId = UUID.randomUUID();
        
        // Test different day ranges
        int[] dayRanges = {1, 7, 14, 30, 90};
        
        for (int days : dayRanges) {
            // Act
            List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);
            
            // Assert
            assertNotNull(result, "Result should not be null for " + days + " days");
            assertEquals(days, result.size(), "Should return exactly " + days + " data points");
        }
    }

    @Test
    void getOrderActivityChart_DatabaseQueriesExecuteSuccessfully() {
        // Arrange
        UUID testCompanyId = UUID.randomUUID();
        int days = 30;

        // Act & Assert - Should not throw any database-related exceptions
        assertDoesNotThrow(() -> {
            List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);
            assertNotNull(result);
            assertEquals(days, result.size());
        });
    }
}