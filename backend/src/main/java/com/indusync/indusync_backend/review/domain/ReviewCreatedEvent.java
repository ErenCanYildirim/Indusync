package com.indusync.indusync_backend.review.domain;

import java.time.LocalDateTime;
import java.util.UUID;

public record ReviewCreatedEvent(
    UUID reviewId,
    UUID orderId,
    UUID reviewerCompanyId,
    UUID revieweeCompanyId,
    LocalDateTime createdAt
) {} 