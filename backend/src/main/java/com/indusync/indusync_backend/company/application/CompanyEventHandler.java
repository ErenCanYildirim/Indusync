package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.application.dto.CompanyRegistrationResponse;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.events.UserRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event handler for processing user registration events in the company module.
 * <p>
 * This handler listens for user registration events and creates default
 * companies
 * for business users, maintaining proper module boundaries by using
 * event-driven
 * communication instead of direct dependencies.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CompanyEventHandler {

    private final CompanyRegistrationService companyRegistrationService;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Handles user registration events and creates default companies for business
     * users.
     * <p>
     * This method processes UserRegisteredEvent for business account types and
     * creates a default company. It publishes events back to notify other modules
     * of company creation results.
     * </p>
     *
     * @param event the user registration event
     */
    @EventListener
    @Transactional
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Processing user registration event for: {} ({})",
                event.email(), event.accountType());

        // Only process business users
        if (event.accountType() != AccountType.BUSINESS) {
            log.debug("Skipping company creation for personal user: {}", event.email());
            return;
        }

        try {
            log.info("Creating default company for business user: {}", event.email());

            // Create default company using data from the event
            CompanyRegistrationResponse response = companyRegistrationService.createDefaultCompanyFromEvent(event);

            if (response.isSuccessful()) {
                log.info("Default company created successfully: {} (ID: {})",
                        response.getCompanyName(), response.getCompanyId());

                // Publish event to notify authentication module of successful company creation
                eventPublisher.publishEvent(new CompanyCreatedEvent(
                        response.getCompanyId(),
                        response.getCompanyName(),
                        event.userId()));
            } else {
                log.warn("Failed to create default company for user {}: {}",
                        event.email(), response.getMessage());
            }

        } catch (Exception e) {
            log.error("Error creating default company for user: {}", event.email(), e);
            // Don't re-throw to avoid failing the user registration process
        }
    }

    /**
     * Event published when a company is successfully created.
     * This allows other modules to react to company creation.
     */
    public record CompanyCreatedEvent(
            java.util.UUID companyId,
            String companyName,
            java.util.UUID userId) {
    }
}