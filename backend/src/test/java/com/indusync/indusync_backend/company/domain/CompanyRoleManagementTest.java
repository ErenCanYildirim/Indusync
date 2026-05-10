package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Test class for Company role management functionality.
 * Tests the canAddRole and addBusinessRole methods.
 */
class CompanyRoleManagementTest {

    private Company company;

    @BeforeEach
    void setUp() {
        company = new Company("Test Company", CompanyType.GMBH);
        company.setStatus(CompanyStatus.ACTIVE);
    }

@Test
    void canAddRole_ShouldReturnTrue_WhenRoleNotAlreadyAssigned() {
        // Given: Company without any roles
        assertFalse(company.getIsAuftraggeber());
        assertFalse(company.getIsAuftragnehmer());

        // When & Then: Should be able to add both roles
        assertTrue(company.canAddRole(BusinessRole.AUFTRAGGEBER));
        assertTrue(company.canAddRole(BusinessRole.AUFTRAGNEHMER));
    }

    @Test
    void canAddRole_ShouldReturnFalse_WhenRoleAlreadyAssigned() {
        // Given: Company with Auftraggeber role
        company.setIsAuftraggeber(true);

        // When & Then: Should not be able to add Auftraggeber again
        assertFalse(company.canAddRole(BusinessRole.AUFTRAGGEBER));
        assertTrue(company.canAddRole(BusinessRole.AUFTRAGNEHMER));
    }

    @Test
    void canAddRole_ShouldThrowException_WhenRoleIsNull() {
        // When & Then
        assertThrows(IllegalArgumentException.class, () -> company.canAddRole(null));
    }

    @Test
    void addBusinessRole_ShouldAddAuftraggeberRole_WhenValidRequest() {
        // Given
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .contactPersonEmail("test@example.com")
                .contactPersonPhone("123456789")
                .build();

        // When
        company.addBusinessRole(BusinessRole.AUFTRAGGEBER, request);

        // Then
        assertTrue(company.getIsAuftraggeber());
        assertEquals("test@example.com", company.getContactEmail());
        assertEquals("123456789", company.getContactPhone());
    }

    @Test
    void addBusinessRole_ShouldAddAuftragnehmberRole_WhenValidRequest() {
        // Given
        List<String> specializations = Arrays.asList("Web Development", "Mobile Apps");
        List<String> industries = Arrays.asList("IT", "Software");
        
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .specializations(specializations)
                .industries(industries)
                .workRadiusKm(50)
                .description("Professional software development services")
                .contactPersonName("John Doe")
                .contactPersonEmail("john@example.com")
                .contactPersonPhone("987654321")
                .employeeCount(10)
                .businessHours("9-17")
                .verificationDocumentUrl("https://example.com/doc.pdf")
                .build();

        // When
        company.addBusinessRole(BusinessRole.AUFTRAGNEHMER, request);

        // Then
        assertTrue(company.getIsAuftragnehmer());
        assertTrue(company.getSpecializations().containsAll(specializations));
        assertTrue(company.getIndustries().containsAll(industries));
        assertEquals(50, company.getWorkRadiusKm());
        assertEquals("Professional software development services", company.getDescription());
        assertEquals("john@example.com", company.getContactEmail());
        assertEquals("987654321", company.getContactPhone());
        assertEquals(10, company.getEmployeeCount());
        assertEquals("9-17", company.getBusinessHours());
        assertEquals("https://example.com/doc.pdf", company.getVerificationDocumentUrl());
    }

    @Test
    void addBusinessRole_ShouldThrowException_WhenRoleAlreadyExists() {
        // Given: Company already has Auftraggeber role
        company.setIsAuftraggeber(true);
        
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .build();

        // When & Then
        assertThrows(IllegalStateException.class, 
                () -> company.addBusinessRole(BusinessRole.AUFTRAGGEBER, request));
    }

    @Test
    void addBusinessRole_ShouldThrowException_WhenRequestIsNull() {
        // When & Then
        assertThrows(IllegalArgumentException.class, 
                () -> company.addBusinessRole(BusinessRole.AUFTRAGGEBER, null));
    }

    @Test
    void addBusinessRole_ShouldThrowException_WhenRoleIsNull() {
        // Given
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .build();

        // When & Then
        assertThrows(IllegalArgumentException.class, 
                () -> company.addBusinessRole(null, request));
    }

    @Test
    void addBusinessRole_ShouldThrowException_WhenRequestRoleDoesNotMatch() {
        // Given
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .build();

        // When & Then
        assertThrows(IllegalArgumentException.class, 
                () -> company.addBusinessRole(BusinessRole.AUFTRAGNEHMER, request));
    }

    @Test
    void addBusinessRole_ShouldMergeSpecializations_WhenAuftragnehmberRoleAdded() {
        // Given: Company already has some specializations
        company.setSpecializations(Arrays.asList("Existing Spec"));
        
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .specializations(Arrays.asList("New Spec", "Existing Spec"))
                .industries(Arrays.asList("IT"))
                .workRadiusKm(50)
                .description("Test description")
                .contactPersonName("John Doe")
                .contactPersonEmail("john@example.com")
                .employeeCount(5)
                .verificationDocumentUrl("https://example.com/doc.pdf")
                .build();

        // When
        company.addBusinessRole(BusinessRole.AUFTRAGNEHMER, request);

        // Then: Should have both existing and new specializations without duplicates
        assertEquals(2, company.getSpecializations().size());
        assertTrue(company.getSpecializations().contains("Existing Spec"));
        assertTrue(company.getSpecializations().contains("New Spec"));
    }
}