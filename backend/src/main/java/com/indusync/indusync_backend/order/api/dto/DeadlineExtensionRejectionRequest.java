package com.indusync.indusync_backend.order.api.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DeadlineExtensionRejectionRequest {
    
    @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
    private String rejectionReason;
}