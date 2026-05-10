package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.application.dto.CompanyRegistrationResponse;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.events.UserRegisteredEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyEventHandler.
 * <p>
 * Tests the event-driven company creation functionality for business users.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CompanyEventHandler Tests")
class CompanyEventHandlerTest {

        @Mock
        private CompanyRegistrationService companyRegistrationService;

        @Mock
        private ApplicationEventPublisher eventPublisher;

        @InjectMocks
        private CompanyEventHandler companyEventHandler;

        private UUID testUserId;
        private UserRegisteredEvent businessUserEvent;
        private UserRegisteredEvent personalUserEvent;

        @BeforeEach
        void setUp() {
                testUserId = UUID.randomUUID();

                businessUserEvent = UserRegisteredEvent.forBusinessUser(
                                testUserId,
                                "test@business.com",
                                "John",
                                "Doe",
                                "+49123456789",
                                "https://johndoe.com",
                                "John Doe GmbH",
                                "GMBH");

                personalUserEvent = UserRegisteredEvent.forPersonalUser(
                                testUserId,
                                "test@personal.com",
                                "Jane",
                                "Smith",
                                "+49987654321",
                                "https://janesmith.com",
                                true, // emailNotifications
                                null, // interests
                                null); // referralSource
        }

        @Test
        @DisplayName("Should create default company for business user")
        void shouldCreateDefaultCompanyForBusinessUser() {
                // Given
                CompanyRegistrationResponse successResponse = CompanyRegistrationResponse.builder()
                                .companyId(UUID.randomUUID())
                                .companyName("John Doe GmbH")
                                .status(CompanyStatus.PENDING)
                                .membershipRole(CompanyMemberRole.OWNER)
                                .message("Standardunternehmen erfolgreich erstellt")
                                .build();

                when(companyRegistrationService.createDefaultCompanyFromEvent(eq(businessUserEvent)))
                                .thenReturn(successResponse);

                // When
                companyEventHandler.handleUserRegistered(businessUserEvent);

                // Then
                verify(companyRegistrationService).createDefaultCompanyFromEvent(eq(businessUserEvent));
                verify(eventPublisher).publishEvent(any());
        }

        @Test
        @DisplayName("Should skip company creation for personal user")
        void shouldSkipCompanyCreationForPersonalUser() {
                // When
                companyEventHandler.handleUserRegistered(personalUserEvent);

                // Then
                verify(companyRegistrationService, never()).createDefaultCompanyFromEvent(any());
                verify(eventPublisher, never()).publishEvent(any());
        }

        @Test
        @DisplayName("Should handle service exception gracefully")
        void shouldHandleServiceExceptionGracefully() {
                // Given
                when(companyRegistrationService.createDefaultCompanyFromEvent(eq(businessUserEvent)))
                                .thenThrow(new RuntimeException("Service error"));

                // When & Then - should not throw exception
                companyEventHandler.handleUserRegistered(businessUserEvent);

                verify(companyRegistrationService).createDefaultCompanyFromEvent(eq(businessUserEvent));
                verify(eventPublisher, never()).publishEvent(any());
        }

        @Test
        @DisplayName("Should handle unsuccessful company creation")
        void shouldHandleUnsuccessfulCompanyCreation() {
                // Given
                CompanyRegistrationResponse errorResponse = CompanyRegistrationResponse.builder()
                                .message("Fehler beim Erstellen des Unternehmens")
                                .build();

                when(companyRegistrationService.createDefaultCompanyFromEvent(eq(businessUserEvent)))
                                .thenReturn(errorResponse);

                // When
                companyEventHandler.handleUserRegistered(businessUserEvent);

                // Then
                verify(companyRegistrationService).createDefaultCompanyFromEvent(eq(businessUserEvent));
                verify(eventPublisher, never()).publishEvent(any());
        }

        @Test
        @DisplayName("Should publish CompanyCreatedEvent on successful creation")
        void shouldPublishCompanyCreatedEventOnSuccess() {
                // Given
                UUID companyId = UUID.randomUUID();
                CompanyRegistrationResponse successResponse = CompanyRegistrationResponse.builder()
                                .companyId(companyId)
                                .companyName("Test Company")
                                .status(CompanyStatus.PENDING)
                                .membershipRole(CompanyMemberRole.OWNER)
                                .message("Success")
                                .build();

                when(companyRegistrationService.createDefaultCompanyFromEvent(eq(businessUserEvent)))
                                .thenReturn(successResponse);

                // When
                companyEventHandler.handleUserRegistered(businessUserEvent);

                // Then
                ArgumentCaptor<CompanyEventHandler.CompanyCreatedEvent> eventCaptor = ArgumentCaptor
                                .forClass(CompanyEventHandler.CompanyCreatedEvent.class);
                verify(eventPublisher).publishEvent(eventCaptor.capture());

                CompanyEventHandler.CompanyCreatedEvent capturedEvent = eventCaptor.getValue();
                assertThat(capturedEvent.companyId()).isEqualTo(companyId);
                assertThat(capturedEvent.companyName()).isEqualTo("Test Company");
                assertThat(capturedEvent.userId()).isEqualTo(testUserId);
        }
}