package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.application.service.impl.OrderCompletionServiceImpl;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderCompletionRequest;
import com.indusync.indusync_backend.order.domain.OrderCompletionRequestRepository;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderCompletionServiceImpl.
 * <p>
 * Tests the business logic in isolation using mocks for dependencies,
 * following SOLID principles by testing single responsibilities.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("OrderCompletionService Tests")
class OrderCompletionServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderCompletionRequestRepository completionRequestRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private OrderCompletionServiceImpl completionService;

    // Test data
    private UUID orderId;
    private UUID clientCompanyId;
    private UUID providerCompanyId;
    private Order inProgressOrder;
    private OrderCompletionRequest pendingRequest;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        clientCompanyId = UUID.randomUUID();
        providerCompanyId = UUID.randomUUID();

        // Create an order in IN_PROGRESS status
        inProgressOrder = new Order();
        inProgressOrder.setId(orderId);
        inProgressOrder.setTitle("Test Order");
        inProgressOrder.setDescription("Test Description");
        inProgressOrder.setStatus(OrderStatus.IN_PROGRESS);
        inProgressOrder.setCompanyId(clientCompanyId);
        inProgressOrder.setProviderId(providerCompanyId);

        // Create a pending completion request
        pendingRequest = OrderCompletionRequest.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .requesterCompanyId(clientCompanyId)
                .status(OrderCompletionRequest.Status.REQUESTED)
                .completionMessage("Work completed successfully")
                .build();
    }

    @Nested
    @DisplayName("Request Completion Tests")
    class RequestCompletionTests {

        @Test
        @DisplayName("Should create completion request when valid")
        void shouldCreateCompletionRequestWhenValid() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(false);
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.requestCompletion(
                    orderId, clientCompanyId, "Work completed");

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getOrderId()).isEqualTo(orderId);
            assertThat(result.getRequesterCompanyId()).isEqualTo(clientCompanyId);
            assertThat(result.getStatus()).isEqualTo(OrderCompletionRequest.Status.REQUESTED);
            assertThat(result.getCompletionMessage()).isEqualTo("Work completed");

            verify(completionRequestRepository).save(any(OrderCompletionRequest.class));
        }

        @Test
        @DisplayName("Should throw exception when order not found")
        void shouldThrowExceptionWhenOrderNotFound() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> completionService.requestCompletion(orderId, clientCompanyId, "message"))
                    .isInstanceOf(OrderCompletionServiceImpl.OrderNotFoundException.class)
                    .hasMessageContaining("Auftrag nicht gefunden");
        }

        @Test
        @DisplayName("Should throw exception when order not in progress")
        void shouldThrowExceptionWhenOrderNotInProgress() {
            // Given
            inProgressOrder.setStatus(OrderStatus.PUBLISHED);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));

            // When & Then
            assertThatThrownBy(() -> completionService.requestCompletion(orderId, clientCompanyId, "message"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("In Bearbeitung");
        }

        @Test
        @DisplayName("Should throw exception when company not involved")
        void shouldThrowExceptionWhenCompanyNotInvolved() {
            // Given
            UUID unrelatedCompanyId = UUID.randomUUID();
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));

            // When & Then
            assertThatThrownBy(() -> completionService.requestCompletion(orderId, unrelatedCompanyId, "message"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("nicht an diesem Auftrag beteiligt");
        }

        @Test
        @DisplayName("Should throw exception when pending request exists")
        void shouldThrowExceptionWhenPendingRequestExists() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(true);

            // When & Then
            assertThatThrownBy(() -> completionService.requestCompletion(orderId, clientCompanyId, "message"))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("offener Abschlussantrag");
        }
    }

    @Nested
    @DisplayName("Confirm Completion Tests")
    class ConfirmCompletionTests {

        @Test
        @DisplayName("Should confirm completion and complete order")
        void shouldConfirmCompletionAndCompleteOrder() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(orderRepository.save(any(Order.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.confirmCompletion(orderId, providerCompanyId);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrderCompletionRequest.Status.CONFIRMED);
            assertThat(result.getConfirmedByCompanyId()).isEqualTo(providerCompanyId);
            assertThat(result.getConfirmedAt()).isNotNull();
            assertThat(inProgressOrder.getStatus()).isEqualTo(OrderStatus.COMPLETED);
            assertThat(inProgressOrder.getCompletedAt()).isNotNull();

            verify(completionRequestRepository).save(any(OrderCompletionRequest.class));
            verify(orderRepository).save(any(Order.class));
            verify(eventPublisher).publishEvent(any());
        }

        @Test
        @DisplayName("Should throw exception when no pending request")
        void shouldThrowExceptionWhenNoPendingRequest() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> completionService.confirmCompletion(orderId, providerCompanyId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Kein offener Abschlussantrag");
        }

        @Test
        @DisplayName("Should throw exception when requester tries to confirm")
        void shouldThrowExceptionWhenRequesterTriesToConfirm() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));

            // When & Then
            assertThatThrownBy(() -> completionService.confirmCompletion(orderId, clientCompanyId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("kann diesen Abschlussantrag nicht bestätigen");
        }
    }

    @Nested
    @DisplayName("Reject Completion Tests")
    class RejectCompletionTests {

        @Test
        @DisplayName("Should reject completion with reason")
        void shouldRejectCompletionWithReason() {
            // Given
            String rejectionReason = "Additional work needed";
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.rejectCompletion(
                    orderId, providerCompanyId, rejectionReason);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrderCompletionRequest.Status.REJECTED);
            assertThat(result.getRejectedByCompanyId()).isEqualTo(providerCompanyId);
            assertThat(result.getRejectedAt()).isNotNull();
            assertThat(result.getRejectionReason()).isEqualTo(rejectionReason);

            verify(completionRequestRepository).save(any(OrderCompletionRequest.class));
            // Order should NOT be completed
            assertThat(inProgressOrder.getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);
        }

        @Test
        @DisplayName("Should reject completion without reason")
        void shouldRejectCompletionWithoutReason() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.rejectCompletion(
                    orderId, providerCompanyId, null);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrderCompletionRequest.Status.REJECTED);
            assertThat(result.getRejectionReason()).isNull();
            verify(completionRequestRepository).save(any(OrderCompletionRequest.class));
        }
    }

    @Nested
    @DisplayName("Cancel Completion Tests")
    class CancelCompletionTests {

        @Test
        @DisplayName("Should cancel completion request by requester")
        void shouldCancelCompletionRequestByRequester() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.cancelCompletion(orderId, clientCompanyId);

            // Then
            assertThat(result.getStatus()).isEqualTo(OrderCompletionRequest.Status.CANCELLED);
            assertThat(result.getCancelledAt()).isNotNull();

            verify(completionRequestRepository).save(any(OrderCompletionRequest.class));
        }

        @Test
        @DisplayName("Should throw exception when non-requester tries to cancel")
        void shouldThrowExceptionWhenNonRequesterTriesToCancel() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));

            // When & Then
            assertThatThrownBy(() -> completionService.cancelCompletion(orderId, providerCompanyId))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("kann diesen Abschlussantrag nicht stornieren");
        }
    }

    @Nested
    @DisplayName("Authorization Check Tests")
    class AuthorizationCheckTests {

        @Test
        @DisplayName("Should return true when can request completion")
        void shouldReturnTrueWhenCanRequestCompletion() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(false);

            // When
            boolean canRequest = completionService.canRequestCompletion(orderId, clientCompanyId);

            // Then
            assertThat(canRequest).isTrue();
        }

        @Test
        @DisplayName("Should return false when order not in progress")
        void shouldReturnFalseWhenOrderNotInProgress() {
            // Given
            inProgressOrder.setStatus(OrderStatus.PUBLISHED);
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));

            // When
            boolean canRequest = completionService.canRequestCompletion(orderId, clientCompanyId);

            // Then
            assertThat(canRequest).isFalse();
        }

        @Test
        @DisplayName("Should return true when can confirm completion")
        void shouldReturnTrueWhenCanConfirmCompletion() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));

            // When (provider confirming client's request)
            boolean canConfirm = completionService.canConfirmCompletion(orderId, providerCompanyId);

            // Then
            assertThat(canConfirm).isTrue();
        }

        @Test
        @DisplayName("Should return false when requester tries to confirm own request")
        void shouldReturnFalseWhenRequesterTriesToConfirmOwnRequest() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.findPendingRequestForOrder(orderId))
                    .thenReturn(Optional.of(pendingRequest));

            // When (client trying to confirm their own request)
            boolean canConfirm = completionService.canConfirmCompletion(orderId, clientCompanyId);

            // Then
            assertThat(canConfirm).isFalse();
        }
    }

    @Nested
    @DisplayName("Input Validation Tests")
    class InputValidationTests {

        @Test
        @DisplayName("Should trim and validate completion message")
        void shouldTrimAndValidateCompletionMessage() {
            // Given
            String messageWithSpaces = "  Work completed successfully  ";
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(false);
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.requestCompletion(
                    orderId, clientCompanyId, messageWithSpaces);

            // Then
            assertThat(result.getCompletionMessage()).isEqualTo("Work completed successfully");
        }

        @Test
        @DisplayName("Should handle null completion message")
        void shouldHandleNullCompletionMessage() {
            // Given
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(false);
            when(completionRequestRepository.save(any(OrderCompletionRequest.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            OrderCompletionRequest result = completionService.requestCompletion(
                    orderId, clientCompanyId, null);

            // Then
            assertThat(result.getCompletionMessage()).isNull();
        }

        @Test
        @DisplayName("Should throw exception for too long completion message")
        void shouldThrowExceptionForTooLongCompletionMessage() {
            // Given
            String longMessage = "a".repeat(1001); // 1001 characters
            when(orderRepository.findById(orderId)).thenReturn(Optional.of(inProgressOrder));
            when(completionRequestRepository.existsPendingRequestForOrder(orderId)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> completionService.requestCompletion(orderId, clientCompanyId, longMessage))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("maximal 1000 Zeichen");
        }
    }
}