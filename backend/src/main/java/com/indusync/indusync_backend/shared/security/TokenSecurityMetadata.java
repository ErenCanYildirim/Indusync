package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

import java.util.Date;

/**
 * Value object containing JWT token security metadata.
 * Used for security analysis and audit logging.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record TokenSecurityMetadata(
    String jwtId,
    String issuer,
    String audience,
    Date issuedAt,
    Date expiresAt,
    Date notBefore,
    String ipAddress,
    String userAgent
) {
    
    /**
     * Check if a token has security metadata
     */
    public boolean hasSecurityMetadata() {
        return ipAddress != null || userAgent != null;
    }
    
    /**
     * Check if a token is currently valid based on timestamps
     */
    public boolean isCurrentlyValid() {
        Date now = new Date();
        return (notBefore == null || !notBefore.after(now)) && 
               (expiresAt == null || expiresAt.after(now));
    }
    
    /**
     * Get token age in milliseconds
     */
    public long getTokenAgeMillis() {
        if (issuedAt == null) {
            return 0;
        }
        return System.currentTimeMillis() - issuedAt.getTime();
    }
    
    /**
     * Get remaining validity in milliseconds
     */
    public long getRemainingValidityMillis() {
        if (expiresAt == null) {
            return Long.MAX_VALUE;
        }
        return expiresAt.getTime() - System.currentTimeMillis();
    }
}