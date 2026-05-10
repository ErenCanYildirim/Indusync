package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service responsible for order validation logic.
 * Handles all validation rules for order creation, updates, and state transitions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderValidationService {

    /**
     * Validates the create order command.
     */
    public void validateCreateOrderCommand(CreateOrderCommand command, UUID companyId) {
        if (command == null) {
            throw new ValidationException("Befehl zum Erstellen des Auftrags darf nicht null sein");
        }
        if (companyId == null) {
            throw new ValidationException("Unternehmens-ID darf nicht null sein");
        }

        // Basic presence checks
        validateRequiredFields(command);
        validateContactInformation(command);
        validateAddress(command);
        validateGeographicCoordinates(command);
        validateSearchRadius(command);
        validateBudget(command.budget());
        validateTimeline(command.startDate(), command.deadline());
    }

    /**
     * Validates the update order command.
     */
    public void validateUpdateOrderCommand(UpdateOrderCommand command) {
        if (command == null) {
            throw new ValidationException("Update-Befehl darf nicht null sein");
        }
        if (command.orderId() == null) {
            throw new ValidationException("Auftrags-ID ist erforderlich");
        }

        // Validate budget if present
        if (command.budget() != null) {
            validateBudget(command.budget());
        }

        // Validate timeline if present
        if (command.deadline() != null || command.startDate() != null) {
            validateTimeline(command.startDate(), command.deadline());
        }

        // Validate coordinates if provided
        validateCoordinates(command.latitude(), command.longitude());
    }

    /**
     * Validates an order before publishing.
     */
    public void validateOrderForPublishing(Order order) {
        // Ensure all required fields are present
        if (order.getTitle() == null || order.getTitle().trim().isEmpty()) {
            throw new ValidationException("Auftrag benötigt einen Titel für die Veröffentlichung");
        }

        if (order.getDescription() == null || order.getDescription().trim().isEmpty()) {
            throw new ValidationException("Auftrag benötigt eine Beschreibung für die Veröffentlichung");
        }

        if (order.getServiceAddress() == null ||
                order.getServiceAddress().getStreet() == null ||
                order.getServiceAddress().getPostalCode() == null ||
                order.getServiceAddress().getCity() == null) {
            throw new ValidationException(
                    "Auftrag muss eine vollständige Service-Adresse haben, um veröffentlicht zu werden.");
        }

        if (order.getLocation() == null ||
                order.getLocation().getLatitude() == null ||
                order.getLocation().getLongitude() == null) {
            throw new ValidationException("Auftrag muss geografische Koordinaten haben, um veröffentlicht zu werden.");
        }

        if (order.getSearchRadiusKm() == null || order.getSearchRadiusKm() <= 0) {
            throw new ValidationException("Auftrag benötigt einen gültigen Suchradius für die Veröffentlichung");
        }

        if (order.getContactPerson() == null || order.getContactEmail() == null) {
            throw new ValidationException(
                    "Auftrag muss eine Kontaktperson mit E-Mail haben, um veröffentlicht zu werden.");
        }

        log.debug("Order validation successful for publishing: {}", order.getId());
    }

    /**
     * Validates that an order can be published.
     */
    public void validateOrderCanBePublished(Order order) {
        if (!order.getStatus().canBePublished()) {
            throw new ValidationException(
                    String.format("Auftrag kann nicht veröffentlicht werden. Aktueller Status: %s",
                            order.getStatusDisplayName()));
        }
    }

    /**
     * Validates that an order can be cancelled.
     */
    public void validateOrderCanBeCancelled(Order order) {
        if (!order.getStatus().canBeCancelled()) {
            throw new ValidationException(
                    String.format("Auftrag kann nicht storniert werden. Aktueller Status: %s",
                            order.getStatusDisplayName()));
        }
    }

    /**
     * Validates that an order can be updated.
     */
    public void validateOrderCanBeUpdated(Order order) {
        if (order.getStatus() != OrderStatus.DRAFT) {
            throw new ValidationException(
                    String.format("Nur Entwürfe können bearbeitet werden. Aktueller Status: %s",
                            order.getStatusDisplayName()));
        }
    }

    /**
     * Validates that an order can accept provider.
     */
    public void validateOrderCanAcceptProvider(Order order) {
        if (order.getStatus() != OrderStatus.PUBLISHED && order.getStatus() != OrderStatus.MATCHED) {
            throw new ValidationException("Auftrag kann keinen Anbieter in Status " + order.getStatus() + " akzeptieren");
        }
    }

    /**
     * Validates that an order can select provider.
     */
    public void validateOrderCanSelectProvider(Order order) {
        if (order.getStatus() != OrderStatus.PUBLISHED && order.getStatus() != OrderStatus.MATCHED) {
            throw new ValidationException("Auftrag kann keinen Anbieter in Status " + order.getStatus() + " auswählen");
        }
    }

    /**
     * Validates that deadline extension can be proposed.
     */
    public void validateDeadlineExtensionProposal(Order order, LocalDateTime proposedDeadline) {
        // Only active orders can be extended
        if (order.getStatus() != OrderStatus.IN_PROGRESS) {
            throw new ValidationException("Deadline kann nur verlängert werden, wenn der Auftrag IN_PROGRESS ist");
        }

        // Validate date window
        if (proposedDeadline.isBefore(LocalDateTime.now())) {
            throw new ValidationException("Vorgeschlagene Deadline muss in der Zukunft liegen");
        }
        if (proposedDeadline.isAfter(LocalDateTime.now().plusDays(90))) {
            throw new ValidationException("Vorgeschlagene Deadline darf nicht mehr als 90 Tage in der Zukunft liegen");
        }
    }

    /**
     * Validates that an update command has at least one field set.
     */
    public void validateUpdateCommandHasFields(UpdateOrderCommand command) {
        if (!command.hasAnyFieldSet()) {
            throw new ValidationException("Mindestens ein Feld muss für die Aktualisierung angegeben werden");
        }
    }

    // Private validation helper methods

    private void validateRequiredFields(CreateOrderCommand command) {
        if (command.title() == null || command.title().trim().isEmpty()) {
            throw new ValidationException("Auftragstitel ist erforderlich");
        }
        if (command.description() == null || command.description().trim().isEmpty()) {
            throw new ValidationException("Auftragsbeschreibung ist erforderlich");
        }
    }

    private void validateContactInformation(CreateOrderCommand command) {
        if (command.contactName() == null || command.contactName().trim().isEmpty()) {
            throw new ValidationException("Kontaktname ist erforderlich");
        }
        if (command.contactEmail() == null || command.contactEmail().trim().isEmpty()) {
            throw new ValidationException("Kontakt-E-Mail ist erforderlich");
        }
        
        // Basic email validation
        if (!isValidEmail(command.contactEmail())) {
            throw new ValidationException("Ungültige E-Mail-Adresse");
        }
    }

    private void validateAddress(CreateOrderCommand command) {
        if (command.street() == null || command.street().trim().isEmpty()) {
            throw new ValidationException("Straße ist erforderlich");
        }
        if (command.postalCode() == null || command.postalCode().trim().isEmpty()) {
            throw new ValidationException("Postleitzahl ist erforderlich");
        }
        if (command.city() == null || command.city().trim().isEmpty()) {
            throw new ValidationException("Stadt ist erforderlich");
        }
    }

    private void validateGeographicCoordinates(CreateOrderCommand command) {
        if (command.latitude() == null || command.longitude() == null) {
            throw new ValidationException("Geografische Koordinaten sind erforderlich");
        }
        
        validateCoordinates(command.latitude(), command.longitude());
    }

    private void validateCoordinates(Double latitude, Double longitude) {
        if (latitude != null && (latitude < -90.0 || latitude > 90.0)) {
            throw new ValidationException("Breitengrad muss zwischen -90 und 90 liegen");
        }
        if (longitude != null && (longitude < -180.0 || longitude > 180.0)) {
            throw new ValidationException("Längengrad muss zwischen -180 und 180 liegen");
        }
    }

    private void validateSearchRadius(CreateOrderCommand command) {
        if (command.searchRadiusKm() == null || command.searchRadiusKm() <= 0) {
            throw new ValidationException("Gültiger Suchradius ist erforderlich");
        }
        if (command.searchRadiusKm() > 1000) {
            throw new ValidationException("Suchradius darf nicht größer als 1000 km sein");
        }
    }

    private void validateBudget(BigDecimal budget) {
        if (budget != null && budget.compareTo(BigDecimal.ZERO) < 0) {
            throw new ValidationException("Budget darf nicht negativ sein");
        }
        if (budget != null && budget.compareTo(new BigDecimal("1000000")) > 0) {
            throw new ValidationException("Budget darf nicht größer als 1.000.000 sein");
        }
    }

    private void validateTimeline(LocalDateTime startDate, LocalDateTime deadline) {
        if (deadline != null && deadline.isBefore(LocalDateTime.now())) {
            throw new ValidationException("Deadline muss in der Zukunft liegen");
        }
        if (startDate != null && startDate.isBefore(LocalDateTime.now().minusDays(1))) {
            throw new ValidationException("Startdatum darf nicht in der Vergangenheit liegen");
        }
        if (startDate != null && deadline != null && startDate.isAfter(deadline)) {
            throw new ValidationException("Startdatum darf nicht nach der Deadline liegen");
        }
    }

    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        
        // Basic email validation regex
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }

    // Exception class
    public static class ValidationException extends RuntimeException {
        public ValidationException(String message) {
            super(message);
        }
    }
}