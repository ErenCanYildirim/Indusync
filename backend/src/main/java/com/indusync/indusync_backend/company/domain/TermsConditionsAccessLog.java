package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Objects;
import java.util.UUID;

/**
 * Terms & Conditions access log entity for audit trail of document access.
 * <p>
 * This entity tracks:
 * - Who accessed T&C documents
 * - When they were accessed
 * - From which context (order detail, company profile, etc.)
 * - Associated order information when applicable
 * - Request metadata for security and analytics
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Entity
@Table(name = "terms_conditions_access_log", schema = "company", indexes = {
        @Index(name = "idx_terms_conditions_access_log_document", columnList = "document_id"),
        @Index(name = "idx_terms_conditions_access_log_user", columnList = "accessed_by"),
        @Index(name = "idx_terms_conditions_access_log_created", columnList = "created_at"),
        @Index(name = "idx_terms_conditions_access_log_context", columnList = "access_context"),
        @Index(name = "idx_terms_conditions_access_log_order", columnList = "order_id")
})
public class TermsConditionsAccessLog extends AuditableEntity {

    /**
     * Reference to the T&C document that was accessed.
     */
    @NotNull(message = "Document ID is required")
    @Column(name = "document_id", nullable = false, columnDefinition = "uuid")
    private UUID documentId;

    /**
     * Reference to the user who accessed the document.
     */
    @NotNull(message = "Accessed by user ID is required")
    @Column(name = "accessed_by", nullable = false, columnDefinition = "uuid")
    private UUID accessedBy;

    /**
     * Context where the document was accessed (ORDER_DETAIL, COMPANY_PROFILE,
     * EXPRESSION_OF_INTEREST).
     */
    @NotNull(message = "Access context is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "access_context", nullable = false, length = 50)
    private AccessContext accessContext;

    /**
     * Optional reference to the order when accessed from order-related contexts.
     * Required for ORDER_DETAIL and EXPRESSION_OF_INTEREST contexts.
     */
    @Column(name = "order_id", columnDefinition = "uuid")
    private UUID orderId;

    /**
     * IP address of the accessing user (IPv4 or IPv6).
     */
    @Size(max = 45, message = "IP address cannot exceed 45 characters")
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User agent string of the accessing client.
     */
    @Size(max = 500, message = "User agent cannot exceed 500 characters")
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Lazy-loaded reference to the accessed document.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", insertable = false, updatable = false)
    private TermsConditionsDocument document;

    /**
     * Default constructor for JPA.
     */
    public TermsConditionsAccessLog() {
        super();
    }

    /**
     * Constructor for creating a new access log entry.
     *
     * @param documentId    the ID of the accessed document
     * @param accessedBy    the ID of the user who accessed the document
     * @param accessContext the context where the document was accessed
     */
    public TermsConditionsAccessLog(UUID documentId, UUID accessedBy, AccessContext accessContext) {
        super();
        setDocumentId(documentId);
        setAccessedBy(accessedBy);
        setAccessContext(accessContext);
    }

    /**
     * Constructor for creating a new access log entry with order context.
     *
     * @param documentId    the ID of the accessed document
     * @param accessedBy    the ID of the user who accessed the document
     * @param accessContext the context where the document was accessed
     * @param orderId       the ID of the associated order (for order-related
     *                      contexts)
     */
    public TermsConditionsAccessLog(UUID documentId, UUID accessedBy, AccessContext accessContext, UUID orderId) {
        this(documentId, accessedBy, accessContext);
        setOrderId(orderId);
    }

    // Business Methods

    /**
     * Sets the document ID with validation.
     *
     * @param documentId the document ID
     * @throws IllegalArgumentException if documentId is null
     */
    public void setDocumentId(UUID documentId) {
        if (documentId == null) {
            throw new IllegalArgumentException("Document ID cannot be null");
        }
        this.documentId = documentId;
    }

    /**
     * Sets the accessing user ID with validation.
     *
     * @param accessedBy the user ID
     * @throws IllegalArgumentException if accessedBy is null
     */
    public void setAccessedBy(UUID accessedBy) {
        if (accessedBy == null) {
            throw new IllegalArgumentException("Accessed by user ID cannot be null");
        }
        this.accessedBy = accessedBy;
    }

    /**
     * Sets the access context with validation.
     *
     * @param accessContext the access context
     * @throws IllegalArgumentException if accessContext is null
     */
    public void setAccessContext(AccessContext accessContext) {
        if (accessContext == null) {
            throw new IllegalArgumentException("Access context cannot be null");
        }
        this.accessContext = accessContext;
    }

    /**
     * Sets the order ID with validation for order-related contexts.
     *
     * @param orderId the order ID
     * @throws IllegalArgumentException if orderId is null but required for the
     *                                  access context
     */
    public void setOrderId(UUID orderId) {
        // Validate that order ID is provided for order-related contexts
        if (this.accessContext != null && this.accessContext.requiresOrderId() && orderId == null) {
            throw new IllegalArgumentException(
                    String.format("Order ID is required for access context: %s", this.accessContext));
        }
        this.orderId = orderId;
    }

    /**
     * Sets the IP address with basic validation.
     *
     * @param ipAddress the IP address
     */
    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress != null ? ipAddress.trim() : null;
    }

    /**
     * Sets the user agent with basic validation.
     *
     * @param userAgent the user agent string
     */
    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent != null ? userAgent.trim() : null;
    }

    /**
     * Checks if this access log entry is for an order-related context.
     *
     * @return true if the access context is order-related
     */
    public boolean isOrderRelated() {
        return accessContext != null && accessContext.isOrderRelated();
    }

    /**
     * Validates that the access log entry has all required fields for its context.
     *
     * @throws IllegalStateException if validation fails
     */
    public void validate() {
        if (documentId == null) {
            throw new IllegalStateException("Document ID is required");
        }
        if (accessedBy == null) {
            throw new IllegalStateException("Accessed by user ID is required");
        }
        if (accessContext == null) {
            throw new IllegalStateException("Access context is required");
        }
        if (accessContext.requiresOrderId() && orderId == null) {
            throw new IllegalStateException(
                    String.format("Order ID is required for access context: %s", accessContext));
        }
    }

    /**
     * Creates a builder for constructing TermsConditionsAccessLog instances.
     *
     * @return a new builder instance
     */
    public static Builder builder() {
        return new Builder();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        TermsConditionsAccessLog that = (TermsConditionsAccessLog) o;
        return Objects.equals(getId(), that.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    @Override
    public String toString() {
        return String.format("TermsConditionsAccessLog{id=%s, documentId=%s, accessedBy=%s, context=%s, orderId=%s}",
                getId(), documentId, accessedBy, accessContext, orderId);
    }

    /**
     * Builder class for creating TermsConditionsAccessLog instances.
     */
    public static class Builder {
        private UUID documentId;
        private UUID accessedBy;
        private AccessContext accessContext;
        private UUID orderId;
        private String ipAddress;
        private String userAgent;

        private Builder() {
        }

        public Builder documentId(UUID documentId) {
            this.documentId = documentId;
            return this;
        }

        public Builder accessedBy(UUID accessedBy) {
            this.accessedBy = accessedBy;
            return this;
        }

        public Builder accessContext(AccessContext accessContext) {
            this.accessContext = accessContext;
            return this;
        }

        public Builder orderId(UUID orderId) {
            this.orderId = orderId;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        /**
         * Builds the TermsConditionsAccessLog instance with validation.
         *
         * @return the constructed access log entry
         * @throws IllegalArgumentException if required fields are missing or invalid
         */
        public TermsConditionsAccessLog build() {
            TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();
            accessLog.setDocumentId(documentId);
            accessLog.setAccessedBy(accessedBy);
            accessLog.setAccessContext(accessContext);
            accessLog.setOrderId(orderId);
            accessLog.setIpAddress(ipAddress);
            accessLog.setUserAgent(userAgent);

            // Validate the constructed object
            accessLog.validate();

            return accessLog;
        }
    }
}