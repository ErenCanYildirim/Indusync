package com.indusync.indusync_backend.order.application.dto;

import com.indusync.indusync_backend.order.domain.OrderDocument;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for order document operations.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record OrderDocumentResponse(
        UUID id,
        UUID orderId,
        String fileName,
        String originalFileName,
        String documentType,
        String description,
        Long fileSize,
        String contentType,
        String fileUrl,
        LocalDateTime uploadedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {

    /**
     * Creates an OrderDocumentResponse from an OrderDocument entity.
     * 
     * @param document the order document entity
     * @return OrderDocumentResponse DTO
     */
    public static OrderDocumentResponse fromOrderDocument(OrderDocument document) {
        return OrderDocumentResponse.builder()
                .id(document.getId())
                .orderId(document.getOrder().getId())
                .fileName(document.getFileName())
                .originalFileName(document.getOriginalFileName())
                .documentType(document.getDocumentType())
                .description(document.getDescription())
                .fileSize(document.getFileSize())
                .contentType(document.getContentType())
                .fileUrl(document.getFileUrl())
                .uploadedAt(document.getCreatedAt())
                .createdAt(document.getCreatedAt())
                .updatedAt(document.getUpdatedAt())
                .build();
    }

    /**
     * Gets human-readable file size.
     */
    public String getFormattedFileSize() {
        if (fileSize == null) return "Unknown";
        
        if (fileSize < 1024) return fileSize + " B";
        if (fileSize < 1024 * 1024) return String.format("%.1f KB", fileSize / 1024.0);
        if (fileSize < 1024 * 1024 * 1024) return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
    }

    /**
     * Gets the download URL for the document.
     */
    public String getDownloadUrl() {
        return "/v1/orders/" + orderId + "/documents/" + id + "/download";
    }
} 