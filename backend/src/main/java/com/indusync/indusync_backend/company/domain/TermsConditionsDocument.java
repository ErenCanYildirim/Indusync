package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Objects;
import java.util.UUID;

/**
 * Terms & Conditions document entity representing T&C documents uploaded by
 * companies.
 * <p>
 * This entity manages:
 * - PDF document storage and metadata
 * - Version control for document updates
 * - File integrity verification with checksums
 * - Active document management (only one active per company)
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Entity
@Table(name = "terms_conditions_documents", schema = "company", indexes = {
        @Index(name = "idx_terms_conditions_documents_company", columnList = "company_id"),
        @Index(name = "idx_terms_conditions_documents_active", columnList = "company_id, is_active"),
        @Index(name = "idx_terms_conditions_documents_created", columnList = "created_at")
}, uniqueConstraints = {
        @UniqueConstraint(name = "idx_terms_conditions_documents_company_active_unique", columnNames = { "company_id" })
})
public class TermsConditionsDocument extends AuditableEntity {

    /**
     * Reference to the company that owns this T&C document.
     */
    @NotNull(message = "Company ID is required")
    @Column(name = "company_id", nullable = false, columnDefinition = "uuid")
    private UUID companyId;

    /**
     * Stored file name (may be different from original for security/storage
     * purposes).
     */
    @NotBlank(message = "File name is required")
    @Size(max = 255, message = "File name cannot exceed 255 characters")
    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /**
     * Original file name as uploaded by the user.
     */
    @NotBlank(message = "Original file name is required")
    @Size(max = 255, message = "Original file name cannot exceed 255 characters")
    @Column(name = "original_file_name", nullable = false, length = 255)
    private String originalFileName;

    /**
     * File size in bytes (maximum 10MB = 10,485,760 bytes).
     */
    @NotNull(message = "File size is required")
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /**
     * MIME type of the file (only PDF allowed: application/pdf).
     */
    @NotBlank(message = "MIME type is required")
    @Size(max = 100, message = "MIME type cannot exceed 100 characters")
    @Column(name = "mime_type", nullable = false, length = 100)
    private String mimeType;

    /**
     * URL or path to the stored file in the file storage system.
     */
    @NotBlank(message = "File URL is required")
    @Size(max = 500, message = "File URL cannot exceed 500 characters")
    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    /**
     * Whether this document is the current active version for the company.
     * Only one active document per company is allowed.
     */
    @NotNull(message = "Active status is required")
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    /**
     * Document version number (incremented on updates).
     * Note: This is separate from the JPA version field used for optimistic
     * locking.
     */
    @NotNull(message = "Document version is required")
    @Column(name = "document_version", nullable = false)
    private Integer documentVersion = 1;

    /**
     * File checksum for integrity verification (SHA-256 hash).
     */
    @Size(max = 64, message = "Checksum cannot exceed 64 characters")
    @Column(name = "checksum", length = 64)
    private String checksum;

    /**
     * Lazy-loaded reference to the owning company.
     * This is a read-only relationship for convenience.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", insertable = false, updatable = false)
    private Company company;

    /**
     * Default constructor for JPA.
     */
    public TermsConditionsDocument() {
        super();
    }

    /**
     * Constructor for creating a new T&C document.
     *
     * @param companyId        the company that owns this document
     * @param fileName         the stored file name
     * @param originalFileName the original file name as uploaded
     * @param fileSize         the file size in bytes
     * @param mimeType         the MIME type (must be application/pdf)
     * @param fileUrl          the URL/path to the stored file
     */
    public TermsConditionsDocument(UUID companyId, String fileName, String originalFileName,
            Long fileSize, String mimeType, String fileUrl) {
        super();
        setCompanyId(companyId);
        setFileName(fileName);
        setOriginalFileName(originalFileName);
        setFileSize(fileSize);
        setMimeType(mimeType);
        setFileUrl(fileUrl);
    }

    // Business Methods

    /**
     * Sets the company ID with validation.
     *
     * @param companyId the company ID
     * @throws IllegalArgumentException if companyId is null
     */
    public void setCompanyId(UUID companyId) {
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }
        this.companyId = companyId;
    }

    /**
     * Sets the file name with validation.
     *
     * @param fileName the file name
     * @throws IllegalArgumentException if fileName is null or empty
     */
    public void setFileName(String fileName) {
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new IllegalArgumentException("File name cannot be null or empty");
        }
        this.fileName = fileName.trim();
    }

    /**
     * Sets the original file name with validation.
     *
     * @param originalFileName the original file name
     * @throws IllegalArgumentException if originalFileName is null or empty
     */
    public void setOriginalFileName(String originalFileName) {
        if (originalFileName == null || originalFileName.trim().isEmpty()) {
            throw new IllegalArgumentException("Original file name cannot be null or empty");
        }
        this.originalFileName = originalFileName.trim();
    }

    /**
     * Sets the file size with validation.
     *
     * @param fileSize the file size in bytes
     * @throws IllegalArgumentException if fileSize is null, negative, or exceeds
     *                                  10MB
     */
    public void setFileSize(Long fileSize) {
        if (fileSize == null) {
            throw new IllegalArgumentException("File size cannot be null");
        }
        if (fileSize <= 0) {
            throw new IllegalArgumentException("File size must be positive");
        }
        if (fileSize > 10485760L) { // 10MB limit
            throw new IllegalArgumentException("File size cannot exceed 10MB (10,485,760 bytes)");
        }
        this.fileSize = fileSize;
    }

    /**
     * Sets the MIME type with validation.
     *
     * @param mimeType the MIME type
     * @throws IllegalArgumentException if mimeType is not application/pdf
     */
    public void setMimeType(String mimeType) {
        if (mimeType == null || mimeType.trim().isEmpty()) {
            throw new IllegalArgumentException("MIME type cannot be null or empty");
        }
        String trimmed = mimeType.trim();
        if (!"application/pdf".equals(trimmed)) {
            throw new IllegalArgumentException("Only PDF files are allowed (application/pdf)");
        }
        this.mimeType = trimmed;
    }

    /**
     * Sets the file URL with validation.
     *
     * @param fileUrl the file URL
     * @throws IllegalArgumentException if fileUrl is null or empty
     */
    public void setFileUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("File URL cannot be null or empty");
        }
        this.fileUrl = fileUrl.trim();
    }

    /**
     * Sets the active status.
     *
     * @param isActive the active status
     */
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive != null ? isActive : true;
    }

    /**
     * Sets the document version with validation.
     *
     * @param documentVersion the document version number
     * @throws IllegalArgumentException if documentVersion is null or not positive
     */
    public void setDocumentVersion(Integer documentVersion) {
        if (documentVersion == null) {
            throw new IllegalArgumentException("Document version cannot be null");
        }
        if (documentVersion <= 0) {
            throw new IllegalArgumentException("Document version must be positive");
        }
        this.documentVersion = documentVersion;
    }

    /**
     * Sets the checksum.
     *
     * @param checksum the file checksum (SHA-256 hash)
     */
    public void setChecksum(String checksum) {
        this.checksum = checksum != null ? checksum.trim() : null;
    }

    /**
     * Deactivates this document (sets isActive to false).
     * Used when a new version is uploaded.
     */
    public void deactivate() {
        this.isActive = false;
    }

    /**
     * Activates this document (sets isActive to true).
     * Should be used carefully to ensure only one active document per company.
     */
    public void activate() {
        this.isActive = true;
    }

    /**
     * Checks if this document is currently active.
     *
     * @return true if the document is active
     */
    public boolean isActive() {
        return Boolean.TRUE.equals(this.isActive);
    }

    /**
     * Gets the file size in a human-readable format.
     *
     * @return formatted file size (e.g., "2.5 MB")
     */
    public String getFormattedFileSize() {
        if (fileSize == null) {
            return "Unknown";
        }

        double size = fileSize.doubleValue();
        String[] units = { "B", "KB", "MB", "GB" };
        int unitIndex = 0;

        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }

        return String.format("%.1f %s", size, units[unitIndex]);
    }

    /**
     * Checks if the file extension matches the MIME type.
     *
     * @return true if the file extension is consistent with PDF MIME type
     */
    public boolean hasValidFileExtension() {
        if (originalFileName == null) {
            return false;
        }
        return originalFileName.toLowerCase().endsWith(".pdf");
    }

    /**
     * Creates a new version of this document with updated file information.
     *
     * @param newFileName         the new file name
     * @param newOriginalFileName the new original file name
     * @param newFileSize         the new file size
     * @param newFileUrl          the new file URL
     * @param newChecksum         the new file checksum
     * @return a new TermsConditionsDocument with incremented version
     */
    public TermsConditionsDocument createNewVersion(String newFileName, String newOriginalFileName,
            Long newFileSize, String newFileUrl, String newChecksum) {
        TermsConditionsDocument newVersion = new TermsConditionsDocument(
                this.companyId, newFileName, newOriginalFileName, newFileSize, this.mimeType, newFileUrl);
        newVersion.setDocumentVersion(this.documentVersion + 1);
        newVersion.setChecksum(newChecksum);
        newVersion.setIsActive(true);

        // Deactivate current version
        this.deactivate();

        return newVersion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        TermsConditionsDocument that = (TermsConditionsDocument) o;
        return Objects.equals(getId(), that.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    @Override
    public String toString() {
        return String.format(
                "TermsConditionsDocument{id=%s, companyId=%s, fileName='%s', documentVersion=%d, isActive=%s}",
                getId(), companyId, fileName, documentVersion, isActive);
    }
}