package com.indusync.indusync_backend.authentication.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for JWT token management and blacklist operations.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface JwtTokenRepository extends JpaRepository<JwtToken, UUID> {

    /**
     * Find token by JWT ID
     */
    Optional<JwtToken> findByTokenId(String tokenId);

    /**
     * Find all active tokens for a user
     */
    @Query("SELECT t FROM JwtToken t WHERE t.userId = :userId AND t.revoked = false AND t.expiresAt > :now")
    List<JwtToken> findActiveTokensByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    /**
     * Find all tokens for a user (active and revoked)
     */
    List<JwtToken> findByUserIdOrderByIssuedAtDesc(UUID userId);

    /**
     * Find active tokens by type for a user
     */
    @Query("SELECT t FROM JwtToken t WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.revoked = false AND t.expiresAt > :now")
    List<JwtToken> findActiveTokensByUserIdAndType(@Param("userId") UUID userId, 
                                                   @Param("tokenType") JwtToken.TokenType tokenType,
                                                   @Param("now") LocalDateTime now);

    /**
     * Check if token is blacklisted (revoked)
     */
    @Query("SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END FROM JwtToken t WHERE t.tokenId = :tokenId AND t.revoked = true")
    boolean isTokenBlacklisted(@Param("tokenId") String tokenId);

    /**
     * Find expired tokens for cleanup
     */
    @Query("SELECT t FROM JwtToken t WHERE t.expiresAt < :cutoffTime")
    List<JwtToken> findExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Find tokens expiring soon for rotation
     */
    @Query("SELECT t FROM JwtToken t WHERE t.expiresAt BETWEEN :now AND :rotationTime AND t.revoked = false AND t.tokenType = 'ACCESS'")
    List<JwtToken> findTokensForRotation(@Param("now") LocalDateTime now, @Param("rotationTime") LocalDateTime rotationTime);

    /**
     * Revoke all tokens for a user
     */
    @Modifying
    @Query("UPDATE JwtToken t SET t.revoked = true, t.revocationReason = :reason, t.revokedAt = :revokedAt WHERE t.userId = :userId AND t.revoked = false")
    int revokeAllUserTokens(@Param("userId") UUID userId, @Param("reason") String reason, @Param("revokedAt") LocalDateTime revokedAt);

    /**
     * Revoke tokens by type for a user
     */
    @Modifying
    @Query("UPDATE JwtToken t SET t.revoked = true, t.revocationReason = :reason, t.revokedAt = :revokedAt WHERE t.userId = :userId AND t.tokenType = :tokenType AND t.revoked = false")
    int revokeUserTokensByType(@Param("userId") UUID userId, 
                               @Param("tokenType") JwtToken.TokenType tokenType,
                               @Param("reason") String reason, 
                               @Param("revokedAt") LocalDateTime revokedAt);

    /**
     * Delete expired tokens (cleanup)
     */
    @Modifying
    @Query("DELETE FROM JwtToken t WHERE t.expiresAt < :cutoffTime")
    int deleteExpiredTokens(@Param("cutoffTime") LocalDateTime cutoffTime);

    /**
     * Count active tokens for a user
     */
    @Query("SELECT COUNT(t) FROM JwtToken t WHERE t.userId = :userId AND t.revoked = false AND t.expiresAt > :now")
    long countActiveTokensByUserId(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    /**
     * Find tokens by IP address for security analysis
     */
    @Query("SELECT t FROM JwtToken t WHERE t.ipAddress = :ipAddress AND t.issuedAt > :since ORDER BY t.issuedAt DESC")
    List<JwtToken> findTokensByIpAddressSince(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);

    /**
     * Find tokens by device fingerprint
     */
    List<JwtToken> findByDeviceFingerprintAndRevokedFalseOrderByIssuedAtDesc(String deviceFingerprint);

    /**
     * Update token usage statistics
     */
    @Modifying
    @Query("UPDATE JwtToken t SET t.lastUsedAt = :lastUsedAt, t.usageCount = t.usageCount + 1 WHERE t.tokenId = :tokenId")
    int updateTokenUsage(@Param("tokenId") String tokenId, @Param("lastUsedAt") LocalDateTime lastUsedAt);
}