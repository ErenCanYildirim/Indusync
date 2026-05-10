package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.company.api.dto.CompanyRoleAdditionResponse;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyRoleManagementService.
 * <p>
 * Tests the core functionality of role management including:
 * - Adding business roles with proper authorization
 * - Getting available roles
 * - Getting role requirements
 * - Error handling and validation
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@ExtendWith(MockitoExtension.class)
class CompanyRoleManagementServiceTest {

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private CompanyMemberRepository companyMemberRepository;

    @InjectMocks
    private CompanyRoleManagementService roleManagementService;

    private UUID companyId;
    private UUID userId;
    private Company testCompany;
    private CompanyMember testMember;

    @BeforeEach
    void setUp() {
        companyId = UUID.randomUUID();
        userId = UUID.randomUUID();

        // Create a test company (AG only initially)
        testCompany = new Company("Test Company", CompanyType.GMBH);
        testCompany.setId(companyId);
        testCompany.setIsAuftraggeber(true);
        testCompany.setIsAuftragnehmer(false);
        testCompany.setStatus(CompanyStatus.ACTIVE);

        // Create a test company member (owner)
        testMember = new CompanyMember();
        testMember.setId(UUID.randomUUID());
        testMember.setCompanyId(companyId);
        testMember.setUserId(userId);
        testMember.setRole(CompanyMemberRole.OWNER);
        testMember.setActive(true);
        testMember.setCanManageCompanySettings(true);
    }

    @Test
    void addBusinessRole_Success_AuftragnehmberRole() {
        // Arrange
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .specializations(List.of("Software Development", "Web Design"))
                .industries(List.of("IT", "Technology"))
                .workRadiusKm(50)
                .description("We provide excellent software development services")
                .contactPersonName("John Doe")
                .contactPersonEmail("john@test.com")
                .employeeCount(10)
                .verificationDocumentUrl("https://example.com/verification.pdf")
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGNEHMER, request, userId);

        // Assert
        assertTrue(response.isSuccessful());
        assertEquals(BusinessRole.AUFTRAGNEHMER, response.getAddedRole());
        assertTrue(response.getIsAuftragnehmer());
        assertTrue(response.getIsAuftraggeber());
        assertTrue(response.getRequiresVerification());

        verify(companyRepository).save(testCompany);
        assertTrue(testCompany.getIsAuftragnehmer());
    }

    @Test
    void addBusinessRole_Success_AuftraggeberRole() {
        // Arrange - company is AN only initially
        testCompany.setIsAuftraggeber(false);
        testCompany.setIsAuftragnehmer(true);

        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .contactPersonName("Jane Doe")
                .contactPersonEmail("jane@test.com")
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));
        when(companyRepository.save(any(Company.class))).thenReturn(testCompany);

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGGEBER, request, userId);

        // Assert
        assertTrue(response.isSuccessful());
        assertEquals(BusinessRole.AUFTRAGGEBER, response.getAddedRole());
        assertTrue(response.getIsAuftraggeber());
        assertTrue(response.getIsAuftragnehmer());
        assertFalse(response.getRequiresVerification());

        verify(companyRepository).save(testCompany);
        assertTrue(testCompany.getIsAuftraggeber());
    }

    @Test
    void addBusinessRole_Failure_CompanyNotFound() {
        // Arrange
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGNEHMER, request, userId);

        // Assert
        assertFalse(response.isSuccessful());
        assertEquals("COMPANY_NOT_FOUND", response.getErrorCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void addBusinessRole_Failure_UnauthorizedUser() {
        // Arrange
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.empty()); // No membership

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGNEHMER, request, userId);

        // Assert
        assertFalse(response.isSuccessful());
        assertEquals("UNAUTHORIZED", response.getErrorCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void addBusinessRole_Failure_RoleAlreadyExists() {
        // Arrange - company already has Auftraggeber role
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGGEBER)
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGGEBER, request, userId);

        // Assert
        assertFalse(response.isSuccessful());
        assertEquals("ROLE_ALREADY_EXISTS", response.getErrorCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void addBusinessRole_Failure_InvalidAuftragnehmberData() {
        // Arrange - missing required fields for Auftragnehmer
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                // Missing required fields like specializations, industries, etc.
                .build();

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        CompanyRoleAdditionResponse response = roleManagementService.addBusinessRole(
                companyId, BusinessRole.AUFTRAGNEHMER, request, userId);

        // Assert
        assertFalse(response.isSuccessful());
        assertEquals("VALIDATION_ERROR", response.getErrorCode());
        verify(companyRepository, never()).save(any());
    }

    @Test
    void getAvailableRoles_Success_AuftraggeberOnly() {
        // Arrange - company has only Auftraggeber role
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        List<BusinessRole> availableRoles = roleManagementService.getAvailableRoles(companyId, userId);

        // Assert
        assertEquals(1, availableRoles.size());
        assertTrue(availableRoles.contains(BusinessRole.AUFTRAGNEHMER));
        assertFalse(availableRoles.contains(BusinessRole.AUFTRAGGEBER));
    }

    @Test
    void getAvailableRoles_Success_BothRoles() {
        // Arrange - company has both roles
        testCompany.setIsAuftragnehmer(true);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        List<BusinessRole> availableRoles = roleManagementService.getAvailableRoles(companyId, userId);

        // Assert
        assertEquals(0, availableRoles.size()); // No roles can be added
    }

    @Test
    void getAvailableRoles_Failure_CompanyNotFound() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CompanyRoleManagementService.CompanyNotFoundException.class,
                () -> roleManagementService.getAvailableRoles(companyId, userId));
    }

    @Test
    void getAvailableRoles_Failure_UnauthorizedUser() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CompanyRoleManagementService.UnauthorizedAccessException.class,
                () -> roleManagementService.getAvailableRoles(companyId, userId));
    }

    @Test
    void getRoleRequirements_Success_AuftragnehmberRole() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        CompanyRoleManagementService.RoleRequirements requirements = roleManagementService
                .getRoleRequirements(companyId, BusinessRole.AUFTRAGNEHMER, userId);

        // Assert
        assertEquals(BusinessRole.AUFTRAGNEHMER, requirements.getRole());
        assertEquals("Auftragnehmer", requirements.getDisplayName());
        assertTrue(requirements.getFollowsRegistrationFlow());
        assertTrue(requirements.getRequiresVerification());
        assertTrue(requirements.getCanBeAdded());
        assertTrue(requirements.getRequiredFieldCount() > 0);
        assertTrue(requirements.isFieldRequired("specializations"));
        assertTrue(requirements.isFieldRequired("industries"));
        assertTrue(requirements.isFieldRequired("workRadiusKm"));
    }

    @Test
    void getRoleRequirements_Success_AuftraggeberRole() {
        // Arrange - company is AN only
        testCompany.setIsAuftraggeber(false);
        testCompany.setIsAuftragnehmer(true);

        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.of(testMember));

        // Act
        CompanyRoleManagementService.RoleRequirements requirements = roleManagementService
                .getRoleRequirements(companyId, BusinessRole.AUFTRAGGEBER, userId);

        // Assert
        assertEquals(BusinessRole.AUFTRAGGEBER, requirements.getRole());
        assertEquals("Auftraggeber", requirements.getDisplayName());
        assertFalse(requirements.getFollowsRegistrationFlow());
        assertFalse(requirements.getRequiresVerification());
        assertTrue(requirements.getCanBeAdded());
        assertEquals(0, requirements.getRequiredFieldCount()); // No required fields for AG
    }

    @Test
    void getRoleRequirements_Failure_CompanyNotFound() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CompanyRoleManagementService.CompanyNotFoundException.class, () ->
                roleManagementService.getRoleRequirements(companyId, BusinessRole.AUFTRAGNEHMER, userId));
    }

@Test
    void getRoleRequirements_Failure_UnauthorizedUser() {
        // Arrange
        when(companyRepository.findById(companyId)).thenReturn(Optional.of(testCompany));
        when(companyMemberRepository.findByCompanyIdAndUserId(companyId, userId))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(CompanyRoleManagementService.UnauthorizedAccessException.class, () ->
                roleManagementService.getRoleRequirements(companyId, BusinessRole.AUFTRAGNEHMER, userId));
    }

    @Test
    void addBusinessRole_NullParameters_ThrowsException() {
        // Test null companyId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.addBusinessRole(null, BusinessRole.AUFTRAGNEHMER, 
                        AddBusinessRoleRequest.builder().build(), userId));

        // Test null role
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.addBusinessRole(companyId, null, 
                        AddBusinessRoleRequest.builder().build(), userId));

        // Test null request
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.addBusinessRole(companyId, BusinessRole.AUFTRAGNEHMER, 
                        null, userId));

        // Test null userId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.addBusinessRole(companyId, BusinessRole.AUFTRAGNEHMER, 
                        AddBusinessRoleRequest.builder().build(), null));
    }

    @Test
    void getAvailableRoles_NullParameters_ThrowsException() {
        // Test null companyId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.getAvailableRoles(null, userId));

        // Test null userId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.getAvailableRoles(companyId, null));
    }

    @Test
    void getRoleRequirements_NullParameters_ThrowsException() {
        // Test null companyId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.getRoleRequirements(null, BusinessRole.AUFTRAGNEHMER, userId));

        // Test null role
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.getRoleRequirements(companyId, null, userId));

        // Test null userId
        assertThrows(IllegalArgumentException.class, () ->
                roleManagementService.getRoleRequirements(companyId, BusinessRole.AUFTRAGNEHMER, null));
    }
}