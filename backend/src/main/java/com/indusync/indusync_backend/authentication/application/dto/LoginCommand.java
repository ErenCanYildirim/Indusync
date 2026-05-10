package com.indusync.indusync_backend.authentication.application.dto;

import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO representing a user's membership in a company with their role and
 * permissions.
 */
@Data
@Builder
public class CompanyMembershipDto {

    private UUID companyId;
    private String companyName;
    private CompanyMemberRole role;
    private String positionTitle;
    private Boolean isPrimaryContact;
    private LocalDateTime joinedAt;
    private Boolean active;

    // Permission flags
    private Boolean canCreateOrders;
    private Boolean canManageEmployees;
    private Boolean canAssignProjects;
    private Boolean canViewFinancials;
    private Boolean canManageCompanySettings;

    /**
     * Creates a CompanyMembershipDto from a CompanyMember entity and company name.
     * 
     * @param member      the company member entity
     * @param companyName the name of the company
     * @return CompanyMembershipDto instance
     */
    public static CompanyMembershipDto from(CompanyMember member, String companyName) {
        return CompanyMembershipDto.builder()
                .companyId(member.getCompanyId())
                .companyName(companyName)
                .role(member.getRole())
                .positionTitle(member.getPositionTitle())
                .isPrimaryContact(member.getIsPrimaryContact())
                .joinedAt(member.getJoinedAt())
                .active(member.getActive())
                .canCreateOrders(member.getCanCreateOrders())
                .canManageEmployees(member.getCanManageEmployees())
                .canAssignProjects(member.getCanAssignProjects())
                .canViewFinancials(member.getCanViewFinancials())
                .canManageCompanySettings(member.getCanManageCompanySettings())
                .build();
    }
}