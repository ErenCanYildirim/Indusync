package com.indusync.indusync_backend.review.api;

import com.indusync.indusync_backend.review.application.ReviewService;
import com.indusync.indusync_backend.review.application.dto.*;
import com.indusync.indusync_backend.review.domain.Review;
import com.indusync.indusync_backend.review.domain.ReviewRating;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/v1/orders/{orderId}/review")
public class ReviewController extends BaseController {
    private final ReviewService reviewService;

    public ReviewController(
                    JwtAuthenticationHelper authHelper,
                    ApiResponseHelper responseHelper,
                    ReviewService reviewService) {
            super(authHelper, responseHelper);
            this.reviewService = reviewService;
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
        @PathVariable UUID orderId,
        @RequestBody CreateReviewRequest request,
        Authentication authentication 
    ) {
        UUID reviewerCompanyId = getCurrentCompanyId(authentication);

        // Map ReviewRatingDto to ReviewRating domain objects
        List<ReviewRating> ratings = request.ratings().stream()
            .map(dto -> new ReviewRating(
                null, //review is set after Review is saved
                ReviewRating.Category.valueOf(dto.category()),
                dto.score(),
                dto.comment()
            ))
            .collect(Collectors.toList());
        Review review = reviewService.createReview(
            orderId,
            reviewerCompanyId,
            request.revieweeCompanyId(),
            ratings 
        );

        // Use the original ratings list since the saved review might not have ratings
        // loaded
        List<ReviewRatingDto> ratingDtos = ratings.stream()
                        .map(r -> new ReviewRatingDto(r.getCategory().name(), r.getScore(), r.getComment()))
                        .collect(Collectors.toList());

        ReviewResponse response = new ReviewResponse(
                        review.getId(),
                        review.getOrderId(),
                        review.getReviewerCompanyId(),
                        review.getRevieweeCompanyId(),
                        review.getCreatedAt(),
                        review.getUpdatedAt(),
                        ratingDtos);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> getReviewsByOrder(@PathVariable UUID orderId) {
        List<Review> reviews = reviewService.getReviewsByOrderId(orderId);
        List<ReviewResponse> responses = reviews.stream().map(review -> {
        // Get ratings for this review using the relationship
        List<ReviewRatingDto> ratingDtos = review.getRatings().stream()
            .map(rating -> new ReviewRatingDto(
                rating.getCategory().name(),
                rating.getScore(),
                rating.getComment()))
            .collect(Collectors.toList());

        return new ReviewResponse(
            review.getId(),
            review.getOrderId(),
            review.getReviewerCompanyId(),
            review.getRevieweeCompanyId(),
            review.getCreatedAt(),
            review.getUpdatedAt(),
            ratingDtos);
    }).collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }
}