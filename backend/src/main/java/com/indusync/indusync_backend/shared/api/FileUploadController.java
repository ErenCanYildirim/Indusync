package com.indusync.indusync_backend.shared.api;

import com.indusync.indusync_backend.shared.infrastructure.FileStorageService;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotNull;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;


/**
 * Controller for handling file uploads.
 * <p>
 * This controller provides endpoints for uploading files such as company
 * verification documents, certificates, and other supporting documents
 * needed during the registration process.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/files")
@RequiredArgsConstructor
@Slf4j
public class FileUploadController {

     private final FileStorageService fileStorageService;

    private static final List<String> ALLOWED_DOCUMENT_TYPES = Arrays.asList(
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Uploads a company verification document.
     */
    @PostMapping("/company-verification")
    public ResponseEntity<FileUploadResponse> uploadCompanyVerification(
            @RequestParam("file") @NotNull MultipartFile file) {
        
        log.debug("Uploading company verification document: {}", file.getOriginalFilename());


        try {
            validateFile(file, "company verification");

            // Upload to Cloudinary
            String fileId = UUID.randomUUID().toString();
            String fileName = sanitizeFileName(file.getOriginalFilename());
            String publicId = fileId + "_" + fileName;
            String storedPath = fileStorageService.uploadFile(file, "company-verification", publicId);

            log.info("Company verification file uploaded: {} -> {}", fileName, storedPath);

            FileUploadResponse response = FileUploadResponse.builder()
                .fileId(fileId)
                .originalName(fileName)
                .storedPath(storedPath)
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedAt(LocalDateTime.now())
                .success(true)
                .message("Unternehmensnachweis erfolgreich hochgeladen")
                .build();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error uploading company verification file", e);

            FileUploadResponse response = FileUploadResponse.builder()
                    .success(false)
                    .message("Fehler beim Hochladen: " + e.getMessage())
                    .build();

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Uploads company certificates.
     */
    @PostMapping("/company-certificates")
    public ResponseEntity<FileUploadResponse> uploadCompanyCertificates(
            @RequestParam("file") @NotNull MultipartFile file) {

        log.debug("Uploading company certificates: {}", file.getOriginalFilename());

        try {
            validateFile(file, "company certificates");

            // Upload to Cloudinary
            String fileId = UUID.randomUUID().toString();
            String fileName = sanitizeFileName(file.getOriginalFilename());
            String publicId = fileId + "_" + fileName;
            String storedPath = fileStorageService.uploadFile(file, "company-certificates", publicId);

            log.info("Company certificates file uploaded: {} -> {}", fileName, storedPath);

            FileUploadResponse response = FileUploadResponse.builder()
                    .fileId(fileId)
                    .originalName(fileName)
                    .storedPath(storedPath)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedAt(LocalDateTime.now())
                    .success(true)
                    .message("Zertifikate erfolgreich hochgeladen")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error uploading company certificates file", e);

            FileUploadResponse response = FileUploadResponse.builder()
                    .success(false)
                    .message("Fehler beim Hochladen: " + e.getMessage())
                    .build();

            return ResponseEntity.badRequest().body(response);
        }
    }

    
    /**
     * Uploads a company logo.
     */
    @PostMapping("/company-logo")
    public ResponseEntity<FileUploadResponse> uploadCompanyLogo(
            @RequestParam("file") @NotNull MultipartFile file) {

        log.debug("Uploading company logo: {}", file.getOriginalFilename());

        try {
            validateImageFile(file);

            // Upload to Cloudinary
            String fileId = UUID.randomUUID().toString();
            String fileName = sanitizeFileName(file.getOriginalFilename());
            String publicId = fileId + "_" + fileName;
            String storedPath = fileStorageService.uploadFile(file, "company-logos", publicId);

            log.info("Company logo uploaded: {} -> {}", fileName, storedPath);

            FileUploadResponse response = FileUploadResponse.builder()
                    .fileId(fileId)
                    .originalName(fileName)
                    .storedPath(storedPath)
                    .fileSize(file.getSize())
                    .contentType(file.getContentType())
                    .uploadedAt(LocalDateTime.now())
                    .success(true)
                    .message("Logo erfolgreich hochgeladen")
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error uploading company logo", e);

            FileUploadResponse response = FileUploadResponse.builder()
                    .success(false)
                    .message("Fehler beim Hochladen: " + e.getMessage())
                    .build();

            return ResponseEntity.badRequest().body(response);
        }
    }

    /**
     * Gets file info by file ID.
     */
    @GetMapping("/{fileId}")
    public ResponseEntity<FileInfoResponse> getFileInfo(@PathVariable String fileId) {
        log.debug("Getting file info for: {}", fileId);

        // TODO: Implement actual file retrieval
        FileInfoResponse response = FileInfoResponse.builder()
                .fileId(fileId)
                .originalName("example_document.pdf")
                .fileSize(1024L)
                .contentType("application/pdf")
                .uploadedAt(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a file by file ID
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<FileDeleteResponse> deleteFile(@PathVariable String fileId) {
            log.debug("Deleting file: {}", fileId);
        
        try {
            //currently its a soft deletion

            log.info("File deleted: {}", fileId);

            FileDeleteResponse response = FileDeleteResponse.builder()
                .fileId(fileId)
                .success(true)
                .message("Datei erfolgreich gelöscht")
                .build();
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting file: {}", fileId, e);

            FileDeleteResponse response = FileDeleteResponse.builder()
                    .fileId(fileId)
                    .success(false)
                    .message("Fehler beim Löschen: " + e.getMessage())
                    .build();

            return ResponseEntity.badRequest().body(response);
        }
    }

     private void validateFile(MultipartFile file, String fileType) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Datei ist leer");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Datei ist zu groß (max. 10MB)");
        }

        if (!ALLOWED_DOCUMENT_TYPES.contains(file.getContentType())) {
            throw new IllegalArgumentException("Dateityp nicht erlaubt. Erlaubt: PDF, JPEG, PNG, DOC, DOCX");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.trim().isEmpty()) {
            throw new IllegalArgumentException("Dateiname ist ungültig");
        }
    }

    private void validateImageFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Datei ist leer");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Datei ist zu groß (max. 10MB)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt (JPEG, PNG)");
        }

        List<String> allowedImageTypes = Arrays.asList("image/jpeg", "image/jpg", "image/png");
        if (!allowedImageTypes.contains(contentType)) {
            throw new IllegalArgumentException("Bildformat nicht unterstützt. Erlaubt: JPEG, PNG");
        }
    }

    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unnamed_file";
        }

        // Remove or replace potentially dangerous characters
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    // DTOs

    @Data
    @Builder
    public static class FileUploadResponse {
        private String fileId;
        private String originalName;
        private String storedPath;
        private Long fileSize;
        private String contentType;
        private LocalDateTime uploadedAt;
        private boolean success;
        private String message;
    }

    @Data
    @Builder
    public static class FileInfoResponse {
        private String fileId;
        private String originalName;
        private Long fileSize;
        private String contentType;
        private LocalDateTime uploadedAt;
    }

    @Data
    @Builder
    public static class FileDeleteResponse {
        private String fileId;
        private boolean success;
        private String message;
}