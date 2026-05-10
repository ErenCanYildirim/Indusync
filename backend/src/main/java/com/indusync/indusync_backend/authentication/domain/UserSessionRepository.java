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
 * Repository interface for UserSession entity operations.
 * <p>
 * Provides methods for:
 * - Session lifecycle management
 * - Device and IP-based queries
 * - Security and risk assessment queries
 * - Session cleanup and maintenance
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {

    /**
     * Finds a session by its session ID.
     *
     * @param sessionId the session ID
     * @return optional UserSession
     */
    Optional<UserSession> findBySessionId(String sessionId);

    /**
     * Finds all active sessions for a user.
     *
     * @param userId the user ID
     * @return list of active sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.active = true ORDER BY s.lastActivity DESC")
    List<UserSession> findActiveSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Finds all sessions for a user (active and inactive).
     *
     * @param userId the user ID
     * @return list of all sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId ORDER BY s.lastActivity DESC")
    List<UserSession> findAllSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Counts active sessions for a user.
     *
     * @param userId the user ID
     * @return count of active sessions
     */
    @Query("SELECT COUNT(s) FROM UserSession s WHERE s.userId = :userId AND s.active = true")
    long countActiveSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Finds sessions by device fingerprint.
     *
     * @param deviceFingerprint the device fingerprint
     * @return list of sessions from the same device
     */
    List<UserSession> findByDeviceFingerprint(String deviceFingerprint);

    /**
     * Finds active sessions by device fingerprint.
     *
     * @param deviceFingerprint the device fingerprint
     * @return list of active sessions from the same device
     */
    @Query("SELECT s FROM UserSession s WHERE s.deviceFingerprint = :deviceFingerprint AND s.active = true")
    List<UserSession> findActiveSessionsByDeviceFingerprint(@Param("deviceFingerprint") String deviceFingerprint);

    /**
     * Finds sessions by IP address.
     *
     * @param ipAddress the IP address
     * @return list of sessions from the same IP
     */
    List<UserSession> findByIpAddress(String ipAddress);

    /**
     * Finds sessions by IP address within a time range.
     *
     * @param ipAddress the IP address
     * @param startTime start of time range
     * @param endTime   end of time range
     * @return list of sessions from the IP within the time range
     */
    @Query("SELECT s FROM UserSession s WHERE s.ipAddress = :ipAddress AND s.createdAt BETWEEN :startTime AND :endTime")
    List<UserSession> findByIpAddressAndTimeRange(@Param("ipAddress") String ipAddress, 
                                                   @Param("startTime") LocalDateTime startTime, 
                                                   @Param("endTime") LocalDateTime endTime);

    /**
     * Finds sessions with high or critical risk levels.
     *
     * @return list of high-risk sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.riskLevel IN ('HIGH', 'CRITICAL') AND s.active = true")
    List<UserSession> findHighRiskActiveSessions();

    /**
     * Finds sessions that are inactive beyond the threshold.
     *
     * @param inactivityThreshold the inactivity threshold timestamp
     * @return list of inactive sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.active = true AND s.lastActivity < :inactivityThreshold")
    List<UserSession> findInactiveSessions(@Param("inactivityThreshold") LocalDateTime inactivityThreshold);

    /**
     * Finds expired sessions.
     *
     * @param currentTime the current timestamp
     * @return list of expired sessions
     */
    @Query("SELECT s FROM UserSession s WHERE s.active = true AND s.expiresAt IS NOT NULL AND s.expiresAt < :currentTime")
    List<UserSession> findExpiredSessions(@Param("currentTime") LocalDateTime currentTime);

    /**
     * Terminates all active sessions for a user except the specified session.
     *
     * @param userId            the user ID
     * @param excludeSessionId  the session ID to exclude from termination
     * @param terminationReason the reason for termination
     * @return number of sessions terminated
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.active = false, s.terminatedAt = :terminatedAt, s.terminationReason = :terminationReason " +
           "WHERE s.userId = :userId AND s.active = true AND s.sessionId != :excludeSessionId")
    int terminateOtherUserSessions(@Param("userId") UUID userId, 
                                   @Param("excludeSessionId") String excludeSessionId,
                                   @Param("terminatedAt") LocalDateTime terminatedAt,
                                   @Param("terminationReason") String terminationReason);

    /**
     * Terminates all active sessions for a user.
     *
     * @param userId            the user ID
     * @param terminationReason the reason for termination
     * @return number of sessions terminated
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.active = false, s.terminatedAt = :terminatedAt, s.terminationReason = :terminationReason " +
           "WHERE s.userId = :userId AND s.active = true")
    int terminateAllUserSessions(@Param("userId") UUID userId,
                                 @Param("terminatedAt") LocalDateTime terminatedAt,
                                 @Param("terminationReason") String terminationReason);

    /**
     * Terminates a specific session.
     *
     * @param sessionId         the session ID
     * @param terminationReason the reason for termination
     * @return number of sessions terminated (should be 1 or 0)
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.active = false, s.terminatedAt = :terminatedAt, s.terminationReason = :terminationReason " +
           "WHERE s.sessionId = :sessionId AND s.active = true")
    int terminateSession(@Param("sessionId") String sessionId,
                         @Param("terminatedAt") LocalDateTime terminatedAt,
                         @Param("terminationReason") String terminationReason);

    /**
     * Finds sessions with suspicious activity above threshold.
     *
     * @param suspiciousActivityThreshold the threshold for suspicious activity count
     * @return list of sessions with high suspicious activity
     */
    @Query("SELECT s FROM UserSession s WHERE s.suspiciousActivityCount >= :threshold AND s.active = true")
    List<UserSession> findSessionsWithSuspiciousActivity(@Param("threshold") int suspiciousActivityThreshold);

    /**
     * Finds trusted device sessions for a user.
     *
     * @param userId the user ID
     * @return list of sessions from trusted devices
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.trustedDevice = true")
    List<UserSession> findTrustedDeviceSessionsByUserId(@Param("userId") UUID userId);

    /**
     * Finds the most recent session for a user.
     *
     * @param userId the user ID
     * @return optional most recent session
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId ORDER BY s.lastActivity DESC LIMIT 1")
    Optional<UserSession> findMostRecentSessionByUserId(@Param("userId") UUID userId);

    /**
     * Deletes old terminated sessions beyond retention period.
     *
     * @param retentionThreshold the retention threshold timestamp
     * @return number of sessions deleted
     */
    @Modifying
    @Query("DELETE FROM UserSession s WHERE s.active = false AND s.terminatedAt < :retentionThreshold")
    int deleteOldTerminatedSessions(@Param("retentionThreshold") LocalDateTime retentionThreshold);

    /**
     * Finds sessions by user ID and device fingerprint.
     *
     * @param userId            the user ID
     * @param deviceFingerprint the device fingerprint
     * @return list of sessions for the user from the specific device
     */
    @Query("SELECT s FROM UserSession s WHERE s.userId = :userId AND s.deviceFingerprint = :deviceFingerprint ORDER BY s.lastActivity DESC")
    List<UserSession> findByUserIdAndDeviceFingerprint(@Param("userId") UUID userId, 
                                                        @Param("deviceFingerprint") String deviceFingerprint);

    /**
     * Checks if a user has any active sessions.
     *
     * @param userId the user ID
     * @return true if user has active sessions
     */
    @Query("SELECT CASE WHEN COUNT(s) > 0 THEN true ELSE false END FROM UserSession s WHERE s.userId = :userId AND s.active = true")
    boolean hasActiveSessionsByUserId(@Param("userId") UUID userId);
}