package com.indusync.indusync_backend.order.application;

import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentDownloadResponse;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentResponse;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.application.service.*;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Facade service that coordinates between specialized order services.
 * Maintains backward compatibility with the original OrderManagementService API
 * while internally delegating to focused, single-responsibility services.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderFacadeService {

    // Core services
    private final OrderLifecycleService lifecycleService;
    private final OrderSearchService searchService;
    private final OrderMatchingManagementService matchingService;
    private final OrderDocumentService documentService;
    private final OrderDeadlineService deadlineService;
    private final OrderAuthorizationService authorizationService;
    private final OrderRepository orderRepository;

    // ===== Order Lifecycle Operations =====

    /**
     * Creates a new order in DRAFT status with comprehensive frontend data.
     */
    public OrderResponse createDraft(CreateOrderCommand command, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return lifecycleService.createDraft(command, companyId);
    }

    /**
     * Publishes an order, making it visible to service providers.
     */
    public OrderResponse publishOrder(UUID orderId, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return lifecycleService.publishOrder(orderId, companyId);
    }

    /**
     * Retrieves an order by ID.
     */
    public OrderResponse getOrder(UUID orderId) {
        return lifecycleService.getOrder(orderId);
    }

    /**
     * Retrieves an order by ID with authorization check.
     */
    public OrderResponse getOrder(UUID orderId, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        Order order = orderRepository.findByIdWithCollections(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Manually initialize collections to ensure they are loaded for caching
        // This prevents lazy initialization exceptions when the entity is cached in
        // Redis
        if (order.getTargetIndustries() != null) {
            order.getTargetIndustries().size(); // Force initialization
        }
        if (order.getPlacementTypes() != null) {
            order.getPlacementTypes().size(); // Force initialization
        }

        authorizationService.verifyOrderAccess(order, companyId);

        return OrderResponse.fromOrder(order);
    }

    /**
     * Retrieves orders for the authenticated user's company filtered by role.
     */
    public Page<OrderResponse> getMyOrders(OrderLifecycleService.MyOrderRole role, Authentication authentication,
            Pageable pageable) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        if (companyId == null) {
            throw new UnauthorizedAccessException("Keine gültige Unternehmenskontext gefunden");
        }

        return lifecycleService.getMyOrders(role, companyId, pageable);
    }

    /**
     * Retrieves orders for the authenticated user's company filtered by role and
     * status.
     */
    public Page<OrderResponse> getMyOrders(OrderLifecycleService.MyOrderRole role, String status,
            Authentication authentication, Pageable pageable) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        if (companyId == null) {
            throw new UnauthorizedAccessException("Keine gültige Unternehmenskontext gefunden");
        }

        return lifecycleService.getMyOrders(role, companyId, status, pageable);
    }

    /**
     * Retrieves completed orders for the authenticated user's company filtered by
     * role.
     */
    public Page<OrderResponse> getMyCompletedOrders(OrderLifecycleService.MyOrderRole role,
            Authentication authentication, Pageable pageable) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        if (companyId == null) {
            throw new UnauthorizedAccessException("Keine gültige Unternehmenskontext gefunden");
        }

        return lifecycleService.getMyCompletedOrders(role, companyId, pageable);
    }

    /**
     * Cancels an order.
     */
    public OrderResponse cancelOrder(UUID orderId) {
        return lifecycleService.cancelOrder(orderId);
    }

    /**
     * Updates an existing order with new data.
     */
    public OrderResponse updateOrder(UpdateOrderCommand command, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return lifecycleService.updateOrder(command, companyId);
    }

    // ===== Order Search Operations =====

    /**
     * Finds available published orders that service providers can view and apply
     * for.
     */
    public Page<OrderResponse> findAvailableOrders(
            BigDecimal companyLat, BigDecimal companyLng, Integer maxDistanceKm,
            OrderCategory primaryCategory, Urgency urgency,
            BigDecimal minBudget, BigDecimal maxBudget, String specialization,
            Pageable pageable, Authentication authentication) {

        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return searchService.findAvailableOrders(
                companyLat, companyLng, maxDistanceKm,
                primaryCategory, urgency,
                minBudget, maxBudget, specialization,
                pageable, companyId);
    }

    /**
     * Gets detailed information about a specific published order for service
     * providers.
     */
    public OrderResponse getAvailableOrderDetails(UUID orderId, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return searchService.getAvailableOrderDetails(orderId, companyId);
    }

    /**
     * Gets all order categories that currently have published orders.
     */
    public OrderCategory[] getAvailableOrderCategories() {
        return searchService.getAvailableOrderCategories();
    }

    /**
     * Finds orders near the authenticated company's registered location.
     */
    public Page<OrderResponse> findNearbyOrdersForCompany(Integer radiusKm, Pageable pageable,
            Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return searchService.findNearbyOrdersForCompany(radiusKm, pageable, companyId);
    }

    // ===== Order Matching Operations =====

    /**
     * Provider accepts an order, marking the corresponding OrderMatch as
     * interested.
     */
    public void acceptByProvider(UUID orderId, UUID providerId) {
        matchingService.acceptByProvider(orderId, providerId);
    }

    /**
     * Client confirms a provider for the order.
     */
    public void confirmProviderSelection(UUID orderId, UUID providerId, UUID clientCompanyId) {
        matchingService.confirmProviderSelection(orderId, providerId, clientCompanyId);
    }

    /**
     * Retrieves providers that have expressed interest in the specified order.
     * Only the order's owning company can access this information.
     */
    public java.util.List<com.indusync.indusync_backend.order.domain.OrderMatch> getInterestedProviders(
            java.util.UUID orderId,
            org.springframework.security.core.Authentication authentication) {
        java.util.UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);

        return matchingService.getInterestedProviders(orderId, companyId);
    }

    // ===== Document Management Operations =====

    /**
     * Uploads a document for an order.
     */
    public OrderDocumentResponse uploadOrderDocument(
            UUID orderId,
            MultipartFile file,
            String documentType,
            String description,
            Authentication authentication) {

        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);
        authorizationService.verifyDocumentUploadAccess(orderId, companyId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        return documentService.uploadDocument(order, file, documentType, description);
    }

    /**
     * Gets all documents for an order.
     */
    public List<OrderDocumentResponse> getOrderDocuments(UUID orderId, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);
        authorizationService.verifyDocumentAccess(orderId, companyId);

        return documentService.getOrderDocuments(orderId);
    }

    /**
     * Downloads an order document.
     */
    public OrderDocumentDownloadResponse downloadOrderDocument(
            UUID orderId,
            UUID documentId,
            Authentication authentication) {

        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);
        authorizationService.verifyDocumentAccess(orderId, companyId);

        return documentService.downloadDocument(orderId, documentId);
    }

    /**
     * Deletes an order document.
     */
    public void deleteOrderDocument(UUID orderId, UUID documentId, Authentication authentication) {
        UUID companyId = authorizationService.getCurrentCompanyId(authentication);
        authorizationService.requireValidCompanyContext(companyId);
        authorizationService.verifyDocumentDeletionAccess(orderId, companyId);

        documentService.deleteDocument(orderId, documentId);
    }

    // ===== Deadline Extension Operations =====

    /**
     * Provider or client proposes a new deadline.
     */
    public void proposeDeadlineExtension(UUID orderId, LocalDateTime proposedDeadline, UUID requesterCompanyId) {
        deadlineService.proposeDeadlineExtension(orderId, proposedDeadline, requesterCompanyId);
    }

    /**
     * Counter-party confirms the pending deadline change.
     */
    public void confirmDeadlineExtension(UUID orderId, UUID confirmerCompanyId) {
        deadlineService.confirmDeadlineExtension(orderId, confirmerCompanyId);
    }

    /**
     * Counter-party rejects the pending deadline change.
     */
    public void rejectDeadlineExtension(UUID orderId, UUID rejecterCompanyId, String rejectionReason) {
        deadlineService.rejectDeadlineExtension(orderId, rejecterCompanyId, rejectionReason);
    }

    /**
     * Cancels a pending deadline extension proposal by the requester.
     */
    public void cancelDeadlineExtensionProposal(UUID orderId, UUID requesterCompanyId) {
        deadlineService.cancelDeadlineExtensionProposal(orderId, requesterCompanyId);
    }

    public long getInterestedProviderCount(UUID orderId, UUID clientCompanyId) {
        return matchingService.getInterestedProviderCount(orderId, clientCompanyId);
    }

    // ===== Legacy Support Methods =====

    /**
     * Legacy enum for backward compatibility.
     * 
     * @deprecated Use OrderLifecycleService.MyOrderRole instead
     */
    @Deprecated
    public enum MyOrderRole {
        CLIENT, PROVIDER
    }

    // Exception classes for backward compatibility
    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedAccessException extends RuntimeException {
        public UnauthorizedAccessException(String message) {
            super(message);
        }
    }

    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }

    public static class CompanyNotFoundException extends RuntimeException {
        public CompanyNotFoundException(String message) {
            super(message);
        }
    }
}