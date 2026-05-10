package com.indusync.indusync_backend.order.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Row representing an open deadline-extension proposal for an order.
 * The row is deleted once the counterpart confirms (dual-confirmation).
 */
@Entity
@Table(name = "order_extension_proposals", schema = "\"order\"")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderDeadlineExtensionProposal {

    @Id
    @Column(name = "id")
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "proposed_deadline", nullable = false)
    private LocalDateTime proposedDeadline;

    @Column(name = "requester_company_id", nullable = false)
    private UUID requesterCompanyId;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PROPOSED;

    @Column(name = "confirmed_by_company_id")
    private UUID confirmedByCompanyId;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "rejected_by_company_id")
    private UUID rejectedByCompanyId;

    @Column(name = "rejected_at")
    private LocalDateTime rejectedAt;

    @Column(name = "rejection_reason")
    private String rejectionReason;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreationTimestamp
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Status {
        PROPOSED, CONFIRMED, REJECTED, CANCELLED
    }
}