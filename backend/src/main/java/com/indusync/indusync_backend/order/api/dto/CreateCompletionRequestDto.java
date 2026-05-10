package com.indusync.indusync_backend.order.api.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Data Transfer Object for creating a new completion request.
 * <p>
 * Follows Separation of Concerns: handles only API input validation and data transfer.
 * This DTO represents the input data needed to create a completion request.
 * </p>
 * 
 * <p>
 * Used for:
 * - API request body when requesting order completion
 * - Input validation for completion request creation
 * - Data transfer from API to service layer
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
public class CreateCompletionRequestDto {

    /**
     * Optional message from the requester explaining the completion.
     * <p>
     * This can include details about what work was completed,
     * any final notes, or other relevant information for the counterpart.
     * </p>
     */
    @Size(max = 1000, message = "Abschlussnachricht darf maximal 1000 Zeichen lang sein")
    private String completionMessage;

    /**
     * Default constructor for JSON deserialization.
     */
    public CreateCompletionRequestDto() {
    }

    /**
     * Constructor with completion message.
     *
     * @param completionMessage Optional message explaining the completion
     */
    public CreateCompletionRequestDto(String completionMessage) {
        this.completionMessage = completionMessage;
    }
} 