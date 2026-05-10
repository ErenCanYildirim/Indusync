package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.order.domain.OrderCompletionRequest;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Data Transfer Object for Order Completion Requests.
 * <p>
 * Follows Separation of Concerns: handles only data transfer between API and service layers.
 * This DTO represents the complete state of a completion request for API responses.
 * </p>
 * 
 * <p>
 * Used for:
 * - API responses when fetching completion request details
 * - Transferring completion request data between layers
 * - JSON serialization for frontend consumption
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Builder
public class CompletionRequestDto {

    /**
     * Unique identifier of the completion request.
     */
    private UUID id;

    /**
     * ID of the order this completion request belongs to.
     */
    private UUID orderId;

    /**
     * ID of the company that requested completion.
     */
    private UUID requesterCompanyId;

    /**
     * Current status of the completion request.
     */
    private String status;

    /**
     * Optional message from the requester explaining the completion.
     */
    private String completionMessage;

    /**
     * ID of the company that confirmed the completion request (if confirmed).
     */
    private UUID confirmedByCompanyId;

    /**
     * Timestamp when the completion request was confirmed (if confirmed).
     */
    private LocalDateTime confirmedAt;

    /**
     * ID of the company that rejected the completion request (if rejected).
     */
    private UUID rejectedByCompanyId;

    /**
     * Timestamp when the completion request was rejected (if rejected).
     */
    private LocalDateTime rejectedAt;

    /**
     * Optional reason for rejecting the completion request.
     */
    private String rejectionReason;

    /**
     * Timestamp when the completion request was cancelled (if cancelled).
     */
    private LocalDateTime cancelledAt;

    /**
     * Timestamp when the completion request was created.
     */
    private LocalDateTime createdAt;

    /**
     * Factory method to create DTO from domain entity.
     * <p>
     * This method encapsulates the mapping logic and ensures consistent
     * transformation from domain to DTO representation.
     * </p>
     *
     * @param completionRequest Domain entity to convert
     * @return DTO representation of the completion request
     */
    public static CompletionRequestDto fromDomain(OrderCompletionRequest completionRequest) {
        if (completionRequest == null) {
            return null;
        }

        return CompletionRequestDto.builder()
                .id(completionRequest.getId())
                .orderId(completionRequest.getOrderId())
                .requesterCompanyId(completionRequest.getRequesterCompanyId())
                .status(completionRequest.getStatus().name())
                .completionMessage(completionRequest.getCompletionMessage())
                .confirmedByCompanyId(completionRequest.getConfirmedByCompanyId())
                .confirmedAt(completionRequest.getConfirmedAt())
                .rejectedByCompanyId(completionRequest.getRejectedByCompanyId())
                .rejectedAt(completionRequest.getRejectedAt())
                .rejectionReason(completionRequest.getRejectionReason())
                .cancelledAt(completionRequest.getCancelledAt())
                .createdAt(completionRequest.getCreatedAt())
                .build();
    }

    /**
     * Convenience method to check if this completion request is pending.
     *
     * @return true if status is REQUESTED
     */
    public boolean isPending() {
        return "REQUESTED".equals(status);
    }

    /**
     * Convenience method to check if this completion request is confirmed.
     *
     * @return true if status is CONFIRMED
     */
    public boolean isConfirmed() {
        return "CONFIRMED".equals(status);
    }

    /**
     * Convenience method to check if this completion request is rejected.
     *
     * @return true if status is REJECTED
     */
    public boolean isRejected() {
        return "REJECTED".equals(status);
    }

    /**
     * Convenience method to check if this completion request is cancelled.
     *
     * @return true if status is CANCELLED
     */
    public boolean isCancelled() {
        return "CANCELLED".equals(status);
    }
} 