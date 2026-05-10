package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.OrderAssignedEvent;
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
public class OrderAssignedEventListener {
    private final NotificationService notificationService;
    private final CompanyManagementService companyManagementService;

    @Async
    @EventListener
    public void handleOrderAssigned(OrderAssignedEvent event) {
        String providerEmail = companyManagementService.getBestContactEmail(event.providerCompanyId());
        String clientName = companyManagementService.getCompanyName(event.clientCompanyId());
        String orderId = event.orderId().toString();
        if (providerEmail == null) {
            log.warn("No provider email found for company {} (order {})", event.providerCompanyId(), orderId);
            return;
        }
        notificationService.sendEmail(
                providerEmail,
                "Sie wurden für einen Auftrag ausgewählt",
                "provider-assigned", // Template name
                Map.of(
                        "orderId", orderId,
                        "clientName", clientName,
                        "assignedAt", event.assignedAt()
                )
        );
    }
} 