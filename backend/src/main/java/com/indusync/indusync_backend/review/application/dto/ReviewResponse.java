package com.indusync.indusync_backend.review.application.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ReviewResponse(
    UUID reviewId,
    UUID orderId,
    UUID reviewerCompanyId,
    UUID revieweeCompanyId,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<ReviewRatingDto> ratings
) {} 