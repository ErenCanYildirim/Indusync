package com.indusync.indusync_backend.company.api.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * REST API request DTO for Terms and Conditions document upload.
 * <p>
 * This DTO represents the request payload for uploading T&C documents
 * to a company profile. It includes validation for required fields
 * and follows the established DTO patterns in the application.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermsConditionsUploadRequest {

    @NotNull(message = "Unternehmen-ID ist erforderlich")
    private UUID companyId;

    @NotNull(message = "Datei ist erforderlich")
    private MultipartFile file;

    /**
     * Validates that the uploaded file is a PDF.
     *
     * @return true if file is PDF format
     */
    public boolean isPdfFile() {
        if (file == null || file.getContentType() == null) {
            return false;
        }
        return "application/pdf".equals(file.getContentType());
    }

    /**
     * Validates that the file size is within the 10MB limit.
     *
     * @return true if file size is acceptable
     */
    public boolean isFileSizeValid() {
        if (file == null) {
            return false;
        }
        // 10MB limit
        return file.getSize() <= 10 * 1024 * 1024;
    }

    /**
     * Validates that the file is not empty.
     *
     * @return true if file has content
     */
    public boolean hasValidFile() {
        return file != null && !file.isEmpty() && file.getSize() > 0;
    }

    /**
     * Gets the original filename from the uploaded file.
     *
     * @return original filename or null if not available
     */
    public String getOriginalFileName() {
        return file != null ? file.getOriginalFilename() : null;
    }

    /**
     * Gets the file size in bytes.
     *
     * @return file size or 0 if file is null
     */
    public long getFileSize() {
        return file != null ? file.getSize() : 0;
    }

    /**
     * Gets the content type of the uploaded file.
     *
     * @return content type or null if not available
     */
    public String getContentType() {
        return file != null ? file.getContentType() : null;
    }

    /**
     * Performs comprehensive validation of the upload request.
     *
     * @return true if all validations pass
     */
    public boolean isValid() {
        return companyId != null &&
                hasValidFile() &&
                isPdfFile() &&
                isFileSizeValid();
    }

    /**
     * Gets a validation error message if the request is invalid.
     *
     * @return error message or null if valid
     */
    public String getValidationError() {
        if (companyId == null) {
            return "Unternehmen-ID ist erforderlich";
        }
        if (!hasValidFile()) {
            return "Eine gültige Datei ist erforderlich";
        }
        if (!isPdfFile()) {
            return "Nur PDF-Dateien sind erlaubt";
        }
        if (!isFileSizeValid()) {
            return "Dateigröße darf 10MB nicht überschreiten";
        }
        return null;
    }
}