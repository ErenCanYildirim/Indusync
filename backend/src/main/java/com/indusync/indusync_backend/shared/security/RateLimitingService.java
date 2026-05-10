package com.indusync.indusync_backend.shared.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitingService {

    private final StringRedisTemplate redis;

    @Value("${security.jwt.rate-limiting.max-requests-per-minute:100}")
    private int maxRequestsPerMinute;

    // Authentication rate limiting - 10 attempts per 15 minutes per IP (fixed
    // window)
    public boolean canAttemptAuthentication(String ipAddress) {
        return !allow("rl:auth:" + ipAddress, 10, Duration.ofMinutes(15));
    }

    // Token refresh rate limiting - 5 refreshes per hour per user (fixed window)
    public boolean canRefreshToken(String userId) {
        return allow("rl:refresh:" + userId, 5, Duration.ofHours(1));
    }

    // General API rate limiting - per-minute per IP (fixed window)
    public boolean canMakeRequest(String ipAddress) {
        return !allow("rl:api:" + ipAddress, maxRequestsPerMinute, Duration.ofMinutes(1));
    }

    public long getRemainingAttempts(String ipAddress) {
        String key = "rl:auth:" + ipAddress;
        String current = redis.opsForValue().get(key);
        long used = current != null ? parseLongSafely(current) : 0L;
        long remaining = 10 - used;
        return Math.max(remaining, 0);
    }

    public boolean allow(String key, int capacity, Duration window) {
        try {
            Long count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                // first hit in window -> set expiry
                redis.expire(key, window.toSeconds(), TimeUnit.SECONDS);
            }
            return count != null && count <= capacity;
        } catch (Exception e) {
            log.error("Rate limiting error for key {}: {}", key, e.getMessage());
            // Fail-open to avoid blocking legitimate traffic due to Redis outage
            return true;
        }
    }

    private long parseLongSafely(String value) {
        try {
            return Long.parseLong(value);
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }
}