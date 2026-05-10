package com.indusync.indusync_backend.shared.security;

/**
 * Result of token rotation operation containing new tokens and metadata.
 * Used for secure token refresh with automatic rotation.
 *
 * @param accessToken New access token
 * @param newRefreshToken New refresh token (rotated)
 * @param oldRefreshTokenId JWT ID of the old refresh token that was rotated
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record TokenRotationResult(
    String accessToken,
    String newRefreshToken,
    String oldRefreshTokenId
) {
    
    /**
     * Check if rotation was successful
     */
    public boolean isSuccessful() {
        return accessToken != null && newRefreshToken != null;
    }
    
    /**
     * Get token pair for client response
     */
    public TokenPair getTokenPair() {
        return new TokenPair(accessToken, newRefreshToken);
    }
    
    /**
     * Simple token pair for API responses
     */
    public record TokenPair(String accessToken, String refreshToken) {}
}