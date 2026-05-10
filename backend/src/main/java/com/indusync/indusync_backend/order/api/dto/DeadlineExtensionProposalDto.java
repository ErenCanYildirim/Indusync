package com.indusync.indusync_backend.order.api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DeadlineExtensionProposalDto {
    private UUID id;
    private UUID orderId;
    private LocalDateTime proposedDeadline;
    private UUID requesterCompanyId;
    private String status; // PROPOSED / CONFIRMED / REJECTED / CANCELLED
    private UUID confirmedByCompanyId;
    private LocalDateTime confirmedAt;
    private UUID rejectedByCompanyId;
    private LocalDateTime rejectedAt;
    private String rejectionReason;
    private LocalDateTime cancelledAt;
    private LocalDateTime createdAt;
}