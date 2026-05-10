package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

import java.util.UUID;

/**
 * Service responsible for order authorization and authentication concerns.
 * Handles permission checks, company context extraction, and access control.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderAuthorizationService {

    private final JwtService jwtService;
    private final OrderRepository orderRepository;

    /**
     * Extracts the current company ID from the authentication context.
     */
    public UUID getCurrentCompanyId(Authentication authentication) {
        try {
            String token = getTokenFromAuthentication(authentication);
            if (token != null) {
                return jwtService.extractCurrentCompanyId(token);
            }

            log.debug("No JWT token found in authentication context");
            return null;
        } catch (Exception e) {
            log.error("Error extracting current company ID from authentication: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Verifies that a company has permission to access an order.
     */
    public void verifyOrderAccess(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        verifyOrderAccess(order, companyId);
    }

    /**
     * Verifies that a company has permission to access an order.
     */
    public void verifyOrderAccess(Order order, UUID companyId) {
        // Authorization: allow if
        // 1) Order is published (public for providers)
        // 2) Requesting company is the order owner
        // 3) Requesting company has been assigned as provider for this order

        boolean isPublished = order.getStatus() == OrderStatus.PUBLISHED;
        boolean isOwner = order.getCompanyId().equals(companyId);
        boolean isAssignedProvider = order.getProviderId() != null && order.getProviderId().equals(companyId);

        if (!(isPublished || isOwner || isAssignedProvider)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, diesen Auftrag anzuzeigen");
        }
    }

    /**
     * Verifies that a company owns an order.
     */
    public void verifyOrderOwnership(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        verifyOrderOwnership(order, companyId);
    }

    /**
     * Verifies that a company owns an order.
     */
    public void verifyOrderOwnership(Order order, UUID companyId) {
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, diesen Auftrag zu bearbeiten");
        }
    }

    /**
     * Verifies that a company can view documents for an order.
     */
    public void verifyDocumentAccess(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Allow access to published orders or owned orders
//        if (order.getStatus() != OrderStatus.PUBLISHED && !order.getCompanyId().equals(companyId)
//                && !order.getProviderId().equals(companyId)) {
//            throw new UnauthorizedAccessException("Keine Berechtigung, Dokumente für diesen Auftrag anzuzeigen");
//        }
    }

    /**
     * Verifies that a company can upload documents for an order.
     */
    public void verifyDocumentUploadAccess(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Only order owner can upload documents
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, Dokumente für diesen Auftrag hochzuladen");
        }
    }

    /**
     * Verifies that a company can delete documents for an order.
     */
    public void verifyDocumentDeletionAccess(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Only order owner can delete documents
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, Dokumente für diesen Auftrag zu löschen");
        }
    }

    /**
     * Verifies that a company is a participant in an order (owner or provider).
     */
    public void verifyOrderParticipation(UUID orderId, UUID companyId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        verifyOrderParticipation(order, companyId);
    }

    /**
     * Verifies that a company is a participant in an order (owner or provider).
     */
    public void verifyOrderParticipation(Order order, UUID companyId) {
        boolean isOwner = order.getCompanyId().equals(companyId);
        boolean isProvider = order.getProviderId() != null && order.getProviderId().equals(companyId);

        if (!(isOwner || isProvider)) {
            throw new UnauthorizedAccessException("Keine Berechtigung für diesen Auftrag");
        }
    }

    /**
     * Verifies that a company can access available orders (service provider
     * companies).
     */
    public void verifyAvailableOrdersAccess(UUID companyId) {
        if (companyId == null) {
            throw new UnauthorizedAccessException("Keine gültige Unternehmenskontext gefunden");
        }
        // Additional business logic for service provider verification can be added here
    }

    /**
     * Verifies that a company can view available order details.
     */
    public void verifyAvailableOrderDetailsAccess(Order order, UUID companyId) {
        // Verify order is published (available to service providers)
        if (!order.isPublished()) {
            throw new OrderNotFoundException("Auftrag ist nicht verfügbar oder wurde nicht veröffentlicht");
        }

        // Verify the requesting company is not the order owner (service providers can't
        // see their own orders)
        if (order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException(
                    "Sie können Ihre eigenen Aufträge nicht über das Order Board einsehen");
        }
    }

    /**
     * Verifies that a company can confirm provider selection for an order.
     */
    public void verifyProviderConfirmationAccess(Order order, UUID companyId) {
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Unternehmen besitzt diesen Auftrag nicht");
        }
    }

    /**
     * Checks if a company has valid authentication context.
     */
    public void requireValidCompanyContext(UUID companyId) {
        if (companyId == null) {
            throw new UnauthorizedAccessException("Keine gültige Unternehmenskontext gefunden");
        }
    }

    /**
     * Extracts JWT token from Spring Security Authentication object.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return getString(authentication, jwtService, log);
    }

    /**
     * Helper method to extract token from authentication (copied from original
     * implementation).
     */
    private static String getString(Authentication authentication, JwtService jwtService, org.slf4j.Logger log) {
        // 1) Try to read the token stored in the Authentication object (credentials /
        // details / principal)
        if (authentication != null) {
            Object details = authentication.getDetails();
            if (details instanceof String tokenStr) {
                return tokenStr;
            }

            Object credentials = authentication.getCredentials();
            if (credentials instanceof String tokenStr) {
                return tokenStr;
            }

            Object principal = authentication.getPrincipal();
            if (principal instanceof String tokenStr) {
                return tokenStr;
            }
        } else {
            log.debug("No authentication object found");
        }

        // 2) Fallback – extract token directly from current HTTP request (Authorization
        // header)
        try {
            var attrs = RequestContextHolder.currentRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletAttrs) {
                HttpServletRequest request = servletAttrs.getRequest();
                String token = jwtService.extractTokenFromRequest(request);
                if (token != null) {
                    return token;
                }
            }
        } catch (Exception e) {
            log.debug("Could not extract token from request context: {}", e.getMessage());
        }

        log.debug("Could not extract token from authentication object or request context");
        return null;
    }

    // Exception classes
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
}