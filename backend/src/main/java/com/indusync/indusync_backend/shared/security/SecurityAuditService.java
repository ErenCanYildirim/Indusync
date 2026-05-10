package com.indusync.indusync_backend.shared.security;

import com.indusync.indusync_backend.authentication.domain.SecurityEvent;
import com.indusync.indusync_backend.authentication.domain.SecurityEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditService {

    private final SecurityEventRepository repository;

    public void logAuthSuccess(UUID userId, String ip, String ua, String sessionId) {
        save("AUTHENTICATION_SUCCESS", userId, ip, ua, sessionId, null);
    }

    public void logAuthFailure(String email, String ip, String ua, String reason) {
        save("AUTHENTICATION_FAILURE", null, ip, ua, null, "email=" + email + ";reason=" + reason);
    }

    public void logRateLimitExceeded(String ip, String endpoint, String ua) {
        save("RATE_LIMIT_EXCEEDED", null, ip, ua, null, "endpoint=" + endpoint);
    }

    public void logSuspiciousActivity(UUID userId, String ip, String ua, String details) {
        save("SUSPICIOUS_ACTIVITY", userId, ip, ua, null, details);
    }

    private void save(String type, UUID userId, String ip, String ua, String sessionId, String details) {
        try {
            SecurityEvent event = SecurityEvent.builder()
                    .eventId(UUID.randomUUID().toString())
                    .eventType(type)
                    .userId(userId)
                    .ipAddress(ip)
                    .userAgent(ua)
                    .sessionId(sessionId)
                    .timestamp(LocalDateTime.now())
                    .details(details)
                    .build();
            repository.save(event);
        } catch (Exception e) {
            log.warn("Failed to save security event {}: {}", type, e.getMessage());
        }
    }
}