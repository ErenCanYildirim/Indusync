package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.api.dto.TermsConditionsAccessRequest;
import com.indusync.indusync_backend.company.api.dto.TermsConditionsResponse;
import com.indusync.indusync_backend.company.api.dto.TermsConditionsUploadRequest;
import com.indusync.indusync_backend.company.domain.AccessContext;
import com.indusync.indusync_backend.company.domain.TermsConditionsAccessLog;
import com.indusync.indusync_backend.company.domain.TermsConditionsAccessLogRepository;
import com.indusync.indusync_backend.company.domain.TermsConditionsDocument;
import com.indusync.indusync_backend.company.domain.TermsConditionsDocumentRepository;
import com.indusync.indusync_backend.shared.infrastructure.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for handling Terms and Conditions document management operations.
 * <p>
 * This service provides functionality for:
 * - Uploading T&C documents with validation and security checks
 * - Retrieving T&C documents by company ID
 * - Deleting T&C documents with proper cleanup
 * - Checking if companies have active T&C documents
 * - Logging document access for audit and compliance
 * </p>
 * 
 * The service follows existing patterns with proper error handling,
 * transaction management, and security validation.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class TermsConditionsService {

    private final TermsConditionsDocumentRepository documentRepository;
    private final TermsConditionsAccessLogRepository accessLogRepository;
    private final FileStorageService fileStorageService;

    // Constants for file validation
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String ALLOWED_MIME_TYPE = "application/pdf";
    private static final String STORAGE_FOLDER = "terms-conditions";

    /**
     * Uploads a Terms and Conditions document for a company.
     * 
     * @param request the upload request containing company ID and file
     * @param userId  the ID of the user performing the upload
     * @return response containing upload result and document information
     * @throws IllegalArgumentException if validation fails
     * @throws RuntimeException         if file storage fails
     */
    public TermsConditionsResponse uploadTermsConditions(TermsConditionsUploadRequest request, UUID userId) {
        log.info("Uploading T&C document for company: {} by user: {}", request.getCompanyId(), userId);

        try {
            // Validate the upload request
            validateUploadRequest(request);

            MultipartFile file = request.getFile();
            UUID companyId = request.getCompanyId();

            // Generate unique file name and calculate checksum
            String fileName = generateFileName(companyId, file.getOriginalFilename());
            String checksum = calculateFileChecksum(file);

            // Check for duplicate files
            if (isDuplicateFile(checksum, companyId)) {
                log.warn("Duplicate file detected for company: {}, checksum: {}", companyId, checksum);
                return TermsConditionsResponse.validationError("Diese Datei wurde bereits hochgeladen");
            }

            // Deactivate existing active documents for this company
            int deactivatedCount = documentRepository.deactivateAllByCompanyId(companyId);
            if (deactivatedCount > 0) {
                log.info("Deactivated {} existing T&C documents for company: {}", deactivatedCount, companyId);
            }

            // Upload file to storage
            String publicId = String.format("%s/%s", STORAGE_FOLDER, fileName);
            String fileUrl = fileStorageService.uploadFile(file, STORAGE_FOLDER, publicId);

            // Get next version number
            Integer nextVersion = documentRepository.findMaxDocumentVersionByCompanyId(companyId) + 1;

            // Create and save the document entity
            TermsConditionsDocument document = new TermsConditionsDocument(
                    companyId,
                    fileName,
                    file.getOriginalFilename(),
                    file.getSize(),
                    file.getContentType(),
                    fileUrl);
            document.setDocumentVersion(nextVersion);
            document.setChecksum(checksum);
            document.setIsActive(true);

            TermsConditionsDocument savedDocument = documentRepository.save(document);

            log.info("Successfully uploaded T&C document: {} for company: {}", savedDocument.getId(), companyId);
            return TermsConditionsResponse.uploadSuccess(savedDocument);

        } catch (IllegalArgumentException e) {
            log.warn("Validation error during T&C upload for company: {}: {}", request.getCompanyId(), e.getMessage());
            return TermsConditionsResponse.validationError(e.getMessage());
        } catch (Exception e) {
            log.error("Error uploading T&C document for company: {}", request.getCompanyId(), e);
            return TermsConditionsResponse.uploadError("Unerwarteter Fehler beim Hochladen: " + e.getMessage());
        }
    }

    /**
     * Retrieves the active Terms and Conditions document for a company.
     * 
     * @param companyId the company ID
     * @return response containing the document information or not found result
     */
    @Transactional(readOnly = true)
    public TermsConditionsResponse getTermsConditions(UUID companyId) {
        log.debug("Retrieving T&C document for company: {}", companyId);

        Optional<TermsConditionsDocument> documentOpt = documentRepository.findActiveByCompanyId(companyId);

        if (documentOpt.isEmpty()) {
            log.debug("No active T&C document found for company: {}", companyId);
            return TermsConditionsResponse.notFound(companyId);
        }

        TermsConditionsDocument document = documentOpt.get();
        log.debug("Found T&C document: {} for company: {}", document.getId(), companyId);
        return TermsConditionsResponse.retrievalSuccess(document);
    }

    /**
     * Deletes the active Terms and Conditions document for a company.
     * 
     * @param companyId the company ID
     * @param userId    the ID of the user performing the deletion
     * @return response indicating deletion result
     */
    public TermsConditionsResponse deleteTermsConditions(UUID companyId, UUID userId) {
        log.info("Deleting T&C document for company: {} by user: {}", companyId, userId);

        try {
            Optional<TermsConditionsDocument> documentOpt = documentRepository.findActiveByCompanyId(companyId);

            if (documentOpt.isEmpty()) {
                log.warn("No active T&C document found for deletion, company: {}", companyId);
                return TermsConditionsResponse.notFound(companyId);
            }

            TermsConditionsDocument document = documentOpt.get();

            // Delete file from storage
            try {
                String publicId = extractPublicIdFromUrl(document.getFileUrl());
                fileStorageService.deleteFile(publicId);
                log.debug("Deleted file from storage: {}", publicId);
            } catch (Exception e) {
                log.warn("Failed to delete file from storage for document: {}, continuing with database deletion",
                        document.getId(), e);
            }

            // Delete document from database
            documentRepository.delete(document);

            log.info("Successfully deleted T&C document: {} for company: {}", document.getId(), companyId);
            return TermsConditionsResponse.deletionSuccess(companyId);

        } catch (Exception e) {
            log.error("Error deleting T&C document for company: {}", companyId, e);
            return TermsConditionsResponse.error("Fehler beim Löschen des Dokuments: " + e.getMessage());
        }
    }

    /**
     * Checks if a company has an active Terms and Conditions document.
     * 
     * @param companyId the company ID
     * @return true if the company has an active T&C document
     */
    @Transactional(readOnly = true)
    public boolean hasActiveDocument(UUID companyId) {
        boolean hasDocument = documentRepository.existsActiveByCompanyId(companyId);
        log.debug("Company {} has active T&C document: {}", companyId, hasDocument);
        return hasDocument;
    }

    /**
     * Logs access to a Terms and Conditions document for audit purposes.
     * 
     * @param request the access request containing document and context information
     * @param userId  the ID of the user accessing the document
     */
    public void logDocumentAccess(TermsConditionsAccessRequest request, UUID userId) {
        log.debug("Logging T&C document access: document={}, user={}, context={}",
                request.getDocumentId(), userId, request.getAccessContext());

        try {
            // Validate the access request
            if (!request.isCompletelyValid()) {
                log.warn("Invalid access request: {}", request.getValidationError());
                return;
            }

            // Create access log entry
            TermsConditionsAccessLog accessLog = TermsConditionsAccessLog.builder()
                    .documentId(request.getDocumentId())
                    .accessedBy(userId)
                    .accessContext(request.getAccessContext())
                    .orderId(request.getOrderId())
                    .ipAddress(request.getSanitizedIpAddress())
                    .userAgent(request.getSanitizedUserAgent())
                    .build();

            accessLogRepository.save(accessLog);

            log.debug("Successfully logged T&C document access: {}", accessLog.getId());

        } catch (Exception e) {
            log.error("Error logging T&C document access for document: {}, user: {}",
                    request.getDocumentId(), userId, e);
            // Don't throw exception - access logging should not break the main flow
        }
    }

    /**
     * Logs access to a Terms and Conditions document with minimal information.
     * 
     * @param documentId    the document ID
     * @param userId        the user ID
     * @param accessContext the access context
     */
    public void logDocumentAccess(UUID documentId, UUID userId, AccessContext accessContext) {
        TermsConditionsAccessRequest request = TermsConditionsAccessRequest.builder()
                .documentId(documentId)
                .accessContext(accessContext)
                .build();
        logDocumentAccess(request, userId);
    }

    /**
     * Logs access to a Terms and Conditions document from order context.
     * 
     * @param documentId    the document ID
     * @param userId        the user ID
     * @param accessContext the access context
     * @param orderId       the order ID
     */
    public void logDocumentAccess(UUID documentId, UUID userId, AccessContext accessContext, UUID orderId) {
        TermsConditionsAccessRequest request = TermsConditionsAccessRequest.builder()
                .documentId(documentId)
                .accessContext(accessContext)
                .orderId(orderId)
                .build();
        logDocumentAccess(request, userId);
    }

    // Private helper methods

    /**
     * Validates the upload request for completeness and business rules.
     */
    private void validateUploadRequest(TermsConditionsUploadRequest request) {
        if (!request.isValid()) {
            throw new IllegalArgumentException(request.getValidationError());
        }

        MultipartFile file = request.getFile();

        // Additional server-side validation
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dateigröße überschreitet das Limit von 10MB");
        }

        if (!ALLOWED_MIME_TYPE.equals(file.getContentType())) {
            throw new IllegalArgumentException("Nur PDF-Dateien sind erlaubt");
        }

        // Validate file extension
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Datei muss eine PDF-Datei sein (.pdf)");
        }
    }

    /**
     * Generates a unique file name for storage.
     */
    private String generateFileName(UUID companyId, String originalFilename) {
        String timestamp = String.valueOf(System.currentTimeMillis());
        String extension = getFileExtension(originalFilename);
        return String.format("tc_%s_%s%s", companyId.toString().replace("-", ""), timestamp, extension);
    }

    /**
     * Extracts file extension from filename.
     */
    private String getFileExtension(String filename) {
        if (filename == null) {
            return ".pdf";
        }
        int lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot) : ".pdf";
    }

    /**
     * Calculates SHA-256 checksum of the uploaded file.
     */
    private String calculateFileChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(file.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException | IOException e) {
            log.warn("Failed to calculate file checksum, using fallback", e);
            return String.valueOf(file.getSize() + System.currentTimeMillis());
        }
}

/**
     * Checks if a file with the same checksum already exists for the company.
     */
    private boolean isDuplicateFile(String checksum, UUID companyId) {
        return documentRepository.findByChecksum(checksum)
                .stream()
                .anyMatch(doc -> doc.getCompanyId().equals(companyId) && doc.isActive());
    }

    /**
     * Extracts public ID from Cloudinary URL for deletion.
     */
    private String extractPublicIdFromUrl(String fileUrl) {
        // Extract public ID from Cloudinary URL
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/terms-conditions/tc_uuid_timestamp.pdf
        if (fileUrl.contains("/")) {
            String[] parts = fileUrl.split("/");
            if (parts.length >= 2) {
                String lastPart = parts[parts.length - 1];
                String secondLastPart = parts[parts.length - 2];
                // Remove file extension for public ID
                String fileName = lastPart.contains(".") ? lastPart.substring(0, lastPart.lastIndexOf('.')) : lastPart;
                return secondLastPart + "/" + fileName;
            }
        }
        return fileUrl; // Fallback to original URL
    }

    // Exception classes for better error handling

    /**
     * Exception thrown when a T&C document is not found.
     */
    public static class TermsConditionsNotFoundException extends RuntimeException {
        public TermsConditionsNotFoundException(String message) {
            super(message);
        }
    }

    /**
     * Exception thrown when file upload fails.
     */
    public static class FileUploadException extends RuntimeException {
        public FileUploadException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Exception thrown when file validation fails.
     */
    public static class FileValidationException extends IllegalArgumentException {
        public FileValidationException(String message) {
            super(message);
        }
    }
}