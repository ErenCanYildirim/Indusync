package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.notification.event.NotificationEvent;
import com.indusync.indusync_backend.order.domain.*;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * Service responsible for publishing order-related domain events.
 * Centralizes all event publishing logic for orders.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderEventPublisher {

    private final ApplicationEventPublisher eventPublisher;
    private final CompanyRepository companyRepository;

    /**
     * Publishes an order published event.
     */
    public void publishOrderPublishedEvent(Order order) {
        try {
            String companyName = companyRepository.findById(order.getCompanyId())
                    .map(Company::getName)
                    .orElse("Unknown Company");

            OrderPublishedEvent event = OrderPublishedEvent.fromOrder(order, companyName);
            eventPublisher.publishEvent(event);

            log.info("Published OrderPublishedEvent for order: {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to publish OrderPublishedEvent for order: {}", order.getId(), e);
            // Don't fail the operation if event publishing fails
        }
    }

    /**
     * Publishes a provider accepted order event.
     */
    public void publishProviderAcceptedEvent(UUID orderId, UUID providerId) {
        try {
            ProviderAcceptedOrderEvent event = new ProviderAcceptedOrderEvent(orderId, providerId);
            eventPublisher.publishEvent(event);

            log.info("Published ProviderAcceptedOrderEvent for order: {} by provider: {}", orderId, providerId);
        } catch (Exception e) {
            log.error("Failed to publish ProviderAcceptedOrderEvent for order: {}", orderId, e);
        }
    }

    /**
     * Publishes an order lifecycle event.
     */
    public void publishOrderLifecycleEvent(UUID orderId, OrderStatus newStatus) {
        try {
            OrderLifecycleEvent event = new OrderLifecycleEvent(orderId, newStatus);
            eventPublisher.publishEvent(event);

            log.info("Published OrderLifecycleEvent for order: {} with status: {}", orderId, newStatus);
        } catch (Exception e) {
            log.error("Failed to publish OrderLifecycleEvent for order: {}", orderId, e);
        }
    }

    /**
     * Publishes deadline extension proposed notification.
     */
    public void publishDeadlineExtensionProposedNotification(
            UUID orderId,
            LocalDateTime proposedDeadline,
            UUID counterpartCompanyId) {

        try {
            companyRepository.findById(counterpartCompanyId).ifPresent(counterpart -> {
                String email = counterpart.getContactEmail();
                if (email != null && !email.trim().isEmpty()) {
                    NotificationEvent mailEvent = NotificationEvent.builder()
                            .recipient(email)
                            .subject("Deadline extension proposed")
                            .templateName("order-deadline-extension-proposed")
                            .variables(Map.of(
                                    "orderId", orderId.toString(),
                                    "proposedDeadline", proposedDeadline.toString()))
                            .type(NotificationEvent.NotificationType.EMAIL)
                            .priority(NotificationEvent.NotificationPriority.NORMAL)
                            .build();
                    eventPublisher.publishEvent(mailEvent);

                    log.info("Published deadline extension proposed notification for order: {}", orderId);
                }
            });
        } catch (Exception e) {
            log.error("Failed to publish deadline extension proposed notification for order: {}", orderId, e);
        }
    }

    /**
     * Publishes deadline extension confirmed notification.
     */
    public void publishDeadlineExtensionConfirmedNotification(Order order) {
        try {
            List<String> partiesEmails = getPartiesEmails(order);
            List<NotificationEvent> mails = partiesEmails.stream()
                    .map(email -> NotificationEvent.builder()
                            .recipient(email)
                            .subject("Deadline extension confirmed")
                            .templateName("order-deadline-extension-confirmed")
                            .variables(Map.of(
                                    "orderId", order.getId().toString(),
                                    "newDeadline", order.getDeadline().toString()))
                            .type(NotificationEvent.NotificationType.EMAIL)
                            .priority(NotificationEvent.NotificationPriority.NORMAL)
                            .build())
                    .toList();

            mails.forEach(eventPublisher::publishEvent);

            log.info("Published deadline extension confirmed notifications for order: {}", order.getId());
        } catch (Exception e) {
            log.error("Failed to publish deadline extension confirmed notifications for order: {}", order.getId(), e);
        }
    }

    /**
     * Publishes deadline extension rejected notification.
     */
    public void publishDeadlineExtensionRejectedNotification(Order order, String rejectionReason) {
        try {
            // Notify only the requester about rejection
            companyRepository.findById(order.getCompanyId()).ifPresent(requester -> {
                String email = requester.getContactEmail();
                if (email != null && !email.trim().isEmpty()) {
                    NotificationEvent mailEvent = NotificationEvent.builder()
                            .recipient(email)
                            .subject("Deadline extension rejected")
                            .templateName("order-deadline-extension-rejected")
                            .variables(Map.of(
                                    "orderId", order.getId().toString(),
                                    "rejectionReason",
                                    rejectionReason != null ? rejectionReason : "No reason provided"))
                            .type(NotificationEvent.NotificationType.EMAIL)
                            .priority(NotificationEvent.NotificationPriority.NORMAL)
                            .build();
                    eventPublisher.publishEvent(mailEvent);

                    log.info("Published deadline extension rejected notification for order: {}", order.getId());
                }
            });
        } catch (Exception e) {
            log.error("Failed to publish deadline extension rejected notification for order: {}", order.getId(), e);
        }
    }

    /**
     * Publishes deadline extension cancelled notification.
     */
    public void publishDeadlineExtensionCancelledNotification(Order order) {
        try {
            // Notify the counterpart about cancellation
            UUID counterpartId = order.getProviderId();
            if (counterpartId != null) {
                companyRepository.findById(counterpartId).ifPresent(counterpart -> {
                    String email = counterpart.getContactEmail();
                    if (email != null && !email.trim().isEmpty()) {
                        NotificationEvent mailEvent = NotificationEvent.builder()
                                .recipient(email)
                                .subject("Deadline extension cancelled")
                                .templateName("order-deadline-extension-cancelled")
                                .variables(Map.of(
                                        "orderId", order.getId().toString()))
                                .type(NotificationEvent.NotificationType.EMAIL)
                                .priority(NotificationEvent.NotificationPriority.NORMAL)
                                .build();
                        eventPublisher.publishEvent(mailEvent);

                        log.info("Published deadline extension cancelled notification for order: {}", order.getId());
                    }
                });
            }
        } catch (Exception e) {
            log.error("Failed to publish deadline extension cancelled notification for order: {}", order.getId(), e);
        }
    }

    /**
     * Publishes a ProviderShowedInterestEvent when a provider expresses interest in
     * an order.
     */
    public void publishProviderShowedInterestEvent(UUID orderId, UUID clientCompanyId, UUID providerCompanyId,
            LocalDateTime interestedAt) {
        try {
            ProviderShowedInterestEvent event = new ProviderShowedInterestEvent(
                    orderId, clientCompanyId, providerCompanyId, interestedAt);
            eventPublisher.publishEvent(event);
            log.info("Published ProviderShowedInterestEvent for order: {} by provider: {}", orderId, providerCompanyId);
        } catch (Exception e) {
            log.error("Failed to publish ProviderShowedInterestEvent for order: {} by provider: {}", orderId,
                    providerCompanyId, e);
        }
    }

    /**
     * Publishes an OrderAssignedEvent when a provider is assigned to an order.
     */
    public void publishOrderAssignedEvent(UUID orderId, UUID clientCompanyId, UUID providerCompanyId,
            LocalDateTime assignedAt) {
        try {
            OrderAssignedEvent event = new OrderAssignedEvent(
                    orderId, clientCompanyId, providerCompanyId, assignedAt);
            eventPublisher.publishEvent(event);
            log.info("Published OrderAssignedEvent for order: {} assigned to provider: {}", orderId, providerCompanyId);
        } catch (Exception e) {
            log.error("Failed to publish OrderAssignedEvent for order: {} assigned to provider: {}", orderId,
                    providerCompanyId, e);
        }
    }

    /**
     * Publishes an OrderCompletionRequestedEvent when a completion is requested.
     */
    public void publishOrderCompletionRequestedEvent(UUID orderId, UUID requesterCompanyId, UUID counterpartCompanyId,
            UUID completionRequestId, String completionMessage, java.time.LocalDateTime requestedAt) {
        try {
            OrderCompletionRequestedEvent event = new OrderCompletionRequestedEvent(
                    orderId, requesterCompanyId, counterpartCompanyId, completionRequestId, completionMessage,
                    requestedAt);
            eventPublisher.publishEvent(event);
            log.info("Published OrderCompletionRequestedEvent for order: {} by company: {}", orderId,
                    requesterCompanyId);
        } catch (Exception e) {
            log.error("Failed to publish OrderCompletionRequestedEvent for order: {} by company: {}", orderId,
                    requesterCompanyId, e);
        }
    }

    /**
     * Publishes an OrderCompletedEvent when an order is completed.
     */
    public void publishOrderCompletedEvent(OrderCompletedEvent event) {
        eventPublisher.publishEvent(event);
        log.info("Published OrderCompletedEvent for order: {}", event.orderId());
    }

    /**
     * Gets email addresses of all parties involved in an order.
     */
    private List<String> getPartiesEmails(Order order) {
        return Stream.of(order.getCompanyId(), order.getProviderId())

                .map(cid -> companyRepository.findById(cid).map(Company::getContactEmail).orElse(null))
                .filter(e -> e != null && !e.isBlank())
                .toList();
    }

    // Event classes

    /**
     * Event representing provider acceptance of an order.
     */

    public record ProviderAcceptedOrderEvent(UUID orderId, UUID providerId) {

    }

    /**
     * Event representing order lifecycle changes.
     */

    public record OrderLifecycleEvent(UUID orderId, OrderStatus newStatus) {

    }
}