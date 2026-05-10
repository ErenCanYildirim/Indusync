package com.indusync.indusync_backend.shared.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for cache configuration.
 * <p>
 * This test verifies that the cache configuration loads correctly
 * and that the cache manager is properly configured.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@SpringBootTest
@ActiveProfiles("test")
class CacheConfigIntegrationTest {

    @Autowired
    private CacheManager cacheManager;

    /**
     * Test that cache manager is properly configured and available.
     */
    @Test
    void testCacheManagerConfiguration() {
        assertNotNull(cacheManager, "Cache manager should be configured");

        // Verify cache manager type
        assertTrue(cacheManager.getClass().getSimpleName().contains("Caffeine"),
                "Should use Caffeine cache manager");
    }

    /**
     * Test that expected cache names are available.
     */
    @Test
    void testCacheNamesConfiguration() {
        // Test that we can get the expected caches (they will be created on-demand)
        var dashboardStatsCache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        var orderActivityCache = cacheManager.getCache(CacheConfig.ORDER_ACTIVITY_CACHE);

        assertNotNull(dashboardStatsCache, "Dashboard statistics cache should be available");
        assertNotNull(orderActivityCache, "Order activity cache should be available");

        // Verify cache names match expected constants
        assertEquals(CacheConfig.DASHBOARD_STATISTICS_CACHE, dashboardStatsCache.getName());
        assertEquals(CacheConfig.ORDER_ACTIVITY_CACHE, orderActivityCache.getName());
    }

    /**
     * Test basic cache operations.
     */
    @Test
    void testBasicCacheOperations() {
        var cache = cacheManager.getCache(CacheConfig.DASHBOARD_STATISTICS_CACHE);
        assertNotNull(cache);

        String testKey = "test-key";
        String testValue = "test-value";

        // Test put and get
        cache.put(testKey, testValue);
        var retrievedValue = cache.get(testKey, String.class);
        assertEquals(testValue, retrievedValue);

        // Test evict
        cache.evict(testKey);
        var evictedValue = cache.get(testKey);
        assertNull(evictedValue);
    }

    /**
     * Test that cache constants are properly defined.
     */
    @Test
    void testCacheConstants() {
        assertEquals("dashboard-statistics", CacheConfig.DASHBOARD_STATISTICS_CACHE);
        assertEquals("order-activity", CacheConfig.ORDER_ACTIVITY_CACHE);
    }
}