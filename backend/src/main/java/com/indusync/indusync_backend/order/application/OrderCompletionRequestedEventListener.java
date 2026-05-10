package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.OrderCompletionRequestedEvent;
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
public class OrderCompletionRequestedEventListener {
    private final NotificationService notificationService;
    private final CompanyManagementService companyManagementService;

    @Async
    @EventListener
    public void handleOrderCompletionRequested(OrderCompletionRequestedEvent event) {
        String counterpartEmail = companyManagementService.getBestContactEmail(event.counterpartCompanyId());
        String requesterName = companyManagementService.getCompanyName(event.requesterCompanyId());
        String orderId = event.orderId().toString();
        if (counterpartEmail == null) {
            log.warn("No counterpart email found for company {} (order {})", event.counterpartCompanyId(), orderId);
            return;
        }
        notificationService.sendEmail(
                counterpartEmail,
                "Abschlussanfrage für Auftrag erhalten",
                "completion-requested", // Template name
                Map.of(
                        "orderId", orderId,
                        "requesterName", requesterName,
                        "completionMessage", event.completionMessage(),
                        "requestedAt", event.requestedAt()
                )
        );
    }
} 