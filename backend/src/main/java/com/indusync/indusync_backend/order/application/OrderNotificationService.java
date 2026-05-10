package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.notification.event.NotificationEvent;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.orm.ObjectOptimisticLockingFailureException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service for handling order-related notifications.
 * <p>
 * Manages sending notifications to service providers about:
 * - New order matches
 * - Order updates
 * - Match engagement tracking
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderNotificationService {

    private final OrderMatchRepository orderMatchRepository;
    private final OrderRepository orderRepository;
    private final CompanyRepository companyRepository;
    private final NotificationService notificationService;

    /**
     * Processes notifications for all matches of a newly published order.
     *
     * @param orderId the ID of the published order
     */
    public void processOrderMatchNotifications(UUID orderId) {
        log.info("Processing match notifications for order: {}", orderId);

        try {
            // Get the order
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

            // Find all matches for this order that haven't been notified yet
            List<OrderMatch> pendingMatches = orderMatchRepository.findByOrderId(orderId)
                    .stream()
                    .filter(match -> !match.getNotificationSent())
                    .toList();

            log.info("Found {} pending notifications for order: {}", pendingMatches.size(), orderId);

            // Process each match
            for (OrderMatch match : pendingMatches) {
                try {
                    sendOrderMatchNotification(match, order);
                    match.markNotificationSent();
                    orderMatchRepository.save(match);

                    log.debug("Successfully sent notification for match: {} (provider: {}, score: {}%)",
                            match.getId(), match.getProviderId(), match.getMatchScorePercentage());

                } catch (Exception e) {
                    log.error("Failed to send notification for match: {} (provider: {})",
                            match.getId(), match.getProviderId(), e);
                    // Continue with other notifications even if one fails
                }
            }

            log.info("Completed processing {} notifications for order: {}", pendingMatches.size(), orderId);

        } catch (Exception e) {
            log.error("Error processing order match notifications for order: {}", orderId, e);
            throw new NotificationProcessingException("Failed to process notifications for order: " + orderId, e);
        }
    }

    /**
     * Sends a notification to a provider about a new order match.
     */
    private void sendOrderMatchNotification(OrderMatch match, Order order) {
        // Get provider company details
        Company provider = companyRepository.findById(match.getProviderId())
                .orElseThrow(
                        () -> new IllegalArgumentException("Provider company not found: " + match.getProviderId()));

        // Prepare notification variables
        Map<String, Object> variables = new HashMap<>();
        variables.put("companyName", provider.getName());
        variables.put("orderTitle", order.getTitle());
        variables.put("orderDescription", truncateDescription(order.getDescription(), 200));
        variables.put("orderLocation", formatLocation(order));
        variables.put("distanceKm",
                match.getDistanceKm() != null ? Math.round(match.getDistanceKm().doubleValue()) : "N/A");
        variables.put("matchScore", match.getMatchScorePercentage());
        variables.put("deadline", order.getDeadline() != null ? order.getDeadline().toLocalDate().toString() : "Offen");
        variables.put("budget",
                order.getBudget() != null ? "€" + String.format("%,.2f", order.getBudget()) : "Nach Vereinbarung");
        variables.put("urgency", getUrgencyDisplayName(order.getUrgency()));
        variables.put("contactName", order.getContactName());
        variables.put("contactEmail", order.getContactEmail());
        variables.put("viewOrderUrl", buildOrderViewUrl(order.getId()));

        // Create notification event
        if (provider.getContactEmail() != null) {
            NotificationEvent notificationEvent = NotificationEvent.builder()
                    .recipient(provider.getContactEmail())
                    .subject(String.format("Neuer Auftrag verfügbar: %s (%d%% Match)",
                            order.getTitle(), match.getMatchScorePercentage()))
                    .templateName("order-match-notification")
                    .variables(variables)
                    .type(NotificationEvent.NotificationType.EMAIL)
                    .priority(determineNotificationPriority(match, order))
                    .build();

            // Send notification
            notificationService.processNotificationEvent(notificationEvent);

            log.debug("Sent order match notification to provider {} for order {} (score: {}%)",
                    provider.getId(), order.getId(), match.getMatchScorePercentage());
        }
    }

    /**
     * Retries failed notifications.
     *
     * @param maxRetries maximum number of retry attempts
     */
    public void retryFailedNotifications(int maxRetries) {
        log.info("Retrying failed notifications (max retries: {})", maxRetries);

        // Find matches that should have been notified but haven't been
        // (older than 1 hour and still not notified)
        List<OrderMatch> failedMatches = orderMatchRepository.findFailedNotifications(
                java.time.LocalDateTime.now().minusHours(1),
                PageRequest.of(0, 50) // Process up to 50 failed notifications at a time
        ).getContent();

        log.info("Found {} failed notifications to retry", failedMatches.size());

        for (OrderMatch match : failedMatches) {
            try {
                Order order = orderRepository.findById(match.getOrderId()).orElse(null);
                if (order != null && order.isPublished()) {
                    sendOrderMatchNotification(match, order);
                    match.markNotificationSent();
                    orderMatchRepository.save(match);
                    log.info("Successfully retried notification for match: {}", match.getId());
                }
            } catch (Exception e) {
                log.error("Failed to retry notification for match: {}", match.getId(), e);
            }
        }
    }

    /**
     * Marks an order match as viewed by the provider.
     */
    public void markOrderMatchViewed(UUID orderId, UUID providerId) {
        try {
            orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                    .ifPresent(match -> {
                        match.markAsViewed();
                        orderMatchRepository.save(match);
                        log.info("Marked order match as viewed: order={}, provider={}", orderId, providerId);
                    });
        } catch (ObjectOptimisticLockingFailureException ex) {
            // Another concurrent request has already updated the row – that's fine
            log.info("Order match already marked as viewed concurrently for order={}, provider={}", orderId,
                    providerId);
        }
    }

    /**
     * Marks an order match as having provider interest.
     */
    public void markProviderInterest(UUID orderId, UUID providerId) {
        orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .ifPresent(match -> {
                    match.markAsInterested();
                    orderMatchRepository.save(match);
                    log.info("Marked provider interest: order={}, provider={}", orderId, providerId);
                });
    }

    // Helper methods

    private String truncateDescription(String description, int maxLength) {
        if (description == null || description.length() <= maxLength) {
            return description;
        }
        return description.substring(0, maxLength - 3) + "...";
    }

    private String formatLocation(Order order) {
        if (order.getServiceAddress() == null) {
            return "Nicht angegeben";
        }
        return String.format("%s, %s",
                order.getServiceAddress().getCity(),
                order.getServiceAddress().getPostalCode());
    }

    private String getUrgencyDisplayName(Urgency urgency) {
        if (urgency == null) {
            return "Normal";
        }
        return switch (urgency) {
            case LOW -> "Niedrig";
            case MEDIUM -> "Normal";
            case HIGH -> "Hoch";
            case URGENT -> "Dringend";
        };
    }

    private NotificationEvent.NotificationPriority determineNotificationPriority(OrderMatch match, Order order) {
        // High priority for high-score matches or urgent orders
        if (match.isHighQualityMatch() || order.getUrgency() == Urgency.URGENT) {
            return NotificationEvent.NotificationPriority.HIGH;
        }
        return NotificationEvent.NotificationPriority.NORMAL;
    }

    private String buildOrderViewUrl(UUID orderId) {
        // TODO: Configure base URL from application properties
        return String.format("https://app.indusync.de/dashboard/orders/%s", orderId);
    }

    /**
     * Custom exception for notification processing errors.
     */
    public static class NotificationProcessingException extends RuntimeException {
        public NotificationProcessingException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}