package com.indusync.indusync_backend.review.application;

import com.indusync.indusync_backend.review.domain.*;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Service
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ReviewRatingRepository reviewRatingRepository;
    private final OrderFacadeService orderFacadeService;
    private final ApplicationEventPublisher eventPublisher;

    public ReviewService(ReviewRepository reviewRepository, ReviewRatingRepository reviewRatingRepository,
            OrderFacadeService orderFacadeService, ApplicationEventPublisher eventPublisher) {
        this.reviewRepository = reviewRepository;
        this.reviewRatingRepository = reviewRatingRepository;
        this.orderFacadeService = orderFacadeService;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public Review createReview(UUID orderId, UUID reviewerCompanyId, UUID revieweeCompanyId,
            List<ReviewRating> ratings) {
        
        //Fetch order details
        OrderResponse order = orderFacadeService.getOrder(orderId);

        //order must be COMPLETED
        if (order.status() == null || !"COMPLETED".equals(order.status().name())) {
            throw new IllegalStateException("Order must be COMPLETED to review");
        }

        //reviewer and reviewee must be participants
        boolean reviewerIsParticipant = reviewerCompanyId.equals(order.companyId())
                || reviewerCompanyId.equals(order.providerId());
        boolean revieweeIsParticipant = revieweeCompanyId.equals(order.companyId())
                || revieweeCompanyId.equals(order.providerId());
        if (!reviewerIsParticipant || !revieweeIsParticipant) {
            throw new IllegalArgumentException("Both reviewer and reviewee must be participants in the order");
        }
        // cannot review yourself
        if (reviewerCompanyId.equals(revieweeCompanyId)) {
            throw new IllegalArgumentException("Reviewer and reviewee cannot be the same company");
        }
        //cannot review twice for same order
        if (reviewRepository.existsByOrderIdAndReviewerCompanyId(orderId, reviewerCompanyId)) {
            throw new IllegalStateException("Review already exists for this order and reviewer");
        }

        Review review = new Review(orderId, reviewerCompanyId, revieweeCompanyId);
        Review savedReview = reviewRepository.save(review);
        for (ReviewRating rating : ratings) {
            rating.setReview(savedReview);
            reviewRatingRepository.save(rating);
        }
        // Publish event for notification/email
        eventPublisher.publishEvent(new ReviewCreatedEvent(
                savedReview.getId(),
                savedReview.getOrderId(),
                savedReview.getReviewerCompanyId(),
                savedReview.getRevieweeCompanyId(),
                savedReview.getCreatedAt()));
        return savedReview;
    }

     @Transactional(readOnly = true)
    public List<Review> getReviewsByOrderId(UUID orderId) {
        return reviewRepository.findByOrderId(orderId);
    }

    @Transactional(readOnly = true)
    public Optional<Review> getReviewByOrderIdAndReviewer(UUID orderId, UUID reviewerCompanyId) {
        return reviewRepository.findByOrderIdAndReviewerCompanyId(orderId, reviewerCompanyId);
    }
}