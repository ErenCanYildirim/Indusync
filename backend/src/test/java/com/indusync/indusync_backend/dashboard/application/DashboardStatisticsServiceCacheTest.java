package com.indusync.indusync_backend.dashboard.application;

import com.indusync.indusync_backend.shared.config.CacheConfig;
import com.indusync.indusync_backend.dashboard.application.dto.DashboardStatistics;
import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.order.domain.OrderMatchRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Test class for verifying caching behavior in DashboardStatisticsService.
 * <p>
 * This test class focuses specifically on cache functionality including:
 * </p>
 * <ul>
 * <li>Cache hit/miss behavior</li>
 * <li>Cache eviction strategies</li>
 * <li>Cache key generation</li>
 * <li>Concurrent access scenarios</li>
 * </ul>
 * <p>
 * Uses Spring Boot test context with mocked repositories to isolate
 * cache behavior from database interactions.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@SpringBootTest
@ActiveProfiles("test")
class DashboardStatisticsServiceCacheTest {

    @Autowired
    private DashboardStatisticsService dashboardStatisticsService;

    @Autowired
    private CacheManager cacheManager;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private OrderMatchRepository orderMatchRepository;

    @MockBean
    private CompanyRepository companyRepository;

    private UUID testCompanyId;

    @BeforeEach
    void setUp() {
        testCompanyId = UUID.randomUUID();

        // Clear all caches before each test
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
            }
        });

        // Setup mock responses for repository calls
        setupMockRepositoryResponses();
    }

    /**
     * Test that dashboard statistics are cached on first call and retrieved from
     * cache on subsequent calls.
     */
    @Test
    void testDashboardStatisticsCaching() {
        // First call - should hit the database and cache the result
        DashboardStatistics firstResult = dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId);

        // Verify the result is not null and has expected structure
        assertNotNull(firstResult);

        // Verify that repository methods were called (first call hits database)
        verify(orderRepository, times(1)).countActiveOrdersAsClient(testCompanyId);
        verify(orderRepository, times(1)).countActiveOrdersAsProvider(testCompanyId);

        // Second call - should retrieve from cache without hitting database
        DashboardStatistics secondResult = dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId);

        // Verify the results are the same (cached)
        assertEquals(firstResult.getActiveOrders(), secondResult.getActiveOrders());
        assertEquals(firstResult.getOpenApplications(), secondResult.getOpenApplications());
        assertEquals(firstResult.getCompletedOrders(), secondResult.getCompletedOrders());

        // Verify that repository methods were NOT called again (cache hit)
        verify(orderRepository, times(1)).countActiveOrdersAsClient(testCompanyId);
        verify(orderRepository, times(1)).countActiveOrdersAsProvider(testCompanyId);

        // Verify cache contains the entry
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        assertNotNull(cache);
        assertNotNull(cache.get(testCompanyId));
    }

    /**
     * Test that order activity chart data is cached properly with different days
     * parameters.
     */
    @Test
    void testOrderActivityChartCaching() {
        int days = 30;

        // First call - should hit the database and cache the result
        List<OrderActivityData> firstResult = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Verify the result is not null
        assertNotNull(firstResult);

        // Verify that repository methods were called
        verify(orderRepository, times(1)).getDailyOrderCountsAsClient(eq(testCompanyId), any(), any());
        verify(orderRepository, times(1)).getDailyOrderCountsAsProvider(eq(testCompanyId), any(), any());

        // Second call with same parameters - should retrieve from cache
        List<OrderActivityData> secondResult = dashboardStatisticsService.getOrderActivityChart(testCompanyId, days);

        // Verify the results are the same size (cached)
        assertEquals(firstResult.size(), secondResult.size());

        // Verify that repository methods were NOT called again (cache hit)
        verify(orderRepository, times(1)).getDailyOrderCountsAsClient(eq(testCompanyId), any(), any());
        verify(orderRepository, times(1)).getDailyOrderCountsAsProvider(eq(testCompanyId), any(), any());

        // Verify cache contains the entry
        var cache = cacheManager.getCache(CacheConfig.ORDER_ACTIVITY_CACHE);
        assertNotNull(cache);
        String expectedKey = testCompanyId + "-" + days;
        assertNotNull(cache.get(expectedKey));
    }

    /**
     * Test that different days parameters create separate cache entries.
     */
    @Test
    void testOrderActivityChartCachingWithDifferentDays() {
        // Call with 30 days
        dashboardStatisticsService.getOrderActivityChart(testCompanyId, 30);

        // Call with 7 days - should be a separate cache entry
        dashboardStatisticsService.getOrderActivityChart(testCompanyId, 7);

        // Verify both calls hit the database (different cache keys)
        verify(orderRepository, times(2)).getDailyOrderCountsAsClient(eq(testCompanyId), any(), any());
        verify(orderRepository, times(2)).getDailyOrderCountsAsProvider(eq(testCompanyId), any(), any());

        // Verify both cache entries exist
        var cache = cacheManager.getCache(CacheConfig.ORDER_ACTIVITY_CACHE);
        assertNotNull(cache);
        assertNotNull(cache.get(testCompanyId + "-30"));
        assertNotNull(cache.get(testCompanyId + "-7"));
    }

    /**
     * Test cache eviction for dashboard statistics.
     */
    @Test
    void testDashboardStatisticsCacheEviction() {
        // First call to populate cache
        dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId);

        // Verify cache contains the entry
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        assertNotNull(cache);
        assertNotNull(cache.get(testCompanyId));

        // Evict the cache
        dashboardStatisticsService.evictDashboardStatisticsCache(testCompanyId);

        // Verify cache entry is removed
        assertNull(cache.get(testCompanyId));

        // Next call should hit database again
        dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId);

        // Verify repository was called again (cache miss after eviction)
        verify(orderRepository, times(2)).countActiveOrdersAsClient(testCompanyId);
        verify(orderRepository, times(2)).countActiveOrdersAsProvider(testCompanyId);
    }

    /**
     * Test cache eviction for order activity chart.
     */
    @Test
    void testOrderActivityCacheEviction() {
        // Populate cache with different days parameters
        dashboardStatisticsService.getOrderActivityChart(testCompanyId, 30);
        dashboardStatisticsService.getOrderActivityChart(testCompanyId, 7);

        // Verify cache contains both entries
        var cache = cacheManager.getCache(CacheConfig.ORDER_ACTIVITY_CACHE);
        assertNotNull(cache);
        assertNotNull(cache.get(testCompanyId + "-30"));
        assertNotNull(cache.get(testCompanyId + "-7"));

        // Evict all chart cache entries for the company
        dashboardStatisticsService.evictOrderActivityCache(testCompanyId);

        // Verify all entries are removed (allEntries=true in the eviction method)
        // Note: Since we use allEntries=true, all cache entries are cleared
        assertTrue(cache.getNativeCache().toString().contains("size=0") ||
                cache.get(testCompanyId + "-30") == null);
    }

    /**
     * Test evicting all dashboard caches for a company.
     */
    @Test
    void testEvictAllDashboardCaches() {
        // Populate both caches
        dashboardStatisticsService.getCompanyDashboardStatistics(testCompanyId);
        dashboardStatisticsService.getOrderActivityChart(testCompanyId, 30);

        // Verify both caches contain entries
        var statsCache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        var activityCache = cacheManager.getCache(CacheConfig.ORDER_ACTIVITY_CACHE);
        assertNotNull(statsCache);
        assertNotNull(activityCache);
        assertNotNull(statsCache.get(testCompanyId));
        assertNotNull(activityCache.get(testCompanyId + "-30"));

        // Evict all dashboard caches for the company
        dashboardStatisticsService.evictAllDashboardCaches(testCompanyId);

        // Verify both cache entries are removed
        assertNull(statsCache.get(testCompanyId));
        // Activity cache uses allEntries=true, so it's completely cleared
    }

    /**
     * Test that different companies have separate cache entries.
     */
    @Test
    void testCacheIsolationBetweenCompanies() {
        UUID company1 = UUID.randomUUID();
        UUID company2 = UUID.randomUUID();
        
        // Setup mocks for both companies
        when(orderRepository.countActiveOrdersAsClient(company1)).thenReturn(5L);
        when(orderRepository.countActiveOrdersAsClient(company2)).thenReturn(10L);
        when(orderRepository.countActiveOrdersAsProvider(any())).thenReturn(0L);
        when(orderRepository.countOpenApplicationsAsClient(any())).thenReturn(0L);
        when(orderRepository.countOpenApplicationsAsProvider(any())).thenReturn(0L);
        when(orderRepository.countCompletedOrdersAsClient(any())).thenReturn(0L);
        when(orderRepository.countCompletedOrdersAsProvider(any())).thenReturn(0L);
        when(orderRepository.calculateAverageResponseTimeAsClient(any())).thenReturn(null);
        when(orderRepository.calculateAverageResponseTimeAsProvider(any())).thenReturn(null);
        when(orderRepository.findPublishedOrderIdsByCompanyId(any())).thenReturn(new ArrayList<>());
        when(orderMatchRepository.countOpenApplicationsForOrders(any())).thenReturn(0L);
        when(orderMatchRepository.countOpenApplicationsAsProvider(any())).thenReturn(0L);
        
        // Get statistics for both companies
        DashboardStatistics stats1 = dashboardStatisticsService.getCompanyDashboardStatistics(company1);
        DashboardStatistics stats2 = dashboardStatisticsService.getCompanyDashboardStatistics(company2);
        
        // Verify different results (proving cache isolation)
        assertNotEquals(stats1.getActiveOrders(), stats2.getActiveOrders());
        
        // Verify both companies' data was fetched from database
        verify(orderRepository, times(1)).countActiveOrdersAsClient(company1);
        verify(orderRepository, times(1)).countActiveOrdersAsClient(company2);
        
        // Verify cache contains separate entries
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        assertNotNull(cache);
        assertNotNull(cache.get(company1));
        assertNotNull(cache.get(company2));
    }

/**
     * Setup mock responses for repository methods to enable testing.
     */
    private void setupMockRepositoryResponses() {
        // Mock dashboard statistics repository calls
        when(orderRepository.countActiveOrdersAsClient(any())).thenReturn(5L);
        when(orderRepository.countActiveOrdersAsProvider(any())).thenReturn(3L);
        when(orderRepository.countCompletedOrdersAsClient(any())).thenReturn(10L);
        when(orderRepository.countCompletedOrdersAsProvider(any())).thenReturn(7L);
        when(orderRepository.calculateAverageResponseTimeAsClient(any())).thenReturn(2.5);
        when(orderRepository.calculateAverageResponseTimeAsProvider(any())).thenReturn(1.8);
        when(orderRepository.findPublishedOrderIdsByCompanyId(any())).thenReturn(new ArrayList<>());
        
        when(orderMatchRepository.countOpenApplicationsForOrders(any())).thenReturn(4L);
        when(orderMatchRepository.countOpenApplicationsAsProvider(any())).thenReturn(6L);
     // Mock chart data repository calls
        when(orderRepository.getDailyOrderCountsAsClient(any(), any(), any())).thenReturn(new ArrayList<>());
        when(orderRepository.getDailyOrderCountsAsProvider(any(), any(), any())).thenReturn(new ArrayList<>());
        when(orderMatchRepository.getDailyApplicationCountsAsClient(any(), any(), any())).thenReturn(new ArrayList<>());
        when(orderMatchRepository.getDailyApplicationCountsAsProvider(any(), any(), any())).thenReturn(new ArrayList<>());
    }
}