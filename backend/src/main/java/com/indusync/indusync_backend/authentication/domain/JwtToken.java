package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing JWT tokens with security metadata for tracking and revocation.
 * Supports token blacklisting and comprehensive audit trails.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "jwt_tokens", schema = "auth", indexes = {
    @Index(name = "idx_jwt_token_id", columnList = "token_id"),
    @Index(name = "idx_jwt_user_id", columnList = "user_id"),
    @Index(name = "idx_jwt_expires_at", columnList = "expires_at"),
    @Index(name = "idx_jwt_revoked", columnList = "revoked")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtToken extends AuditableEntity {

    /**
     * JWT ID (jti claim) - unique identifier for the token
     */
    @Column(name = "token_id", nullable = false, unique = true, length = 64)
    private String tokenId;

    /**
     * User ID associated with this token
     */
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /**
     * Type of token (ACCESS, REFRESH)
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false, length = 20)
    private TokenType tokenType;

    /**
     * When the token was issued (iat claim)
     */
    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    /**
     * When the token expires (exp claim)
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Not before timestamp (nbf claim)
     */
    @Column(name = "not_before")
    private LocalDateTime notBefore;

    /**
     * Token audience (aud claim)
     */
    @Column(name = "audience", length = 100)
    private String audience;

    /**
     * Token issuer (iss claim)
     */
    @Column(name = "issuer", length = 100)
    private String issuer;

    /**
     * Whether the token has been revoked
     */
    @Column(name = "revoked", nullable = false)
    @Builder.Default
    private Boolean revoked = false;

    /**
     * Reason for token revocation
     */
    @Column(name = "revocation_reason", length = 100)
    private String revocationReason;

    /**
     * When the token was revoked
     */
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /**
     * Device fingerprint associated with the token
     */
    @Column(name = "device_fingerprint", length = 255)
    private String deviceFingerprint;

    /**
     * IP address from which the token was issued
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User agent from which the token was issued
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Last time this token was used
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    /**
     * Number of times this token has been used
     */
    @Column(name = "usage_count", nullable = false)
    @Builder.Default
    private Integer usageCount = 0;

    // === Business Methods ===

    /**
     * Revoke the token with a specific reason
     */
    public void revoke(String reason) {
        this.revoked = true;
        this.revocationReason = reason;
        this.revokedAt = LocalDateTime.now();
    }

    /**
     * Check if the token is currently valid (not expired and not revoked)
     */
    public boolean isValid() {
        return !revoked && expiresAt.isAfter(LocalDateTime.now()) && 
               (notBefore == null || notBefore.isBefore(LocalDateTime.now()));
    }

    /**
     * Check if the token has expired
     */
    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * Check if the token is not yet valid (nbf check)
     */
    public boolean isNotYetValid() {
        return notBefore != null && notBefore.isAfter(LocalDateTime.now());
    }

    /**
     * Record token usage
     */
    public void recordUsage() {
        this.lastUsedAt = LocalDateTime.now();
        this.usageCount++;
    }

    /**
     * Check if this is an access token
     */
    public boolean isAccessToken() {
        return TokenType.ACCESS.equals(tokenType);
    }

    /**
     * Check if this is a refresh token
     */
    public boolean isRefreshToken() {
        return TokenType.REFRESH.equals(tokenType);
    }

    /**
     * Get remaining validity in minutes
     */
    public long getRemainingValidityMinutes() {
        if (isExpired()) {
            return 0;
        }
        return java.time.Duration.between(LocalDateTime.now(), expiresAt).toMinutes();
    }

    /**
     * Token type enumeration
     */
    public enum TokenType {
        ACCESS,
        REFRESH
    }
}