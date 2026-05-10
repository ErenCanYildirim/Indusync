package com.indusync.indusync_backend.company.api.dto;

import com.indusync.indusync_backend.company.domain.TermsConditionsDocument;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * REST API response DTO for Terms and Conditions operations.
 * <p>
 * This DTO represents the response payload for T&C document operations
 * including upload, retrieval, and deletion. It follows the established
 * response patterns with builder pattern and static factory methods.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermsConditionsResponse {

    private UUID documentId;
    private UUID companyId;
    private String fileName;
    private String originalFileName;
    private Long fileSize;
    private String mimeType;
    private String fileUrl;
    private LocalDateTime uploadedAt;
    private String uploadedBy;
    private Boolean isActive;
    private Integer version;
    private String checksum;

    // Response metadata
    private Boolean success;
    private String message;
    private String errorCode;

    /**
     * Creates a successful response from a TermsConditionsDocument entity.
     *
     * @param document the T&C document entity
     * @param message  success message
     * @return successful response DTO
     */
    public static TermsConditionsResponse success(TermsConditionsDocument document, String message) {
        return TermsConditionsResponse.builder()
                .documentId(document.getId())
                .companyId(document.getCompanyId())
                .fileName(document.getFileName())
                .originalFileName(document.getOriginalFileName())
                .fileSize(document.getFileSize())
                .mimeType(document.getMimeType())
                .fileUrl(document.getFileUrl())
                .uploadedAt(document.getCreatedAt())
                .uploadedBy(document.getCreatedBy() != null ? document.getCreatedBy().toString() : null)
                .isActive(document.getIsActive())
                .version(Math.toIntExact(document.getVersion()))
                .checksum(document.getChecksum())
                .success(true)
                .message(message)
                .build();
    }

    /**
     * Creates a successful response for upload operations.
     *
     * @param document the uploaded T&C document entity
     * @return successful upload response
     */
    public static TermsConditionsResponse uploadSuccess(TermsConditionsDocument document) {
        return success(document, "AGB-Dokument wurde erfolgreich hochgeladen");
    }

    /**
     * Creates a successful response for retrieval operations.
     *
     * @param document the retrieved T&C document entity
     * @return successful retrieval response
     */
    public static TermsConditionsResponse retrievalSuccess(TermsConditionsDocument document) {
        return success(document, "AGB-Dokument wurde erfolgreich abgerufen");
    }

    /**
     * Creates a successful response for deletion operations.
     *
     * @param companyId the company ID
     * @return successful deletion response
     */
    public static TermsConditionsResponse deletionSuccess(UUID companyId) {
        return TermsConditionsResponse.builder()
                .companyId(companyId)
                .success(true)
                .message("AGB-Dokument wurde erfolgreich gelöscht")
                .build();
    }

    /**
     * Creates an error response with a message.
     *
     * @param message error message
     * @return error response DTO
     */
    public static TermsConditionsResponse error(String message) {
        return TermsConditionsResponse.builder()
                .success(false)
                .message(message)
                .build();
    }

    /**
     * Creates an error response with message and error code.
     *
     * @param message   error message
     * @param errorCode error code for client handling
     * @return error response DTO
     */
    public static TermsConditionsResponse error(String message, String errorCode) {
        return TermsConditionsResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }

    /**
     * Creates a validation error response.
     *
     * @param message validation error message
     * @return validation error response
     */
    public static TermsConditionsResponse validationError(String message) {
        return error(message, "VALIDATION_ERROR");
    }

    /**
     * Creates a file not found error response.
     *
     * @param companyId the company ID
     * @return file not found error response
     */
    public static TermsConditionsResponse notFound(UUID companyId) {
        return TermsConditionsResponse.builder()
                .companyId(companyId)
                .success(false)
                .message("Kein AGB-Dokument für dieses Unternehmen gefunden")
                .errorCode("DOCUMENT_NOT_FOUND")
                .build();
    }

    /**
     * Creates an unauthorized access error response.
     *
     * @return unauthorized error response
     */
    public static TermsConditionsResponse unauthorized() {
        return error("Keine Berechtigung für diese Operation", "UNAUTHORIZED");
    }

    /**
     * Creates a file upload error response.
     *
     * @param message specific upload error message
     * @return upload error response
     */
    public static TermsConditionsResponse uploadError(String message) {
        return error("Fehler beim Hochladen: " + message, "UPLOAD_ERROR");
    }

    /**
     * Creates a file storage error response.
     *
     * @return storage error response
     */
    public static TermsConditionsResponse storageError() {
        return error("Fehler beim Speichern der Datei", "STORAGE_ERROR");
    }

    /**
     * Gets human-readable file size.
     *
     * @return formatted file size string
     */
    public String getFormattedFileSize() {
        if (fileSize == null) {
            return "Unbekannt";
        }

        if (fileSize < 1024) {
            return fileSize + " B";
        } else if (fileSize < 1024 * 1024) {
            return String.format("%.1f KB", fileSize / 1024.0);
        } else if (fileSize < 1024 * 1024 * 1024) {
            return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
        } else {
            return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
        }
    }

    /**
     * Checks if this response represents a successful operation.
     *
     * @return true if operation was successful
     */
    public boolean isSuccessful() {
        return Boolean.TRUE.equals(success);
    }

    /**
     * Checks if this response contains document data.
     *
     * @return true if document data is present
     */
    public boolean hasDocumentData() {
        return documentId != null && fileName != null;
    }

    /**
     * Gets the file extension from the original filename.
     *
     * @return file extension or empty string
     */
    public String getFileExtension() {
        if (originalFileName == null) {
            return "";
        }
        int lastDot = originalFileName.lastIndexOf('.');
        return lastDot > 0 ? originalFileName.substring(lastDot + 1).toLowerCase() : "";
    }

    /**
     * Checks if the document is a PDF file.
     *
     * @return true if document is PDF
     */
    public boolean isPdfDocument() {
        return "application/pdf".equals(mimeType) || "pdf".equals(getFileExtension());
    }
}