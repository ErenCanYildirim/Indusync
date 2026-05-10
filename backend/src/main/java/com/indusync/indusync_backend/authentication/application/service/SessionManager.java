package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.domain.SessionRiskLevel;
import com.indusync.indusync_backend.authentication.domain.UserSession;
import com.indusync.indusync_backend.authentication.domain.UserSessionRepository;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
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
 * Service for managing user sessions with comprehensive security features.
 * <p>
 * This service provides:
 * - Session creation and lifecycle management
 * - Device fingerprinting and tracking
 * - Concurrent session limits and management
 * - Session security monitoring and risk assessment
 * - Session cleanup and maintenance
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SessionManager {

    private final UserSessionRepository userSessionRepository;

    @Value("${security.session.max-concurrent-sessions:3}")
    private int maxConcurrentSessions;

    @Value("${security.session.timeout-minutes:30}")
    private long sessionTimeoutMinutes;

    @Value("${security.session.cleanup-interval-hours:24}")
    private long cleanupIntervalHours;

    /**
     * Creates a new user session with comprehensive metadata.
     *
     * @param context the session creation context
     * @return the created UserSession
     */
    public UserSession createSession(SessionCreationContext context) {
        log.info("Creating new session for user: {} from IP: {}", context.getUserId(), context.getIpAddress());

        // Generate unique session ID
        String sessionId = generateSessionId();

        // Check and enforce concurrent session limits
        enforceConcurrentSessionLimits(context.getUserId(), context.getDeviceFingerprint());

        // Create session entity
        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(context.getUserId())
                .deviceFingerprint(context.getDeviceFingerprint())
                .ipAddress(context.getIpAddress())
                .userAgent(context.getUserAgent())
                .location(context.getLocation())
                .lastActivity(LocalDateTime.now())
                .deviceName(context.getDeviceName())
                .deviceType(context.getDeviceType())
                .operatingSystem(context.getOperatingSystem())
                .browser(context.getBrowser())
                .trustedDevice(isTrustedDevice(context.getUserId(), context.getDeviceFingerprint()))
                .build();

        // Set session expiration
        session.setExpiration(sessionTimeoutMinutes);

        // Assess initial risk level
        assessAndUpdateRiskLevel(session, context);

        // Add initial metadata
        if (context.getMetadata() != null) {
            context.getMetadata().forEach(session::addMetadata);
        }

        session = userSessionRepository.save(session);
        log.info("Session created successfully: {} for user: {}", sessionId, context.getUserId());

        return session;
    }

    /**
     * Updates session activity and extends expiration.
     *
     * @param sessionId the session ID
     * @return true if session was updated successfully
     */
    public boolean updateSessionActivity(String sessionId) {
        return updateSessionActivity(sessionId, LocalDateTime.now());
    }

    /**
     * Updates session activity with specific timestamp.
     *
     * @param sessionId    the session ID
     * @param activityTime the activity timestamp
     * @return true if session was updated successfully
     */
    public boolean updateSessionActivity(String sessionId, LocalDateTime activityTime) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);

        if (sessionOpt.isEmpty()) {
            log.warn("Session not found for activity update: {}", sessionId);
            return false;
        }

        UserSession session = sessionOpt.get();

        if (!session.getActive()) {
            log.warn("Attempted to update activity for inactive session: {}", sessionId);
            return false;
        }

        if (session.isExpired()) {
            log.info("Session expired, terminating: {}", sessionId);
            terminateSession(sessionId, "Session expired");
            return false;
        }

        session.updateActivity(activityTime);
        session.extendExpiration(sessionTimeoutMinutes);
        userSessionRepository.save(session);

        log.debug("Session activity updated: {}", sessionId);
        return true;
    }

    /**
     * Gets all active sessions for a user.
     *
     * @param userId the user ID
     * @return list of active sessions
     */
    @Transactional(readOnly = true)
    public List<UserSession> getUserActiveSessions(UUID userId) {
        return userSessionRepository.findActiveSessionsByUserId(userId);
    }

    /**
     * Gets session information by session ID.
     *
     * @param sessionId the session ID
     * @return optional session information
     */
    @Transactional(readOnly = true)
    public Optional<UserSession> getSessionInfo(String sessionId) {
        return userSessionRepository.findBySessionId(sessionId);
    }

    /**
     * Terminates a specific session.
     *
     * @param sessionId the session ID
     * @param reason    the termination reason
     * @return true if session was terminated successfully
     */
    public boolean terminateSession(String sessionId, String reason) {
        log.info("Terminating session: {} with reason: {}", sessionId, reason);

        int terminated = userSessionRepository.terminateSession(sessionId, LocalDateTime.now(), reason);

        if (terminated > 0) {
            log.info("Session terminated successfully: {}", sessionId);
            return true;
        } else {
            log.warn("Session not found or already terminated: {}", sessionId);
            return false;
        }
    }

    /**
     * Terminates all active sessions for a user except the specified session.
     *
     * @param userId           the user ID
     * @param excludeSessionId the session ID to exclude from termination
     * @param reason           the termination reason
     * @return number of sessions terminated
     */
    public int terminateOtherUserSessions(UUID userId, String excludeSessionId, String reason) {
        log.info("Terminating other sessions for user: {} except: {}", userId, excludeSessionId);

        int terminated = userSessionRepository.terminateOtherUserSessions(
                userId, excludeSessionId, LocalDateTime.now(), reason);

        log.info("Terminated {} other sessions for user: {}", terminated, userId);
        return terminated;
    }

    /**
     * Terminates all active sessions for a user.
     *
     * @param userId the user ID
     * @param reason the termination reason
     * @return number of sessions terminated
     */
    public int terminateAllUserSessions(UUID userId, String reason) {
        log.info("Terminating all sessions for user: {}", userId);

        int terminated = userSessionRepository.terminateAllUserSessions(userId, LocalDateTime.now(), reason);

        log.info("Terminated {} sessions for user: {}", terminated, userId);
        return terminated;
    }

    /**
     * Validates if a session is active and valid.
     *
     * @param sessionId the session ID
     * @return true if session is valid and active
     */
    @Transactional(readOnly = true)
    public boolean isSessionValid(String sessionId) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);

        if (sessionOpt.isEmpty()) {
            return false;
        }

        UserSession session = sessionOpt.get();

        if (!session.getActive()) {
            return false;
        }

        if (session.isExpired()) {
            // Asynchronously terminate expired session
            terminateSession(sessionId, "Session expired");
            return false;
        }

        return true;
    }

    /**
     * Records suspicious activity for a session.
     *
     * @param sessionId the session ID
     * @param activity  description of suspicious activity
     */
    public void recordSuspiciousActivity(String sessionId, String activity) {
        Optional<UserSession> sessionOpt = userSessionRepository.findBySessionId(sessionId);

        if (sessionOpt.isEmpty()) {
            log.warn("Cannot record suspicious activity for non-existent session: {}", sessionId);
            return;
        }

        UserSession session = sessionOpt.get();
        session.recordSuspiciousActivity();
        session.addMetadata("suspicious_activity_" + System.currentTimeMillis(), activity);

        userSessionRepository.save(session);

        log.warn("Suspicious activity recorded for session {}: {}", sessionId, activity);

        // If risk level becomes critical, consider terminating the session
        if (session.getRiskLevel() == SessionRiskLevel.CRITICAL) {
            log.error("Session {} has critical risk level, considering termination", sessionId);
            // Could implement automatic termination here based on security policy
        }
    }

    /**
     * Cleans up expired and old sessions.
     *
     * @return number of sessions cleaned up
     */
    public int cleanupExpiredSessions() {
        log.info("Starting session cleanup process");

        LocalDateTime now = LocalDateTime.now();

        // Find and terminate expired sessions
        List<UserSession> expiredSessions = userSessionRepository.findExpiredSessions(now);
        int expiredCount = 0;

        for (UserSession session : expiredSessions) {
            terminateSession(session.getSessionId(), "Session expired");
            expiredCount++;
        }

        // Find and terminate inactive sessions
        LocalDateTime inactivityThreshold = now.minusMinutes(sessionTimeoutMinutes * 2);
        List<UserSession> inactiveSessions = userSessionRepository.findInactiveSessions(inactivityThreshold);
        int inactiveCount = 0;

        for (UserSession session : inactiveSessions) {
            terminateSession(session.getSessionId(), "Session inactive");
            inactiveCount++;
        }

        // Delete old terminated sessions (older than retention period)
        LocalDateTime retentionThreshold = now.minusHours(cleanupIntervalHours * 7); // Keep for 7 cleanup cycles
        int deletedCount = userSessionRepository.deleteOldTerminatedSessions(retentionThreshold);

        int totalCleaned = expiredCount + inactiveCount + deletedCount;
        log.info("Session cleanup completed: {} expired, {} inactive, {} deleted, {} total",
                expiredCount, inactiveCount, deletedCount, totalCleaned);

        return totalCleaned;
    }

    /**
     * Gets session count for a user.
     *
     * @param userId the user ID
     * @return number of active sessions
     */
    @Transactional(readOnly = true)
    public long getUserSessionCount(UUID userId) {
        return userSessionRepository.countActiveSessionsByUserId(userId);
    }

    /**
     * Checks if a device is trusted for a user.
     *
     * @param userId            the user ID
     * @param deviceFingerprint the device fingerprint
     * @return true if device is trusted
     */
    @Transactional(readOnly = true)
    public boolean isTrustedDevice(UUID userId, String deviceFingerprint) {
        if (deviceFingerprint == null) {
            return false;
        }

        List<UserSession> deviceSessions = userSessionRepository.findByUserIdAndDeviceFingerprint(userId,
                deviceFingerprint);

        return deviceSessions.stream()
                .anyMatch(UserSession::getTrustedDevice);
    }

    /**
     * Marks a device as trusted for a user.
     *
     * @param userId            the user ID
     * @param deviceFingerprint the device fingerprint
     */
    public void trustDevice(UUID userId, String deviceFingerprint) {
        List<UserSession> deviceSessions = userSessionRepository.findByUserIdAndDeviceFingerprint(userId,
                deviceFingerprint);

        for (UserSession session : deviceSessions) {
            session.trustDevice();
        }

        userSessionRepository.saveAll(deviceSessions);
        log.info("Device trusted for user {}: {}", userId, deviceFingerprint);
    }

    // === Private Helper Methods ===

    private String generateSessionId() {
        return UUID.randomUUID().toString().replace("-", "") + System.currentTimeMillis();
    }

    private void enforceConcurrentSessionLimits(UUID userId, String deviceFingerprint) {
        long activeSessionCount = userSessionRepository.countActiveSessionsByUserId(userId);

        if (activeSessionCount >= maxConcurrentSessions) {
            log.info("User {} has reached concurrent session limit ({}), terminating oldest sessions",
                    userId, maxConcurrentSessions);

            List<UserSession> activeSessions = userSessionRepository.findActiveSessionsByUserId(userId);

            // Sort by last activity (oldest first) and terminate excess sessions
            activeSessions.stream()
                    .sorted((s1, s2) -> s1.getLastActivity().compareTo(s2.getLastActivity()))
                    .limit(activeSessionCount - maxConcurrentSessions + 1)
                    .forEach(session -> terminateSession(session.getSessionId(), "Concurrent session limit exceeded"));
        }
    }

    private void assessAndUpdateRiskLevel(UserSession session, SessionCreationContext context) {
        // Initial risk assessment based on various factors
        SessionRiskLevel riskLevel = SessionRiskLevel.LOW;

        // Check if device is trusted
        if (!session.getTrustedDevice()) {
            riskLevel = SessionRiskLevel.MEDIUM;
        }

        // Check for suspicious IP patterns (could be enhanced with IP intelligence)
        if (context.getIpAddress() != null) {
            // Basic checks - could be enhanced with external IP reputation services
            if (isPrivateIP(context.getIpAddress())) {
                // Private IPs might be less risky in some contexts
            } else {
                // Public IPs might need additional scrutiny
            }
        }

        // Check for unusual user agent patterns
        if (context.getUserAgent() != null && isUnusualUserAgent(context.getUserAgent())) {
            riskLevel = SessionRiskLevel.MEDIUM;
        }

        session.setRiskLevel(riskLevel);
    }

    private boolean isPrivateIP(String ipAddress) {
        // Basic private IP range check
        return ipAddress.startsWith("192.168.") ||
                ipAddress.startsWith("10.") ||
                ipAddress.startsWith("172.") ||
                ipAddress.equals("127.0.0.1") ||
                ipAddress.equals("::1");
    }

    private boolean isUnusualUserAgent(String userAgent) {
        // Basic checks for unusual user agents
        if (userAgent.length() < 10 || userAgent.length() > 1000) {
            return true;
        }

        // Check for common bot patterns
        String lowerUserAgent = userAgent.toLowerCase();
        return lowerUserAgent.contains("bot") ||
                lowerUserAgent.contains("crawler") ||
                lowerUserAgent.contains("spider");
    }

    /**
     * Context object for session creation containing all necessary information.
     */
    public static class SessionCreationContext {
        private UUID userId;
        private String deviceFingerprint;
        private String ipAddress;
        private String userAgent;
        private GeoLocation location;
        private String deviceName;
        private String deviceType;
        private String operatingSystem;
        private String browser;
        private java.util.Map<String, String> metadata;

        // Constructors
        public SessionCreationContext() {
        }

        public SessionCreationContext(UUID userId, String deviceFingerprint, String ipAddress, String userAgent) {
            this.userId = userId;
            this.deviceFingerprint = deviceFingerprint;
            this.ipAddress = ipAddress;
            this.userAgent = userAgent;
        }

        // Getters and setters
        public UUID getUserId() {
            return userId;
        }

        public void setUserId(UUID userId) {
            this.userId = userId;
        }

        public String getDeviceFingerprint() {
            return deviceFingerprint;
        }

        public void setDeviceFingerprint(String deviceFingerprint) {
            this.deviceFingerprint = deviceFingerprint;
        }

        public String getIpAddress() {
            return ipAddress;
        }

        public void setIpAddress(String ipAddress) {
            this.ipAddress = ipAddress;
        }

        public String getUserAgent() {
            return userAgent;
        }

        public void setUserAgent(String userAgent) {
            this.userAgent = userAgent;
        }

        public GeoLocation getLocation() {
            return location;
        }

        public void setLocation(GeoLocation location) {
            this.location = location;
        }

        public String getDeviceName() {
            return deviceName;
        }

        public void setDeviceName(String deviceName) {
            this.deviceName = deviceName;
        }

        public String getDeviceType() {
            return deviceType;
        }

        public void setDeviceType(String deviceType) {
            this.deviceType = deviceType;
        }

        public String getOperatingSystem() {
            return operatingSystem;
        }

        public void setOperatingSystem(String operatingSystem) {
            this.operatingSystem = operatingSystem;
        }

        public String getBrowser() {
            return browser;
        }

        public void setBrowser(String browser) {
            this.browser = browser;
        }

        public java.util.Map<String, String> getMetadata() {
            return metadata;
        }

        public void setMetadata(java.util.Map<String, String> metadata) {
            this.metadata = metadata;
        }
    }
}