package com.indusync.indusync_backend.company.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for TermsConditionsAccessLog entity.
 * Tests the entity creation, validation, and business methods.
 */
class TermsConditionsAccessLogTest {

    private UUID documentId;
    private UUID accessedBy;
    private UUID orderId;

    @BeforeEach
    void setUp() {
        documentId = UUID.randomUUID();
        accessedBy = UUID.randomUUID();
        orderId = UUID.randomUUID();
    }

    @Test
    void constructor_ShouldCreateValidAccessLog_WhenValidParametersProvided() {
        // When
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.ORDER_DETAIL);

        // Then
        assertNotNull(accessLog);
        assertEquals(documentId, accessLog.getDocumentId());
        assertEquals(accessedBy, accessLog.getAccessedBy());
        assertEquals(AccessContext.ORDER_DETAIL, accessLog.getAccessContext());
        assertNull(accessLog.getOrderId());
        assertNull(accessLog.getIpAddress());
        assertNull(accessLog.getUserAgent());
    }

    @Test
    void constructor_ShouldCreateValidAccessLogWithOrder_WhenOrderContextProvided() {
        // When
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.EXPRESSION_OF_INTEREST, orderId);

        // Then
        assertNotNull(accessLog);
        assertEquals(documentId, accessLog.getDocumentId());
        assertEquals(accessedBy, accessLog.getAccessedBy());
        assertEquals(AccessContext.EXPRESSION_OF_INTEREST, accessLog.getAccessContext());
        assertEquals(orderId, accessLog.getOrderId());
    }

    @Test
    void setDocumentId_ShouldThrowException_WhenDocumentIdIsNull() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> accessLog.setDocumentId(null));
    }

    @Test
    void setAccessedBy_ShouldThrowException_WhenAccessedByIsNull() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> accessLog.setAccessedBy(null));
    }

    @Test
    void setAccessContext_ShouldThrowException_WhenAccessContextIsNull() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> accessLog.setAccessContext(null));
    }

    @Test
    void setOrderId_ShouldThrowException_WhenOrderIdRequiredButNull() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();
        accessLog.setAccessContext(AccessContext.ORDER_DETAIL); // This context requires order ID

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> accessLog.setOrderId(null));
    }

    @Test
    void setOrderId_ShouldNotThrowException_WhenOrderIdNotRequired() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();
        accessLog.setAccessContext(AccessContext.COMPANY_PROFILE); // This context doesn't require order ID

        // When & Then
        assertDoesNotThrow(() -> accessLog.setOrderId(null));
    }

    @Test
    void isOrderRelated_ShouldReturnTrue_WhenAccessContextIsOrderRelated() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.ORDER_DETAIL);

        // When & Then
        assertTrue(accessLog.isOrderRelated());

        // Given - Expression of Interest
        accessLog.setAccessContext(AccessContext.EXPRESSION_OF_INTEREST);

        // When & Then
        assertTrue(accessLog.isOrderRelated());
    }

    @Test
    void isOrderRelated_ShouldReturnFalse_WhenAccessContextIsNotOrderRelated() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.COMPANY_PROFILE);

        // When & Then
        assertFalse(accessLog.isOrderRelated());
    }

    @Test
    void validate_ShouldNotThrowException_WhenAllRequiredFieldsProvided() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.COMPANY_PROFILE);

        // When & Then
        assertDoesNotThrow(accessLog::validate);
    }

    @Test
    void validate_ShouldNotThrowException_WhenOrderContextWithOrderId() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.ORDER_DETAIL, orderId);

        // When & Then
        assertDoesNotThrow(accessLog::validate);
    }

    @Test
    void validate_ShouldThrowException_WhenRequiredFieldsMissing() {
        // Given - Missing document ID
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();
        accessLog.setAccessedBy(accessedBy);
        accessLog.setAccessContext(AccessContext.COMPANY_PROFILE);

        // When & Then
        assertThrows(IllegalStateException.class, accessLog::validate);

        // Given - Missing accessed by
        accessLog = new TermsConditionsAccessLog();
        accessLog.setDocumentId(documentId);
        accessLog.setAccessContext(AccessContext.COMPANY_PROFILE);

        // When & Then
        assertThrows(IllegalStateException.class, accessLog::validate);

        // Given - Missing access context
        accessLog = new TermsConditionsAccessLog();
        accessLog.setDocumentId(documentId);
        accessLog.setAccessedBy(accessedBy);

        // When & Then
        assertThrows(IllegalStateException.class, accessLog::validate);
    }

    @Test
    void validate_ShouldThrowException_WhenOrderIdRequiredButMissing() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog();
        accessLog.setDocumentId(documentId);
        accessLog.setAccessedBy(accessedBy);
        accessLog.setAccessContext(AccessContext.ORDER_DETAIL); // Requires order ID

        // When & Then
        assertThrows(IllegalStateException.class, accessLog::validate);
    }

    @Test
    void builder_ShouldCreateValidAccessLog() {
        // When
        TermsConditionsAccessLog accessLog = TermsConditionsAccessLog.builder()
                .documentId(documentId)
                .accessedBy(accessedBy)
                .accessContext(AccessContext.COMPANY_PROFILE)
                .ipAddress("192.168.1.1")
                .userAgent("Mozilla/5.0")
                .build();

        // Then
        assertNotNull(accessLog);
        assertEquals(documentId, accessLog.getDocumentId());
        assertEquals(accessedBy, accessLog.getAccessedBy());
        assertEquals(AccessContext.COMPANY_PROFILE, accessLog.getAccessContext());
        assertEquals("192.168.1.1", accessLog.getIpAddress());
        assertEquals("Mozilla/5.0", accessLog.getUserAgent());
    }

    @Test
    void builder_ShouldCreateValidAccessLogWithOrder() {
        // When
        TermsConditionsAccessLog accessLog = TermsConditionsAccessLog.builder()
                .documentId(documentId)
                .accessedBy(accessedBy)
                .accessContext(AccessContext.EXPRESSION_OF_INTEREST)
                .orderId(orderId)
                .ipAddress("10.0.0.1")
                .userAgent("Chrome/91.0")
                .build();

        // Then
        assertNotNull(accessLog);
        assertEquals(documentId, accessLog.getDocumentId());
        assertEquals(accessedBy, accessLog.getAccessedBy());
        assertEquals(AccessContext.EXPRESSION_OF_INTEREST, accessLog.getAccessContext());
        assertEquals(orderId, accessLog.getOrderId());
        assertEquals("10.0.0.1", accessLog.getIpAddress());
        assertEquals("Chrome/91.0", accessLog.getUserAgent());
    }

    @Test
    void builder_ShouldThrowException_WhenRequiredFieldsMissing() {
        // When & Then - Missing document ID
        assertThrows(IllegalArgumentException.class, () -> TermsConditionsAccessLog.builder()
                .accessedBy(accessedBy)
                .accessContext(AccessContext.COMPANY_PROFILE)
                .build());

        // When & Then - Missing accessed by
        assertThrows(IllegalArgumentException.class, () -> TermsConditionsAccessLog.builder()
                .documentId(documentId)
                .accessContext(AccessContext.COMPANY_PROFILE)
                .build());

        // When & Then - Missing access context
        assertThrows(IllegalArgumentException.class, () -> TermsConditionsAccessLog.builder()
                .documentId(documentId)
                .accessedBy(accessedBy)
                .build());
    }

    @Test
    void builder_ShouldThrowException_WhenOrderIdRequiredButMissing() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> TermsConditionsAccessLog.builder()
                .documentId(documentId)
                .accessedBy(accessedBy)
                .accessContext(AccessContext.ORDER_DETAIL) // Requires order ID
                .build());
    }

    @Test
    void toString_ShouldReturnFormattedString() {
        // Given
        TermsConditionsAccessLog accessLog = new TermsConditionsAccessLog(
                documentId, accessedBy, AccessContext.COMPANY_PROFILE);

        // When
        String result = accessLog.toString();

        // Then
        assertTrue(result.contains("TermsConditionsAccessLog"));
        assertTrue(result.contains(documentId.toString()));
        assertTrue(result.contains(accessedBy.toString()));
        assertTrue(result.contains("COMPANY_PROFILE"));
    }
}