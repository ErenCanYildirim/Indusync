package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

/**
 * Statistics and health information for SecureRandom instance.
 * Provides insights into the entropy source quality.
 *
 * @param algorithm       Algorithm used by the SecureRandom instance
 * @param provider        Security provider name
 * @param entropyRatio    Entropy ratio (0.0 to 1.0, higher is better)
 * @param uniqueByteCount Number of unique byte values in test sample
 * @param healthy         Whether the entropy source is considered healthy
 * @param diagnosticInfo  Additional diagnostic information
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record SecureRandomStats(String algorithm, String provider, double entropyRatio, int uniqueByteCount,
                                boolean healthy, String diagnosticInfo) {

    /**
     * Get entropy quality description
     */
    public String getEntropyQuality() {
        if (entropyRatio >= 0.9) {
            return "Excellent";
        } else if (entropyRatio >= 0.8) {
            return "Good";
        } else if (entropyRatio >= 0.6) {
            return "Fair";
        } else {
            return "Poor";
        }
    }

    /**
     * Check if entropy source meets security requirements
     */
    public boolean meetsSecurityRequirements() {
        return healthy && entropyRatio >= 0.8 && uniqueByteCount >= 200;
    }

    /**
     * Get entropy score as percentage
     */
    public int getEntropyPercentage() {
        return (int) Math.round(entropyRatio * 100);
    }
}