package com.indusync.indusync_backend.order.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain entity representing a completion request for an order.
 * <p>
 * Follows Single Responsibility Principle: manages only completion request state and behavior.
 * This entity handles the dual-confirmation workflow where both client and provider
 * must agree on order completion before the order status transitions to COMPLETED.
 * </p>
 * 
 * <p>
 * Business Rules:
 * - Only one active completion request per order at a time
 * - Either party (client or provider) can request completion
 * - Counterpart must confirm or reject the request
 * - Requester can cancel their own pending request
 * - Successful confirmation triggers order completion
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Entity
@Table(name = "order_completion_requests", schema = "\"order\"", 
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_completion_order_status", 
                           columnNames = {"order_id", "status"})
       },
       indexes = {
           @Index(name = "idx_completion_order", columnList = "order_id"),
           @Index(name = "idx_completion_status", columnList = "status"),
           @Index(name = "idx_completion_requester", columnList = "requester_company_id")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderCompletionRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "id", columnDefinition = "uuid")
    private UUID id;

    @Column(name = "order_id", nullable = false, columnDefinition = "uuid")
    private UUID orderId;

    @Column(name = "requester_company_id", nullable = false, columnDefinition = "uuid")
    private UUID requesterCompanyId;

    @Column(name = "status", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.REQUESTED;

    @Column(name = "completion_message", length = 1000)
    private String completionMessage;

    @Column(name = "confirmed_by_company_id", columnDefinition = "uuid")
    private UUID confirmedByCompanyId;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "rejected_by_company_id", columnDefinition = "uuid")
    private UUID rejectedByCompanyId;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    /**
     * Status enum representing the lifecycle of a completion request.
     */
    public enum Status {
        REQUESTED,  // Initial state - awaiting counterpart response
        CONFIRMED,  // Confirmed by counterpart - order should be marked complete
        REJECTED,   // Rejected by counterpart - back to requester
        CANCELLED   // Cancelled by requester - request withdrawn
    }

    // ========================================================================
    // DOMAIN METHODS (Single Responsibility: Completion Request Logic)
    // ========================================================================

    /**
     * Confirms the completion request by the counterpart company.
     * 
     * @param confirmingCompanyId ID of the company confirming the request
     * @throws IllegalStateException if request is not in REQUESTED status
     * @throws IllegalArgumentException if confirming company is the same as requester
     */
    public void confirm(UUID confirmingCompanyId) {
        validateStatusForConfirmation();
        validateConfirmingCompany(confirmingCompanyId);
        
        this.status = Status.CONFIRMED;
        this.confirmedByCompanyId = confirmingCompanyId;
        this.confirmedAt = LocalDateTime.now();
    }

    /**
     * Rejects the completion request by the counterpart company.
     * 
     * @param rejectingCompanyId ID of the company rejecting the request
     * @param rejectionReason Optional reason for rejection
     * @throws IllegalStateException if request is not in REQUESTED status
     * @throws IllegalArgumentException if rejecting company is the same as requester
     */
    public void reject(UUID rejectingCompanyId, String rejectionReason) {
        validateStatusForRejection();
        validateRejectingCompany(rejectingCompanyId);
        
        this.status = Status.REJECTED;
        this.rejectedByCompanyId = rejectingCompanyId;
        this.rejectedAt = LocalDateTime.now();
        this.rejectionReason = rejectionReason;
    }

    /**
     * Cancels the completion request by the original requester.
     * 
     * @param cancellingCompanyId ID of the company cancelling the request
     * @throws IllegalStateException if request is not in REQUESTED status
     * @throws IllegalArgumentException if cancelling company is not the requester
     */
    public void cancel(UUID cancellingCompanyId) {
        validateStatusForCancellation();
        validateCancellingCompany(cancellingCompanyId);
        
        this.status = Status.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
    }

    /**
     * Checks if this completion request is currently pending (awaiting response).
     * 
     * @return true if status is REQUESTED
     */
    public boolean isPending() {
        return Status.REQUESTED.equals(this.status);
    }

    /**
     * Checks if this completion request has been confirmed.
     * 
     * @return true if status is CONFIRMED
     */
    public boolean isConfirmed() {
        return Status.CONFIRMED.equals(this.status);
    }

    /**
     * Checks if this completion request has been rejected.
     * 
     * @return true if status is REJECTED
     */
    public boolean isRejected() {
        return Status.REJECTED.equals(this.status);
    }

    /**
     * Checks if this completion request has been cancelled.
     * 
     * @return true if status is CANCELLED
     */
    public boolean isCancelled() {
        return Status.CANCELLED.equals(this.status);
    }

    /**
     * Checks if the given company can confirm this request.
     * 
     * @param companyId Company ID to check
     * @return true if company can confirm (is not the requester and request is pending)
     */
    public boolean canBeConfirmedBy(UUID companyId) {
        return isPending() && !requesterCompanyId.equals(companyId);
    }

    /**
     * Checks if the given company can reject this request.
     * 
     * @param companyId Company ID to check
     * @return true if company can reject (is not the requester and request is pending)
     */
    public boolean canBeRejectedBy(UUID companyId) {
        return isPending() && !requesterCompanyId.equals(companyId);
    }

    /**
     * Checks if the given company can cancel this request.
     * 
     * @param companyId Company ID to check
     * @return true if company can cancel (is the requester and request is pending)
     */
    public boolean canBeCancelledBy(UUID companyId) {
        return isPending() && requesterCompanyId.equals(companyId);
    }

    // ========================================================================
    // PRIVATE VALIDATION METHODS
    // ========================================================================

    private void validateStatusForConfirmation() {
        if (!isPending()) {
            throw new IllegalStateException(
                "Completion request can only be confirmed when status is REQUESTED, current status: " + status);
        }
    }

    private void validateStatusForRejection() {
        if (!isPending()) {
            throw new IllegalStateException(
                "Completion request can only be rejected when status is REQUESTED, current status: " + status);
        }
    }

    private void validateStatusForCancellation() {
        if (!isPending()) {
            throw new IllegalStateException(
                "Completion request can only be cancelled when status is REQUESTED, current status: " + status);
        }
    }

    private void validateConfirmingCompany(UUID confirmingCompanyId) {
        if (requesterCompanyId.equals(confirmingCompanyId)) {
            throw new IllegalArgumentException(
                "Company cannot confirm their own completion request");
        }
    }

    private void validateRejectingCompany(UUID rejectingCompanyId) {
        if (requesterCompanyId.equals(rejectingCompanyId)) {
            throw new IllegalArgumentException(
                "Company cannot reject their own completion request");
        }
    }

    private void validateCancellingCompany(UUID cancellingCompanyId) {
        if (!requesterCompanyId.equals(cancellingCompanyId)) {
            throw new IllegalArgumentException(
                "Only the original requester can cancel the completion request");
        }
    }

    @Override
    public String toString() {
        return String.format("OrderCompletionRequest{id=%s, orderId=%s, status=%s, requesterCompanyId=%s}", 
                           id, orderId, status, requesterCompanyId);
    }
} 