package com.indusync.indusync_backend.review.application;

import com.indusync.indusync_backend.review.domain.ReviewCreatedEvent;
import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.company.application.CompanyManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewCreatedEventListener {

    private final NotificationService notificationService;
    private final CompanyManagementService companyManagementService;

    @Async
    @EventListener
    public void handleReviewCreated(ReviewCreatedEvent event) {
        log.info("Handling ReviewCreatedEvent for review: {}", event.reviewId());
        try {
            String recipientEmail = companyManagementService.getBestContactEmail(event.revieweeCompanyId());
            if (recipientEmail == null) {
                log.warn("No recipient email found for revieweeCompanyId: {}", event.revieweeCompanyId());
                return;
            }
            String reviewerCompanyName = companyManagementService.getCompanyName(event.reviewerCompanyId());
            String revieweeCompanyName = companyManagementService.getCompanyName(event.revieweeCompanyId());
            notificationService.sendEmail(
                    recipientEmail,
                    "Neue Bewertung erhalten",
                    "review-created", // Template name (should exist in templates)
                    Map.of(
                            "reviewId", event.reviewId(),
                            "orderId", event.orderId(),
                            "reviewerCompanyName", reviewerCompanyName,
                            "revieweeCompanyName", revieweeCompanyName,
                            "createdAt", event.createdAt()));
        } catch (Exception e) {
            log.error("Failed to send review created email for review: {}", event.reviewId(), e);
        }
    }
}