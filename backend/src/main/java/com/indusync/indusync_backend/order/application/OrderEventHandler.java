package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.OrderPublishedEvent;
import com.indusync.indusync_backend.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event handler for processing order-related events.
 * <p>
 * This handler listens for order events and triggers appropriate business
 * processes:
 * - Order matching when orders are published
 * - Notification sending to matched providers
 * - Analytics and tracking updates
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderEventHandler {

    private final OrderMatchingService orderMatchingService;
    private final OrderNotificationService orderNotificationService;

    /**
     * Handles order published events by triggering the matching algorithm.
     * <p>
     * This method processes OrderPublishedEvent asynchronously to avoid blocking
     * the order publication request. It triggers the matching algorithm to find
     * suitable service providers and creates match records.
     * </p>
     *
     * @param event the order published event
     */
    @EventListener
    @Async
    @Transactional
    public void handleOrderPublished(OrderPublishedEvent event) {
        log.info("Processing order published event for order: {} ({})",
                event.orderId(), event.title());

        try {
            // Step 1: Trigger order matching algorithm
            orderMatchingService.processOrderMatching(event);

            // Step 2: Send notifications to matched providers (handled separately)
            orderNotificationService.processOrderMatchNotifications(event.orderId());

            log.info("Successfully processed order published event for order: {}", event.orderId());

        } catch (Exception e) {
            log.error("Error processing order published event for order: {}", event.orderId(), e);
            // Note: We don't re-throw to avoid failing the order publication
            // The order is still published, but matching may need to be retried
        }
    }

    /**
     * Handles order cancellation events by cleaning up matches.
     *
     * @param event the order cancelled event (to be implemented)
     */
    // @EventListener
    // public void handleOrderCancelled(OrderCancelledEvent event) {
    // log.info("Processing order cancelled event for order: {}", event.orderId());
    // // Clean up matches and notify providers
    // }

    /**
     * Handles order completion events for post-completion processing.
     * <p>
     * This method processes OrderCompletedEvent to trigger various post-completion
     * workflows such as analytics updates, calendar synchronization, enabling reviews,
     * and sending completion notifications.
     * </p>
     *
     * @param event the order completed event
     */
    @EventListener
    @Async
    @Transactional
    public void handleOrderCompleted(com.indusync.indusync_backend.order.domain.OrderCompletedEvent event) {
        log.info("Processing order completed event for order: {} ({})", 
                event.orderId(), event.title());

        try {
            // Step 5: Log performance metrics for monitoring
            logCompletionMetrics(event);
            log.info("Successfully processed order completed event for order: {}", event.orderId());
        } catch (Exception e) {
            log.error("Error processing order completed event for order: {}", event.orderId(), e);
            // Note: We don't re-throw to avoid impacting the completion process
        }
    }

    /**
     * Logs completion metrics for monitoring and analytics.
     */
    private void logCompletionMetrics(com.indusync.indusync_backend.order.domain.OrderCompletedEvent event) {
        log.info("Order completion metrics - Order: {}, Duration: {} days, On Time: {}, " +
                "Requester: {}, Had Extensions: {}", 
                event.orderId(), 
                event.durationDays(), 
                event.completedOnTime(),
                event.getRequesterCompanyName(),
                event.hasDeadlineExtensions());
    }
}