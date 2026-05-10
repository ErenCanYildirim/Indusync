package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.OrderMatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for OrderMatchedEvent and triggers notification pipeline.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OrderMatchedEventListener {

    private final OrderNotificationService orderNotificationService;

    @EventListener
    @Async
    public void handleOrderMatched(OrderMatchedEvent event) {
        log.info("Handling OrderMatchedEvent for order {} ({} providers)", event.orderId(), event.providerIds().size());
        try {
            orderNotificationService.processOrderMatchNotifications(event.orderId());
        } catch (Exception e) {
            log.error("Failed to process notifications for order {}", event.orderId(), e);
        }
    }
} 