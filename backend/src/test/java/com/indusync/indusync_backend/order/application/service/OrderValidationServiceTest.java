package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Industry;
import com.indusync.indusync_backend.shared.domain.enums.PlacementType;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.ContactPerson;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Unit tests for OrderValidationService.
 * Tests all validation rules for order creation, updates, and state transitions.
 */
@ExtendWith(MockitoExtension.class)
class OrderValidationServiceTest {

    private OrderValidationService validationService;

    private static final UUID COMPANY_ID = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        validationService = new OrderValidationService();
    }

    // ===== Create Order Validation Tests =====

    @Test
    @DisplayName("Should validate valid create order command")
    void validateCreateOrderCommand_Valid() {
        // Given
        CreateOrderCommand command = createValidCreateOrderCommand();

        // When & Then
        assertThatCode(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when create command is null")
    void validateCreateOrderCommand_NullCommand() {
        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(null, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Befehl zum Erstellen des Auftrags darf nicht null sein");
    }

    @Test
    @DisplayName("Should throw exception when company ID is null")
    void validateCreateOrderCommand_NullCompanyId() {
        // Given
        CreateOrderCommand command = createValidCreateOrderCommand();

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, null))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Unternehmens-ID darf nicht null sein");
    }

    @Test
    @DisplayName("Should throw exception when title is missing")
    void validateCreateOrderCommand_MissingTitle() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "", // Empty title
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Auftragstitel ist erforderlich");
    }

    @Test
    @DisplayName("Should throw exception when description is missing")
    void validateCreateOrderCommand_MissingDescription() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "", // Empty description
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Auftragsbeschreibung ist erforderlich");
    }

    @Test
    @DisplayName("Should throw exception when email is invalid")
    void validateCreateOrderCommand_InvalidEmail() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "invalid-email", // Invalid email
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Ungültige E-Mail-Adresse");
    }

    @Test
    @DisplayName("Should throw exception when coordinates are invalid")
    void validateCreateOrderCommand_InvalidCoordinates() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                95.0, // Invalid latitude
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Breitengrad muss zwischen -90 und 90 liegen");
    }

    @Test
    @DisplayName("Should throw exception when search radius is invalid")
    void validateCreateOrderCommand_InvalidSearchRadius() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                1500, // Too large
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Suchradius darf nicht größer als 1000 km sein");
    }

    @Test
    @DisplayName("Should throw exception when budget is negative")
    void validateCreateOrderCommand_NegativeBudget() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().plusDays(7),
                null,
                BigDecimal.valueOf(-100) // Negative budget
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Budget darf nicht negativ sein");
    }

    @Test
    @DisplayName("Should throw exception when deadline is in the past")
    void validateCreateOrderCommand_PastDeadline() {
        // Given
        CreateOrderCommand command = new CreateOrderCommand(
                "Valid title",
                "Valid description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main St",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                com.indusync.indusync_backend.shared.domain.enums.OrderCategory.OTHER,
                null,
                Set.of(com.indusync.indusync_backend.shared.domain.enums.Industry.OTHER),
                Set.of(com.indusync.indusync_backend.shared.domain.enums.PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                com.indusync.indusync_backend.shared.domain.enums.Urgency.MEDIUM,
                null,
                LocalDateTime.now().minusDays(1), // Past deadline
                null,
                BigDecimal.valueOf(1000)
        );

        // When & Then
        assertThatThrownBy(() -> validationService.validateCreateOrderCommand(command, COMPANY_ID))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Deadline muss in der Zukunft liegen");
    }

    // ===== Update Order Validation Tests =====

    @Test
    @DisplayName("Should validate valid update order command")
    void validateUpdateOrderCommand_Valid() {
        // Given
        UpdateOrderCommand command = UpdateOrderCommand.builder()
                .orderId(UUID.randomUUID())
                .title("Updated title")
                .budget(BigDecimal.valueOf(2000))
                .deadline(LocalDateTime.now().plusDays(10))
                .build();

        // When & Then
        assertThatCode(() -> validationService.validateUpdateOrderCommand(command))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when update command is null")
    void validateUpdateOrderCommand_NullCommand() {
        // When & Then
        assertThatThrownBy(() -> validationService.validateUpdateOrderCommand(null))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Update-Befehl darf nicht null sein");
    }

    @Test
    @DisplayName("Should throw exception when order ID is missing")
    void validateUpdateOrderCommand_MissingOrderId() {
        // Given
        UpdateOrderCommand command = UpdateOrderCommand.builder()
                .title("Updated title")
                .build();

        // When & Then
        assertThatThrownBy(() -> validationService.validateUpdateOrderCommand(command))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Auftrags-ID ist erforderlich");
    }

    // ===== Order State Validation Tests =====

    @Test
    @DisplayName("Should validate order can be published")
    void validateOrderForPublishing_Valid() {
        // Given
        Order order = createValidOrder();

        // When & Then
        assertThatCode(() -> validationService.validateOrderForPublishing(order))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when order missing title for publishing")
    void validateOrderForPublishing_MissingTitle() {
        // Given
        Order order = createValidOrder();
        order.setTitle(null);

        // When & Then
        assertThatThrownBy(() -> validationService.validateOrderForPublishing(order))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Auftrag benötigt einen Titel für die Veröffentlichung");
    }

    @Test
    @DisplayName("Should validate order can be published based on status")
    void validateOrderCanBePublished_Valid() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.DRAFT);

        // When & Then
        assertThatCode(() -> validationService.validateOrderCanBePublished(order))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when order cannot be published due to status")
    void validateOrderCanBePublished_InvalidStatus() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.COMPLETED);

        // When & Then
        assertThatThrownBy(() -> validationService.validateOrderCanBePublished(order))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessageContaining("kann nicht veröffentlicht werden");
    }

    @Test
    @DisplayName("Should validate order can be updated")
    void validateOrderCanBeUpdated_Valid() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.DRAFT);

        // When & Then
        assertThatCode(() -> validationService.validateOrderCanBeUpdated(order))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when order cannot be updated due to status")
    void validateOrderCanBeUpdated_InvalidStatus() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.PUBLISHED);

        // When & Then
        assertThatThrownBy(() -> validationService.validateOrderCanBeUpdated(order))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Nur Entwürfe können bearbeitet werden. Aktueller Status: Veröffentlicht");
    }

    @Test
    @DisplayName("Should validate order can accept provider")
    void validateOrderCanAcceptProvider_Valid() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.PUBLISHED);

        // When & Then
        assertThatCode(() -> validationService.validateOrderCanAcceptProvider(order))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when order cannot accept provider due to status")
    void validateOrderCanAcceptProvider_InvalidStatus() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.DRAFT);

        // When & Then
        assertThatThrownBy(() -> validationService.validateOrderCanAcceptProvider(order))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Auftrag kann keinen Anbieter in Status Entwurf akzeptieren");
    }

    // ===== Deadline Extension Validation Tests =====

    @Test
    @DisplayName("Should validate deadline extension proposal")
    void validateDeadlineExtensionProposal_Valid() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.IN_PROGRESS);
        LocalDateTime proposedDeadline = LocalDateTime.now().plusDays(14);

        // When & Then
        assertThatCode(() -> validationService.validateDeadlineExtensionProposal(order, proposedDeadline))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when order not in progress for deadline extension")
    void validateDeadlineExtensionProposal_InvalidStatus() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.DRAFT);
        LocalDateTime proposedDeadline = LocalDateTime.now().plusDays(14);

        // When & Then
        assertThatThrownBy(() -> validationService.validateDeadlineExtensionProposal(order, proposedDeadline))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Deadline kann nur verlängert werden, wenn der Auftrag IN_PROGRESS ist");
    }

    @Test
    @DisplayName("Should throw exception when proposed deadline is in the past")
    void validateDeadlineExtensionProposal_PastDeadline() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.IN_PROGRESS);
        LocalDateTime proposedDeadline = LocalDateTime.now().minusDays(1);

        // When & Then
        assertThatThrownBy(() -> validationService.validateDeadlineExtensionProposal(order, proposedDeadline))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Vorgeschlagene Deadline muss in der Zukunft liegen");
    }

    @Test
    @DisplayName("Should throw exception when proposed deadline is too far in future")
    void validateDeadlineExtensionProposal_TooFarInFuture() {
        // Given
        Order order = createValidOrder();
        order.setStatus(OrderStatus.IN_PROGRESS);
        LocalDateTime proposedDeadline = LocalDateTime.now().plusDays(100);

        // When & Then
        assertThatThrownBy(() -> validationService.validateDeadlineExtensionProposal(order, proposedDeadline))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Vorgeschlagene Deadline darf nicht mehr als 90 Tage in der Zukunft liegen");
    }

    // ===== Update Command Field Validation Tests =====

    @Test
    @DisplayName("Should validate update command has at least one field")
    void validateUpdateCommandHasFields_Valid() {
        // Given
        UpdateOrderCommand command = UpdateOrderCommand.builder()
                .orderId(UUID.randomUUID())
                .title("Updated title")
                .build();

        // When & Then
        assertThatCode(() -> validationService.validateUpdateCommandHasFields(command))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should throw exception when update command has no fields set")
    void validateUpdateCommandHasFields_NoFields() {
        // Given
        UpdateOrderCommand command = UpdateOrderCommand.builder()
                .orderId(UUID.randomUUID())
                .build();

        // When & Then
        assertThatThrownBy(() -> validationService.validateUpdateCommandHasFields(command))
                .isInstanceOf(OrderValidationService.ValidationException.class)
                .hasMessage("Mindestens ein Feld muss für die Aktualisierung angegeben werden");
    }

    // ===== Helper Methods =====

    private CreateOrderCommand createValidCreateOrderCommand() {
        return new CreateOrderCommand(
                "Valid Order Title",
                "Valid order description",
                COMPANY_ID,
                "John Doe",
                "john@example.com",
                "+49123456789",
                null,
                "Main Street",
                "123",
                "12345",
                "Berlin",
                "Deutschland",
                52.5200,
                13.4050,
                50,
                OrderCategory.OTHER,
                null,
                Set.of(Industry.OTHER),
                Set.of(PlacementType.PROJECT_CONTRACT),
                null, null, null, null,
                Urgency.MEDIUM,
                LocalDateTime.now().plusDays(1),
                LocalDateTime.now().plusDays(7),
                24,
                BigDecimal.valueOf(1000)
        );
    }

    private Order createValidOrder() {
        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setTitle("Valid Order");
        order.setDescription("Valid description");
        order.setStatus(OrderStatus.DRAFT);
        order.setCompanyId(COMPANY_ID);
        
        // Set contact person
        ContactPerson contact = new ContactPerson("John Doe", "john@example.com", "+49123456789");
        order.setContactPerson(contact);
        
        // Set service address
        Address address = new Address("Main St", "123", "12345", "Berlin", "Deutschland");
        order.setServiceAddress(address);
        
        // Set location
        GeoLocation location = new GeoLocation(BigDecimal.valueOf(52.5200), BigDecimal.valueOf(13.4050));
        order.setLocation(location);
        
        order.setSearchRadiusKm(50);
        order.setBudget(BigDecimal.valueOf(1000));
        order.setDeadline(LocalDateTime.now().plusDays(7));
        
        return order;
    }
}