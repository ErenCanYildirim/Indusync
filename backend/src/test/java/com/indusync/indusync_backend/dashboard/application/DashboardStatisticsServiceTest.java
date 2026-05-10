package com.indusync.indusync_backend.dashboard.application;

import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.order.domain.OrderMatchRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Unit tests for DashboardStatisticsService order activity chart functionality.
 * Tests the implementation of task 4: order activity chart data generation.
 */
@ExtendWith(MockitoExtension.class)
class DashboardStatisticsServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderMatchRepository orderMatchRepository;

    @Mock
    private CompanyRepository companyRepository;

    private DashboardStatisticsService dashboardStatisticsService;

    private UUID testCompanyId;

    @BeforeEach
    void setUp() {
        dashboardStatisticsService = new DashboardStatisticsService(
                orderRepository, orderMatchRepository, companyRepository);
        testCompanyId = UUID.randomUUID();
    }

    @Test
    void getOrderActivityChart_WithValidInput_ReturnsCorrectData() {
        // Arrange
        int days = 7;

        // Mock client order data (orders created)
        Object[] clientOrderData1 = { java.sql.Date.valueOf("2024-01-01"), 2L };
        Object[] clientOrderData2 = { java.sql.Date.valueOf("2024-01-02"), 1L };
        when(orderRepository.getDailyOrderCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(clientOrderData1, clientOrderData2));

        // Mock provider order data (orders assigned)
        Object[] providerOrderData1 = { java.sql.Date.valueOf("2024-01-01"), 1L };
        when(orderRepository.getDailyOrderCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(providerOrderData1));

        // Mock client application data (applications received)
        Object[] clientAppData1 = { java.sql.Date.valueOf("2024-01-02"), 3L };
        when(orderMatchRepository.getDailyApplicationCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(clientAppData1));

        // Mock provider application data (applications sent)
        Object[] providerAppData1 = { java.sql.Date.valueOf("2024-01-01"), 2L };
        when(orderMatchRepository.getDailyApplicationCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(providerAppData1));

        // Act
        List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Assert
        assertNotNull(result);
        assertEquals(days, result.size());

        // Verify data structure and content
        assertTrue(result.stream().allMatch(data -> data.date() != null));
        assertTrue(result.stream().allMatch(data -> data.dateDisplay() != null));
        assertTrue(result.stream().allMatch(data -> data.auftraege() >= 0));
        assertTrue(result.stream().allMatch(data -> data.anfragen() >= 0));

        // Verify dates are in ascending order
        for (int i = 1; i < result.size(); i++) {
            assertTrue(result.get(i).date().isAfter(result.get(i - 1).date()));
        }
    }

    @Test
    void getOrderActivityChart_WithNullCompanyId_ThrowsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> dashboardStatisticsService.getOrderActivityChart(null, 30));
        assertEquals("Company ID must not be null", exception.getMessage());
    }

    @Test
    void getOrderActivityChart_WithZeroDays_ThrowsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> dashboardStatisticsService.getOrderActivityChart(testCompanyId, 0));
        assertEquals("Days must be positive", exception.getMessage());
    }

    @Test
    void getOrderActivityChart_WithNegativeDays_ThrowsException() {
        // Act & Assert
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> dashboardStatisticsService.getOrderActivityChart(testCompanyId, -5));
        assertEquals("Days must be positive", exception.getMessage());
    }

    @Test
    void getOrderActivityChart_WithNoData_ReturnsEmptyActivityData() {
        // Arrange
        int days = 5;

        // Mock empty data from all repositories
        when(orderRepository.getDailyOrderCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderRepository.getDailyOrderCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderMatchRepository.getDailyApplicationCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderMatchRepository.getDailyApplicationCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());

        // Act
        List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Assert
        assertNotNull(result);
        assertEquals(days, result.size());

        // All data should be zero
        assertTrue(result.stream().allMatch(data -> data.auftraege() == 0));
        assertTrue(result.stream().allMatch(data -> data.anfragen() == 0));
        assertTrue(result.stream().allMatch(data -> !data.hasActivity()));
    }

    @Test
    void getOrderActivityChart_RoleBasedCategorization_CorrectlyAggregatesData() {
        // Arrange
        int days = 3;
        LocalDate testDate = LocalDate.now().minusDays(1);

        // Mock data for role-based categorization test
        Object[] clientOrderData = { java.sql.Date.valueOf(testDate), 2L }; // 2 orders created as client
        Object[] providerOrderData = { java.sql.Date.valueOf(testDate), 1L }; // 1 order assigned as provider
        Object[] clientAppData = { java.sql.Date.valueOf(testDate), 3L }; // 3 applications received as client
        Object[] providerAppData = { java.sql.Date.valueOf(testDate), 2L }; // 2 applications sent as provider

        when(orderRepository.getDailyOrderCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(clientOrderData));
        when(orderRepository.getDailyOrderCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(providerOrderData));
        when(orderMatchRepository.getDailyApplicationCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(clientAppData));
        when(orderMatchRepository.getDailyApplicationCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of(providerAppData));

        // Act
        List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Assert
        assertNotNull(result);
        assertEquals(days, result.size());

        // Find the test date in results
        OrderActivityData testDateData = result.stream()
                .filter(data -> data.date().equals(testDate))
                .findFirst()
                .orElseThrow();

        // Verify role-based aggregation:
        // "Aufträge" = client orders (2) + provider orders (1) = 3
        // "Anfragen" = client applications (3) + provider applications (2) = 5
        assertEquals(3, testDateData.auftraege());
        assertEquals(5, testDateData.anfragen());
        assertTrue(testDateData.hasActivity());
        assertEquals(8, testDateData.getTotalActivity());
    }

    @Test
    void getOrderActivityChart_DateFormatting_UsesCorrectGermanFormat() {
        // Arrange
        int days = 1;

        // Mock empty data to focus on date formatting
        when(orderRepository.getDailyOrderCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderRepository.getDailyOrderCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderMatchRepository.getDailyApplicationCountsAsClient(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());
        when(orderMatchRepository.getDailyApplicationCountsAsProvider(eq(testCompanyId), any(LocalDateTime.class),
                any(LocalDateTime.class)))
                .thenReturn(List.of());

        // Act
        List<OrderActivityData> result = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.size());

        OrderActivityData data = result.get(0);
        assertNotNull(data.dateDisplay());

        // Verify German date format (dd.MM)
        assertTrue(data.dateDisplay().matches("\\d{2}\\.\\d{2}"));
    }
}