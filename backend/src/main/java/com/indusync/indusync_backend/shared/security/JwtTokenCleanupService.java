package com.indusync.indusync_backend.shared.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

/**
 * Service for scheduled cleanup of expired JWT tokens.
 * Runs periodically to remove expired tokens from the database.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "security.jwt.cleanup.enabled", havingValue = "true", matchIfMissing = true)
public class JwtTokenCleanupService {

    private final JwtBlacklistService jwtBlacklistService;

    /**
     * Clean up expired tokens every 6 hours
     */
    @Scheduled(fixedRate = 21600000) // 6 hours in milliseconds
    public void cleanupExpiredTokens() {
        log.info("Starting JWT token cleanup job");
        try {
            int deletedCount = jwtBlacklistService.cleanupExpiredTokens();
            log.info("JWT token cleanup completed. Deleted {} expired tokens", deletedCount);
        } catch (Exception e) {
            log.error("JWT token cleanup failed: {}", e.getMessage(), e);
        }
    }

    /**
     * Clean up expired tokens on application startup (after a 5-minute delay)
     */
    @Scheduled(initialDelay = 300000, fixedRate = Long.MAX_VALUE) // Run once after 5 minutes
    public void initialCleanup() {
        log.info("Performing initial JWT token cleanup");
        cleanupExpiredTokens();
    }
}