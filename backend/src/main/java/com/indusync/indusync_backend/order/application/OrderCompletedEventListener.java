package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.OrderCompletedEvent;
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
public class OrderCompletedEventListener {
    private final NotificationService notificationService;
    private final CompanyManagementService companyManagementService;

    @Async
    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        String clientEmail = companyManagementService.getBestContactEmail(event.clientCompanyId());
        String providerEmail = companyManagementService.getBestContactEmail(event.providerCompanyId());
        String orderId = event.orderId().toString();
        if (clientEmail == null && providerEmail == null) {
            log.warn("No client or provider email found for order {}", orderId);
            return;
        }
        Map<String, Object> variables = Map.of(
                "orderId", orderId,
                "clientCompanyName", event.clientCompanyName(),
                "providerCompanyName", event.providerCompanyName(),
                "completionMessage", event.completionMessage(),
                "completionConfirmedAt", event.completionConfirmedAt()
        );
        if (clientEmail != null) {
            notificationService.sendEmail(
                    clientEmail,
                    "Auftrag erfolgreich abgeschlossen",
                    "completion-confirmed",
                    variables
            );
        }
        if (providerEmail != null) {
            notificationService.sendEmail(
                    providerEmail,
                    "Auftrag erfolgreich abgeschlossen",
                    "completion-confirmed",
                    variables
            );
        }
    }
} 