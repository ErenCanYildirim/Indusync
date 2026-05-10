package com.indusync.indusync_backend.shared.infrastructure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service for handling file uploads in the application.
 * Provides secure file upload, validation, and storage functionality.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class FileUploadService {

    private final CloudinaryService cloudinaryService;

    /**
     * Upload a file to the server with validation and secure storage.
     *
     * @param file     the multipart file to upload
     * @param category the category/subdirectory to store the file in
     * @return the relative path to the uploaded file
     * @throws IOException if file upload fails
     * @throws IllegalArgumentException if file validation fails
     */
    @Async("fileUploadTaskExecutor")
    public CompletableFuture<String> uploadFile(MultipartFile file, String category) {
        log.info("Starting file upload for category: {}, filename: {}", category, file.getOriginalFilename());

        try {
            String publicId = category + "/" + UUID.randomUUID().toString();
            String url = cloudinaryService.uploadFile(file, category, publicId);
            return CompletableFuture.completedFuture(url);
        } catch (Exception e) {
            log.error("Failed to upload file", e);
            return CompletableFuture.failedFuture(e);
        }
    }

    /**
     * Delete a file from the server.
     *
     * @param publicId the public ID of the file to delete
     * @throws IOException if deletion fails
     */
    public void deleteFile(String publicId) throws IOException {
        if (publicId == null || publicId.trim().isEmpty()) {
            return;
        }
        cloudinaryService.deleteFile(publicId);
    }
}