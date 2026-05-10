package com.indusync.indusync_backend.order.application.service.impl;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.order.application.service.OrderCompletionService;
import com.indusync.indusync_backend.order.application.service.OrderEventPublisher;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderCompletedEvent;
import com.indusync.indusync_backend.order.domain.OrderCompletionRequest;
import com.indusync.indusync_backend.order.domain.OrderCompletionRequestRepository;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Implementation of OrderCompletionService for managing dual-confirmation order
 * completion workflow.
 * <p>
 * Follows SOLID Principles:
 * - Single Responsibility: Handles only order completion workflow logic
 * - Open/Closed: Extensible through interface without modification
 * - Liskov Substitution: Properly implements the service interface contract
 * - Interface Segregation: Depends only on specific repository methods needed
 * - Dependency Inversion: Depends on repository abstractions, not concrete
 * implementations
 * </p>
 * 
 * <p>
 * This service coordinates between the Order entity and OrderCompletionRequest
 * entity
 * to implement a robust dual-confirmation workflow where both parties must
 * agree
 * on order completion before the order transitions to COMPLETED status.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderCompletionServiceImpl implements OrderCompletionService {

    private final OrderRepository orderRepository;
    private final OrderCompletionRequestRepository completionRequestRepository;
    private final OrderEventPublisher eventPublisher;
    private final CompanyManagementService companyManagementService;

    // ========================================================================
    // COMPLETION REQUEST OPERATIONS
    // ========================================================================

    @Override
    public OrderCompletionRequest requestCompletion(UUID orderId, UUID requesterCompanyId, String completionMessage) {
        log.info("Requesting completion for order {} by company {}", orderId, requesterCompanyId);

        // Validate and fetch order
        Order order = validateOrderExistsAndGetOrder(orderId);
        validateOrderInProgress(order);
        validateCompanyInvolvedInOrder(order, requesterCompanyId);
        validateNoPendingCompletionRequest(orderId);

        // Create completion request
        OrderCompletionRequest completionRequest = OrderCompletionRequest.builder()
                .orderId(orderId)
                .requesterCompanyId(requesterCompanyId)
                .completionMessage(validateAndTrimMessage(completionMessage))
                .status(OrderCompletionRequest.Status.REQUESTED)
                .build();

        OrderCompletionRequest savedRequest = completionRequestRepository.save(completionRequest);

        log.info("Created completion request {} for order {} by company {}",
                savedRequest.getId(), orderId, requesterCompanyId);

        // Publish event for notification: completion requested
        UUID counterpartCompanyId = requesterCompanyId.equals(order.getCompanyId()) ? order.getProviderId()
                : order.getCompanyId();
        if (counterpartCompanyId != null) {
            eventPublisher.publishOrderCompletionRequestedEvent(
                    orderId,
                    requesterCompanyId,
                    counterpartCompanyId,
                    savedRequest.getId(),
                    savedRequest.getCompletionMessage(),
                    savedRequest.getCreatedAt());
        }

        return savedRequest;
    }

    @Override
    public OrderCompletionRequest confirmCompletion(UUID orderId, UUID confirmingCompanyId) {
        log.info("Confirming completion for order {} by company {}", orderId, confirmingCompanyId);

        // Validate and fetch order
        Order order = validateOrderExistsAndGetOrder(orderId);

        // Validate and fetch pending completion request
        OrderCompletionRequest completionRequest = validateAndGetPendingCompletionRequest(orderId);
        validateCompanyCanConfirm(order, completionRequest, confirmingCompanyId);

        // Perform domain logic - this validates business rules
        completionRequest.confirm(confirmingCompanyId);

        // Complete the order itself
        order.complete();

        // Save both entities
        OrderCompletionRequest savedRequest = completionRequestRepository.save(completionRequest);
        orderRepository.save(order);

        log.info("Confirmed completion request {} for order {} by company {}. Order status changed to COMPLETED.",
                savedRequest.getId(), orderId, confirmingCompanyId);

        // Publish completion event for post-completion processing
        publishOrderCompletedEvent(order, savedRequest);

        return savedRequest;
    }

    @Override
    public OrderCompletionRequest rejectCompletion(UUID orderId, UUID rejectingCompanyId, String rejectionReason) {
        log.info("Rejecting completion for order {} by company {}", orderId, rejectingCompanyId);

        // Validate and fetch order
        Order order = validateOrderExistsAndGetOrder(orderId);

        // Validate and fetch pending completion request
        OrderCompletionRequest completionRequest = validateAndGetPendingCompletionRequest(orderId);
        validateCompanyCanReject(order, completionRequest, rejectingCompanyId);

        // Perform domain logic - this validates business rules
        completionRequest.reject(rejectingCompanyId, validateAndTrimRejectionReason(rejectionReason));

        // Save completion request
        OrderCompletionRequest savedRequest = completionRequestRepository.save(completionRequest);

        log.info("Rejected completion request {} for order {} by company {} with reason: {}",
                savedRequest.getId(), orderId, rejectingCompanyId, rejectionReason);

        return savedRequest;
    }

    @Override
    public OrderCompletionRequest cancelCompletion(UUID orderId, UUID cancellingCompanyId) {
        log.info("Cancelling completion for order {} by company {}", orderId, cancellingCompanyId);

        // Validate and fetch order
        Order order = validateOrderExistsAndGetOrder(orderId);

        // Validate and fetch pending completion request
        OrderCompletionRequest completionRequest = validateAndGetPendingCompletionRequest(orderId);
        validateCompanyCanCancel(order, completionRequest, cancellingCompanyId);

        // Perform domain logic - this validates business rules
        completionRequest.cancel(cancellingCompanyId);

        // Save completion request
        OrderCompletionRequest savedRequest = completionRequestRepository.save(completionRequest);

        log.info("Cancelled completion request {} for order {} by company {}",
                savedRequest.getId(), orderId, cancellingCompanyId);

        return savedRequest;
    }

    // ========================================================================
    // QUERY OPERATIONS
    // ========================================================================

    @Override
    public Optional<OrderCompletionRequest> getCurrentCompletionRequest(UUID orderId) {
        log.debug("Fetching current completion request for order {}", orderId);
        return completionRequestRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId);
    }

    @Override
    public Optional<OrderCompletionRequest> getPendingCompletionRequest(UUID orderId) {
        log.debug("Fetching pending completion request for order {}", orderId);
        return completionRequestRepository.findPendingRequestForOrder(orderId);
    }

    @Override
    public List<OrderCompletionRequest> getCompletionRequestHistory(UUID orderId) {
        log.debug("Fetching completion request history for order {}", orderId);
        return completionRequestRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    // ========================================================================
    // AUTHORIZATION CHECK OPERATIONS
    // ========================================================================

    @Override
    public boolean canRequestCompletion(UUID orderId, UUID requesterCompanyId) {
        try {
            Order order = validateOrderExistsAndGetOrder(orderId);

            // Check if order is in correct status
            if (order.getStatus() != OrderStatus.IN_PROGRESS) {
                return false;
            }

            // Check if company is involved in order
            if (!isCompanyInvolvedInOrder(order, requesterCompanyId)) {
                return false;
            }

            // Check if there's already a pending request
            return !completionRequestRepository.existsPendingRequestForOrder(orderId);

        } catch (Exception e) {
            log.debug("Cannot request completion for order {} by company {}: {}",
                    orderId, requesterCompanyId, e.getMessage());
            return false;
        }
    }

    /**
     * Checks if a company has access to view completion requests for an order.
     * This is a more efficient security check that doesn't require checking
     * specific permissions.
     * 
     * @param orderId   The order ID to check access for
     * @param companyId The company ID to check access for
     * @return true if the company has access to view completion requests for the
     *         order
     */
    public boolean hasAccessToOrderCompletionRequests(UUID orderId, UUID companyId) {
        try {
            Order order = validateOrderExistsAndGetOrder(orderId);
            return isCompanyInvolvedInOrder(order, companyId);
        } catch (Exception e) {
            log.debug("Company {} does not have access to completion requests for order {}: {}",
                    companyId, orderId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean canConfirmCompletion(UUID orderId, UUID companyId) {
        try {
            Order order = validateOrderExistsAndGetOrder(orderId);
            Optional<OrderCompletionRequest> pendingRequest = getPendingCompletionRequest(orderId);

            return pendingRequest.isPresent() &&
                    pendingRequest.get().canBeConfirmedBy(companyId) &&
                    isCompanyInvolvedInOrder(order, companyId);

        } catch (Exception e) {
            log.debug("Cannot confirm completion for order {} by company {}: {}",
                    orderId, companyId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean canRejectCompletion(UUID orderId, UUID companyId) {
        try {
            Order order = validateOrderExistsAndGetOrder(orderId);
            Optional<OrderCompletionRequest> pendingRequest = getPendingCompletionRequest(orderId);

            return pendingRequest.isPresent() &&
                    pendingRequest.get().canBeRejectedBy(companyId) &&
                    isCompanyInvolvedInOrder(order, companyId);

        } catch (Exception e) {
            log.debug("Cannot reject completion for order {} by company {}: {}",
                    orderId, companyId, e.getMessage());
            return false;
        }
    }

    @Override
    public boolean canCancelCompletion(UUID orderId, UUID companyId) {
        try {
            Order order = validateOrderExistsAndGetOrder(orderId);
            Optional<OrderCompletionRequest> pendingRequest = getPendingCompletionRequest(orderId);

            return pendingRequest.isPresent() &&
                    pendingRequest.get().canBeCancelledBy(companyId) &&
                    isCompanyInvolvedInOrder(order, companyId);

        } catch (Exception e) {
            log.debug("Cannot cancel completion for order {} by company {}: {}",
                    orderId, companyId, e.getMessage());
            return false;
        }
    }

    // ========================================================================
    // PRIVATE VALIDATION METHODS (Single Responsibility: Input Validation)
    // ========================================================================

    private Order validateOrderExistsAndGetOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));
    }

    private void validateOrderInProgress(Order order) {
        if (order.getStatus() != OrderStatus.IN_PROGRESS) {
            throw new BadRequestException(
                    String.format("Abschluss kann nur für Aufträge mit Status 'In Bearbeitung' beantragt werden. " +
                            "Aktueller Status: %s", order.getStatus().getDisplayName()));
        }
    }

    private void validateCompanyInvolvedInOrder(Order order, UUID companyId) {
        if (!isCompanyInvolvedInOrder(order, companyId)) {
            throw new BadRequestException(
                    "Unternehmen ist nicht an diesem Auftrag beteiligt und kann keinen Abschluss beantragen");
        }
    }

    private boolean isCompanyInvolvedInOrder(Order order, UUID companyId) {
        return companyId.equals(order.getCompanyId()) || companyId.equals(order.getProviderId());
    }

    private void validateNoPendingCompletionRequest(UUID orderId) {
        if (completionRequestRepository.existsPendingRequestForOrder(orderId)) {
            throw new BadRequestException(
                    "Es existiert bereits ein offener Abschlussantrag für diesen Auftrag");
        }
    }

    private OrderCompletionRequest validateAndGetPendingCompletionRequest(UUID orderId) {
        return completionRequestRepository.findPendingRequestForOrder(orderId)
                .orElseThrow(() -> new BadRequestException(
                        "Kein offener Abschlussantrag für diesen Auftrag gefunden"));
    }

    private void validateCompanyCanConfirm(Order order, OrderCompletionRequest completionRequest,
            UUID confirmingCompanyId) {
        if (!isCompanyInvolvedInOrder(order, confirmingCompanyId)) {
            throw new BadRequestException("Unternehmen ist nicht an diesem Auftrag beteiligt");
        }

        if (!completionRequest.canBeConfirmedBy(confirmingCompanyId)) {
            throw new BadRequestException("Unternehmen kann diesen Abschlussantrag nicht bestätigen");
        }
    }

    private void validateCompanyCanReject(Order order, OrderCompletionRequest completionRequest,
            UUID rejectingCompanyId) {
        if (!isCompanyInvolvedInOrder(order, rejectingCompanyId)) {
            throw new BadRequestException("Unternehmen ist nicht an diesem Auftrag beteiligt");
        }

        if (!completionRequest.canBeRejectedBy(rejectingCompanyId)) {
            throw new BadRequestException("Unternehmen kann diesen Abschlussantrag nicht ablehnen");
        }
    }

    private void validateCompanyCanCancel(Order order, OrderCompletionRequest completionRequest,
            UUID cancellingCompanyId) {
        if (!isCompanyInvolvedInOrder(order, cancellingCompanyId)) {
            throw new BadRequestException("Unternehmen ist nicht an diesem Auftrag beteiligt");
        }

        if (!completionRequest.canBeCancelledBy(cancellingCompanyId)) {
            throw new BadRequestException("Unternehmen kann diesen Abschlussantrag nicht stornieren");
        }
    }

    private String validateAndTrimMessage(String message) {
        if (message == null) {
            return null;
        }

        String trimmed = message.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.length() > 1000) {
            throw new BadRequestException("Abschlussnachricht darf maximal 1000 Zeichen lang sein");
        }

        return trimmed;
    }

    private String validateAndTrimRejectionReason(String rejectionReason) {
        if (rejectionReason == null) {
            return null;
        }

        String trimmed = rejectionReason.trim();
        if (trimmed.isEmpty()) {
            return null;
        }

        if (trimmed.length() > 1000) {
            throw new BadRequestException("Ablehnungsgrund darf maximal 1000 Zeichen lang sein");
        }

        return trimmed;
    }

    // ========================================================================
    // EVENT PUBLISHING (Single Responsibility: Event Integration)
    // ========================================================================

    private void publishOrderCompletedEvent(Order order, OrderCompletionRequest completionRequest) {
        try {
            String clientCompanyName = companyManagementService.getCompanyName(order.getCompanyId());
            String providerCompanyName = companyManagementService.getCompanyName(order.getProviderId());
            OrderCompletedEvent event = OrderCompletedEvent.fromOrderAndCompletionRequest(
                    order,
                    completionRequest,
                    clientCompanyName,
                    providerCompanyName,
                    false);

            eventPublisher.publishOrderCompletedEvent(event);

            log.info("Published OrderCompletedEvent for order {} completed by completion request {}",
                    order.getId(), completionRequest.getId());

        } catch (Exception e) {
            log.error("Failed to publish OrderCompletedEvent for order {} - completion request {}",
                    order.getId(), completionRequest.getId(), e);
            // Don't re-throw to avoid failing the completion process
        }
    }

    // ========================================================================
    // CUSTOM EXCEPTIONS (Single Responsibility: Error Handling)
    // ========================================================================

    /**
     * Exception thrown when an order is not found.
     */
    public static class OrderNotFoundException extends BadRequestException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }
}