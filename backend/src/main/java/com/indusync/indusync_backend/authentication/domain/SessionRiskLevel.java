package com.indusync.indusync_backend.authentication.domain;

/**
 * Enumeration representing different risk levels for user sessions.
 * <p>
 * Risk levels are determined based on various factors including:
 * - Device trust status
 * - Suspicious activity count
 * - Geographic location anomalies
 * - Authentication patterns
 * </p>
 *
 * @author IndusSync Security Team
 * @since 1.0.0
 */
public enum SessionRiskLevel {
    /**
     * Low risk - trusted device, normal activity patterns.
     */
    LOW,

    /**
     * Medium risk - untrusted device or minor suspicious activities.
     */
    MEDIUM,

    /**
     * High risk - multiple suspicious activities or anomalous patterns.
     */
    HIGH,

    /**
     * Critical risk - severe security concerns, immediate attention required.
     */
    CRITICAL
}