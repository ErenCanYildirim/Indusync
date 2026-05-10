package com.indusync.indusync_backend.order.api.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Data Transfer Object for rejecting a completion request.
 * <p>
 * Follows Separation of Concerns: handles only API input validation and data transfer.
 * This DTO represents the input data needed to reject a completion request.
 * </p>
 * 
 * <p>
 * Used for:
 * - API request body when rejecting order completion
 * - Input validation for completion request rejection
 * - Data transfer from API to service layer
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
public class RejectCompletionRequestDto {

    /**
     * Optional reason for rejecting the completion request.
     * <p>
     * This can include feedback about what still needs to be completed,
     * quality concerns, or other reasons why the order isn't ready for completion.
     * Providing a reason helps the requester understand what needs to be addressed.
     * </p>
     */
    @Size(max = 1000, message = "Ablehnungsgrund darf maximal 1000 Zeichen lang sein")
    private String rejectionReason;

    /**
     * Default constructor for JSON deserialization.
     */
    public RejectCompletionRequestDto() {
    }

    /**
     * Constructor with rejection reason.
     *
     * @param rejectionReason Optional reason for rejection
     */
    public RejectCompletionRequestDto(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
} 