package com.indusync.indusync_backend.company.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
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

/**
 * Redis cache configuration for company-related operations.
 *
 * This configuration sets up different cache regions with appropriate TTL values:
 * - companyPublic: 30 minutes (frequently accessed public data)
 * - companySearch: 15 minutes (search results that change frequently)
 * - companyNearby: 10 minutes (geographic searches that may change)
 * - companyName: 1 hour (company names change infrequently)
 * - companyContactEmail: 30 minutes (contact info may change occasionally)
 */
@Configuration
@EnableCaching
public class CompanyCacheConfig {

    @Bean
    public CacheManager companyCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(30)) // Default TTL: 30 minutes
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new GenericJackson2JsonRedisSerializer()))
                .disableCachingNullValues();

        // Configure specific cache regions with different TTL values
        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();

        // Public company information - cached for 30 minutes
        cacheConfigurations.put("companyPublic", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        // Company search results - cached for 15 minutes (changes frequently)
        cacheConfigurations.put("companySearch", defaultConfig.entryTtl(Duration.ofMinutes(15)));

        // Nearby company searches - cached for 10 minutes (location-based, may change)
        cacheConfigurations.put("companyNearby", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        // Company names - cached for 1 hour (rarely changes)
        cacheConfigurations.put("companyName", defaultConfig.entryTtl(Duration.ofHours(1)));

        // Company contact emails - cached for 30 minutes
        cacheConfigurations.put("companyContactEmail", defaultConfig.entryTtl(Duration.ofMinutes(30)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }
}