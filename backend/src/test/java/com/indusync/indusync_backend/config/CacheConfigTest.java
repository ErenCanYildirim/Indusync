package com.indusync.indusync_backend.config;

import com.indusync.indusync_backend.shared.config.CacheConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for verifying cache configuration.
 * <p>
 * This test ensures that the cache configuration is properly loaded
 * and that the expected caches are available with correct settings.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@SpringBootTest
@ActiveProfiles("test")
class CacheConfigTest {

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
        var cacheNames = cacheManager.getCacheNames();
        
        assertNotNull(cacheNames, "Cache names should not be null");
        
        // Note: Cache names might be empty initially as Caffeine creates caches on-demand
        // The important thing is that the cache manager can create the expected caches
        
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