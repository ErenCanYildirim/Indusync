package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OrderAuthorizationService.
 * Tests all authorization and access control logic for order operations.
 */
@ExtendWith(MockitoExtension.class)
class OrderAuthorizationServiceTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private Authentication authentication;

    private OrderAuthorizationService authorizationService;

    private static final UUID ORDER_ID = UUID.randomUUID();
    private static final UUID COMPANY_ID = UUID.randomUUID();
    private static final UUID PROVIDER_ID = UUID.randomUUID();
    private static final UUID OTHER_COMPANY_ID = UUID.randomUUID();
    private static final String VALID_TOKEN = "valid.jwt.token";

    @BeforeEach
    void setUp() {
        authorizationService = new OrderAuthorizationService(jwtService, orderRepository);
    }

    // ===== getCurrentCompanyId Tests =====

    @Test
    @DisplayName("Should extract company ID from authentication")
    void getCurrentCompanyId_Success() {
        // Given - Mock authentication to return token as details
        when(authentication.getDetails()).thenReturn(VALID_TOKEN);
        when(jwtService.extractCurrentCompanyId(VALID_TOKEN)).thenReturn(COMPANY_ID);

        // When
        UUID result = authorizationService.getCurrentCompanyId(authentication);

        // Then
        assertThat(result).isEqualTo(COMPANY_ID);
    }

    @Test
    @DisplayName("Should return null when no token found")
    void getCurrentCompanyId_NoToken() {
        // Given - No token in authentication object or fallback
        when(authentication.getDetails()).thenReturn(null);
        when(authentication.getCredentials()).thenReturn(null);
        when(authentication.getPrincipal()).thenReturn(null);

        // When
        UUID result = authorizationService.getCurrentCompanyId(authentication);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("Should return null when token extraction fails")
    void getCurrentCompanyId_ExtractionFails() {
        // Given - Authentication has token but extraction fails
        when(authentication.getDetails()).thenReturn(VALID_TOKEN);
        when(jwtService.extractCurrentCompanyId(VALID_TOKEN)).thenThrow(new RuntimeException("Invalid token"));

        // When
        UUID result = authorizationService.getCurrentCompanyId(authentication);

        // Then
        assertThat(result).isNull();
    }

    // ===== verifyOrderAccess Tests =====

    @Test
    @DisplayName("Should allow access for order owner")
    void verifyOrderAccess_Owner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderAccess(order, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should allow access for published order by any company")
    void verifyOrderAccess_PublishedOrder() {
        // Given
        Order order = createOrder(OrderStatus.PUBLISHED, COMPANY_ID, null);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderAccess(order, OTHER_COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should allow access for assigned provider")
    void verifyOrderAccess_AssignedProvider() {
        // Given
        Order order = createOrder(OrderStatus.IN_PROGRESS, COMPANY_ID, PROVIDER_ID);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderAccess(order, PROVIDER_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny access for non-published order by non-owner")
    void verifyOrderAccess_Unauthorized() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyOrderAccess(order, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung, diesen Auftrag anzuzeigen");
    }

    @Test
    @DisplayName("Should throw exception when order not found by ID")
    void verifyOrderAccess_OrderNotFound() {
        // Given
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyOrderAccess(ORDER_ID, COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.OrderNotFoundException.class)
                .hasMessage("Auftrag nicht gefunden: " + ORDER_ID);
    }

    // ===== verifyOrderOwnership Tests =====

    @Test
    @DisplayName("Should verify ownership for order owner")
    void verifyOrderOwnership_Owner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderOwnership(order, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny ownership for non-owner")
    void verifyOrderOwnership_NonOwner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyOrderOwnership(order, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung, diesen Auftrag zu bearbeiten");
    }

    @Test
    @DisplayName("Should verify ownership by order ID")
    void verifyOrderOwnership_ById() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderOwnership(ORDER_ID, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    // ===== verifyDocumentAccess Tests =====

    @Test
    @DisplayName("Should allow document access for published order")
    void verifyDocumentAccess_PublishedOrder() {
        // Given
        Order order = createOrder(OrderStatus.PUBLISHED, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyDocumentAccess(ORDER_ID, OTHER_COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should allow document access for order owner")
    void verifyDocumentAccess_Owner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyDocumentAccess(ORDER_ID, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny document access for non-published order by non-owner")
    void verifyDocumentAccess_Unauthorized() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyDocumentAccess(ORDER_ID, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung, Dokumente für diesen Auftrag anzuzeigen");
    }

    // ===== verifyDocumentUploadAccess Tests =====

    @Test
    @DisplayName("Should allow document upload for order owner")
    void verifyDocumentUploadAccess_Owner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyDocumentUploadAccess(ORDER_ID, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny document upload for non-owner")
    void verifyDocumentUploadAccess_NonOwner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyDocumentUploadAccess(ORDER_ID, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung, Dokumente für diesen Auftrag hochzuladen");
    }

    // ===== verifyDocumentDeletionAccess Tests =====

    @Test
    @DisplayName("Should allow document deletion for order owner")
    void verifyDocumentDeletionAccess_Owner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyDocumentDeletionAccess(ORDER_ID, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny document deletion for non-owner")
    void verifyDocumentDeletionAccess_NonOwner() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyDocumentDeletionAccess(ORDER_ID, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung, Dokumente für diesen Auftrag zu löschen");
    }

    // ===== verifyOrderParticipation Tests =====

    @Test
    @DisplayName("Should verify participation for order owner")
    void verifyOrderParticipation_Owner() {
        // Given
        Order order = createOrder(OrderStatus.IN_PROGRESS, COMPANY_ID, PROVIDER_ID);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderParticipation(order, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should verify participation for provider")
    void verifyOrderParticipation_Provider() {
        // Given
        Order order = createOrder(OrderStatus.IN_PROGRESS, COMPANY_ID, PROVIDER_ID);

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderParticipation(order, PROVIDER_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny participation for non-participant")
    void verifyOrderParticipation_NonParticipant() {
        // Given
        Order order = createOrder(OrderStatus.IN_PROGRESS, COMPANY_ID, PROVIDER_ID);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyOrderParticipation(order, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine Berechtigung für diesen Auftrag");
    }

    @Test
    @DisplayName("Should verify participation by order ID")
    void verifyOrderParticipation_ById() {
        // Given
        Order order = createOrder(OrderStatus.IN_PROGRESS, COMPANY_ID, PROVIDER_ID);
        when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));

        // When & Then
        assertThatCode(() -> authorizationService.verifyOrderParticipation(ORDER_ID, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    // ===== verifyAvailableOrdersAccess Tests =====

    @Test
    @DisplayName("Should verify available orders access for valid company")
    void verifyAvailableOrdersAccess_Valid() {
        // When & Then
        assertThatCode(() -> authorizationService.verifyAvailableOrdersAccess(COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny available orders access for null company")
    void verifyAvailableOrdersAccess_NullCompany() {
        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyAvailableOrdersAccess(null))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine gültige Unternehmenskontext gefunden");
    }

    // ===== verifyAvailableOrderDetailsAccess Tests =====

    @Test
    @DisplayName("Should allow access to published order details by different company")
    void verifyAvailableOrderDetailsAccess_Valid() {
        // Given
        Order order = createOrder(OrderStatus.PUBLISHED, COMPANY_ID, null);

        // When & Then
        assertThatCode(() -> authorizationService.verifyAvailableOrderDetailsAccess(order, OTHER_COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny access to non-published order details")
    void verifyAvailableOrderDetailsAccess_NotPublished() {
        // Given
        Order order = createOrder(OrderStatus.DRAFT, COMPANY_ID, null);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyAvailableOrderDetailsAccess(order, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.OrderNotFoundException.class)
                .hasMessage("Auftrag ist nicht verfügbar oder wurde nicht veröffentlicht");
    }

    @Test
    @DisplayName("Should deny access to own order through order board")
    void verifyAvailableOrderDetailsAccess_OwnOrder() {
        // Given
        Order order = createOrder(OrderStatus.PUBLISHED, COMPANY_ID, null);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyAvailableOrderDetailsAccess(order, COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Sie können Ihre eigenen Aufträge nicht über das Order Board einsehen");
    }

    // ===== verifyProviderConfirmationAccess Tests =====

    @Test
    @DisplayName("Should allow provider confirmation for order owner")
    void verifyProviderConfirmationAccess_Owner() {
        // Given
        Order order = createOrder(OrderStatus.MATCHED, COMPANY_ID, null);

        // When & Then
        assertThatCode(() -> authorizationService.verifyProviderConfirmationAccess(order, COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should deny provider confirmation for non-owner")
    void verifyProviderConfirmationAccess_NonOwner() {
        // Given
        Order order = createOrder(OrderStatus.MATCHED, COMPANY_ID, null);

        // When & Then
        assertThatThrownBy(() -> authorizationService.verifyProviderConfirmationAccess(order, OTHER_COMPANY_ID))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Unternehmen besitzt diesen Auftrag nicht");
    }

    // ===== requireValidCompanyContext Tests =====

    @Test
    @DisplayName("Should accept valid company context")
    void requireValidCompanyContext_Valid() {
        // When & Then
        assertThatCode(() -> authorizationService.requireValidCompanyContext(COMPANY_ID))
                .doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Should reject null company context")
    void requireValidCompanyContext_Null() {
        // When & Then
        assertThatThrownBy(() -> authorizationService.requireValidCompanyContext(null))
                .isInstanceOf(OrderAuthorizationService.UnauthorizedAccessException.class)
                .hasMessage("Keine gültige Unternehmenskontext gefunden");
    }

    // ===== Helper Methods =====

    private Order createOrder(OrderStatus status, UUID companyId, UUID providerId) {
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setStatus(status);
        order.setCompanyId(companyId);
        order.setProviderId(providerId);
        order.setTitle("Test Order");
        order.setDescription("Test Description");
        return order;
    }
}