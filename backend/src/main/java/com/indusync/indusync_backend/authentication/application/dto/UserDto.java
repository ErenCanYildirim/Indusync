package com.indusync.indusync_backend.authentication.application.dto;

import com.indusync.indusync_backend.authentication.domain.User;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * DTO for user information in API responses.
 * Contains safe user data without sensitive information.
 */
@Data
@Builder
public class UserDto {

    private UUID id;
    private String email;
    private AccountType accountType;
    private String firstName;
    private String lastName;
    private String fullName;
    private String phone;
    private String website;
    private Boolean emailVerified;
    private LocalDateTime emailVerifiedAt;
    private Boolean active;
    private UUID currentCompanyId;
    private LocalDateTime lastLoginAt;
    private Boolean emailNotifications;
    private List<String> interests;
    private String referralSource;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Company membership information
    private List<CompanyMembershipDto> companyMemberships;
    private CompanyMembershipDto currentCompanyMembership;

    /**
     * Creates a UserDto from a User entity.
     * 
     * @param user the user entity
     * @return UserDto instance
     */
    public static UserDto from(User user) {
        return from(user, null, null);
    }

    /**
     * Creates a UserDto from a User entity with company membership information.
     * 
     * @param user                     the user entity
     * @param companyMemberships       list of company memberships
     * @param currentCompanyMembership current active company membership
     * @return UserDto instance
     */
    public static UserDto from(User user, List<CompanyMembershipDto> companyMemberships,
            CompanyMembershipDto currentCompanyMembership) {
        return UserDto.builder()
                .id(user.getId())
                .email(user.getEmail() != null ? user.getEmail().getValue() : null)
                .accountType(user.getAccountType())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .website(user.getWebsite())
                .emailVerified(user.getEmailVerified())
                .emailVerifiedAt(user.getEmailVerifiedAt())
                .active(user.getActive())
                .currentCompanyId(user.getCurrentCompanyId())
                .lastLoginAt(user.getLastLoginAt())
                .emailNotifications(user.getEmailNotifications())
                .interests(user.getInterests())
                .referralSource(user.getReferralSource())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .companyMemberships(companyMemberships)
                .currentCompanyMembership(currentCompanyMembership)
                .build();
    }
}