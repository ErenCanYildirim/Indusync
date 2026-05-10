package com.indusync.indusync_backend.authentication.application.dto;

import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Command DTO for user registration.
 * Contains all necessary information to register a new user with complete
 * company details.
 */
@Data
@Builder
public class RegisterUserCommand {

    // === Core Identity ===
    private String email;
    private String password;
    private String confirmPassword;
    private AccountType accountType;

    // === Personal Information ===
    private String firstName;
    private String lastName;
    private String phone;
    private String website;

    // === Company Information (for business accounts) ===
    private String companyName;
    private CompanyType companyType;
    private String taxId;
    private String registrationNumber;

    // === Address Fields ===
    private String street;
    private String houseNumber;
    private String postalCode;
    private String city;
    private String country;

    // === Location Coordinates ===
    private Double latitude;
    private Double longitude;

    // === Business-specific Fields ===
    private Integer workRadiusKm;
    private List<String> specializations;
    private List<String> industries;
    private List<String> orderCategories;
    private String description;

    // === Role Flags ===
    private Boolean companyTypeAuftraggeber;
    private Boolean companyTypeAuftragnehmer;

    // === Auftragnehmer-specific Fields ===

    // Company details (separate from user company)
    private String companyDetailsName;

    // Company headquarters address (separate from user address)
    private String companyAddress;
    private String companyPostalCode;
    private String companyCity;

    // Work radius and country selection
    private String workRadius;
    private String countrySelection;

    // Contact person information
    private Integer contactPersonCount;
    private String contactPersonName;
    private String contactDepartment;
    private String contactEmail;
    private String contactPhone;

    // Employee count
    private Integer employeeCount;

    // Company description (for Auftragnehmer)
    private String companyDescription;

    // Document upload fields
    private String companyVerificationFile;
    private String companyCertificatesFile;

    // === User Preferences ===
    private Boolean emailNotifications;
    private List<String> interests;
    private String referralSource;

    // === GDPR Compliance ===
    private String ipAddress;

    // === Business Logic Methods ===

    public boolean isBusinessAccount() {
        return accountType == AccountType.BUSINESS;
    }

    public boolean isPersonalAccount() {
        return accountType == AccountType.PERSONAL;
    }

    public boolean isAuftragnehmer() {
        return Boolean.TRUE.equals(companyTypeAuftragnehmer);
    }

    public boolean isAuftraggeber() {
        return Boolean.TRUE.equals(companyTypeAuftraggeber);
    }

    public boolean isBothRoles() {
        return isAuftragnehmer() && isAuftraggeber();
    }

    public boolean requiresExtendedCompanyData() {
        return isBusinessAccount() && isAuftragnehmer();
    }
}