package com.indusync.indusync_backend.company.api;

import com.indusync.indusync_backend.company.application.TermsConditionsService;
import com.indusync.indusync_backend.company.api.dto.TermsConditionsAccessRequest;
import com.indusync.indusync_backend.company.api.dto.TermsConditionsResponse;
import com.indusync.indusync_backend.company.api.dto.TermsConditionsUploadRequest;
import com.indusync.indusync_backend.company.domain.AccessContext;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import jakarta.validation.Valid;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * REST controller for Terms and Conditions document management operations.
 * <p>
 * This controller provides endpoints for:
 * - Uploading T&C documents
 * - Retrieving T&C documents
 * - Deleting T&C documents
 * - Checking document existence
 * - Logging document access for audit purposes
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/companies/{companyId}/terms-conditions")
@Slf4j
public class TermsConditionsController extends BaseController {

    private final TermsConditionsService termsConditionsService;

    public TermsConditionsController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            TermsConditionsService termsConditionsService) {
        super(authHelper, responseHelper);
        this.termsConditionsService = termsConditionsService;
    }

    /**
     * Uploads a Terms and Conditions document for a company.
     *
     * @param companyId      the company ID
     * @param file           the PDF file to upload
     * @param authentication the authenticated user
     * @return the upload response
     */
    @PostMapping("/upload")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TermsConditionsResponse> uploadTermsConditions(
            @PathVariable UUID companyId,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        log.info("T&C document upload requested for company: {}", companyId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(TermsConditionsResponse.error("Ungültige Authentifizierung"));
            }

            // Create upload request
            TermsConditionsUploadRequest request = TermsConditionsUploadRequest.builder()
                    .companyId(companyId)
                    .file(file)
                    .build();

            TermsConditionsResponse response = termsConditionsService.uploadTermsConditions(request, userId);

            // Return the appropriate HTTP status based on response
            if (response.getSuccess()) {
                log.info("T&C document uploaded successfully for company: {}", companyId);
                return ResponseEntity.status(HttpStatus.CREATED).body(response);
            } else {
                log.warn("T&C document upload failed for company: {} - {}", companyId, response.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("Unexpected error during T&C document upload for company: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(TermsConditionsResponse.error("Ein unerwarteter Fehler ist aufgetreten"));
        }
    }

    /**
     * Retrieves the active Terms and Conditions document for a company.
     *
     * @param companyId      the company ID
     * @param authentication the authenticated user
     * @return the document information
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TermsConditionsResponse> getTermsConditions(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("T&C document retrieval requested for company: {}", companyId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(TermsConditionsResponse.error("Ungültige Authentifizierung"));
            }

            TermsConditionsResponse response = termsConditionsService.getTermsConditions(companyId);

            if (response.getSuccess()) {
                // Log document access for audit purposes
                if (response.getDocumentId() != null) {
                    termsConditionsService.logDocumentAccess(
                            response.getDocumentId(),
                            userId,
                            AccessContext.COMPANY_PROFILE);
                }
                return ResponseEntity.ok(response);
            } else if ("DOCUMENT_NOT_FOUND".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.OK).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("Unexpected error during T&C document retrieval for company: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(TermsConditionsResponse.error("Ein unerwarteter Fehler ist aufgetreten"));
        }
    }

    /**
     * Deletes the active Terms and Conditions document for a company.
     *
     * @param companyId      the company ID
     * @param authentication an authenticated user
     * @return the deletion response
     */
    @DeleteMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<TermsConditionsResponse> deleteTermsConditions(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("T&C document deletion requested for company: {}", companyId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(TermsConditionsResponse.error("Ungültige Authentifizierung"));
            }

            TermsConditionsResponse response = termsConditionsService.deleteTermsConditions(companyId, userId);

            if (response.getSuccess()) {
                log.info("T&C document deleted successfully for company: {}", companyId);
                return ResponseEntity.ok(response);
            } else if ("DOCUMENT_NOT_FOUND".equals(response.getErrorCode())) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

        } catch (Exception e) {
            log.error("Unexpected error during T&C document deletion for company: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(TermsConditionsResponse.error("Ein unerwarteter Fehler ist aufgetreten"));
        }
    }

    /**
     * Checks if a company has an active Terms and Conditions document.
     *
     * @param companyId      the company ID
     * @param authentication the authenticated user
     * @return boolean response indicating document existence
     */
    @GetMapping("/exists")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> hasTermsConditions(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.debug("T&C document existence check requested for company: {}", companyId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            boolean hasDocument = termsConditionsService.hasActiveDocument(companyId);

            return ResponseEntity.ok()
                    .body(new ExistenceResponse(hasDocument, companyId));

        } catch (Exception e) {
            log.error("Unexpected error during T&C document existence check for company: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    /**
     * Logs access to a Terms and Conditions document for audit purposes.
     *
     * @param companyId      the company ID
     * @param request        the access request
     * @param authentication the authenticated user
     * @return success response
     */
    @PostMapping("/access-log")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> logDocumentAccess(
            @PathVariable UUID companyId,
            @Valid @RequestBody TermsConditionsAccessRequest request,
            Authentication authentication) {

        log.debug("T&C document access logging requested for company: {}", companyId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            termsConditionsService.logDocumentAccess(request, userId);

            return ResponseEntity.ok()
                    .body(new AccessLogResponse("Zugriff erfolgreich protokolliert", companyId));

        } catch (Exception e) {
            log.error("Unexpected error during T&C document access logging for company: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    // Helper response classes for simple endpoints

    /**
     * Response class for document existence check.
     */
    @Getter
    public static class ExistenceResponse {
        private final boolean exists;
        private final UUID companyId;
        private final String message;

        public ExistenceResponse(boolean exists, UUID companyId) {
            this.exists = exists;
            this.companyId = companyId;
            this.message = exists ? "Dokument vorhanden" : "Kein Dokument vorhanden";
        }

    }

    /**
     * Response class for access logging.
     */
    @Getter
    public static class AccessLogResponse {
        private final String message;
        private final UUID companyId;

        public AccessLogResponse(String message, UUID companyId) {
            this.message = message;
            this.companyId = companyId;
        }

    }
}