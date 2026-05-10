package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * UserSession entity for comprehensive session metadata tracking.
 * <p>
 * This entity supports:
 * - Device fingerprinting and tracking
 * - IP address and geolocation monitoring
 * - Session risk assessment and security metadata
 * - Concurrent session management
 * - Session activity monitoring
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "user_sessions", schema = "auth", indexes = {
        @Index(name = "idx_user_sessions_user_id", columnList = "user_id"),
        @Index(name = "idx_user_sessions_session_id", columnList = "session_id"),
        @Index(name = "idx_user_sessions_device_fingerprint", columnList = "device_fingerprint"),
        @Index(name = "idx_user_sessions_active", columnList = "active"),
        @Index(name = "idx_user_sessions_last_activity", columnList = "last_activity")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSession extends AuditableEntity {

    /**
     * Unique session identifier.
     */
    @Column(name = "session_id", nullable = false, unique = true, length = 128)
    private String sessionId;

    /**
     * User ID associated with this session.
     */
    @Column(name = "user_id", nullable = false, columnDefinition = "uuid")
    private UUID userId;

    /**
     * Device fingerprint for device identification.
     */
    @Column(name = "device_fingerprint", length = 256)
    private String deviceFingerprint;

    /**
     * IP address from which the session was created.
     */
    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    /**
     * User agent string from the client.
     */
    @Column(name = "user_agent", length = 1000)
    private String userAgent;

    /**
     * Geographic location of the session.
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "latitude", column = @Column(name = "location_lat")),
            @AttributeOverride(name = "longitude", column = @Column(name = "location_lng"))
    })
    private GeoLocation location;

    /**
     * Timestamp of the last activity in this session.
     */
    @Column(name = "last_activity", nullable = false)
    private LocalDateTime lastActivity;

    /**
     * Whether the session is currently active.
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    /**
     * Risk level assessment for this session.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    @Builder.Default
    private SessionRiskLevel riskLevel = SessionRiskLevel.LOW;

    /**
     * Additional session metadata stored as JSON.
     */
    @ElementCollection
    @CollectionTable(name = "user_session_metadata", schema = "auth", joinColumns = @JoinColumn(name = "session_id", referencedColumnName = "id"))
    @MapKeyColumn(name = "metadata_key", length = 100)
    @Column(name = "metadata_value", length = 1000)
    @Builder.Default
    private Map<String, String> metadata = new HashMap<>();

    /**
     * When the session expires (null for no expiration).
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Device name/description for user-friendly identification.
     */
    @Column(name = "device_name", length = 200)
    private String deviceName;

    /**
     * Device type (mobile, desktop, tablet, etc.).
     */
    @Column(name = "device_type", length = 50)
    private String deviceType;

    /**
     * Operating system information.
     */
    @Column(name = "operating_system", length = 100)
    private String operatingSystem;

    /**
     * Browser information.
     */
    @Column(name = "browser", length = 100)
    private String browser;

    /**
     * Whether this is a trusted device.
     */
    @Column(name = "trusted_device", nullable = false)
    @Builder.Default
    private Boolean trustedDevice = false;

    /**
     * Number of suspicious activities detected in this session.
     */
    @Column(name = "suspicious_activity_count", nullable = false)
    @Builder.Default
    private Integer suspiciousActivityCount = 0;

    /**
     * Timestamp when the session was terminated (null if still active).
     */
    @Column(name = "terminated_at")
    private LocalDateTime terminatedAt;

    /**
     * Reason for session termination.
     */
    @Column(name = "termination_reason", length = 100)
    private String terminationReason;

    // === Business Methods ===

    /**
     * Updates the last activity timestamp for this session.
     */
    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }

    /**
     * Updates the last activity timestamp with a specific timestamp.
     *
     * @param activityTime the activity timestamp
     */
    public void updateActivity(LocalDateTime activityTime) {
        this.lastActivity = activityTime;
    }

    /**
     * Terminates the session with a reason.
     *
     * @param reason the termination reason
     */
    public void terminate(String reason) {
        this.active = false;
        this.terminatedAt = LocalDateTime.now();
        this.terminationReason = reason;
    }

    /**
     * Checks if the session has expired.
     *
     * @return true if the session has expired
     */
    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    /**
     * Checks if the session is inactive for the specified duration.
     *
     * @param inactivityThresholdMinutes the inactivity threshold in minutes
     * @return true if the session is inactive
     */
    public boolean isInactive(long inactivityThresholdMinutes) {
        return lastActivity.isBefore(LocalDateTime.now().minusMinutes(inactivityThresholdMinutes));
    }

    /**
     * Increments the suspicious activity counter.
     */
    public void recordSuspiciousActivity() {
        this.suspiciousActivityCount++;
        updateRiskLevel();
    }

    /**
     * Updates the risk level based on session characteristics.
     */
    public void updateRiskLevel() {
        if (suspiciousActivityCount >= 5) {
            this.riskLevel = SessionRiskLevel.CRITICAL;
        } else if (suspiciousActivityCount >= 3) {
            this.riskLevel = SessionRiskLevel.HIGH;
        } else if (suspiciousActivityCount >= 1 || !trustedDevice) {
            this.riskLevel = SessionRiskLevel.MEDIUM;
        } else {
            this.riskLevel = SessionRiskLevel.LOW;
        }
    }

    /**
     * Adds metadata to the session.
     *
     * @param key   the metadata key
     * @param value the metadata value
     */
    public void addMetadata(String key, String value) {
        if (this.metadata == null) {
            this.metadata = new HashMap<>();
        }
        this.metadata.put(key, value);
    }

    /**
     * Gets metadata value by key.
     *
     * @param key the metadata key
     * @return the metadata value or null if not found
     */
    public String getMetadata(String key) {
        return this.metadata != null ? this.metadata.get(key) : null;
    }

    /**
     * Marks the device as trusted.
     */
    public void trustDevice() {
        this.trustedDevice = true;
        updateRiskLevel();
    }

    /**
     * Marks the device as untrusted.
     */
    public void untrustDevice() {
        this.trustedDevice = false;
        updateRiskLevel();
    }

    /**
     * Sets the session expiration time.
     *
     * @param expirationMinutes minutes from now when the session should expire
     */
    public void setExpiration(long expirationMinutes) {
        this.expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);
    }

    /**
     * Extends the session expiration time.
     *
     * @param additionalMinutes additional minutes to extend the session
     */
    public void extendExpiration(long additionalMinutes) {
        if (this.expiresAt != null) {
            this.expiresAt = this.expiresAt.plusMinutes(additionalMinutes);
        } else {
            setExpiration(additionalMinutes);
        }
    }

    /**
     * Checks if this session is from the same device as another session.
     *
     * @param otherSession the other session to compare
     * @return true if from the same device
     */
    public boolean isSameDevice(UserSession otherSession) {
        return this.deviceFingerprint != null &&
                this.deviceFingerprint.equals(otherSession.getDeviceFingerprint());
    }

    /**
     * Gets a user-friendly device description.
     *
     * @return device description
     */
    public String getDeviceDescription() {
        StringBuilder description = new StringBuilder();

        if (deviceName != null && !deviceName.trim().isEmpty()) {
            description.append(deviceName);
        } else {
            if (deviceType != null) {
                description.append(deviceType);
            }
            if (operatingSystem != null) {
                if (description.length() > 0)
                    description.append(" - ");
                description.append(operatingSystem);
            }
            if (browser != null) {
                if (description.length() > 0)
                    description.append(" - ");
                description.append(browser);
            }
        }

        return description.length() > 0 ? description.toString() : "Unknown Device";
    }
}