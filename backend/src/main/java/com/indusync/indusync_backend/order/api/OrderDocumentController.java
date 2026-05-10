package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.order.api.dto.OrderDetailResponse;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentResponse;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentDownloadResponse;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import com.indusync.indusync_backend.shared.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST controller for order document management operations.
 * 
 * This controller handles:
 * - Uploading documents for orders
 * - Retrieving order documents
 * - Downloading order documents
 * - Deleting order documents
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/orders")
@Slf4j
@Tag(name = "Order Documents", description = "Order document management operations")
public class OrderDocumentController extends BaseController {

    private final OrderFacadeService orderFacadeService;
    private final OrderMapper orderMapper;

    public OrderDocumentController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderFacadeService orderFacadeService,
            OrderMapper orderMapper) {
        super(authHelper, responseHelper);
        this.orderFacadeService = orderFacadeService;
        this.orderMapper = orderMapper;
    }

    /**
     * Uploads a document for an order.
     * 
     * @param orderId        the order ID
     * @param file           the file to upload
     * @param documentType   the type of document (optional)
     * @param description    description of the document (optional)
     * @param authentication the authenticated user
     * @return upload response with document details
     */
    @PostMapping("/{orderId}/documents")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Upload order document", description = "Upload a document attachment for an order")
    @ApiResponse(responseCode = "201", description = "Document uploaded successfully")
    @ApiResponse(responseCode = "400", description = "Invalid file or order")
    @ApiResponse(responseCode = "404", description = "Order not found")
    @ApiResponse(responseCode = "413", description = "File too large")
    public ResponseEntity<OrderDocumentUploadResponse> uploadOrderDocument(
            @PathVariable UUID orderId,
            @RequestParam("file") @Valid MultipartFile file,
            @RequestParam(value = "documentType", required = false) String documentType,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication) {
        
        try {
            OrderDocumentResponse document = orderFacadeService.uploadOrderDocument(
                    orderId, file, documentType, description, authentication);

            OrderDocumentUploadResponse response = OrderDocumentUploadResponse.builder()
                    .success(true)
                    .message("Dokument erfolgreich hochgeladen")
                    .document(orderMapper.toDocumentDto(document))
                    .build();

            return ResponseEntity.status(201).body(response);

        } catch (IllegalArgumentException e) {
            OrderDocumentUploadResponse response = OrderDocumentUploadResponse.builder()
                    .success(false)
                    .message("Ungültige Datei: " + e.getMessage())
                    .build();
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            log.error("Error uploading order document for order {}", orderId, e);

            OrderDocumentUploadResponse response = OrderDocumentUploadResponse.builder()
                    .success(false)
                    .message("Fehler beim Hochladen des Dokuments")
                    .build();
            return ResponseEntity.status(500).body(response);
        }
    }

    /**
     * Gets all documents for an order.
     * 
     * @param orderId        the order ID
     * @param authentication the authenticated user
     * @return list of order documents
     */
    @GetMapping("/{orderId}/documents")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get order documents", description = "Get all documents attached to an order")
    @ApiResponse(responseCode = "200", description = "Documents retrieved successfully")
    @ApiResponse(responseCode = "404", description = "Order not found")
    public ResponseEntity<List<OrderDetailResponse.OrderDocumentDto>> getOrderDocuments(
            @PathVariable UUID orderId,
            Authentication authentication) {

        List<OrderDocumentResponse> documents = orderFacadeService.getOrderDocuments(orderId, authentication);

        List<OrderDetailResponse.OrderDocumentDto> documentDtos = documents.stream()
                .map(orderMapper::toDocumentDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(documentDtos);
    }

    /**
     * Downloads an order document.
     * 
     * @param orderId        the order ID
     * @param documentId     the document ID
     * @param authentication the authenticated user
     * @return the file content
     */
    @GetMapping("/{orderId}/documents/{documentId}/download")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Download order document", description = "Download a specific order document")
    @ApiResponse(responseCode = "200", description = "Document downloaded successfully")
    @ApiResponse(responseCode = "404", description = "Order or document not found")
    public ResponseEntity<Resource> downloadOrderDocument(
            @PathVariable UUID orderId,
            @PathVariable UUID documentId,
            Authentication authentication) {

        try {
            OrderDocumentDownloadResponse downloadResponse = orderFacadeService.downloadOrderDocument(
                    orderId, documentId, authentication);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(downloadResponse.contentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + downloadResponse.fileName() + "\"")
                    .body(downloadResponse.resource());

        } catch (Exception e) {
            log.error("Error downloading order document {} for order {}", documentId, orderId, e);
            return ResponseEntity.notFound().build();
        }
    }

     /**
     * Deletes an order document.
     * 
     * @param orderId        the order ID
     * @param documentId     the document ID
     * @param authentication the authenticated user
     * @return deletion confirmation
     */
    @DeleteMapping("/{orderId}/documents/{documentId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Delete order document", description = "Delete a specific order document")
    @ApiResponse(responseCode = "200", description = "Document deleted successfully")
    @ApiResponse(responseCode = "404", description = "Order or document not found")
    public ResponseEntity<OrderDocumentDeleteResponse> deleteOrderDocument(
            @PathVariable UUID orderId,
            @PathVariable UUID documentId,
            Authentication authentication) {

        try {
            orderFacadeService.deleteOrderDocument(orderId, documentId, authentication);

            OrderDocumentDeleteResponse response = OrderDocumentDeleteResponse.builder()
                    .success(true)
                    .message("Dokument erfolgreich gelöscht")
                    .documentId(documentId)
                    .build();

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error deleting order document {} for order {}", documentId, orderId, e);

            OrderDocumentDeleteResponse response = OrderDocumentDeleteResponse.builder()
                    .success(false)
                    .message("Fehler beim Löschen des Dokuments")
                    .documentId(documentId)
                    .build();

            return ResponseEntity.status(500).body(response);
        }
    }

     // === Helper DTOs for File Operations ===

    @Data
    @Builder
    public static class OrderDocumentUploadResponse {
        private boolean success;
        private String message;
        private OrderDetailResponse.OrderDocumentDto document;
    }

    @Data
    @Builder
    public static class OrderDocumentDeleteResponse {
        private boolean success;
        private String message;
        private UUID documentId;
    }

    // === Helper Methods ===

    /**
     * Extracts user ID from Spring Security Authentication.
     */
    private UUID getUserIdFromAuthentication(Authentication authentication) {
        return getCurrentUserId(authentication);
    }

    /**
     * Extracts JWT token from Spring Security Authentication object.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }
}