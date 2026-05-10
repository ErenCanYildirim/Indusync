package com.indusync.indusync_backend.company.api.dto;

import com.indusync.indusync_backend.company.domain.AccessContext;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * REST API request DTO for Terms and Conditions document access tracking.
 * <p>
 * This DTO represents the request payload for tracking access to T&C documents
 * for audit and compliance purposes. It captures the context of access and
 * related business entities.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TermsConditionsAccessRequest {

    @NotNull(message = "Dokument-ID ist erforderlich")
    private UUID documentId;

    @NotNull(message = "Zugriffs-Kontext ist erforderlich")
    private AccessContext accessContext;

    // Optional: Order ID when accessing from order-related pages
    private UUID orderId;

    // Optional: Company ID when accessing from company profile
    private UUID companyId;

    // Client information for audit trail
    private String ipAddress;
    private String userAgent;

    // Additional context information
    private String referrerUrl;
    private String accessReason;

    /**
     * Validates that the request has the minimum required fields.
     *
     * @return true if basic validation passes
     */
    public boolean isValid() {
        return documentId != null && accessContext != null;
    }

    /**
     * Checks if this is an order-related access.
     *
     * @return true if access is from order context
     */
    public boolean isOrderAccess() {
        return accessContext == AccessContext.ORDER_DETAIL ||
                accessContext == AccessContext.EXPRESSION_OF_INTEREST;
    }

    /**
     * Checks if this is a company profile access.
     *
     * @return true if access is from company profile
     */
    public boolean isCompanyProfileAccess() {
        return accessContext == AccessContext.COMPANY_PROFILE;
    }

    /**
     * Validates that order ID is provided for order-related access.
     *
     * @return true if order context validation passes
     */
    public boolean hasValidOrderContext() {
        if (isOrderAccess()) {
            return orderId != null;
        }
        return true; // Not order access, so no order ID required
    }

    /**
     * Validates that company ID is provided for company profile access.
     *
     * @return true if company context validation passes
     */
    public boolean hasValidCompanyContext() {
        if (isCompanyProfileAccess()) {
            return companyId != null;
        }
        return true; // Not company profile access, so no company ID required
    }

    /**
     * Performs comprehensive validation of the access request.
     *
     * @return true if all validations pass
     */
    public boolean isCompletelyValid() {
        return isValid() &&
                hasValidOrderContext() &&
                hasValidCompanyContext();
    }

    /**
     * Gets a validation error message if the request is invalid.
     *
     * @return error message or null if valid
     */
    public String getValidationError() {
        if (documentId == null) {
            return "Dokument-ID ist erforderlich";
        }
        if (accessContext == null) {
            return "Zugriffs-Kontext ist erforderlich";
        }
        if (isOrderAccess() && orderId == null) {
            return "Auftrags-ID ist für auftragsbezogenen Zugriff erforderlich";
        }
        if (isCompanyProfileAccess() && companyId == null) {
            return "Unternehmen-ID ist für Unternehmensprofil-Zugriff erforderlich";
        }
        return null;
    }

    /**
     * Gets a human-readable description of the access context.
     *
     * @return context description
     */
    public String getAccessContextDescription() {
        if (accessContext == null) {
            return "Unbekannt";
        }

        return switch (accessContext) {
            case ORDER_DETAIL -> "Auftragsdetails";
            case COMPANY_PROFILE -> "Unternehmensprofil";
            case EXPRESSION_OF_INTEREST -> "Interessensbekundung";
            default -> accessContext.toString();
        };
    }

    /**
     * Checks if client information is available for audit trail.
     *
     * @return true if client info is present
     */
    public boolean hasClientInfo() {
        return ipAddress != null && !ipAddress.trim().isEmpty();
    }

    /**
     * Gets a sanitized user agent string for logging.
     *
     * @return sanitized user agent or null
     */
    public String getSanitizedUserAgent() {
        if (userAgent == null) {
            return null;
        }
        // Limit length to prevent log injection and excessive storage
        return userAgent.length() > 500 ? userAgent.substring(0, 500) : userAgent;
    }

    /**
     * Gets a sanitized IP address for logging.
     *
     * @return sanitized IP address or null
     */
    public String getSanitizedIpAddress() {
        if (ipAddress == null) {
            return null;
        }
        // Basic IP address validation and sanitization
        return ipAddress.replaceAll("[^0-9a-fA-F:.\\[\\]]", "");
    }

    /**
     * Creates a basic access request for order detail viewing.
     *
     * @param documentId the document ID
     * @param orderId    the order ID
     * @return access request for order detail context
     */
    public static TermsConditionsAccessRequest forOrderDetail(UUID documentId, UUID orderId) {
        return TermsConditionsAccessRequest.builder()
                .documentId(documentId)
                .accessContext(AccessContext.ORDER_DETAIL)
                .orderId(orderId)
                .build();
    }

    /**
     * Creates a basic access request for company profile viewing.
     *
     * @param documentId the document ID
     * @param companyId  the company ID
     * @return access request for company profile context
     */
    public static TermsConditionsAccessRequest forCompanyProfile(UUID documentId, UUID companyId) {
        return TermsConditionsAccessRequest.builder()
                .documentId(documentId)
                .accessContext(AccessContext.COMPANY_PROFILE)
                .companyId(companyId)
                .build();
    }

    /**
     * Creates a basic access request for expression of interest.
     *
     * @param documentId the document ID
     * @param orderId    the order ID
     * @return access request for expression of interest context
     */
    public static TermsConditionsAccessRequest forExpressionOfInterest(UUID documentId, UUID orderId) {
        return TermsConditionsAccessRequest.builder()
                .documentId(documentId)
                .accessContext(AccessContext.EXPRESSION_OF_INTEREST)
                .orderId(orderId)
                .build();
    }
}