package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Document uploaded for an order (e.g. PDFs, images).
 */
@Getter
@Setter
@Entity
@Table(name = "order_documents", schema = "\"order\"")
public class OrderDocument extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @NotBlank
    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @NotBlank
    @Column(name = "original_file_name", length = 255, nullable = false)
    private String originalFileName;

    @Column(name = "document_type", length = 100)
    private String documentType;

    @Column(name = "description", length = 500)
    private String description;

    @NotBlank
    @Column(name = "content_type", length = 100, nullable = false)
    private String contentType;

    @NotNull
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @NotBlank
    @Column(name = "file_url", length = 1000, nullable = false)
    private String fileUrl;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt = LocalDateTime.now();

    protected OrderDocument() {
    }

    public OrderDocument(Order order, String fileName, String originalFileName, String documentType,
            String description, long fileSize, String contentType, String fileUrl) {
        this.order = order;
        this.fileName = fileName;
        this.originalFileName = originalFileName;
        this.documentType = documentType;
        this.description = description;
        this.fileSize = fileSize;
        this.contentType = contentType;
        this.fileUrl = fileUrl;
    }

    // Legacy constructor for backward compatibility
    public OrderDocument(Order order, String fileName, String contentType, long size, String url) {
        this(order, fileName, fileName, "attachment", null, size, contentType, url);
    }

    public UUID getOrderId() {
        return order != null ? order.getId() : null;
    }

    // Alias methods for backward compatibility
    public Long getSize() {
        return fileSize;
    }

    public void setSize(Long size) {
        this.fileSize = size;
    }

    public String getUrl() {
        return fileUrl;
    }

    public void setUrl(String url) {
        this.fileUrl = url;
    }
}