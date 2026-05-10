package com.indusync.indusync_backend.company.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.company.api.dto.CompanyRoleAdditionResponse;
import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.company.application.CompanyRegistrationService;
import com.indusync.indusync_backend.company.application.CompanyRoleManagementService;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.infrastructure.FileStorageService;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for CompanyController role management endpoints.
 * <p>
 * Tests the HTTP layer integration for:
 * - POST /v1/companies/{id}/roles/add
 * - GET /v1/companies/{id}/available-roles
 * - GET /v1/companies/{id}/role-requirements
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@WebMvcTest(CompanyController.class)
class CompanyControllerRoleManagementTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CompanyRegistrationService companyRegistrationService;

    @MockBean
    private CompanyManagementService companyManagementService;

    @MockBean
    private CompanyRoleManagementService companyRoleManagementService;

    @MockBean
    private CompanyMemberRepository companyMemberRepository;

    @MockBean
    private FileStorageService fileStorageService;

    @MockBean
    private JwtAuthenticationHelper jwtAuthenticationHelper;

    @MockBean
    private ApiResponseHelper apiResponseHelper;

    @Test
    @WithMockUser(roles = "USER")
    void addBusinessRole_Success() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .specializations(List.of("Software Development"))
                .industries(List.of("Technology"))
                .workRadiusKm(50)
                .description("Test company description")
                .contactPersonName("John Doe")
                .contactPersonEmail("john@example.com")
                .employeeCount(10)
                .verificationDocumentUrl("https://example.com/doc.pdf")
                .build();

        CompanyRoleAdditionResponse expectedResponse = CompanyRoleAdditionResponse.success(
                companyId,
                "Test Company",
                BusinessRole.AUFTRAGNEHMER,
                false,
                true,
                CompanyStatus.ACTIVE,
                true);

        when(jwtAuthenticationHelper.getCurrentUserId(any())).thenReturn(userId);
        when(companyRoleManagementService.addBusinessRole(eq(companyId), eq(BusinessRole.AUFTRAGNEHMER), any(),
                eq(userId)))
                .thenReturn(expectedResponse);

        // Act & Assert
        mockMvc.perform(post("/v1/companies/{companyId}/roles/add", companyId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.companyId").value(companyId.toString()))
                .andExpect(jsonPath("$.addedRole").value("AUFTRAGNEHMER"))
                .andExpect(jsonPath("$.isAuftragnehmer").value(true));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAvailableRoles_Success() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        List<BusinessRole> availableRoles = List.of(BusinessRole.AUFTRAGNEHMER);

        when(jwtAuthenticationHelper.getCurrentUserId(any())).thenReturn(userId);
        when(companyRoleManagementService.getAvailableRoles(companyId, userId))
                .thenReturn(availableRoles);

        // Act & Assert
        mockMvc.perform(get("/v1/companies/{companyId}/available-roles", companyId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0]").value("AUFTRAGNEHMER"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getRoleRequirements_Success() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        BusinessRole role = BusinessRole.AUFTRAGNEHMER;

        CompanyRoleManagementService.RoleRequirements requirements = CompanyRoleManagementService.RoleRequirements
                .builder()
                .role(role)
                .displayName("Auftragnehmer")
                .description("Service provider role")
                .requiredFields(List.of("specializations", "industries"))
                .optionalFields(List.of("certifications"))
                .followsRegistrationFlow(true)
                .requiresVerification(true)
                .canBeAdded(true)
                .build();

        when(jwtAuthenticationHelper.getCurrentUserId(any())).thenReturn(userId);
        when(companyRoleManagementService.getRoleRequirements(companyId, role, userId))
                .thenReturn(requirements);

        // Act & Assert
        mockMvc.perform(get("/v1/companies/{companyId}/role-requirements", companyId)
                .param("role", "AUFTRAGNEHMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("AUFTRAGNEHMER"))
                .andExpect(jsonPath("$.displayName").value("Auftragnehmer"))
                .andExpect(jsonPath("$.canBeAdded").value(true))
                .andExpect(jsonPath("$.requiresVerification").value(true));
    }

    @Test
    @WithMockUser(roles = "USER")
    void addBusinessRole_Unauthorized() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .build();

        CompanyRoleAdditionResponse errorResponse = CompanyRoleAdditionResponse.unauthorized();

        when(jwtAuthenticationHelper.getCurrentUserId(any())).thenReturn(userId);
        when(companyRoleManagementService.addBusinessRole(eq(companyId), eq(BusinessRole.AUFTRAGNEHMER), any(),
                eq(userId)))
                .thenReturn(errorResponse);

        // Act & Assert
        mockMvc.perform(post("/v1/companies/{companyId}/roles/add", companyId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.errorCode").value("UNAUTHORIZED"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void getAvailableRoles_CompanyNotFound() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        when(jwtAuthenticationHelper.getCurrentUserId(any())).thenReturn(userId);
        when(companyRoleManagementService.getAvailableRoles(companyId, userId))
                .thenThrow(new CompanyRoleManagementService.CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Act & Assert
        mockMvc.perform(get("/v1/companies/{companyId}/available-roles", companyId))
                .andExpect(status().isNotFound())
                .andExpect(content().string("Unternehmen nicht gefunden"));
    }

    @Test
    void addBusinessRole_RequiresAuthentication() throws Exception {
        // Arrange
        UUID companyId = UUID.randomUUID();
        AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                .role(BusinessRole.AUFTRAGNEHMER)
                .build();

        // Act & Assert
        mockMvc.perform(post("/v1/companies/{companyId}/roles/add", companyId)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}