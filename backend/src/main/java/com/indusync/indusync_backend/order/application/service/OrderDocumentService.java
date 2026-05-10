package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.application.dto.OrderDocumentResponse;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentDownloadResponse;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderDocument;
import com.indusync.indusync_backend.order.domain.OrderDocumentRepository;
import com.indusync.indusync_backend.shared.infrastructure.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for managing order documents.
 * Handles upload, download, deletion, and retrieval of order-related documents.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderDocumentService {

    private final OrderDocumentRepository orderDocumentRepository;
    private final FileStorageService fileStorageService;

    /**
     * Uploads a document for an order.
     */
    public OrderDocumentResponse uploadDocument(
            Order order,
            MultipartFile file,
            String documentType,
            String description) {

        log.info("Uploading document for order: {}, filename: {}", order.getId(), file.getOriginalFilename());

        // Validate file
        validateDocumentFile(file);

        try {
            // Generate unique filename
            String fileExtension = getFileExtension(file.getOriginalFilename());
            String uniqueFileName = UUID.randomUUID().toString() + (fileExtension.isEmpty() ? "" : "." + fileExtension);

            // Upload to file storage
            String fileUrl = fileStorageService.uploadFile(file, "order-documents", uniqueFileName);

            // Create order document entity
            OrderDocument document = new OrderDocument(
                    order,
                    uniqueFileName,
                    file.getOriginalFilename(),
                    documentType != null ? documentType : "order_attachment",
                    description,
                    file.getSize(),
                    file.getContentType(),
                    fileUrl);

            // Save document
            OrderDocument savedDocument = orderDocumentRepository.save(document);

            log.info("Successfully uploaded document {} for order {}", savedDocument.getId(), order.getId());

            return OrderDocumentResponse.fromOrderDocument(savedDocument);

        } catch (Exception e) {
            log.error("Error uploading document for order {}: {}", order.getId(), e.getMessage());
            throw new DocumentUploadException("Fehler beim Hochladen des Dokuments: " + e.getMessage());
        }
    }

    /**
     * Gets all documents for an order.
     */
    public List<OrderDocumentResponse> getOrderDocuments(UUID orderId) {
        log.debug("Getting documents for order: {}", orderId);

        List<OrderDocument> documents = orderDocumentRepository.findByOrder_Id(orderId);

        return documents.stream()
                .map(OrderDocumentResponse::fromOrderDocument)
                .collect(Collectors.toList());
    }

    /**
     * Downloads an order document.
     */
    public OrderDocumentDownloadResponse downloadDocument(UUID orderId, UUID documentId) {
        log.debug("Downloading document {} for order {}", documentId, orderId);

        // Find a document
        OrderDocument document = orderDocumentRepository.findByIdAndOrder_Id(documentId, orderId)
                .orElseThrow(() -> new DocumentNotFoundException("Dokument nicht gefunden"));

        try {
            // For Cloudinary URLs, we can create a URL resource directly
            Resource resource = new UrlResource(document.getFileUrl());

            if (!resource.exists() || !resource.isReadable()) {
                throw new DocumentNotFoundException("Dokument kann nicht gelesen werden");
            }

            return OrderDocumentDownloadResponse.builder()
                    .fileName(document.getFileName())
                    .originalFileName(document.getOriginalFileName())
                    .contentType(document.getContentType())
                    .fileSize(document.getFileSize())
                    .resource(resource)
                    .build();

        } catch (Exception e) {
            log.error("Error downloading document {} for order {}: {}", documentId, orderId, e.getMessage());
            throw new DocumentDownloadException("Fehler beim Herunterladen des Dokuments: " + e.getMessage());
        }
    }

    /**
     * Deletes an order document.
     */
    public void deleteDocument(UUID orderId, UUID documentId) {
        log.info("Deleting document {} for order {}", documentId, orderId);

        // Find document
        OrderDocument document = orderDocumentRepository.findByIdAndOrder_Id(documentId, orderId)
                .orElseThrow(() -> new DocumentNotFoundException("Dokument nicht gefunden"));

        try {
            // Delete from file storage
            String publicId = extractPublicIdFromUrl(document.getFileUrl());
            if (publicId != null) {
                fileStorageService.deleteFile(publicId);
            }

            // Delete from database
            orderDocumentRepository.delete(document);

            log.info("Successfully deleted document {} for order {}", documentId, orderId);

        } catch (Exception e) {
            log.error("Error deleting document {} for order {}: {}", documentId, orderId, e.getMessage());
            throw new DocumentDeletionException("Fehler beim Löschen des Dokuments: " + e.getMessage());
        }
    }

    /**
     * Validates an uploaded file for order documents.
     */
    private void validateDocumentFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDocumentException("Datei ist leer oder nicht vorhanden");
        }

        // Check file size (max 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new InvalidDocumentException("Datei ist zu groß. Maximale Größe: 10MB");
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null) {
            throw new InvalidDocumentException("Dateityp konnte nicht ermittelt werden");
        }

        List<String> allowedTypes = List.of(
                "application/pdf",
                "image/jpeg",
                "image/jpg",
                "image/png",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain");

        if (!allowedTypes.contains(contentType.toLowerCase())) {
            throw new InvalidDocumentException("Dateityp nicht erlaubt. Erlaubte Typen: PDF, DOC, DOCX, JPG, PNG, TXT");
        }

        // Check filename
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new InvalidDocumentException("Dateiname ist erforderlich");
        }

        // Check for suspicious filename patterns
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new InvalidDocumentException("Ungültiger Dateiname");
        }
    }

    /**
     * Extracts file extension from filename.
     */
    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }

        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex == -1) {
            return "";
        }

        return filename.substring(lastDotIndex + 1).toLowerCase();
    }

    /**
     * Extracts Cloudinary public ID from file URL.
     */
    private String extractPublicIdFromUrl(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            return null;
        }

        try {
            // Extract public ID from Cloudinary URL
            String[] parts = fileUrl.split("/");
            if (parts.length >= 2) {
                String filenamePart = parts[parts.length - 1];
                // Remove file extension to get public ID
                int lastDotIndex = filenamePart.lastIndexOf('.');
                return lastDotIndex != -1 ? filenamePart.substring(0, lastDotIndex) : filenamePart;
            }
        } catch (Exception e) {
            log.warn("Could not extract public ID from URL: {}", fileUrl);
        }

        return null;
    }

    // Exception classes
    public static class DocumentUploadException extends RuntimeException {
        public DocumentUploadException(String message) {
            super(message);
        }
    }

    public static class DocumentDownloadException extends RuntimeException {
        public DocumentDownloadException(String message) {
            super(message);
        }
    }

    public static class DocumentDeletionException extends RuntimeException {
        public DocumentDeletionException(String message) {
            super(message);
        }
    }

    public static class DocumentNotFoundException extends RuntimeException {
        public DocumentNotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidDocumentException extends RuntimeException {
        public InvalidDocumentException(String message) {
            super(message);
        }
    }
}