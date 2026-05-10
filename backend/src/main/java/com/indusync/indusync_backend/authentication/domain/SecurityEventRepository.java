package com.indusync.indusync_backend.authentication.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, UUID> {
    List<SecurityEvent> findByUserIdOrderByTimestampDesc(UUID userId);

    List<SecurityEvent> findByEventTypeAndTimestampAfter(String eventType, LocalDateTime since);
}