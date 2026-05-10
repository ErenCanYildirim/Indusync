package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.order.domain.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class OrderEventListenersTest {
    @Mock
    NotificationService notificationService;
    @Mock
    CompanyManagementService companyManagementService;

    @InjectMocks
    ProviderInterestEventListener providerInterestEventListener;
    @InjectMocks
    OrderAssignedEventListener orderAssignedEventListener;
    @InjectMocks
    OrderCompletionRequestedEventListener orderCompletionRequestedEventListener;
    @InjectMocks
    OrderCompletedEventListener orderCompletedEventListener;

    @Captor
    ArgumentCaptor<Map<String, Object>> variablesCaptor;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testProviderInterestEventListener_sendsEmail() {
        UUID clientId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        when(companyManagementService.getBestContactEmail(clientId)).thenReturn("client@example.com");
        when(companyManagementService.getCompanyName(providerId)).thenReturn("Provider GmbH");
        ProviderShowedInterestEvent event = new ProviderShowedInterestEvent(
                UUID.randomUUID(), clientId, providerId, now);
        providerInterestEventListener.handleProviderShowedInterest(event);
        verify(notificationService).sendEmail(eq("client@example.com"), anyString(), eq("provider-interested"), anyMap());
    }

    @Test
    void testOrderAssignedEventListener_sendsEmail() {
        UUID clientId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        when(companyManagementService.getBestContactEmail(providerId)).thenReturn("provider@example.com");
        when(companyManagementService.getCompanyName(clientId)).thenReturn("Client AG");
        OrderAssignedEvent event = new OrderAssignedEvent(
                UUID.randomUUID(), clientId, providerId, now);
        orderAssignedEventListener.handleOrderAssigned(event);
        verify(notificationService).sendEmail(eq("provider@example.com"), anyString(), eq("provider-assigned"), anyMap());
    }

    @Test
    void testOrderCompletionRequestedEventListener_sendsEmail() {
        UUID requesterId = UUID.randomUUID();
        UUID counterpartId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        when(companyManagementService.getBestContactEmail(counterpartId)).thenReturn("counterpart@example.com");
        when(companyManagementService.getCompanyName(requesterId)).thenReturn("Requester GmbH");
        OrderCompletionRequestedEvent event = new OrderCompletionRequestedEvent(
                UUID.randomUUID(), requesterId, counterpartId, UUID.randomUUID(), "Bitte bestätigen", now);
        orderCompletionRequestedEventListener.handleOrderCompletionRequested(event);
        verify(notificationService).sendEmail(eq("counterpart@example.com"), anyString(), eq("completion-requested"), anyMap());
    }

    @Test
    void testOrderCompletedEventListener_sendsEmailToBothParties() {
        UUID clientId = UUID.randomUUID();
        UUID providerId = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();
        when(companyManagementService.getBestContactEmail(clientId)).thenReturn("client@example.com");
        when(companyManagementService.getBestContactEmail(providerId)).thenReturn("provider@example.com");
        OrderCompletedEvent event = OrderCompletedEvent.builder()
                .orderId(UUID.randomUUID())
                .clientCompanyId(clientId)
                .clientCompanyName("Client AG")
                .providerCompanyId(providerId)
                .providerCompanyName("Provider GmbH")
                .completionMessage("Danke für die Zusammenarbeit")
                .completionConfirmedAt(now)
                .build();
        orderCompletedEventListener.handleOrderCompleted(event);
        verify(notificationService).sendEmail(eq("client@example.com"), anyString(), eq("completion-confirmed"), anyMap());
        verify(notificationService).sendEmail(eq("provider@example.com"), anyString(), eq("completion-confirmed"), anyMap());
    }
} 