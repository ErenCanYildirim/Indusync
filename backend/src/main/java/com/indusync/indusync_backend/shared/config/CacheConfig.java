package com.indusync.indusync_backend.shared.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.support.CompositeCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * Cache configuration for the IndusSync application.
 * <p>
 * This configuration sets up Caffeine as the cache provider with specific
 * cache configurations for different types of data. The caching strategy
 * is designed to improve performance for frequently accessed data while
 * maintaining data freshness and security boundaries.
 * </p>
 * <p>
 * <strong>Cache Configurations:</strong>
 * </p>
 * <ul>
 * <li><strong>dashboard-statistics</strong>: TTL 5 minutes, max 1000
 * entries</li>
 * <li><strong>order-activity</strong>: TTL 10 minutes, max 500 entries</li>
 * </ul>
 * <p>
 * <strong>Security Considerations:</strong>
 * </p>
 * <ul>
 * <li>Cache keys include company ID to prevent cross-company data leakage</li>
 * <li>TTL values are kept short to ensure data freshness</li>
 * <li>Cache eviction is handled automatically by TTL and manual eviction
 * strategies</li>
 * </ul>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Slf4j
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Cache name for dashboard statistics.
     * <p>
     * Used for caching company dashboard statistics including active orders,
     * open applications, completed orders, and average response time.
     * </p>
     * <p>
     * <strong>TTL:</strong> 5 minutes<br>
     * <strong>Max Size:</strong> 1000 entries<br>
     * <strong>Key Format:</strong> companyId (UUID)
     * </p>
     */
    public static final String DASHBOARD_STATISTICS_CACHE = "dashboard-statistics";

    /**
     * Cache name for order activity chart data.
     * <p>
     * Used for caching order activity chart data for different time periods.
     * </p>
     * <p>
     * <strong>TTL:</strong> 10 minutes<br>
     * <strong>Max Size:</strong> 500 entries<br>
     * <strong>Key Format:</strong> companyId-days (e.g., "uuid-30")
     * </p>
     */
    public static final String ORDER_ACTIVITY_CACHE = "order-activity";

    /**
     * Cache name for retrieving a single order by ID.
     */
    public static final String ORDER_BY_ID_CACHE = "order-by-id";

    /**
     * Cache name for retrieving orders for a company by role (paged).
     */
    public static final String MY_ORDERS_CACHE = "my-orders";

    /**
     * Cache name for retrieving orders for a company by role and status (paged).
     */
    public static final String MY_ORDERS_BY_STATUS_CACHE = "my-orders-by-status";

    /**
     * Cache name for retrieving completed orders for a company by role (paged).
     */
    public static final String MY_COMPLETED_ORDERS_CACHE = "my-completed-orders";

    /**
     * Cache name for available orders search (provider side).
     */
    public static final String AVAILABLE_ORDERS_CACHE = "available-orders";

    /**
     * Cache name for available order details (provider side, per company access).
     */
    public static final String AVAILABLE_ORDER_DETAILS_CACHE = "available-order-details";

    /**
     * Cache name for nearby orders for a company.
     */
    public static final String NEARBY_ORDERS_CACHE = "nearby-orders";

    // Authentication read caches (Redis-backed)
    public static final String AUTH_USER_PROFILE_CACHE = "auth:user-profile";
    public static final String AUTH_USER_SESSIONS_CACHE = "auth:user-sessions";
    public static final String AUTH_COMPANY_CONTEXT_CACHE = "auth:company-context";
    public static final String AUTH_USER_MEMBERSHIPS_CACHE = "auth:user-memberships";
    public static final String AUTH_CURRENT_MEMBERSHIP_CACHE = "auth:current-membership";

    /**
     * Configures the Caffeine cache manager with specific cache configurations.
     * <p>
     * Sets up different cache configurations for different types of data
     * with appropriate TTL values and size limits to balance performance
     * and memory usage.
     * </p>
     *
     * @return configured cache manager
     */
    @Bean
    public CacheManager cacheManager(RedisConnectionFactory redisConnectionFactory) {
        log.info("Configuring Composite cache manager (Redis + Caffeine)");

        // 1) Redis cache manager for auth-related caches
        RedisCacheConfiguration baseRedisConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        Map<String, RedisCacheConfiguration> redisConfigs = new HashMap<>();
        redisConfigs.put(AUTH_USER_PROFILE_CACHE, baseRedisConfig.entryTtl(Duration.ofMinutes(5)));
        redisConfigs.put(AUTH_USER_SESSIONS_CACHE, baseRedisConfig.entryTtl(Duration.ofMinutes(1)));
        redisConfigs.put(AUTH_COMPANY_CONTEXT_CACHE, baseRedisConfig.entryTtl(Duration.ofMinutes(10)));
        redisConfigs.put(AUTH_USER_MEMBERSHIPS_CACHE, baseRedisConfig.entryTtl(Duration.ofMinutes(5)));
        redisConfigs.put(AUTH_CURRENT_MEMBERSHIP_CACHE, baseRedisConfig.entryTtl(Duration.ofMinutes(5)));

        RedisCacheManager redisCacheManager = RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(baseRedisConfig)
                .withInitialCacheConfigurations(redisConfigs)
                .transactionAware()
                .build();

        // 2) Caffeine cache manager for dashboard/order caches
        CaffeineCacheManager caffeineCacheManager = new CaffeineCacheManager();
        caffeineCacheManager.setCacheSpecification(createDashboardStatisticsCacheSpec());
        caffeineCacheManager.setCacheNames(java.util.Arrays.asList(
                DASHBOARD_STATISTICS_CACHE,
                ORDER_ACTIVITY_CACHE,
                ORDER_BY_ID_CACHE,
                MY_ORDERS_CACHE,
                MY_ORDERS_BY_STATUS_CACHE,
                MY_COMPLETED_ORDERS_CACHE,
                AVAILABLE_ORDERS_CACHE,
                AVAILABLE_ORDER_DETAILS_CACHE,
                NEARBY_ORDERS_CACHE));
        caffeineCacheManager.setAllowNullValues(false);

        // 3) Composite cache manager: Redis first, then Caffeine
        CompositeCacheManager composite = new CompositeCacheManager(redisCacheManager, caffeineCacheManager);
        composite.setFallbackToNoOpCache(false);
        log.info("Composite cache manager configured: Redis (auth caches) + Caffeine (dashboard caches)");
        return composite;
    }

    /**
     * Creates cache specification for dashboard statistics.
     * <p>
     * Optimized for frequently accessed dashboard data with a balance
     * between performance and data freshness.
     * </p>
     *
     * @return cache specification string
     */
    private String createDashboardStatisticsCacheSpec() {
        return "maximumSize=1000,expireAfterWrite=5m,recordStats";
    }

    /**
     * Creates cache specification for order activity chart data.
     * <p>
     * Optimized for chart data which is less frequently accessed but
     * more expensive to calculate.
     * </p>
     *
     * @return cache specification string
     */
    // Note: order-activity previously used a separate spec. If distinct specs are
    // needed,
    // split cache managers or use CaffeineSpec per cache; for now we keep the
    // default.
}