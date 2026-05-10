package com.indusync.indusync_backend.company.domain;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for AccessContext enum.
 * Tests the enum values, methods, and business logic.
 */
class AccessContextTest {

    @Test
    void values_ShouldContainAllExpectedContexts() {
        // When
        AccessContext[] values = AccessContext.values();

        // Then
        assertEquals(3, values.length);
        assertTrue(java.util.Arrays.asList(values).contains(AccessContext.ORDER_DETAIL));
        assertTrue(java.util.Arrays.asList(values).contains(AccessContext.COMPANY_PROFILE));
        assertTrue(java.util.Arrays.asList(values).contains(AccessContext.EXPRESSION_OF_INTEREST));
    }

    @Test
    void getDisplayName_ShouldReturnCorrectDisplayNames() {
        // When & Then
        assertEquals("Order Detail Page", AccessContext.ORDER_DETAIL.getDisplayName());
        assertEquals("Company Profile Page", AccessContext.COMPANY_PROFILE.getDisplayName());
        assertEquals("Expression of Interest", AccessContext.EXPRESSION_OF_INTEREST.getDisplayName());
    }

    @Test
    void getDescription_ShouldReturnCorrectDescriptions() {
        // When & Then
        assertEquals("Document accessed from order detail view", AccessContext.ORDER_DETAIL.getDescription());
        assertEquals("Document accessed from company profile view", AccessContext.COMPANY_PROFILE.getDescription());
        assertEquals("Document accessed during order application process",
                AccessContext.EXPRESSION_OF_INTEREST.getDescription());
    }

    @Test
    void isOrderRelated_ShouldReturnTrue_ForOrderRelatedContexts() {
        // When & Then
        assertTrue(AccessContext.ORDER_DETAIL.isOrderRelated());
        assertTrue(AccessContext.EXPRESSION_OF_INTEREST.isOrderRelated());
        assertFalse(AccessContext.COMPANY_PROFILE.isOrderRelated());
    }

    @Test
    void requiresOrderId_ShouldReturnTrue_ForOrderRelatedContexts() {
        // When & Then
        assertTrue(AccessContext.ORDER_DETAIL.requiresOrderId());
        assertTrue(AccessContext.EXPRESSION_OF_INTEREST.requiresOrderId());
        assertFalse(AccessContext.COMPANY_PROFILE.requiresOrderId());
    }

    @Test
    void fromString_ShouldReturnCorrectContext_WhenValidStringProvided() {
        // When & Then
        assertEquals(AccessContext.ORDER_DETAIL, AccessContext.fromString("ORDER_DETAIL"));
        assertEquals(AccessContext.COMPANY_PROFILE, AccessContext.fromString("COMPANY_PROFILE"));
        assertEquals(AccessContext.EXPRESSION_OF_INTEREST, AccessContext.fromString("EXPRESSION_OF_INTEREST"));

        // Test case insensitive
        assertEquals(AccessContext.ORDER_DETAIL, AccessContext.fromString("order_detail"));
        assertEquals(AccessContext.COMPANY_PROFILE, AccessContext.fromString("company_profile"));
        assertEquals(AccessContext.EXPRESSION_OF_INTEREST, AccessContext.fromString("expression_of_interest"));

        // Test with whitespace
        assertEquals(AccessContext.ORDER_DETAIL, AccessContext.fromString("  ORDER_DETAIL  "));
    }

    @Test
    void fromString_ShouldThrowException_WhenInvalidStringProvided() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> AccessContext.fromString("INVALID_CONTEXT"));
        assertThrows(IllegalArgumentException.class, () -> AccessContext.fromString(""));
        assertThrows(IllegalArgumentException.class, () -> AccessContext.fromString("   "));
        assertThrows(IllegalArgumentException.class, () -> AccessContext.fromString(null));
    }

    @Test
    void toString_ShouldReturnDisplayName() {
        // When & Then
        assertEquals("Order Detail Page", AccessContext.ORDER_DETAIL.toString());
        assertEquals("Company Profile Page", AccessContext.COMPANY_PROFILE.toString());
        assertEquals("Expression of Interest", AccessContext.EXPRESSION_OF_INTEREST.toString());
    }

    @Test
    void enum_ShouldBeComparableAndHashable() {
        // When & Then - Test enum comparison
        assertEquals(AccessContext.ORDER_DETAIL, AccessContext.ORDER_DETAIL);
        assertNotEquals(AccessContext.ORDER_DETAIL, AccessContext.COMPANY_PROFILE);

        // Test hashCode consistency
        assertEquals(AccessContext.ORDER_DETAIL.hashCode(), AccessContext.ORDER_DETAIL.hashCode());
        assertNotEquals(AccessContext.ORDER_DETAIL.hashCode(), AccessContext.COMPANY_PROFILE.hashCode());

        // Test ordinal values are consistent
        assertTrue(AccessContext.ORDER_DETAIL.ordinal() >= 0);
        assertTrue(AccessContext.COMPANY_PROFILE.ordinal() >= 0);
        assertTrue(AccessContext.EXPRESSION_OF_INTEREST.ordinal() >= 0);
    }
}