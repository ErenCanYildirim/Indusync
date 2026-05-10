package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.domain.SessionRiskLevel;
import com.indusync.indusync_backend.authentication.domain.User;
import com.indusync.indusync_backend.authentication.domain.UserRepository;
import com.indusync.indusync_backend.authentication.domain.UserSession;
import com.indusync.indusync_backend.authentication.domain.UserSessionRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for session security assessment and anomaly detection.
 * <p>
 * This service provides:
 * - Session risk assessment and scoring
 * - Suspicious behavior detection and analysis
 * - Automatic session termination for security violations
 * - Session metadata collection and analysis
 * - Integration with authentication flow for security monitoring
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SessionSecurityService {

  private final UserSessionRepository userSessionRepository;
  private final UserRepository userRepository;
  private final SessionManager sessionManager;

  @Value("${security.session.max-location-distance-km:500}")
  private double maxLocationDistanceKm;

  @Value("${security.session.suspicious-activity-threshold:3}")
  private int suspiciousActivityThreshold;

  @Value("${security.session.auto-terminate-critical-risk:true}")
  private boolean autoTerminateCriticalRisk;

  @Value("${security.session.max-concurrent-sessions-per-ip:5}")
  private int maxConcurrentSessionsPerIp;

  /**
   * Assesses the risk level of a session based on various security factors.
   *
   * @param sessionId the session ID to assess
   * @return session risk assessment result
   */
  @Transactional(readOnly = true)
  public SessionRiskAssessment assessSessionRisk(String sessionId) {
    Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);

    if (sessionOpt.isEmpty()) {
      log.warn("Risk assessment requested for non-existent session: {}", sessionId);
      return SessionRiskAssessment.notFound(sessionId);
    }

    UserSession session = sessionOpt.get();
    return assessSessionRisk(session);
  }

  /**
   * Assesses the risk level of a session.
   *
   * @param session the session to assess
   * @return session risk assessment result
   */
  @Transactional(readOnly = true)
  public SessionRiskAssessment assessSessionRisk(UserSession session) {
    log.debug("Assessing risk for session: {}", session.getSessionId());

    SessionRiskAssessment.SessionRiskAssessmentBuilder assessmentBuilder = SessionRiskAssessment.builder()
        .sessionId(session.getSessionId())
        .userId(session.getUserId())
        .currentRiskLevel(session.getRiskLevel())
        .assessmentTime(LocalDateTime.now());

    int riskScore = 0;
    StringBuilder riskFactors = new StringBuilder();

    // Factor 1: Device trust status
    if (!session.getTrustedDevice()) {
      riskScore += 20;
      riskFactors.append("Untrusted device; ");
    }

    // Factor 2: Suspicious activity count
    if (session.getSuspiciousActivityCount() > 0) {
      riskScore += Math.min(session.getSuspiciousActivityCount() * 10, 30);
      riskFactors.append("Suspicious activities (").append(session.getSuspiciousActivityCount()).append("); ");
    }

    // Factor 3: User's overall security risk
    Optional<User> userOpt = userRepository.findById(session.getUserId());
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      if (user.isHighRisk()) {
        riskScore += 25;
        riskFactors.append("High-risk user; ");
      } else if (user.isMediumRisk()) {
        riskScore += 15;
        riskFactors.append("Medium-risk user; ");
      }

      if (user.getUnderSecurityReview()) {
        riskScore += 20;
        riskFactors.append("User under security review; ");
      }
    }

    // Factor 4: Geographic anomalies
    if (hasGeographicAnomalies(session)) {
      riskScore += 15;
      riskFactors.append("Geographic anomaly; ");
    }

    // Factor 5: IP-based risks
    if (hasIpBasedRisks(session)) {
      riskScore += 10;
      riskFactors.append("IP-based risks; ");
    }

    // Factor 6: Session age and activity patterns
    if (hasUnusualActivityPatterns(session)) {
      riskScore += 10;
      riskFactors.append("Unusual activity patterns; ");
    }

    // Factor 7: Concurrent session anomalies
    if (hasConcurrentSessionAnomalies(session)) {
      riskScore += 15;
      riskFactors.append("Concurrent session anomalies; ");
    }

    // Determine risk level based on score
    SessionRiskLevel newRiskLevel;
    if (riskScore >= 70) {
      newRiskLevel = SessionRiskLevel.CRITICAL;
    } else if (riskScore >= 40) {
      newRiskLevel = SessionRiskLevel.HIGH;
    } else if (riskScore >= 20) {
      newRiskLevel = SessionRiskLevel.MEDIUM;
    } else {
      newRiskLevel = SessionRiskLevel.LOW;
    }

    return assessmentBuilder
        .riskScore(riskScore)
        .newRiskLevel(newRiskLevel)
        .riskFactors(riskFactors.toString())
        .requiresAction(newRiskLevel == SessionRiskLevel.CRITICAL ||
            (newRiskLevel == SessionRiskLevel.HIGH && riskScore >= 60))
        .build();
  }

  /**
   * Monitors session activity for suspicious behavior.
   *
   * @param sessionId the session ID to monitor
   * @param activity  description of the activity
   */
  public void monitorSessionActivity(String sessionId, String activity) {
    Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);

    if (sessionOpt.isEmpty()) {
      log.warn("Activity monitoring requested for non-existent session: {}", sessionId);
      return;
    }

    UserSession session = sessionOpt.get();

    // Analyze activity for suspicious patterns
    if (isSuspiciousActivity(session, activity)) {
      recordSuspiciousActivity(session, activity);
    }

    // Update session activity
    session.updateActivity();
    userSessionRepository.save(session);
  }

  /**
   * Records suspicious activity for a session and takes appropriate action.
   *
   * @param session  the session
   * @param activity description of the suspicious activity
   */
  public void recordSuspiciousActivity(UserSession session, String activity) {
    log.warn("Suspicious activity detected for session {}: {}", session.getSessionId(), activity);

    session.recordSuspiciousActivity();
    session.addMetadata("suspicious_activity_" + System.currentTimeMillis(), activity);

    // Update user's suspicious activity counter
    Optional<User> userOpt = userRepository.findById(session.getUserId());
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      user.recordSuspiciousActivity(activity);
      userRepository.save(user);
    }

    // Reassess session risk
    SessionRiskAssessment assessment = assessSessionRisk(session);

    // Update session risk level
    session.setRiskLevel(assessment.getNewRiskLevel());
    userSessionRepository.save(session);

    // Take action if necessary
    if (assessment.isRequiresAction()) {
      handleHighRiskSession(session, assessment);
    }
  }

  /**
   * Handles high-risk sessions by taking appropriate security actions.
   *
   * @param session    the high-risk session
   * @param assessment the risk assessment
   */
  public void handleHighRiskSession(UserSession session, SessionRiskAssessment assessment) {
    log.warn("Handling high-risk session {}: risk level {}, score {}",
        session.getSessionId(), assessment.getNewRiskLevel(), assessment.getRiskScore());

    if (assessment.getNewRiskLevel() == SessionRiskLevel.CRITICAL && autoTerminateCriticalRisk) {
      // Terminate critical risk sessions automatically
      sessionManager.terminateSession(session.getSessionId(),
          "Automatic termination due to critical security risk: " + assessment.getRiskFactors());

      log.error("Session {} terminated due to critical security risk", session.getSessionId());

      // Also terminate other sessions from the same device if risk is very high
      if (assessment.getRiskScore() >= 80) {
        terminateDeviceSessions(session.getDeviceFingerprint(), session.getSessionId());
      }
    } else if (assessment.getNewRiskLevel() == SessionRiskLevel.HIGH) {
      // For high-risk sessions, add additional monitoring
      session.addMetadata("high_risk_monitoring", "true");
      session.addMetadata("risk_assessment_time", LocalDateTime.now().toString());
      session.addMetadata("risk_factors", assessment.getRiskFactors());

      userSessionRepository.save(session);

      log.warn("Session {} marked for enhanced monitoring due to high risk", session.getSessionId());
    }
  }

  /**
   * Performs automated security checks on all active sessions.
   *
   * @return number of sessions that required action
   */
  public int performAutomatedSecurityChecks() {
    log.info("Starting automated security checks on active sessions");

    List<UserSession> activeSessions = userSessionRepository.findAll()
        .stream()
        .filter(UserSession::getActive)
        .toList();

    int actionsRequired = 0;

    for (UserSession session : activeSessions) {
      try {
        SessionRiskAssessment assessment = assessSessionRisk(session);

        // Update session risk level if it has changed
        if (assessment.getNewRiskLevel() != session.getRiskLevel()) {
          session.setRiskLevel(assessment.getNewRiskLevel());
          userSessionRepository.save(session);
        }

        if (assessment.isRequiresAction()) {
          handleHighRiskSession(session, assessment);
          actionsRequired++;
        }
      } catch (Exception e) {
        log.error("Error during security check for session {}: {}", session.getSessionId(), e.getMessage());
      }
    }

    log.info("Automated security checks completed: {} sessions required action", actionsRequired);
    return actionsRequired;
  }

  /**
   * Gets security statistics for monitoring and reporting.
   *
   * @return security statistics
   */
  @Transactional(readOnly = true)
  public SecurityStatistics getSecurityStatistics() {
    long totalActiveSessions = userSessionRepository.count();
    List<UserSession> highRiskSessions = userSessionRepository.findHighRiskActiveSessions();
    List<UserSession> suspiciousSessions = userSessionRepository
        .findSessionsWithSuspiciousActivity(suspiciousActivityThreshold);

    return SecurityStatistics.builder()
        .totalActiveSessions(totalActiveSessions)
        .highRiskSessions(highRiskSessions.size())
        .suspiciousSessions(suspiciousSessions.size())
        .criticalRiskSessions((int) highRiskSessions.stream()
            .filter(s -> s.getRiskLevel() == SessionRiskLevel.CRITICAL)
            .count())
        .build();
  } 

  private boolean hasGeographicAnomalies(UserSession session) {
    if (session.getLocation() == null) {
      return false;
    }

    // Check for unusual geographic patterns
    List<UserSession> userSessions = userSessionRepository.findByUserIdAndDeviceFingerprint(
        session.getUserId(), session.getDeviceFingerprint());

    for (UserSession otherSession : userSessions) {
      if (!otherSession.getSessionId().equals(session.getSessionId()) &&
          otherSession.getLocation() != null) {

        double distance = session.getLocation().distanceToKm(otherSession.getLocation());
        if (distance > maxLocationDistanceKm) {
          return true;
        }
      }
    }

    return false;
  }

  private boolean hasIpBasedRisks(UserSession session) {
    // Check for multiple sessions from the same IP
    List<UserSession> ipSessions = userSessionRepository.findByIpAddress(session.getIpAddress());

    if (ipSessions.size() > maxConcurrentSessionsPerIp) {
      return true;
    }

    // Check for rapid IP changes (could indicate VPN/proxy usage)
    List<UserSession> userSessions = userSessionRepository.findActiveSessionsByUserId(session.getUserId());
    long uniqueIps = userSessions.stream()
        .map(UserSession::getIpAddress)
        .distinct()
        .count();

    return uniqueIps > 3; // More than 3 different IPs is suspicious
  }

  private boolean hasUnusualActivityPatterns(UserSession session) {
    // Check for very old sessions that are still active
    LocalDateTime oldThreshold = LocalDateTime.now().minusHours(12);
    if (session.getCreatedAt().isBefore(oldThreshold)) {
      return true;
    }

    // Check for sessions with no recent activity
    LocalDateTime inactiveThreshold = LocalDateTime.now().minusHours(2);
    return session.getLastActivity().isBefore(inactiveThreshold);
  }

  private boolean hasConcurrentSessionAnomalies(UserSession session) {
    long userSessionCount = userSessionRepository.countActiveSessionsByUserId(session.getUserId());

    // Check if user has too many concurrent sessions
    Optional<User> userOpt = userRepository.findById(session.getUserId());
    if (userOpt.isPresent()) {
      User user = userOpt.get();
      return userSessionCount > user.getMaxConcurrentSessions();
    }

    return userSessionCount > 5; // Default threshold
  }

  private boolean isSuspiciousActivity(UserSession session, String activity) {
    // Basic suspicious activity detection
    if (activity == null) {
      return false;
    }

    String lowerActivity = activity.toLowerCase();

    // Check for suspicious keywords
    return lowerActivity.contains("failed") ||
        lowerActivity.contains("error") ||
        lowerActivity.contains("unauthorized") ||
        lowerActivity.contains("blocked") ||
        lowerActivity.contains("suspicious");
  }

  private void terminateDeviceSessions(String deviceFingerprint, String excludeSessionId) {
        if (deviceFingerprint == null) {
            return;
        }

        List<UserSession> deviceSessions = userSessionRepository.findActiveSessionsByDeviceFingerprint(deviceFingerprint);
        
        for (UserSession session : deviceSessions) {
            if (!session.getSessionId().equals(excludeSessionId)) {
                sessionManager.terminateSession(session.getSessionId(), 
                        "Terminated due to critical security risk on same device");
            }
        }
    }
/**
     * Session risk assessment result containing risk analysis and recommendations.
     */
    @Getter
    public static class SessionRiskAssessment {
    // Getters
    private String sessionId;
        private UUID userId;
        private SessionRiskLevel currentRiskLevel;
        private SessionRiskLevel newRiskLevel;
        private int riskScore;
        private String riskFactors;
        private boolean requiresAction;
        private LocalDateTime assessmentTime;

        // Builder pattern implementation
        public static SessionRiskAssessmentBuilder builder() {
            return new SessionRiskAssessmentBuilder();
        }

        public static SessionRiskAssessment notFound(String sessionId) {
            return builder()
                    .sessionId(sessionId)
                    .currentRiskLevel(SessionRiskLevel.CRITICAL)
                    .newRiskLevel(SessionRiskLevel.CRITICAL)
                    .riskScore(100)
                    .riskFactors("Session not found")
                    .requiresAction(true)
                    .assessmentTime(LocalDateTime.now())
                    .build();
        }

    // Builder class
        public static class SessionRiskAssessmentBuilder {
            private String sessionId;
            private UUID userId;
            private SessionRiskLevel currentRiskLevel;
            private SessionRiskLevel newRiskLevel;
            private int riskScore;
            private String riskFactors;
            private boolean requiresAction;
            private LocalDateTime assessmentTime;

            public SessionRiskAssessmentBuilder sessionId(String sessionId) {
                this.sessionId = sessionId;
                return this;
            }

            public SessionRiskAssessmentBuilder userId(UUID userId) {
                this.userId = userId;
                return this;
            }

            public SessionRiskAssessmentBuilder currentRiskLevel(SessionRiskLevel currentRiskLevel) {
                this.currentRiskLevel = currentRiskLevel;
                return this;
            }

            public SessionRiskAssessmentBuilder newRiskLevel(SessionRiskLevel newRiskLevel) {
                this.newRiskLevel = newRiskLevel;
                return this;
            }

            public SessionRiskAssessmentBuilder riskScore(int riskScore) {
                this.riskScore = riskScore;
                return this;
            }

            public SessionRiskAssessmentBuilder riskFactors(String riskFactors) {
                this.riskFactors = riskFactors;
                return this;
            }

            public SessionRiskAssessmentBuilder requiresAction(boolean requiresAction) {
                this.requiresAction = requiresAction;
                return this;
            }

            public SessionRiskAssessmentBuilder assessmentTime(LocalDateTime assessmentTime) {
                this.assessmentTime = assessmentTime;
                return this;
            }

            public SessionRiskAssessment build() {
                SessionRiskAssessment assessment = new SessionRiskAssessment();
                assessment.sessionId = this.sessionId;
                assessment.userId = this.userId;
                assessment.currentRiskLevel = this.currentRiskLevel;
                assessment.newRiskLevel = this.newRiskLevel;
                assessment.riskScore = this.riskScore;
                assessment.riskFactors = this.riskFactors;
                assessment.requiresAction = this.requiresAction;
                assessment.assessmentTime = this.assessmentTime;
                return assessment;
            }
        }
    }    /**

     * Security statistics for monitoring and reporting.
     */
    @Getter
    public static class SecurityStatistics {
        // Getters
        private long totalActiveSessions;
        private int highRiskSessions;
        private int suspiciousSessions;
        private int criticalRiskSessions;

        public static SecurityStatisticsBuilder builder() {
            return new SecurityStatisticsBuilder();
        }

        // Builder class
        public static class SecurityStatisticsBuilder {
            private long totalActiveSessions;
            private int highRiskSessions;
            private int suspiciousSessions;
            private int criticalRiskSessions;

            public SecurityStatisticsBuilder totalActiveSessions(long totalActiveSessions) {
                this.totalActiveSessions = totalActiveSessions;
                return this;
            }

            public SecurityStatisticsBuilder highRiskSessions(int highRiskSessions) {
                this.highRiskSessions = highRiskSessions;
                return this;
            }

            public SecurityStatisticsBuilder suspiciousSessions(int suspiciousSessions) {
                this.suspiciousSessions = suspiciousSessions;
                return this;
            }

            public SecurityStatisticsBuilder criticalRiskSessions(int criticalRiskSessions) {
                this.criticalRiskSessions = criticalRiskSessions;
                return this;
            }

            public SecurityStatistics build() {
                SecurityStatistics stats = new SecurityStatistics();
                stats.totalActiveSessions = this.totalActiveSessions;
                stats.highRiskSessions = this.highRiskSessions;
                stats.suspiciousSessions = this.suspiciousSessions;
                stats.criticalRiskSessions = this.criticalRiskSessions;
                return stats;
            }
        }
    }
}