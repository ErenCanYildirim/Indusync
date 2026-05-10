package com.indusync.indusync_backend.order.domain;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event published when an order is successfully completed through the dual-confirmation workflow.
 * <p>
 * This event contains all necessary information for post-completion processing such as:
 * - Updating calendar systems
 * - Triggering notification workflows
 * - Enabling review functionality
 * - Analytics and reporting updates
 * - Payment processing (if applicable)
 * </p>
 * 
 * <p>
 * The event is published after both parties have agreed on completion and the order
 * status has been transitioned to COMPLETED.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record OrderCompletedEvent(
        // Order identification
        UUID orderId,
        String title,
        String description,
        
        // Company information
        UUID clientCompanyId,
        String clientCompanyName,
        UUID providerCompanyId,
        String providerCompanyName,
        
        // Contact information for notifications
        String clientContactName,
        String clientContactEmail,
        String providerContactName,
        String providerContactEmail,
        
        // Timeline information
        LocalDateTime originalDeadline,
        LocalDateTime actualCompletionDate,
        LocalDateTime orderStartDate,
        LocalDateTime orderCreatedDate,
        
        // Financial information
        BigDecimal orderBudget,
        
        // Location information (for analytics and reporting)
        String serviceCity,
        String servicePostalCode,
        
        // Completion request details
        UUID completionRequestId,
        UUID completionRequesterCompanyId,
        String completionMessage,
        UUID completionConfirmerCompanyId,
        LocalDateTime completionRequestedAt,
        LocalDateTime completionConfirmedAt,
        
        // Performance metrics (for analytics)
        Long durationDays,
        boolean completedOnTime,
        boolean hasDeadlineExtensions
) {

    /**
     * Creates an OrderCompletedEvent from Order and OrderCompletionRequest entities.
     * <p>
     * This factory method encapsulates the logic for gathering all relevant information
     * from both the order and completion request entities to create a comprehensive event.
     * </p>
     *
     * @param order The completed order
     * @param completionRequest The confirmed completion request
     * @param clientCompanyName Name of the client company
     * @param providerCompanyName Name of the provider company
     * @param hasDeadlineExtensions Whether the order had any deadline extensions
     * @return OrderCompletedEvent with all relevant information
     */
    public static OrderCompletedEvent fromOrderAndCompletionRequest(
            Order order, 
            OrderCompletionRequest completionRequest,
            String clientCompanyName,
            String providerCompanyName,
            boolean hasDeadlineExtensions) {
        
        // Calculate performance metrics
        LocalDateTime completionDate = completionRequest.getConfirmedAt();
        LocalDateTime startDate = order.getStartDate() != null ? order.getStartDate() : order.getCreatedAt();
        long durationDays = java.time.temporal.ChronoUnit.DAYS.between(startDate, completionDate);
        boolean onTime = order.getDeadline() == null || !completionDate.isAfter(order.getDeadline());
        
        return OrderCompletedEvent.builder()
                // Order identification
                .orderId(order.getId())
                .title(order.getTitle())
                .description(order.getDescription())
                
                // Company information
                .clientCompanyId(order.getCompanyId())
                .clientCompanyName(clientCompanyName)
                .providerCompanyId(order.getProviderId())
                .providerCompanyName(providerCompanyName)
                
                // Contact information
                .clientContactName(order.getContactName())
                .clientContactEmail(order.getContactEmail())
                .providerContactName(null)
                .providerContactEmail(null)
                
                // Timeline information
                .originalDeadline(order.getDeadline())
                .actualCompletionDate(completionDate)
                .orderStartDate(order.getStartDate())
                .orderCreatedDate(order.getCreatedAt())
                
                // Financial information
                .orderBudget(order.getBudget())
                
                // Location information
                .serviceCity(order.getServiceAddress() != null ? order.getServiceAddress().getCity() : null)
                .servicePostalCode(order.getServiceAddress() != null ? order.getServiceAddress().getPostalCode() : null)
                
                // Completion request details
                .completionRequestId(completionRequest.getId())
                .completionRequesterCompanyId(completionRequest.getRequesterCompanyId())
                .completionMessage(completionRequest.getCompletionMessage())
                .completionConfirmerCompanyId(completionRequest.getConfirmedByCompanyId())
                .completionRequestedAt(completionRequest.getCreatedAt())
                .completionConfirmedAt(completionRequest.getConfirmedAt())
                
                // Performance metrics
                .durationDays(durationDays)
                .completedOnTime(onTime)
                .hasDeadlineExtensions(hasDeadlineExtensions)
                .build();
    }

    /**
     * Convenience method to check if the client requested completion.
     *
     * @return true if the client company requested completion
     */
    public boolean isClientRequested() {
        return clientCompanyId.equals(completionRequesterCompanyId);
    }

    /**
     * Convenience method to check if the provider requested completion.
     *
     * @return true if the provider company requested completion
     */
    public boolean isProviderRequested() {
        return providerCompanyId.equals(completionRequesterCompanyId);
    }

    /**
     * Convenience method to get the requester company name.
     *
     * @return name of the company that requested completion
     */
    public String getRequesterCompanyName() {
        return isClientRequested() ? clientCompanyName : providerCompanyName;
    }

    /**
     * Convenience method to get the confirmer company name.
     *
     * @return name of the company that confirmed completion
     */
    public String getConfirmerCompanyName() {
        return isClientRequested() ? providerCompanyName : clientCompanyName;
    }

    /**
     * Convenience method to check if order was completed early.
     *
     * @return true if order was completed before the deadline
     */
    public boolean isCompletedEarly() {
        return originalDeadline != null && actualCompletionDate.isBefore(originalDeadline);
    }

    /**
     * Convenience method to get duration in hours for more precise metrics.
     *
     * @return duration in hours from start to completion
     */
    public long getDurationHours() {
        if (orderStartDate != null) {
            return java.time.temporal.ChronoUnit.HOURS.between(orderStartDate, actualCompletionDate);
        }
        return java.time.temporal.ChronoUnit.HOURS.between(orderCreatedDate, actualCompletionDate);
    }
} 