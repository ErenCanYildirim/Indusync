package com.indusync.indusync_backend.order.domain;

import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Domain event published after order matching has finished and match records were persisted.
 */
@Builder
public record OrderMatchedEvent(
        UUID orderId,
        List<UUID> providerIds,
        LocalDateTime matchedAt,
        double averageScore
) {
} 