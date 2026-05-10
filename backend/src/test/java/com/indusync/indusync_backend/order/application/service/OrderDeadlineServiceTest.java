package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposal;
import com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposalRepository;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderDeadlineService.
 * Tests all deadline extension functionality including proposal, confirmation, rejection, and cancellation.
 */
@ExtendWith(MockitoExtension.class)
class OrderDeadlineServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderDeadlineExtensionProposalRepository extensionProposalRepository;

    @Mock
    private OrderValidationService validationService;

    @Mock
    private OrderAuthorizationService authorizationService;

    @Mock
    private OrderEventPublisher eventPublisher;

    private OrderDeadlineService deadlineService;

    private static final UUID ORDER_ID = UUID.randomUUID();
    private static final UUID REQUESTER_COMPANY_ID = UUID.randomUUID();
    private static final UUID PROVIDER_COMPANY_ID = UUID.randomUUID();
    private static final UUID CLIENT_COMPANY_ID = UUID.randomUUID();
    private static final LocalDateTime PROPOSED_DEADLINE = LocalDateTime.now().plusDays(7);

    @BeforeEach
    void setUp() {
        deadlineService = new OrderDeadlineService(
                orderRepository,
                extensionProposalRepository,
                validationService,
                authorizationService,
                eventPublisher
        );
    }

    // ===== Propose Deadline Extension Tests =====

    @Test
    @DisplayName("Should successfully propose deadline extension")
    void proposeDeadlineExtension_Success() {
        // Given
        Order order = createOrder();
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.empty());

        // When - CLIENT_COMPANY_ID proposes extension
        deadlineService.proposeDeadlineExtension(ORDER_ID, PROPOSED_DEADLINE, CLIENT_COMPANY_ID);

        // Then - PROVIDER_COMPANY_ID should be notified (counterpart)
        verify(authorizationService).verifyOrderParticipation(order, CLIENT_COMPANY_ID);
        verify(validationService).validateDeadlineExtensionProposal(order, PROPOSED_DEADLINE);
        verify(extensionProposalRepository).save(any(OrderDeadlineExtensionProposal.class));
        verify(eventPublisher).publishDeadlineExtensionProposedNotification(
                eq(ORDER_ID), eq(PROPOSED_DEADLINE), eq(PROVIDER_COMPANY_ID));
        verify(eventPublisher).publishOrderLifecycleEvent(ORDER_ID, OrderStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("Should throw exception when order not found")
    void proposeDeadlineExtension_OrderNotFound() {
        // Given
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> deadlineService.proposeDeadlineExtension(ORDER_ID, PROPOSED_DEADLINE, REQUESTER_COMPANY_ID))
                .isInstanceOf(OrderDeadlineService.OrderNotFoundException.class)
                .hasMessage("Order not found: " + ORDER_ID);

        verify(extensionProposalRepository, never()).save(any());
    }

    @Test
    @DisplayName("Should throw exception when pending proposal already exists")
    void proposeDeadlineExtension_PendingProposalExists() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal existingProposal = createProposal();
        
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(existingProposal));

        // When & Then
        assertThatThrownBy(() -> deadlineService.proposeDeadlineExtension(ORDER_ID, PROPOSED_DEADLINE, REQUESTER_COMPANY_ID))
                .isInstanceOf(OrderDeadlineService.PendingProposalExistsException.class)
                .hasMessage("There is already a pending deadline extension");

        verify(extensionProposalRepository, never()).save(any());
    }

    // ===== Confirm Deadline Extension Tests =====

    @Test
    @DisplayName("Should successfully confirm deadline extension")
    void confirmDeadlineExtension_Success() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When
        deadlineService.confirmDeadlineExtension(ORDER_ID, PROVIDER_COMPANY_ID);

        // Then
        verify(authorizationService).verifyOrderParticipation(order, PROVIDER_COMPANY_ID);
        verify(orderRepository).save(order);
        verify(extensionProposalRepository).save(proposal);
        verify(eventPublisher).publishDeadlineExtensionConfirmedNotification(order);
        verify(eventPublisher).publishOrderLifecycleEvent(ORDER_ID, OrderStatus.IN_PROGRESS);
        
        assertThat(order.getDeadline()).isEqualTo(PROPOSED_DEADLINE);
        assertThat(proposal.getStatus()).isEqualTo(OrderDeadlineExtensionProposal.Status.CONFIRMED);
        assertThat(proposal.getConfirmedByCompanyId()).isEqualTo(PROVIDER_COMPANY_ID);
        assertThat(proposal.getConfirmedAt()).isNotNull();
    }

    @Test
    @DisplayName("Should throw exception when no pending proposal exists for confirmation")
    void confirmDeadlineExtension_NoProposal() {
        // Given
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> deadlineService.confirmDeadlineExtension(ORDER_ID, PROVIDER_COMPANY_ID))
                .isInstanceOf(OrderDeadlineService.ProposalNotFoundException.class)
                .hasMessage("No pending deadline extension for this order");
    }

    @Test
    @DisplayName("Should throw exception when requester tries to confirm own proposal")
    void confirmDeadlineExtension_RequesterCannotConfirm() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> deadlineService.confirmDeadlineExtension(ORDER_ID, REQUESTER_COMPANY_ID))
                .isInstanceOf(OrderDeadlineService.InvalidConfirmerException.class)
                .hasMessage("Requester cannot confirm their own proposal");
    }

    // ===== Reject Deadline Extension Tests =====

    @Test
    @DisplayName("Should successfully reject deadline extension")
    void rejectDeadlineExtension_Success() {
        // Given
        String rejectionReason = "Cannot extend deadline due to project constraints";
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When
        deadlineService.rejectDeadlineExtension(ORDER_ID, PROVIDER_COMPANY_ID, rejectionReason);

        // Then
        verify(authorizationService).verifyOrderParticipation(order, PROVIDER_COMPANY_ID);
        verify(extensionProposalRepository).save(proposal);
        verify(eventPublisher).publishDeadlineExtensionRejectedNotification(order, rejectionReason);
        
        assertThat(proposal.getStatus()).isEqualTo(OrderDeadlineExtensionProposal.Status.REJECTED);
        assertThat(proposal.getRejectedByCompanyId()).isEqualTo(PROVIDER_COMPANY_ID);
        assertThat(proposal.getRejectedAt()).isNotNull();
        assertThat(proposal.getRejectionReason()).isEqualTo(rejectionReason);
    }

    @Test
    @DisplayName("Should throw exception when requester tries to reject own proposal")
    void rejectDeadlineExtension_RequesterCannotReject() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> deadlineService.rejectDeadlineExtension(ORDER_ID, REQUESTER_COMPANY_ID, "reason"))
                .isInstanceOf(OrderDeadlineService.InvalidRejecterException.class)
                .hasMessage("Requester cannot reject their own proposal");
    }

    // ===== Cancel Deadline Extension Tests =====

    @Test
    @DisplayName("Should successfully cancel deadline extension proposal")
    void cancelDeadlineExtensionProposal_Success() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When
        deadlineService.cancelDeadlineExtensionProposal(ORDER_ID, REQUESTER_COMPANY_ID);

        // Then
        verify(extensionProposalRepository).save(proposal);
        verify(eventPublisher).publishDeadlineExtensionCancelledNotification(order);
        
        assertThat(proposal.getStatus()).isEqualTo(OrderDeadlineExtensionProposal.Status.CANCELLED);
        assertThat(proposal.getCancelledAt()).isNotNull();
    }

    @Test
    @DisplayName("Should throw exception when non-requester tries to cancel proposal")
    void cancelDeadlineExtensionProposal_UnauthorizedCancellation() {
        // Given
        OrderDeadlineExtensionProposal proposal = createProposal();
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));

        // When & Then
        assertThatThrownBy(() -> deadlineService.cancelDeadlineExtensionProposal(ORDER_ID, PROVIDER_COMPANY_ID))
                .isInstanceOf(OrderDeadlineService.UnauthorizedCancellationException.class)
                .hasMessage("Only the requester can cancel their proposal");
    }

    // ===== Get Pending Proposal Tests =====

    @Test
    @DisplayName("Should return pending proposal when exists")
    void getPendingProposal_Success() {
        // Given
        Order order = createOrder();
        OrderDeadlineExtensionProposal proposal = createProposal();
        
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(proposal));

        // When
        OrderDeadlineExtensionProposal result = deadlineService.getPendingProposal(ORDER_ID, REQUESTER_COMPANY_ID);

        // Then
        verify(authorizationService).verifyOrderParticipation(order, REQUESTER_COMPANY_ID);
        assertThat(result).isEqualTo(proposal);
    }

    @Test
    @DisplayName("Should return null when no pending proposal exists")
    void getPendingProposal_NotFound() {
        // Given
        Order order = createOrder();
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.empty());

        // When
        OrderDeadlineExtensionProposal result = deadlineService.getPendingProposal(ORDER_ID, REQUESTER_COMPANY_ID);

        // Then
        assertThat(result).isNull();
    }

    // ===== Has Pending Proposal Tests =====

    @Test
    @DisplayName("Should return true when pending proposal exists")
    void hasPendingProposal_True() {
        // Given
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.of(createProposal()));

        // When
        boolean result = deadlineService.hasPendingProposal(ORDER_ID);

        // Then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false when no pending proposal exists")
    void hasPendingProposal_False() {
        // Given
        when(extensionProposalRepository.findByOrderIdAndStatus(ORDER_ID, OrderDeadlineExtensionProposal.Status.PROPOSED))
                .thenReturn(Optional.empty());

        // When
        boolean result = deadlineService.hasPendingProposal(ORDER_ID);

        // Then
        assertThat(result).isFalse();
    }

    // ===== Helper Methods =====

    private Order createOrder() {
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setCompanyId(CLIENT_COMPANY_ID);
        order.setProviderId(PROVIDER_COMPANY_ID);
        order.setStatus(OrderStatus.IN_PROGRESS);
        order.setDeadline(LocalDateTime.now().plusDays(3));
        return order;
    }

    private OrderDeadlineExtensionProposal createProposal() {
        return OrderDeadlineExtensionProposal.builder()
                .id(UUID.randomUUID())
                .orderId(ORDER_ID)
                .proposedDeadline(PROPOSED_DEADLINE)
                .requesterCompanyId(REQUESTER_COMPANY_ID)
                .status(OrderDeadlineExtensionProposal.Status.PROPOSED)
                .createdAt(LocalDateTime.now())
                .build();
    }
}