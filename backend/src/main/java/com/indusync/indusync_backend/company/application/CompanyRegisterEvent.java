package com.indusync.indusync_backend.company.application;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Domain event fired when a new company is registered.
 * <p>
 * This event is used for cross-module communication to notify
 * other modules about company creation.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record CompanyRegisteredEvent(
    UUID companyId,
    UUID ownerId,
    String companyName,
    String businessRole,
    LocalDateTime registeredAt
) {

    /**
     * Creates a company registered event.
     *
     * @param companyId the company ID
     * @param ownerId the owner user ID
     * @param companyName the company name
     * @param businessRole the business role (CLIENT, PROVIDER, BOTH)
     */
    public CompanyRegisteredEvent(UUID companyId, UUID ownerId, String companyName, String businessRole) {
        this(companyId, ownerId, companyName, businessRole, LocalDateTime.now());
    }

    /**
     * Validates the event data.
     */
    public CompanyRegisteredEvent {
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID cannot be null");
        }
        if (ownerId == null) {
            throw new IllegalArgumentException("Owner ID cannot be null");
        }
        if (companyName == null || companyName.trim().isEmpty()) {
            throw new IllegalArgumentException("Company name cannot be null or empty");
        }
        if (businessRole == null || businessRole.trim().isEmpty()) {
            throw new IllegalArgumentException("Business role cannot be null or empty");
        }
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }

    /**
     * Gets the event type identifier.
     *
     * @return event type
     */
    public String getEventType() {
        return "CompanyRegistered";
    }
} 