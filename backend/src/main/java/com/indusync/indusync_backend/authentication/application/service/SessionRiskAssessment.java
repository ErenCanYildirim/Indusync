package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.domain.SessionRiskLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Session risk assessment result containing risk analysis and recommendations.
 * <p>
 * This class encapsulates the results of a session security risk assessment,
 * including risk scores, factors, and recommended actions.
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@Data
@Builder
public class SessionRiskAssessment {

    /**
     * The session ID that was assessed.
     */
    private String sessionId;

    /**
     * The user ID associated with the session.
     */
    private UUID userId;

    /**
     * The current risk level of the session before assessment.
     */
    private SessionRiskLevel currentRiskLevel;

    /**
     * The new risk level determined by the assessment.
     */
    private SessionRiskLevel newRiskLevel;

    /**
     * Numerical risk score (0-100, higher is riskier).
     */
    private int riskScore;

    /**
     * Description of risk factors that contributed to the score.
     */
    private String riskFactors;

    /**
     * Whether immediate action is required based on the assessment.
     */
    private boolean requiresAction;

    /**
     * Timestamp when the assessment was performed.
     */
    private LocalDateTime assessmentTime;

    /**
     * Creates a risk assessment for a session that was not found.
     *
     * @param sessionId the session ID that was not found
     * @return risk assessment indicating session not found
     */
    public static SessionRiskAssessment notFound(String sessionId) {
        return SessionRiskAssessment.builder()
                .sessionId(sessionId)
                .currentRiskLevel(SessionRiskLevel.CRITICAL)
                .newRiskLevel(SessionRiskLevel.CRITICAL)
                .riskScore(100)
                .riskFactors("Session not found")
                .requiresAction(true)
                .assessmentTime(LocalDateTime.now())
                .build();
    }

    /**
     * Checks if the risk level has increased from the previous assessment.
     *
     * @return true if the risk level has increased
     */
    public boolean hasRiskIncreased() {
        if (currentRiskLevel == null || newRiskLevel == null) {
            return false;
        }

        return newRiskLevel.ordinal() > currentRiskLevel.ordinal();
    }

    /**
     * Checks if the risk level has decreased from the previous assessment.
     *
     * @return true if the risk level has decreased
     */
    public boolean hasRiskDecreased() {
        if (currentRiskLevel == null || newRiskLevel == null) {
            return false;
        }

        return newRiskLevel.ordinal() < currentRiskLevel.ordinal();
    }

    /**
     * Gets a human-readable summary of the risk assessment.
     *
     * @return risk assessment summary
     */
    public String getSummary() {
        StringBuilder summary = new StringBuilder();
        summary.append("Session ").append(sessionId)
                .append(" risk assessment: ")
                .append(newRiskLevel)
                .append(" (score: ").append(riskScore).append(")");

        if (hasRiskIncreased()) {
            summary.append(" - RISK INCREASED from ").append(currentRiskLevel);
        } else if (hasRiskDecreased()) {
            summary.append(" - Risk decreased from ").append(currentRiskLevel);
        }

        if (requiresAction) {
            summary.append(" - ACTION REQUIRED");
        }

        return summary.toString();
    }
}