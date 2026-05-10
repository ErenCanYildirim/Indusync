package com.indusync.indusync_backend.authentication.api.dto;

import com.indusync.indusync_backend.authentication.application.dto.UserDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Response DTO for authentication operations.
 * Contains JWT token, user information, and company context for business users.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthenticationResponse {

    private String token;
    private String refreshToken;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long expiresIn;
    private UserDto user;

    // Company context for business users
    private CompanyContext currentCompany;
    private List<CompanyMembership> companyMemberships;

    /**
     * Company context information included in authentication response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyContext {
        private UUID companyId;
        private String companyName;
        private String companyType;
        private String companyRole; // AUFTRAGGEBER, AUFTRAGNEHMER, BOTH
        private Boolean verified;
        private String status;
    }

    /**
     * User's membership information in companies.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CompanyMembership {
        private UUID companyId;
        private String companyName;
        private String role; // OWNER, ADMIN, MANAGER, EMPLOYEE, VIEWER
        private String positionTitle;
        private Boolean isPrimaryContact;
        private Boolean active;

        // Permission flags for frontend authorization
        private Boolean canCreateOrders;
        private Boolean canManageEmployees;
        private Boolean canAssignProjects;
        private Boolean canViewFinancials;
        private Boolean canManageCompanySettings;
    }
}