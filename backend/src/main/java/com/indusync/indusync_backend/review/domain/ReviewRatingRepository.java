package com.indusync.indusync_backend.review.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRatingRepository extends JpaRepository<ReviewRating, UUID> {
    List<ReviewRating> findByReviewId(UUID reviewId);
    Optional<ReviewRating> findByReviewIdAndCategory(UUID reviewId, ReviewRating.Category category);
} 