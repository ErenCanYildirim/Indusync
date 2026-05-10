package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

import java.util.List;

/**
 * Assessment of cryptographic key strength and security characteristics.
 * Provides detailed analysis of key security properties.
 *
 * @param keyId           Identifier of the assessed key
 * @param strength        Overall strength classification
 * @param entropyScore    Entropy score (0.0 to 1.0, higher is better)
 * @param keyAge          Age of the key in days
 * @param recommendations Security recommendations for the key
 * @param additionalInfo  Additional security metrics
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record KeyStrengthAssessment(String keyId, KeyStrength strength, double entropyScore, long keyAge,
                                    List<String> recommendations, String additionalInfo) {

    /**
     * Check if the key is suitable for production use
     */
    public boolean isProductionReady() {
        return strength != null && strength.isAcceptable() && entropyScore >= 0.6;
    }

    /**
     * Check if immediate action is required
     */
    public boolean requiresImmediateAction() {
        return strength != null && strength.requiresAttention();
    }

    /**
     * Get security score as percentage
     */
    public int getSecurityScorePercentage() {
        if (strength == null) {
            return 0;
        }

        // Combine strength level and entropy score
        double strengthScore = (double) strength.getLevel() / 4.0; // Normalize to 0-1
        double combinedScore = (strengthScore + entropyScore) / 2.0;

        return (int) Math.round(combinedScore * 100);
    }
}