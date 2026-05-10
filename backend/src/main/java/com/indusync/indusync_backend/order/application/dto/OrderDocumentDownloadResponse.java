package com.indusync.indusync_backend.order.application.dto;

import lombok.Builder;
import org.springframework.core.io.Resource;

/**
 * Response DTO for order document download operations.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record OrderDocumentDownloadResponse(
        String fileName,
        String originalFileName,
        String contentType,
        Long fileSize,
        Resource resource) {

    /**
     * Gets the effective filename for download.
     */
    public String getEffectiveFileName() {
        return originalFileName != null ? originalFileName : fileName;
    }
}