package com.indusync.indusync_backend.authentication.application.service;

import com.indusync.indusync_backend.authentication.application.dto.CompanyMembershipDto;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for managing user company memberships and permissions.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserCompanyMembershipService {

    private final CompanyMemberRepository companyMemberRepository;
    private final CompanyRepository companyRepository;

    /**
     * Gets all active company memberships for a user.
     *
     * @param userId the user ID
     * @return list of company memberships
     */
    public List<CompanyMembershipDto> getUserCompanyMemberships(UUID userId) {
        log.debug("Fetching company memberships for user: {}", userId);

        List<CompanyMember> memberships = companyMemberRepository.findByUserIdAndActive(userId, true);

        return memberships.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    /**
     * Gets the current active company membership for a user.
     *
     * @param userId           the user ID
     * @param currentCompanyId the current company ID
     * @return current company membership if found
     */
    public Optional<CompanyMembershipDto> getCurrentCompanyMembership(UUID userId, UUID currentCompanyId) {
        if (currentCompanyId == null) {
            return Optional.empty();
        }

        log.debug("Fetching current company membership for user: {} in company: {}", userId, currentCompanyId);

        return companyMemberRepository.findByUserIdAndCompanyIdAndActive(userId, currentCompanyId, true)
                .map(this::mapToDto);
    }

    /**
     * Checks if a user has a specific permission in their current company.
     *
     * @param userId           the user ID
     * @param currentCompanyId the current company ID
     * @param permission       the permission to check
     * @return true if user has the permission
     */
    public boolean hasPermission(UUID userId, UUID currentCompanyId, CompanyPermission permission) {
        if (currentCompanyId == null) {
            return false;
        }

        Optional<CompanyMember> membership = companyMemberRepository
                .findByUserIdAndCompanyIdAndActive(userId, currentCompanyId, true);

        if (membership.isEmpty()) {
            return false;
        }

        CompanyMember member = membership.get();

        return switch (permission) {
            case CREATE_ORDERS -> member.getCanCreateOrders();
            case MANAGE_EMPLOYEES -> member.getCanManageEmployees();
            case ASSIGN_PROJECTS -> member.getCanAssignProjects();
            case VIEW_FINANCIALS -> member.getCanViewFinancials();
            case MANAGE_COMPANY_SETTINGS -> member.getCanManageCompanySettings();
        };
    }

    /**
     * Maps a CompanyMember entity to a DTO.
     *
     * @param member the company member entity
     * @return the DTO
     */
    private CompanyMembershipDto mapToDto(CompanyMember member) {
        String companyName = companyRepository.findById(member.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown Company");

        return CompanyMembershipDto.from(member, companyName);
    }

    /**
     * Enum representing available company permissions.
     */
    public enum CompanyPermission {
        CREATE_ORDERS,
        MANAGE_EMPLOYEES,
        ASSIGN_PROJECTS,
        VIEW_FINANCIALS,
        MANAGE_COMPANY_SETTINGS
    }
}