package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Result of key security audit.
 * Contains information about the security status of all stored keys.
 *
 * @param totalKeys      Total number of keys audited
 * @param secureKeys     Number of keys that passed security validation
 * @param weakKeys       Number of keys that failed security validation
 * @param overallSecure  Overall security status
 * @param auditTimestamp Timestamp when the audit was performed
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record KeySecurityAuditResult(int totalKeys, int secureKeys, int weakKeys, boolean overallSecure,
                                     LocalDateTime auditTimestamp) {

}