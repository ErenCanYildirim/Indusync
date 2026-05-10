package com.indusync.indusync_backend.order.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderAssignedEvent(
        UUID orderId,
        UUID clientCompanyId,
        UUID providerCompanyId,
        LocalDateTime assignedAt) {
}