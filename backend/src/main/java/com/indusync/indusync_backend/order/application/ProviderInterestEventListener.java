package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.domain.ProviderShowedInterestEvent;
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
public class ProviderInterestEventListener {
    private final NotificationService notificationService;
    private final CompanyManagementService companyManagementService;

    @Async
    @EventListener
    public void handleProviderShowedInterest(ProviderShowedInterestEvent event) {
        String clientEmail = companyManagementService.getBestContactEmail(event.clientCompanyId());
        String providerName = companyManagementService.getCompanyName(event.providerCompanyId());
        String orderId = event.orderId().toString();
        if (clientEmail == null) {
            log.warn("No client email found for company {} (order {})", event.clientCompanyId(), orderId);
            return;
        }
        notificationService.sendEmail(
                clientEmail,
                "Ein Dienstleister hat Interesse an Ihrem Auftrag",
                "provider-interested", // Template name
                Map.of(
                        "orderId", orderId,
                        "providerName", providerName,
                        "interestedAt", event.interestedAt()));
    }
}