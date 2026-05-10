package com.indusync.indusync_backend.order.api.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Future;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DeadlineExtensionRequest {

    @NotNull
    @Future
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDateTime proposedDeadline;

    /**
     * If true, the caller is confirming an existing proposal instead of creating one.
     */
    private Boolean confirm = false;
} 