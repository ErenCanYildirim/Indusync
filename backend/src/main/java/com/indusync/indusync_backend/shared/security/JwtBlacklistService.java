package com.indusync.indusync_backend.shared.security;

import com.indusync.indusync_backend.authentication.domain.JwtToken;
import com.indusync.indusync_backend.authentication.domain.JwtTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing JWT token blacklist and revocation operations.
 * Provides comprehensive token tracking and security management.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class JwtBlacklistService {

    private final JwtTokenRepository jwtTokenRepository;
    private final JwtService jwtService;

    /**
     * Store a newly issues token for tracking
     */
     @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void storeToken(String token, UUID userId, String ipAddress, String userAgent, String deviceFingerprint) {
        try {
            TokenSecurityMetadata metadata = jwtService.getTokenSecurityMetadata(token);
            String tokenType = jwtService.getTokenType(token);
            String jwtId = metadata.jwtId();
            if (jwtId == null || jwtId.isBlank()) {
                log.debug("Skipping token store: missing jti for user {}", userId);
                return;
            }

            // Idempotency: skip insert if token already stored
            if (jwtTokenRepository.findByTokenId(jwtId).isPresent()) {
                log.debug("Token with ID {} already stored for user {}", jwtId, userId);
                return;
            }

            JwtToken jwtToken = JwtToken.builder()
                    .tokenId(jwtId)
                    .userId(userId)
                    .tokenType(JwtToken.TokenType.valueOf(tokenType.toUpperCase()))
                    .issuedAt(convertToLocalDateTime(metadata.issuedAt()))
                    .expiresAt(convertToLocalDateTime(metadata.expiresAt()))
                    .notBefore(convertToLocalDateTime(metadata.notBefore()))
                    .audience(metadata.audience())
                    .issuer(metadata.issuer())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .deviceFingerprint(deviceFingerprint)
                    .revoked(false)
                    .usageCount(0)
                    .build();

            jwtTokenRepository.save(jwtToken);
            log.debug("Stored token with ID: {} for user: {}", jwtId, userId);
        } catch (Exception e) {
            log.error("Failed to store token for user {}: {}", userId, e.getMessage());
            // Don't throw exception to avoid breaking the authentication flow
        }
    }

    /**
     * Check if a token is blacklisted
     */
    public boolean isTokenBlacklisted(String token) {
        try {
            String jwtId = jwtService.extractJwtId(token);
            if (jwtId == null) {
                log.debug("Token has no JWT ID, considering not blacklisted for backward compatibility");
                return false;
            }

            return jwtTokenRepository.isTokenBlacklisted(jwtId);
        } catch (Exception e) {
            log.debug("Error checking token blacklist status: {}", e.getMessage());
            return false; // Fail open for backward compatibility
        }
    }

    /**
     * Revoke a specific token
     */
    @Transactional
    public boolean revokeToken(String token, String reason) {
        try {
            String jwtId = jwtService.extractJwtId(token);
            if (jwtId == null) {
                log.debug("Cannot revoke token without JWT ID");
                return false;
            }

            Optional<JwtToken> tokenEntity = jwtTokenRepository.findByTokenId(jwtId);
            if (tokenEntity.isPresent()) {
                JwtToken jwtToken = tokenEntity.get();
                jwtToken.revoke(reason);
                jwtTokenRepository.save(jwtToken);
                log.info("Revoked token {} for user {} with reason: {}", jwtId, jwtToken.getUserId(), reason);
                return true;
            } else {
                log.debug("Token {} not found in database", jwtId);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to revoke token: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Revoke all tokens for a user
     */
    @Transactional
    public int revokeAllUserTokens(UUID userId, String reason) {
        try {
            int revokedCount = jwtTokenRepository.revokeAllUserTokens(userId, reason, LocalDateTime.now());
            log.info("Revoked {} tokens for user {} with reason: {}", revokedCount, userId, reason);
            return revokedCount;
        } catch (Exception e) {
            log.error("Failed to revoke all tokens for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }

    /**
     * Revoke all refresh tokens for a user (useful for logout)
     */
    @Transactional
    public int revokeAllRefreshTokens(UUID userId, String reason) {
        try {
            int revokedCount = jwtTokenRepository.revokeUserTokensByType(
                    userId, JwtToken.TokenType.REFRESH, reason, LocalDateTime.now());
            log.info("Revoked {} refresh tokens for user {} with reason: {}", revokedCount, userId, reason);
            return revokedCount;
        } catch (Exception e) {
            log.error("Failed to revoke refresh tokens for user {}: {}", userId, e.getMessage());
            return 0;
        }
    }

     /**
     * Get all active tokens for a user
     */
    public List<JwtToken> getActiveUserTokens(UUID userId) {
        return jwtTokenRepository.findActiveTokensByUserId(userId, LocalDateTime.now());
    }

    /**
     * Get token information by JWT ID
     */
    public Optional<JwtToken> getTokenInfo(String jwtId) {
        return jwtTokenRepository.findByTokenId(jwtId);
    }

    /**
     * Record token usage for analytics
     */
    @Transactional
    public void recordTokenUsage(String token) {
        try {
            String jwtId = jwtService.extractJwtId(token);
            if (jwtId != null) {
                jwtTokenRepository.updateTokenUsage(jwtId, LocalDateTime.now());
            }
        } catch (Exception e) {
            log.debug("Failed to record token usage: {}", e.getMessage());
            // Don't throw exception to avoid breaking request flow
        }
    }

    /**
     * Clean up expired tokens
     */
    @Transactional
    public int cleanupExpiredTokens() {
        try {
            // Delete tokens that expired more than 7 days ago
            LocalDateTime cutoffTime = LocalDateTime.now().minusDays(7);
            int deletedCount = jwtTokenRepository.deleteExpiredTokens(cutoffTime);
            log.info("Cleaned up {} expired tokens", deletedCount);
            return deletedCount;
        } catch (Exception e) {
            log.error("Failed to cleanup expired tokens: {}", e.getMessage());
            return 0;
        }
    }

    /**
     * Get tokens for security analysis
     */
    public List<JwtToken> getTokensByIpAddress(String ipAddress, int hours) {
        LocalDateTime since = LocalDateTime.now().minusHours(hours);
        return jwtTokenRepository.findTokensByIpAddressSince(ipAddress, since);
    }

    /**
     * Get tokens by device fingerprint
     */
    public List<JwtToken> getTokensByDeviceFingerprint(String deviceFingerprint) {
        return jwtTokenRepository.findByDeviceFingerprintAndRevokedFalseOrderByIssuedAtDesc(deviceFingerprint);
    }

    /**
     * Count active tokens for a user
     */
    public long countActiveUserTokens(UUID userId) {
        return jwtTokenRepository.countActiveTokensByUserId(userId, LocalDateTime.now());
    }

    /**
     * Check if user has too many active tokens
     */
    public boolean hasExceededTokenLimit(UUID userId, int maxTokens) {
        return countActiveUserTokens(userId) >= maxTokens;
    }

    /**
     * Revoke oldest tokens if limit exceeded
     */
    @Transactional
    public void enforceTokenLimit(UUID userId, int maxTokens) {
        List<JwtToken> activeTokens = getActiveUserTokens(userId);
        if (activeTokens.size() > maxTokens) {
            // Sort by issued date and revoke oldest tokens
            activeTokens.sort((a, b) -> a.getIssuedAt().compareTo(b.getIssuedAt()));
            int tokensToRevoke = activeTokens.size() - maxTokens;

            for (int i = 0; i < tokensToRevoke; i++) {
                JwtToken token = activeTokens.get(i);
                token.revoke("Token limit exceeded");
                jwtTokenRepository.save(token);
            }

            log.info("Revoked {} oldest tokens for user {} due to limit exceeded", tokensToRevoke, userId);
        }
    }

    /**
     * Convert java.util.Date to LocalDateTime
     */
    private LocalDateTime convertToLocalDateTime(java.util.Date date) {
        if (date == null) {
            return null;
        }
        return LocalDateTime.ofInstant(date.toInstant(), java.time.ZoneId.systemDefault());
    }
}