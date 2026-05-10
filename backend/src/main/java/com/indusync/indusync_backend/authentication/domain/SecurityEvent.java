package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "security_events", schema = "auth", indexes = {
        @Index(name = "idx_security_events_user_id", columnList = "user_id"),
        @Index(name = "idx_security_events_type", columnList = "event_type"),
        @Index(name = "idx_security_events_timestamp", columnList = "timestamp")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEvent extends AuditableEntity {

    @Column(name = "event_id", nullable = false, unique = true, length = 64)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 64)
    private String eventType;

    @Column(name = "user_id", columnDefinition = "uuid")
    private UUID userId;

    @Column(name = "session_id", length = 128)
    private String sessionId;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    private String userAgent;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "details", columnDefinition = "text")
    private String details;
}