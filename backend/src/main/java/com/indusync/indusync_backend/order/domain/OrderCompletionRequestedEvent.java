package com.indusync.indusync_backend.order.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record OrderCompletionRequestedEvent(
    UUID orderId,
    UUID requesterCompanyId,
    UUID counterpartCompanyId,
    UUID completionRequestId,
    String completionMessage,
    LocalDateTime requestedAt
) {} 