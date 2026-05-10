package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposal;
import com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposalRepository;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Service responsible for managing order deadline extensions.
 * Handles proposal, confirmation, and rejection of deadline changes.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderDeadlineService {

    private final OrderRepository orderRepository;
    private final OrderDeadlineExtensionProposalRepository extensionProposalRepository;
    private final OrderValidationService validationService;
    private final OrderAuthorizationService authorizationService;
    private final OrderEventPublisher eventPublisher;

    /**
     * Provider or client proposes a new deadline.
     */
    public void proposeDeadlineExtension(UUID orderId, LocalDateTime proposedDeadline, UUID requesterCompanyId) {
        log.info("Company {} proposes deadline {} for order {}", requesterCompanyId, proposedDeadline, orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyOrderParticipation(order, requesterCompanyId);

        // Validate deadline extension can be proposed
        validationService.validateDeadlineExtensionProposal(order, proposedDeadline);

        // Ensure no existing pending proposal
        extensionProposalRepository.findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .ifPresent(p -> {
                    throw new PendingProposalExistsException("There is already a pending deadline extension");
                });

        // Create a proposal
        OrderDeadlineExtensionProposal proposal = OrderDeadlineExtensionProposal.builder()
                .id(UUID.randomUUID())
                .orderId(orderId)
                .proposedDeadline(proposedDeadline)
                .requesterCompanyId(requesterCompanyId)
                .status(OrderDeadlineExtensionProposal.Status.PROPOSED)
                .build();
        
        extensionProposalRepository.save(proposal);

        log.info("Deadline extension proposed for order {} by company {}", orderId, requesterCompanyId);

        // Notify counterpart
        UUID counterpartCompanyId = requesterCompanyId.equals(order.getCompanyId())
                ? order.getProviderId()
                : order.getCompanyId();

        eventPublisher.publishDeadlineExtensionProposedNotification(orderId, proposedDeadline, counterpartCompanyId);

        // Publish lifecycle event
        eventPublisher.publishOrderLifecycleEvent(orderId, OrderStatus.IN_PROGRESS);
    }

    /**
     * Counter-party confirms the pending deadline change.
     */
    public void confirmDeadlineExtension(UUID orderId, UUID confirmerCompanyId) {
        log.info("Company {} confirms deadline extension for order {}", confirmerCompanyId, orderId);

        OrderDeadlineExtensionProposal proposal = extensionProposalRepository
                .findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .orElseThrow(() -> new ProposalNotFoundException("No pending deadline extension for this order"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Only counterpart may confirm
        if (confirmerCompanyId.equals(proposal.getRequesterCompanyId())) {
            throw new InvalidConfirmerException("Requester cannot confirm their own proposal");
        }

        // Verify authorization
        authorizationService.verifyOrderParticipation(order, confirmerCompanyId);

        // Apply deadline
        order.setDeadline(proposal.getProposedDeadline());
        orderRepository.save(order);

        // Update proposal to confirmed status
        proposal.setStatus(OrderDeadlineExtensionProposal.Status.CONFIRMED);
        proposal.setConfirmedByCompanyId(confirmerCompanyId);
        proposal.setConfirmedAt(LocalDateTime.now());
        extensionProposalRepository.save(proposal);

        log.info("Deadline extension confirmed for order {} by company {}", orderId, confirmerCompanyId);

        // Notify both parties about confirmation
        eventPublisher.publishDeadlineExtensionConfirmedNotification(order);

        // Publish lifecycle event
        eventPublisher.publishOrderLifecycleEvent(orderId, OrderStatus.IN_PROGRESS);
    }

    /**
     * Counter-party rejects the pending deadline change.
     */
    public void rejectDeadlineExtension(UUID orderId, UUID rejecterCompanyId, String rejectionReason) {
        log.info("Company {} rejects deadline extension for order {}", rejecterCompanyId, orderId);

        OrderDeadlineExtensionProposal proposal = extensionProposalRepository
                .findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .orElseThrow(() -> new ProposalNotFoundException("No pending deadline extension for this order"));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Only counterpart may reject
        if (rejecterCompanyId.equals(proposal.getRequesterCompanyId())) {
            throw new InvalidRejecterException("Requester cannot reject their own proposal");
        }

        // Verify authorization
        authorizationService.verifyOrderParticipation(order, rejecterCompanyId);

        // Update proposal to rejected status
        proposal.setStatus(OrderDeadlineExtensionProposal.Status.REJECTED);
        proposal.setRejectedByCompanyId(rejecterCompanyId);
        proposal.setRejectedAt(LocalDateTime.now());
        proposal.setRejectionReason(rejectionReason);
        extensionProposalRepository.save(proposal);

        log.info("Deadline extension rejected for order {} by company {}", orderId, rejecterCompanyId);

        // Notify requester about rejection
        eventPublisher.publishDeadlineExtensionRejectedNotification(order, rejectionReason);
    }

    /**
     * Cancels a pending deadline extension proposal by the requester.
     */
    public void cancelDeadlineExtensionProposal(UUID orderId, UUID requesterCompanyId) {
        log.info("Company {} canceling deadline extension proposal for order {}", requesterCompanyId, orderId);

        OrderDeadlineExtensionProposal proposal = extensionProposalRepository
                .findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .orElseThrow(() -> new ProposalNotFoundException("No pending deadline extension for this order"));

        // Only requester can cancel their proposal
        if (!requesterCompanyId.equals(proposal.getRequesterCompanyId())) {
            throw new UnauthorizedCancellationException("Only the requester can cancel their proposal");
        }

        // Update proposal to cancelled status
        proposal.setStatus(OrderDeadlineExtensionProposal.Status.CANCELLED);
        proposal.setCancelledAt(LocalDateTime.now());
        extensionProposalRepository.save(proposal);

        log.info("Deadline extension proposal cancelled for order {} by company {}", orderId, requesterCompanyId);

        // Notify counterpart about cancellation
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
        
        eventPublisher.publishDeadlineExtensionCancelledNotification(order);
    }

    /**
     * Gets the pending deadline extension proposal for an order.
     */
    public OrderDeadlineExtensionProposal getPendingProposal(UUID orderId, UUID requestingCompanyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));

        // Verify authorization
        authorizationService.verifyOrderParticipation(order, requestingCompanyId);

        return extensionProposalRepository.findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .orElse(null);
    }

//    /**
//     * Gets all deadline extension proposals for an order (history).
//     */
//    public List<OrderDeadlineExtensionProposal> getDeadlineExtensionHistory(UUID orderId, UUID requestingCompanyId) {
//        Order order = orderRepository.findById(orderId)
//                .orElseThrow(() -> new OrderNotFoundException("Order not found: " + orderId));
//
//        // Verify authorization
//        authorizationService.verifyOrderParticipation(order, requestingCompanyId);
//
//        return extensionProposalRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
//    }

    /**
     * Checks if there is a pending deadline extension proposal for an order.
     */
    public boolean hasPendingProposal(UUID orderId) {
        return extensionProposalRepository.findByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.PROPOSED)
                .isPresent();
    }

    /**
     * Gets the count of deadline extensions for an order.
     */
//    public long getDeadlineExtensionCount(UUID orderId) {
//        return extensionProposalRepository.countByOrderIdAndStatus(orderId, OrderDeadlineExtensionProposal.Status.CONFIRMED);
//    }

    // Exception classes
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }

    public static class PendingProposalExistsException extends RuntimeException {
        public PendingProposalExistsException(String message) {
            super(message);
        }
    }

    public static class ProposalNotFoundException extends RuntimeException {
        public ProposalNotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidConfirmerException extends RuntimeException {
        public InvalidConfirmerException(String message) {
            super(message);
        }
    }

    public static class InvalidRejecterException extends RuntimeException {
        public InvalidRejecterException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedCancellationException extends RuntimeException {
        public UnauthorizedCancellationException(String message) {
            super(message);
        }
    }
}