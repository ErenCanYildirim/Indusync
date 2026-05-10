package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderMatch;
import com.indusync.indusync_backend.order.domain.OrderMatchRepository;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service responsible for order matching between providers and clients.
 * Handles provider acceptance, client confirmation, and order assignment.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderMatchingManagementService {

    private final OrderRepository orderRepository;
    private final OrderMatchRepository orderMatchRepository;
    private final OrderValidationService validationService;
    private final OrderAuthorizationService authorizationService;
    private final OrderEventPublisher eventPublisher;

    /**
     * Provider accepts an order, marking the corresponding OrderMatch as
     * interested.
     * This signals intention to execute the order and awaits client confirmation.
     */
    public void acceptByProvider(UUID orderId, UUID providerId) {
        log.info("Provider {} accepting order {}", providerId, orderId);

        // Validate order exists & status
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        validationService.validateOrderCanAcceptProvider(order);

        // Validate match row exists
        OrderMatch match = orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .orElseThrow(() -> new MatchNotFoundException("Provider not matched to this order"));

        // Record interest / acceptance
        match.markAsInterested();
        orderMatchRepository.save(match);

        log.info("Provider {} marked as interested in order {}", providerId, orderId);

        // Publish domain event for analytics / notifications
        eventPublisher.publishProviderAcceptedEvent(orderId, providerId);
        // Publish event for notification: provider showed interest
        eventPublisher.publishProviderShowedInterestEvent(orderId, order.getCompanyId(), providerId,
                match.getRespondedAt());
    }

    /**
     * Client confirms a provider for the order. This assigns the provider, marks
     * the match accepted,
     * and transitions the order to IN_PROGRESS.
     */
    public void confirmProviderSelection(UUID orderId, UUID providerId, UUID clientCompanyId) {
        log.info("Client {} selecting provider {} for order {}", clientCompanyId, providerId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyProviderConfirmationAccess(order, clientCompanyId);

        // Validate order state
        validationService.validateOrderCanSelectProvider(order);

        OrderMatch match = orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .orElseThrow(() -> new MatchNotFoundException("Provider not matched to this order"));

        if (!Boolean.TRUE.equals(match.getInterested())) {
            throw new ProviderNotInterestedException("Provider did not express interest");
        }

        // Domain changes
        order.assignProvider(providerId);
        match.markAsAccepted();

        orderRepository.save(order);
        orderMatchRepository.save(match);

        log.info("Provider {} confirmed for order {} by client {}", providerId, orderId, clientCompanyId);

        // Publish lifecycle event for calendar/notification
        eventPublisher.publishOrderLifecycleEvent(order.getId(), OrderStatus.IN_PROGRESS);
        // Publish event for notification: order assigned to provider
        eventPublisher.publishOrderAssignedEvent(orderId, order.getCompanyId(), providerId, match.getAcceptedAt());
    }

    /**
     * Provider withdraws interest from an order.
     */
    public void withdrawProviderInterest(UUID orderId, UUID providerId) {
        log.info("Provider {} withdrawing interest from order {}", providerId, orderId);

        OrderMatch match = orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .orElseThrow(() -> new MatchNotFoundException("Provider not matched to this order"));

        if (!Boolean.TRUE.equals(match.getInterested())) {
            throw new ProviderNotInterestedException("Provider was not interested in this order");
        }

        // Remove interest
        // match.markAsNotInterested();
        orderMatchRepository.save(match);

        log.info("Provider {} withdrew interest from order {}", providerId, orderId);
    }

    /**
     * Client rejects a provider for an order.
     */
    public void rejectProvider(UUID orderId, UUID providerId, UUID clientCompanyId) {
        log.info("Client {} rejecting provider {} for order {}", clientCompanyId, providerId, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyOrderOwnership(order, clientCompanyId);

        OrderMatch match = orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .orElseThrow(() -> new MatchNotFoundException("Provider not matched to this order"));

        // Mark as rejected
        // match.markAsRejected();
        orderMatchRepository.save(match);

        log.info("Provider {} rejected for order {} by client {}", providerId, orderId, clientCompanyId);
    }

    /**
     * Gets all interested providers for an order.
     */
    public List<OrderMatch> getInterestedProviders(UUID orderId, UUID clientCompanyId) {
        log.debug("Getting interested providers for order {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyOrderOwnership(order, clientCompanyId);

        return orderMatchRepository.findByOrderIdAndInterestedTrue(orderId);
    }

    /**
     * Get number of interested providers for an order
     */
    public long getInterestedProviderCount(UUID orderId, UUID clientCompanyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyOrderOwnership(order, clientCompanyId);

        return orderMatchRepository.countByOrderIdAndInterestedTrue(orderId);
    }

    /**
     * Gets all matches for an order.
     */
    public List<OrderMatch> getOrderMatches(UUID orderId, UUID requestingCompanyId) {
        log.debug("Getting all matches for order {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization (owner or assigned provider can see matches)
        authorizationService.verifyOrderAccess(order, requestingCompanyId);

        return orderMatchRepository.findByOrderId(orderId);
    }

    /**
     * Checks if a provider has expressed interest in an order.
     */
    public boolean isProviderInterested(UUID orderId, UUID providerId) {
        return orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .map(match -> Boolean.TRUE.equals(match.getInterested()))
                .orElse(false);
    }

    /**
     * Checks if a provider is confirmed for an order.
     */
    public boolean isProviderConfirmed(UUID orderId, UUID providerId) {
        return orderMatchRepository.findByOrderIdAndProviderId(orderId, providerId)
                .map(match -> Boolean.TRUE.equals(match.getAccepted()))
                .orElse(false);
    }

    /**
     * Gets the count of interested providers for an order.
     */
    public long getInterestedProviderCount(UUID orderId) {
        return orderMatchRepository.countByOrderIdAndInterestedTrue(orderId);
    }

    /**
     * Completes an order (marks it as completed).
     */
    public void completeOrder(UUID orderId, UUID requestingCompanyId) {
        log.info("Completing order {} by company {}", orderId, requestingCompanyId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization (only client or assigned provider can complete)
        authorizationService.verifyOrderParticipation(order, requestingCompanyId);

        // Validate order can be completed
        if (order.getStatus() != OrderStatus.IN_PROGRESS) {
            throw new InvalidOrderStateException("Order can only be completed when IN_PROGRESS");
        }

        // Complete order
        order.complete();
        orderRepository.save(order);

        log.info("Order {} completed by company {}", orderId, requestingCompanyId);

        // Publish lifecycle event
        eventPublisher.publishOrderLifecycleEvent(orderId, OrderStatus.COMPLETED);
    }

    // Exception classes
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }

    public static class MatchNotFoundException extends RuntimeException {
        public MatchNotFoundException(String message) {
            super(message);
        }
    }

    public static class ProviderNotInterestedException extends RuntimeException {
        public ProviderNotInterestedException(String message) {
            super(message);
        }
    }

    public static class InvalidOrderStateException extends RuntimeException {
        public InvalidOrderStateException(String message) {
            super(message);
        }
    }
}