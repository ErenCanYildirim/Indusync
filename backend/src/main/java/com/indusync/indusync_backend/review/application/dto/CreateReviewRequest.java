package com.indusync.indusync_backend.review.application.dto;

import java.util.List;
import java.util.UUID;

public record CreateReviewRequest(
        UUID orderId,
        UUID revieweeCompanyId,
        List<ReviewRatingDto> ratings) {
}