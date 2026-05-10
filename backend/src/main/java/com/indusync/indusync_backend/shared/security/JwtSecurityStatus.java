package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

/**
 * Overall JWT security status information.
 * Aggregates security status from all JWT security components.
 *
 * @param keyRotationStatus     Key rotation status information
 * @param keyStrengthAssessment Current key strength assessment
 * @param entropyStats          Entropy generator statistics
 * @param overallHealthy        Overall health status
 * @param statusMessage         Additional status information
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record JwtSecurityStatus(KeyRotationStatus keyRotationStatus, KeyStrengthAssessment keyStrengthAssessment,
                                SecureRandomStats entropyStats, boolean overallHealthy, String statusMessage) {

    /**
     * Get security score as percentage
     */
    public int getOverallSecurityScore() {
        if (!overallHealthy) {
            return 0;
        }

        int keyScore = keyStrengthAssessment != null ? keyStrengthAssessment.getSecurityScorePercentage() : 0;
        int entropyScore = entropyStats != null ? entropyStats.getEntropyPercentage() : 0;
        int rotationScore = (keyRotationStatus != null && keyRotationStatus.rotationEnabled()) ? 100 : 50;

        return (keyScore + entropyScore + rotationScore) / 3;
    }

    /**
     * Get human-readable status summary
     */
    public String getStatusSummary() {
        if (!overallHealthy) {
            return "JWT security requires attention";
        }

        int score = getOverallSecurityScore();
        if (score >= 90) {
            return "Excellent JWT security";
        } else if (score >= 80) {
            return "Good JWT security";
        } else if (score >= 70) {
            return "Fair JWT security";
        } else {
            return "JWT security needs improvement";
        }
    }
}