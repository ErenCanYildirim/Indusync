package com.indusync.indusync_backend.review.application.dto;

public record ReviewRatingDto(
        String category,
        int score,
        String comment) {
}