package com.indusync.indusync_backend.shared.security;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting service for JWT token operations.
 * Implements sliding window rate limiting for token refresh and other security operations.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Slf4j
public class JwtRateLimitService {
     @Value("${security.jwt.rate-limit.refresh.max-attempts:10}")
    private int maxRefreshAttempts;

    @Value("${security.jwt.rate-limit.refresh.window-minutes:15}")
    private int refreshWindowMinutes;

    @Value("${security.jwt.rate-limit.ip.max-attempts:50}")
    private int maxIpAttempts;

    @Value("${security.jwt.rate-limit.ip.window-minutes:60}")
    private int ipWindowMinutes;

    // In-memory storage for rate limiting (add Redis later)
    private final Map<String, RateLimitEntry> userRefreshLimits = new ConcurrentHashMap<>();
    private final Map<String, RateLimitEntry> ipLimits = new ConcurrentHashMap<>();

    /**
     * Check if user can perform token refresh
     */
    public boolean canRefreshToken(UUID userId) {
        String key = "user:" + userId.toString();
        return checkRateLimit(key, userRefreshLimits, maxRefreshAttempts, refreshWindowMinutes);
    }

    /**
     * Record a token refresh attempt for a user
     */
    public void recordRefreshAttempt(UUID userId) {
        String key = "user:" + userId.toString();
        recordAttempt(key, userRefreshLimits);
        log.debug("Recorded refresh attempt for user: {}", userId);
    }

    /**
     * Check if IP address can perform JWT operations
     */
    public boolean canPerformJwtOperation(String ipAddress) {
        return checkRateLimit(ipAddress, ipLimits, maxIpAttempts, ipWindowMinutes);
    }

    /**
     * Record a JWT operation attempt for an IP address
     */
    public void recordJwtOperation(String ipAddress) {
        recordAttempt(ipAddress, ipLimits);
        log.debug("Recorded JWT operation for IP: {}", ipAddress);
    }

    /**
     * Get remaining refresh attempts for a user
     */
    public int getRemainingFreshAttempts(UUID userId) {
        String key = "user:" + userId.toString();
        RateLimitEntry entry = userRefreshLimits.get(key);
        if (entry == null || isWindowExpired(entry, refreshWindowMinutes)) {
            return maxRefreshAttempts;
        }
        return Math.max(0, maxRefreshAttempts - entry.getAttemptCount());
    }

    /**
     * Get time until refresh rate limit resets for a user
     */
    public long getRefreshResetTimeMinutes(UUID userId) {
        String key = "user:" + userId.toString();
        RateLimitEntry entry = userRefreshLimits.get(key);
        if (entry == null) {
            return 0;
        }
        
        LocalDateTime resetTime = entry.getWindowStart().plusMinutes(refreshWindowMinutes);
        long minutesUntilReset = ChronoUnit.MINUTES.between(LocalDateTime.now(), resetTime);
        return Math.max(0, minutesUntilReset);
    }

    /**
     * Clear rate limit for a user (admin operation)
     */
    public void clearUserRateLimit(UUID userId) {
        String key = "user:" + userId.toString();
        userRefreshLimits.remove(key);
        log.info("Cleared rate limit for user: {}", userId);
    }

     /**
     * Clear rate limit for an IP address (admin operation)
     */
    public void clearIpRateLimit(String ipAddress) {
        ipLimits.remove(ipAddress);
        log.info("Cleared rate limit for IP: {}", ipAddress);
    }

     /**
     * Check rate limit for a given key
     */
    private boolean checkRateLimit(String key, Map<String, RateLimitEntry> limitMap, 
                                  int maxAttempts, int windowMinutes) {
        RateLimitEntry entry = limitMap.get(key);
        
        if (entry == null || isWindowExpired(entry, windowMinutes)) {
            return true; // No limit or window expired
        }
        
        return entry.getAttemptCount() < maxAttempts;
    }

    /**
     * Record an attempt for a given key
     */
    private void recordAttempt(String key, Map<String, RateLimitEntry> limitMap) {
        LocalDateTime now = LocalDateTime.now();
        
        limitMap.compute(key, (k, entry) -> {
            if (entry == null) {
                return new RateLimitEntry(now, 1);
            } else if (isWindowExpired(entry, getWindowMinutes(limitMap))) {
                return new RateLimitEntry(now, 1);
            } else {
                entry.incrementAttempts();
                return entry;
            }
        });
    }

    /**
     * Check if the rate limit window has expired
     */
    private boolean isWindowExpired(RateLimitEntry entry, int windowMinutes) {
        return entry.getWindowStart().plusMinutes(windowMinutes).isBefore(LocalDateTime.now());
    }

    /**
     * Get window minutes based on the limit map
     */
    private int getWindowMinutes(Map<String, RateLimitEntry> limitMap) {
        return limitMap == userRefreshLimits ? refreshWindowMinutes : ipWindowMinutes;
    }

    /**
     * Cleanup expired entries (should be called periodically)
     */
    public void cleanupExpiredEntries() {
        LocalDateTime now = LocalDateTime.now();
        
        userRefreshLimits.entrySet().removeIf(entry -> 
            entry.getValue().getWindowStart().plusMinutes(refreshWindowMinutes).isBefore(now));
            
        ipLimits.entrySet().removeIf(entry -> 
            entry.getValue().getWindowStart().plusMinutes(ipWindowMinutes).isBefore(now));
            
        log.debug("Cleaned up expired rate limit entries");
    }

    /**
     * Rate limit entry for tracking attempts within a time window
     */
    @Getter
    private static class RateLimitEntry {
        private final LocalDateTime windowStart;
        private int attemptCount;

        public RateLimitEntry(LocalDateTime windowStart, int attemptCount) {
            this.windowStart = windowStart;
            this.attemptCount = attemptCount;
        }

        public void incrementAttempts() {
            this.attemptCount++;
        }
    }
}