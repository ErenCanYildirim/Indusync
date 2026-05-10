package com.indusync.indusync_backend.company.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO representing a company document.
 * <p>
 * This DTO is used to transfer document information from the backend to the
 * frontend,
 * including verification documents, certificates, and certification lists.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyDocument {

    /**
     * Unique identifier for the document.
     */
    private String id;

    /**
     * Type of the document.
     */
    private DocumentType type;

    /**
     * Display name of the document.
     */
    private String name;

    /**
     * URL to access the document.
     */
    private String url;

    /**
     * When the document was uploaded.
     */
    private LocalDateTime uploadedAt;

    /**
     * File size in bytes (optional).
     */
    private Long fileSize;

    /**
     * Content type of the document (optional).
     */
    private String contentType;

    /**
     * Category or grouping for the document.
     */
    private String category;

    /**
     * Enum representing different types of company documents.
     */
    public enum DocumentType {
        VERIFICATION("Verification Document", "Legal Documents"),
        CERTIFICATES("Certificates Document", "Certifications"),
        CERTIFICATION_ITEM("Certification", "Certifications"),
        OTHER("Other Document", "Other Documents");

        private final String displayName;
        private final String category;

        DocumentType(String displayName, String category) {
            this.displayName = displayName;
            this.category = category;
        }

        public String getDisplayName() {
            return displayName;
        }

        public String getCategory() {
            return category;
        }
    }
}