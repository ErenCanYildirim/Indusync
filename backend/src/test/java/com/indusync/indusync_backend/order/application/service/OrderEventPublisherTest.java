package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.notification.event.NotificationEvent;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderPublishedEvent;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderEventPublisher.
 * Tests all event publishing and notification logic for order operations.
 */
@ExtendWith(MockitoExtension.class)
class OrderEventPublisherTest {

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private CompanyRepository companyRepository;

    private OrderEventPublisher orderEventPublisher;

    private static final UUID ORDER_ID = UUID.randomUUID();
    private static final UUID COMPANY_ID = UUID.randomUUID();
    private static final UUID PROVIDER_ID = UUID.randomUUID();
    private static final UUID COUNTERPART_ID = UUID.randomUUID();
    private static final String COMPANY_NAME = "Test Company";
    private static final String COMPANY_EMAIL = "company@example.com";
    private static final String PROVIDER_EMAIL = "provider@example.com";
    private static final LocalDateTime PROPOSED_DEADLINE = LocalDateTime.now().plusDays(7);

    @BeforeEach
    void setUp() {
        orderEventPublisher = new OrderEventPublisher(eventPublisher, companyRepository);
    }

    // ===== publishOrderPublishedEvent Tests =====

    @Test
    @DisplayName("Should publish order published event successfully")
    void publishOrderPublishedEvent_Success() {
        // Given
        Order order = createOrder();
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));

        // When
        orderEventPublisher.publishOrderPublishedEvent(order);

        // Then
        ArgumentCaptor<OrderPublishedEvent> eventCaptor = ArgumentCaptor.forClass(OrderPublishedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        OrderPublishedEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.orderId()).isEqualTo(ORDER_ID);
        assertThat(publishedEvent.companyName()).isEqualTo(COMPANY_NAME);
    }

    @Test
    @DisplayName("Should handle company not found gracefully when publishing order event")
    void publishOrderPublishedEvent_CompanyNotFound() {
        // Given
        Order order = createOrder();
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.empty());

        // When
        orderEventPublisher.publishOrderPublishedEvent(order);

        // Then
        ArgumentCaptor<OrderPublishedEvent> eventCaptor = ArgumentCaptor.forClass(OrderPublishedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        OrderPublishedEvent publishedEvent = eventCaptor.getValue();
        assertThat(publishedEvent.orderId()).isEqualTo(ORDER_ID);
        assertThat(publishedEvent.companyName()).isEqualTo("Unknown Company");
    }

    @Test
    @DisplayName("Should not fail when event publishing throws exception")
    void publishOrderPublishedEvent_ExceptionHandling() {
        // Given
        Order order = createOrder();
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
        doThrow(new RuntimeException("Event publishing failed")).when(eventPublisher).publishEvent(any(OrderPublishedEvent.class));

        // When & Then - Should not throw exception
        orderEventPublisher.publishOrderPublishedEvent(order);
        
        verify(eventPublisher).publishEvent(any(OrderPublishedEvent.class));
    }

    // ===== publishProviderAcceptedEvent Tests =====

    @Test
    @DisplayName("Should publish provider accepted event successfully")
    void publishProviderAcceptedEvent_Success() {
        // When
        orderEventPublisher.publishProviderAcceptedEvent(ORDER_ID, PROVIDER_ID);

        // Then
        ArgumentCaptor<OrderEventPublisher.ProviderAcceptedOrderEvent> eventCaptor = 
                ArgumentCaptor.forClass(OrderEventPublisher.ProviderAcceptedOrderEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        OrderEventPublisher.ProviderAcceptedOrderEvent event = eventCaptor.getValue();
        assertThat(event.orderId()).isEqualTo(ORDER_ID);
        assertThat(event.providerId()).isEqualTo(PROVIDER_ID);
    }

    @Test
    @DisplayName("Should handle exception in provider accepted event")
    void publishProviderAcceptedEvent_ExceptionHandling() {
        // Given
        doThrow(new RuntimeException("Event publishing failed")).when(eventPublisher).publishEvent(any(OrderEventPublisher.ProviderAcceptedOrderEvent.class));

        // When & Then - Should not throw exception
        orderEventPublisher.publishProviderAcceptedEvent(ORDER_ID, PROVIDER_ID);
        
        verify(eventPublisher).publishEvent(any(OrderEventPublisher.ProviderAcceptedOrderEvent.class));
    }

    // ===== publishOrderLifecycleEvent Tests =====

    @Test
    @DisplayName("Should publish order lifecycle event successfully")
    void publishOrderLifecycleEvent_Success() {
        // When
        orderEventPublisher.publishOrderLifecycleEvent(ORDER_ID, OrderStatus.PUBLISHED);

        // Then
        ArgumentCaptor<OrderEventPublisher.OrderLifecycleEvent> eventCaptor = 
                ArgumentCaptor.forClass(OrderEventPublisher.OrderLifecycleEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        OrderEventPublisher.OrderLifecycleEvent event = eventCaptor.getValue();
        assertThat(event.orderId()).isEqualTo(ORDER_ID);
        assertThat(event.newStatus()).isEqualTo(OrderStatus.PUBLISHED);
    }

    // ===== publishDeadlineExtensionProposedNotification Tests =====

    @Test
    @DisplayName("Should publish deadline extension proposed notification successfully")
    void publishDeadlineExtensionProposedNotification_Success() {
        // Given
        Company counterpart = createCompany(COUNTERPART_ID, "Counterpart Company", COMPANY_EMAIL);
        when(companyRepository.findById(COUNTERPART_ID)).thenReturn(Optional.of(counterpart));

        // When
        orderEventPublisher.publishDeadlineExtensionProposedNotification(ORDER_ID, PROPOSED_DEADLINE, COUNTERPART_ID);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        NotificationEvent notification = eventCaptor.getValue();
        assertThat(notification.getRecipient()).isEqualTo(COMPANY_EMAIL);
        assertThat(notification.getSubject()).isEqualTo("Deadline extension proposed");
        assertThat(notification.getTemplateName()).isEqualTo("order-deadline-extension-proposed");
        assertThat(notification.getType()).isEqualTo(NotificationEvent.NotificationType.EMAIL);
        assertThat(notification.getVariables()).containsKey("orderId");
        assertThat(notification.getVariables()).containsKey("proposedDeadline");
    }

    @Test
    @DisplayName("Should not publish notification when counterpart has no email")
    void publishDeadlineExtensionProposedNotification_NoEmail() {
        // Given
        Company counterpart = createCompany(COUNTERPART_ID, "Counterpart Company", null);
        when(companyRepository.findById(COUNTERPART_ID)).thenReturn(Optional.of(counterpart));

        // When
        orderEventPublisher.publishDeadlineExtensionProposedNotification(ORDER_ID, PROPOSED_DEADLINE, COUNTERPART_ID);

        // Then
        verify(eventPublisher, never()).publishEvent(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("Should not publish notification when counterpart not found")
    void publishDeadlineExtensionProposedNotification_CounterpartNotFound() {
        // Given
        when(companyRepository.findById(COUNTERPART_ID)).thenReturn(Optional.empty());

        // When
        orderEventPublisher.publishDeadlineExtensionProposedNotification(ORDER_ID, PROPOSED_DEADLINE, COUNTERPART_ID);

        // Then
        verify(eventPublisher, never()).publishEvent(any(NotificationEvent.class));
    }

    // ===== publishDeadlineExtensionConfirmedNotification Tests =====

    @Test
    @DisplayName("Should publish deadline extension confirmed notification to all parties")
    void publishDeadlineExtensionConfirmedNotification_Success() {
        // Given
        Order order = createOrderWithProvider();
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        Company provider = createCompany(PROVIDER_ID, "Provider Company", PROVIDER_EMAIL);
        
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
        when(companyRepository.findById(PROVIDER_ID)).thenReturn(Optional.of(provider));

        // When
        orderEventPublisher.publishDeadlineExtensionConfirmedNotification(order);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher, times(2)).publishEvent(eventCaptor.capture());
        
        var notifications = eventCaptor.getAllValues();
        assertThat(notifications).hasSize(2);
        
        // Verify both parties get notifications
        var recipients = notifications.stream().map(NotificationEvent::getRecipient).toList();
        assertThat(recipients).containsExactlyInAnyOrder(COMPANY_EMAIL, PROVIDER_EMAIL);
        
        for (NotificationEvent notification : notifications) {
            assertThat(notification.getSubject()).isEqualTo("Deadline extension confirmed");
            assertThat(notification.getTemplateName()).isEqualTo("order-deadline-extension-confirmed");
            assertThat(notification.getType()).isEqualTo(NotificationEvent.NotificationType.EMAIL);
            assertThat(notification.getVariables()).containsKey("orderId");
            assertThat(notification.getVariables()).containsKey("newDeadline");
        }
    }

    @Test
    @DisplayName("Should only send notifications to parties with valid emails")
    void publishDeadlineExtensionConfirmedNotification_OnlyValidEmails() {
        // Given
        Order order = createOrderWithProvider();
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        Company provider = createCompany(PROVIDER_ID, "Provider Company", ""); // Empty email
        
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));
        when(companyRepository.findById(PROVIDER_ID)).thenReturn(Optional.of(provider));

        // When
        orderEventPublisher.publishDeadlineExtensionConfirmedNotification(order);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher, times(1)).publishEvent(eventCaptor.capture());
        
        NotificationEvent notification = eventCaptor.getValue();
        assertThat(notification.getRecipient()).isEqualTo(COMPANY_EMAIL);
    }

    // ===== publishDeadlineExtensionRejectedNotification Tests =====

    @Test
    @DisplayName("Should publish deadline extension rejected notification to requester")
    void publishDeadlineExtensionRejectedNotification_Success() {
        // Given
        Order order = createOrder();
        String rejectionReason = "Cannot extend due to constraints";
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));

        // When
        orderEventPublisher.publishDeadlineExtensionRejectedNotification(order, rejectionReason);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        NotificationEvent notification = eventCaptor.getValue();
        assertThat(notification.getRecipient()).isEqualTo(COMPANY_EMAIL);
        assertThat(notification.getSubject()).isEqualTo("Deadline extension rejected");
        assertThat(notification.getTemplateName()).isEqualTo("order-deadline-extension-rejected");
        assertThat(notification.getVariables()).containsEntry("rejectionReason", rejectionReason);
    }

    @Test
    @DisplayName("Should use default reason when rejection reason is null")
    void publishDeadlineExtensionRejectedNotification_NullReason() {
        // Given
        Order order = createOrder();
        Company company = createCompany(COMPANY_ID, COMPANY_NAME, COMPANY_EMAIL);
        when(companyRepository.findById(COMPANY_ID)).thenReturn(Optional.of(company));

        // When
        orderEventPublisher.publishDeadlineExtensionRejectedNotification(order, null);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        NotificationEvent notification = eventCaptor.getValue();
        assertThat(notification.getVariables()).containsEntry("rejectionReason", "No reason provided");
    }

    // ===== publishDeadlineExtensionCancelledNotification Tests =====

    @Test
    @DisplayName("Should publish deadline extension cancelled notification to provider")
    void publishDeadlineExtensionCancelledNotification_Success() {
        // Given
        Order order = createOrderWithProvider();
        Company provider = createCompany(PROVIDER_ID, "Provider Company", PROVIDER_EMAIL);
        when(companyRepository.findById(PROVIDER_ID)).thenReturn(Optional.of(provider));

        // When
        orderEventPublisher.publishDeadlineExtensionCancelledNotification(order);

        // Then
        ArgumentCaptor<NotificationEvent> eventCaptor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        
        NotificationEvent notification = eventCaptor.getValue();
        assertThat(notification.getRecipient()).isEqualTo(PROVIDER_EMAIL);
        assertThat(notification.getSubject()).isEqualTo("Deadline extension cancelled");
        assertThat(notification.getTemplateName()).isEqualTo("order-deadline-extension-cancelled");
        assertThat(notification.getVariables()).containsEntry("orderId", ORDER_ID.toString());
    }

    @Test
    @DisplayName("Should not publish notification when order has no provider")
    void publishDeadlineExtensionCancelledNotification_NoProvider() {
        // Given
        Order order = createOrder(); // No provider set

        // When
        orderEventPublisher.publishDeadlineExtensionCancelledNotification(order);

        // Then
        verify(eventPublisher, never()).publishEvent(any(NotificationEvent.class));
    }

    @Test
    @DisplayName("Should not publish notification when provider has no email")
    void publishDeadlineExtensionCancelledNotification_NoProviderEmail() {
        // Given
        Order order = createOrderWithProvider();
        Company provider = createCompany(PROVIDER_ID, "Provider Company", null);
        when(companyRepository.findById(PROVIDER_ID)).thenReturn(Optional.of(provider));

        // When
        orderEventPublisher.publishDeadlineExtensionCancelledNotification(order);

        // Then
        verify(eventPublisher, never()).publishEvent(any(NotificationEvent.class));
    }

    // ===== Exception Handling Tests =====

    @Test
    @DisplayName("Should handle database exceptions gracefully")
    void publishDeadlineExtensionProposedNotification_DatabaseException() {
        // Given
        when(companyRepository.findById(COUNTERPART_ID)).thenThrow(new RuntimeException("Database error"));

        // When & Then - Should not throw exception
        orderEventPublisher.publishDeadlineExtensionProposedNotification(ORDER_ID, PROPOSED_DEADLINE, COUNTERPART_ID);
        
        verify(eventPublisher, never()).publishEvent(any(NotificationEvent.class));
    }

    // ===== Helper Methods =====

    private Order createOrder() {
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setCompanyId(COMPANY_ID);
        order.setTitle("Test Order");
        order.setDescription("Test Description");
        order.setStatus(OrderStatus.PUBLISHED);
        order.setDeadline(LocalDateTime.now().plusDays(14));
        return order;
    }

    private Order createOrderWithProvider() {
        Order order = createOrder();
        order.setProviderId(PROVIDER_ID);
        return order;
    }

    private Company createCompany(UUID id, String name, String email) {
        Company company = new Company();
        company.setId(id);
        company.setName(name);
        company.setContactEmail(email);
        return company;
    }
}