package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.company.api.dto.CompanyDetailResponse;
import com.indusync.indusync_backend.company.api.dto.UpdateCompanyRequest;
import com.indusync.indusync_backend.company.api.dto.CompanyDocument;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.time.LocalDateTime;
import com.indusync.indusync_backend.authentication.application.service.UserLookupService;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;

/**
 * Service for handling company management operations.
 * <p>
 * This service provides functionality for:
 * - Company updates
 * - Company search and filtering
 * - Geographic search
 * - Public company information
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CompanyManagementService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final UserLookupService userLookupService;

    /**
     * Updates company information.
     *
     * @param companyId the company ID to update
     * @param request   the update request
     * @param userId    the user performing the update
     * @return updated company details
     * @throws CompanyNotFoundException    if company is not found
     * @throws UnauthorizedAccessException if user cannot update the company
     */
    @CacheEvict(value = {"companyPublic", "companyContactEmail", "companyName", "companySearch", "companyNearby"}, allEntries = true)
    public CompanyDetailResponse updateCompany(UUID companyId, UpdateCompanyRequest request, UUID userId) {
        log.info("Updating company: {} by user: {}", companyId, userId);

        // Verify company exists
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Verify the user has permission to update
        verifyUpdatePermission(companyId, userId);

        // Update fields from request
        if (request.getName() != null) {
            company.setName(request.getName());
        }
        if (request.getDescription() != null) {
            company.setDescription(request.getDescription());
        }
        if (request.getWebsite() != null) {
            company.setWebsite(request.getWebsite());
        }
        if (request.getContactPhone() != null) {
            company.setContactPhone(request.getContactPhone());
        }
        if (request.getBusinessHours() != null) {
            company.setBusinessHours(request.getBusinessHours());
        }
        if (request.getWorkRadiusKm() != null) {
            company.setWorkRadiusKm(request.getWorkRadiusKm());
        }
        if (request.getSpecializations() != null) {
            company.setSpecializations(request.getSpecializations());
        }
        if (request.getIndustries() != null) {
            company.setIndustries(request.getIndustries());
        }
        if (request.getOrderCategories() != null) {
            company.setOrderCategories(request.getOrderCategories());
        }
        if (request.getIsAuftraggeber() != null) {
            company.setIsAuftraggeber(request.getIsAuftraggeber());
        }
        if (request.getIsAuftragnehmer() != null) {
            company.setIsAuftragnehmer(request.getIsAuftragnehmer());
        }
        if (request.getLogoUrl() != null) {
            company.setLogoUrl(request.getLogoUrl());
        }
        if (request.getContactEmail() != null) {
            company.setContactEmail(request.getContactEmail());
        }
        // Save updated company
        company = companyRepository.save(company);

        log.info("Company updated successfully: {}", companyId);

        return CompanyDetailResponse.from(company);
    }

    /**
     * Searches companies based on criteria.
     *
     * @param name            company name filter (optional)
     * @param city            city filter (optional)
     * @param specialization  specialization filter (optional)
     * @param isAuftragnehmer provider filter (optional)
     * @param page            page number
     * @param size            page size
     * @return search results
     */
    @Cacheable(value = "companySearch", key = "#name + ':' + #city + ':' + #specialization + ':' + #isAuftragnehmer + ':' + #page + ':' + #size")
    @Transactional(readOnly = true)
    public CompanySearchResponse searchCompanies(String name, String city, String specialization,
            Boolean isAuftragnehmer, int page, int size) {
        log.info("Searching companies with filters - name: {}, city: {}, specialization: {}, isAuftragnehmer: {}",
                name, city, specialization, isAuftragnehmer);

        Pageable pageable = PageRequest.of(page, size);
        Page<Company> companies;

        if (specialization != null && !specialization.trim().isEmpty()) {
            // Use specialization-specific search
            companies = companyRepository.findBySpecialization(specialization.trim(), pageable);
        } else if (city != null && !city.trim().isEmpty()) {
            // Use city-specific search
            companies = companyRepository.findByCity(city.trim(), pageable);
        } else if (name != null && !name.trim().isEmpty()) {
            // Use name search
            companies = companyRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        } else {
            // Use advanced filters
            companies = companyRepository.findWithFilters(
                    name, city, null, null, isAuftragnehmer, null, pageable);
        }

        List<CompanySearchResult> results = companies.getContent().stream()
                .map(this::mapToSearchResult)
                .collect(Collectors.toList());

        return CompanySearchResponse.builder()
                .companies(results)
                .totalElements(companies.getTotalElements())
                .totalPages(companies.getTotalPages())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    /**
     * Finds companies within a geographic radius.
     *
     * @param lat      latitude
     * @param lng      longitude
     * @param radiusKm radius in kilometers
     * @param page     page number
     * @param size     page size
     * @return companies within radius
     */
    @Cacheable(value = "companyNearby", key = "#lat + ':' + #lng + ':' + #radiusKm + ':' + #page + ':' + #size")
    @Transactional(readOnly = true)
    public CompanySearchResponse findNearbyCompanies(double lat, double lng, double radiusKm, int page, int size) {
        log.info("Finding nearby companies for location: {}, {} with radius: {} km", lat, lng, radiusKm);

        Pageable pageable = PageRequest.of(page, size);
        List<Company> companies = companyRepository.findServiceProvidersWithinRadius(lat, lng, radiusKm, pageable);

        List<CompanySearchResult> results = companies.stream()
                .map(this::mapToSearchResult)
                .collect(Collectors.toList());

        // Calculate total pages (Note: this is a simplified calculation)
        int totalPages = (int) Math.ceil((double) results.size() / size);

        return CompanySearchResponse.builder()
                .companies(results)
                .totalElements((long) results.size())
                .totalPages(totalPages)
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    /**
     * Gets comprehensive company information for admins or company owners.
     * This includes all company data including sensitive information.
     *
     * @param companyId the company ID
     * @param userId    the requesting user ID
     * @return comprehensive company information
     * @throws CompanyNotFoundException    if company is not found
     * @throws UnauthorizedAccessException if user doesn't have permission
     */
    public ComprehensiveCompanyInfo getComprehensiveCompanyInfo(UUID companyId, UUID userId) {
        log.info("Getting comprehensive company info for ID: {} by user: {}", companyId, userId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Verify user has permission to view comprehensive data
        verifyViewPermission(companyId, userId);

        // Get all company members
        // List<CompanyMember> members =
        // companyMemberRepository.findByCompanyIdAndActiveTrue(companyId);

        return ComprehensiveCompanyInfo.builder()
                .companyId(company.getId())
                .name(company.getName())
                .companyType(company.getCompanyType())
                .status(company.getStatus())
                .verified(company.getVerified())
                .verifiedAt(company.getVerifiedAt())
                .verifiedBy(company.getVerifiedBy())

                // Contact and address information
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .website(company.getWebsite())
                .address(company.getAddress())
                .location(company.getLocation())

                // Business information
                .description(company.getDescription())
                .businessHours(company.getBusinessHours())
                .workRadiusKm(company.getWorkRadiusKm())
                .specializations(company.getSpecializations())
                .industries(company.getIndustries())
                .orderCategories(company.getOrderCategories())
                .certifications(company.getCertifications())
                .verificationDocumentUrl(company.getVerificationDocumentUrl())

                // Business roles and capabilities
                .isAuftraggeber(company.getIsAuftraggeber())
                .isAuftragnehmer(company.getIsAuftragnehmer())

                // Financial and legal information
                .foundedYear(company.getFoundedYear())
                .employeeCount(company.getEmployeeCount())
                .annualRevenue(company.getAnnualRevenue())
                .taxId(company.getTaxId())
                .registrationNumber(company.getRegistrationNumber())
                .vatNumber(company.getVatNumber())
                .insuranceCoverage(company.getInsuranceCoverage())

                // Performance metrics
                .qualityScore(company.getQualityScore())
                .completionRate(company.getCompletionRate())
                .averageResponseHours(company.getAverageResponseHours())
                .totalOrdersCompleted(null)
                .totalOrdersReceived(null)

                // Media and branding
                .logoUrl(company.getLogoUrl())

                // System information
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt())
                .createdBy(company.getCreatedBy())
                .updatedBy(company.getUpdatedBy())

                // Company members
                // .totalMembers(members.size())
                // .members(members.stream().map(this::mapToMemberInfo).collect(Collectors.toList()))

                // Company documents
                .documents(mapCompanyDocuments(company))

                .build();
    }

    /**
     * Gets public company information (no authentication required).
     *
     * @param companyId the company ID
     * @return public company information
     * @throws CompanyNotFoundException if company is not found
     */
    @Cacheable(value = "companyPublic", key = "#companyId")
    @Transactional(readOnly = true)
    public PublicCompanyInfo getPublicCompanyInfo(UUID companyId) {
        log.info("Getting public company info for ID: {}", companyId);

        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Only return public information with proper null handling
        return PublicCompanyInfo.builder()
                .companyId(company.getId())
                .name(company.getName())
                .companyType(company.getCompanyType())
                .description(company.getDescription())
                .website(company.getWebsite())
                .city(company.getAddress() != null ? company.getAddress().getCity() : null)
                .isAuftraggeber(company.getIsAuftraggeber())
                .isAuftragnehmer(company.getIsAuftragnehmer())
                .specializations(
                        company.getSpecializations() != null ? company.getSpecializations() : new ArrayList<>())
                .industries(company.getIndustries() != null ? company.getIndustries() : new ArrayList<>())
                .verified(company.getVerified())
                .foundedYear(company.getFoundedYear())
                .employeeCount(company.getEmployeeCount())
                .logoUrl(company.getLogoUrl())

                // Additional fields with proper null handling and data validation
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .businessHours(company.getBusinessHours())
                .vatNumber(company.getVatNumber())
                .address(company.getAddress())
                .createdAt(company.getCreatedAt())
                .qualityScore(company.getQualityScore())
                .completionRate(company.getCompletionRate())
                .insuranceCoverage(company.getInsuranceCoverage() != null ? company.getInsuranceCoverage() : false)

                // Integrate company documents using existing mapCompanyDocuments method
                .documents(mapCompanyDocuments(company))
                .build();
    }

    /**
     * Updates company logo URL.
     *
     * @param companyId the company ID
     * @param logoUrl   the URL of the uploaded logo
     * @param userId    the user ID making the request
     * @return updated company details
     * @throws CompanyNotFoundException    if company not found
     * @throws UnauthorizedAccessException if user isn't authorized
     */
    @CacheEvict(value = {"companyPublic", "companyContactEmail", "companyName", "companySearch", "companyNearby"}, allEntries = true)
    public CompanyDetailResponse updateCompanyLogo(UUID companyId, String logoUrl, Optional<UUID> userId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        if (userId.isEmpty()) {
            throw new UnauthorizedAccessException("Keine Berechtigung zum Bearbeiten des Unternehmens");
        }

        // Verify user has permission to update this company
        verifyUpdatePermission(companyId, userId.get());

        // Update the logo URL
        company.setLogoUrl(logoUrl);
        companyRepository.save(company);

        log.info("Company logo updated for companyId: {}", companyId);

        // Return updated company details
        return CompanyDetailResponse.from(company);
    }

    /**
     * Returns the best contact email for a company: contactEmail, then primary
     * contact, then owner, then any active member.
     */
    @Cacheable(value = "companyContactEmail", key = "#companyId")
    @Transactional(readOnly = true)
    public String getBestContactEmail(UUID companyId) {
        // 1. Try company contactEmail
        String contactEmail = companyRepository.findById(companyId)
                .map(Company::getContactEmail)
                .filter(email -> !email.isBlank())
                .orElse(null);
        if (contactEmail != null)
            return contactEmail;

        // 2. Try primary contact
        return companyMemberRepository.findPrimaryContact(companyId)
                .flatMap(cm -> getUserEmail(cm.getUserId()))
                .orElseGet(() ->
                // 3. Try an owner
                companyMemberRepository.findOwnerByCompanyId(companyId)
                        .flatMap(cm -> getUserEmail(cm.getUserId()))
                        .orElseGet(() ->
                        // 4. Try any active member
                        companyMemberRepository
                                .findByCompanyIdAndActiveTrue(companyId,
                                        org.springframework.data.domain.Pageable.unpaged())
                                .stream()
                                .findFirst()
                                .flatMap(cm -> getUserEmail(cm.getUserId()))
                                .orElse(null)));
    }

    /**
     * Returns the company name for a given companyId, or "Unbekannt" if not found.
     */
    @Cacheable(value = "companyName", key = "#companyId")
    @Transactional(readOnly = true)
    public String getCompanyName(UUID companyId) {
        return companyRepository.findById(companyId)
                .map(Company::getName)
                .orElse("Unbekannt");
    }

    // Helper to get user email by userId
    private Optional<String> getUserEmail(UUID userId) {
        return userLookupService.getUserEmail(userId);
    }

    /**
     * Verifies that a user has permission to update a company.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @throws UnauthorizedAccessException if user doesn't have permission
     */
    private void verifyUpdatePermission(UUID companyId, UUID userId) {
        Optional<CompanyMember> membership = companyMemberRepository.findByCompanyIdAndUserId(companyId, userId);

        boolean hasPermission = membership.isPresent() &&
                membership.get().getActive() &&
                (membership.get().getRole() == CompanyMemberRole.OWNER ||
                        membership.get().getCanManageCompanySettings());

        if (!hasPermission) {
            throw new UnauthorizedAccessException("Keine Berechtigung zum Bearbeiten des Unternehmens");
        }
    }

    /**
     * Verifies that a user has permission to view comprehensive company
     * information.
     * This allows owners, managers, and admins to view all company data.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @throws UnauthorizedAccessException if user doesn't have permission
     */
    private void verifyViewPermission(UUID companyId, UUID userId) {
        Optional<CompanyMember> membership = companyMemberRepository.findByCompanyIdAndUserId(companyId, userId);

        boolean hasPermission = membership.isPresent() &&
                membership.get().getActive() &&
                (membership.get().getRole() == CompanyMemberRole.OWNER ||
                        membership.get().getRole() == CompanyMemberRole.MANAGER ||
                        membership.get().getCanViewFinancials() ||
                        membership.get().getCanManageCompanySettings());

        if (!hasPermission) {
            throw new UnauthorizedAccessException("Keine Berechtigung zum Anzeigen der Unternehmensdaten");
        }
    }

    @Cacheable(value = "companyName", key = "#companyId")
    @Transactional(readOnly = true)
    public String findCompanyNameById(UUID companyId) {
        var company = companyRepository.findById(companyId);
        return company.map(Company::getName).orElse(null);
    }

    /**
     * Maps a CompanyMember entity to member info DTO.
     *
     * @param member the company member entity
     * @return member info DTO
     */
    private MemberInfo mapToMemberInfo(CompanyMember member) {
        return MemberInfo.builder()
                .memberId(member.getId())
                .userId(member.getUserId())
                .role(member.getRole())
                .isPrimaryContact(member.getIsPrimaryContact())
                .canCreateOrders(member.getCanCreateOrders())
                .canManageEmployees(member.getCanManageEmployees())
                .canAssignProjects(member.getCanAssignProjects())
                .canViewFinancials(member.getCanViewFinancials())
                .canManageCompanySettings(member.getCanManageCompanySettings())
                .joinedAt(member.getJoinedAt())
                .active(member.getActive())
                .build();
    }

    /**
     * Maps a Company entity to a search result.
     *
     * @param company the company entity
     * @return search result DTO
     */
    private CompanySearchResult mapToSearchResult(Company company) {
        return CompanySearchResult.builder()
                .companyId(company.getId())
                .name(company.getName())
                .companyType(company.getCompanyType())
                .description(company.getDescription())
                .city(company.getAddress() != null ? company.getAddress().getCity() : null)
                .isAuftraggeber(company.getIsAuftraggeber())
                .isAuftragnehmer(company.getIsAuftragnehmer())
                .verified(company.getVerified())
                .qualityScore(company.getQualityScore())
                .logoUrl(company.getLogoUrl())
                .build();
    }

    /**
     * Maps company document fields to a list of CompanyDocument DTOs.
     * <p>
     * This method converts the various document-related fields in the Company
     * entity
     * (verificationDocumentUrl, certificatesDocumentUrl, and certifications list of
     * URLs)
     * into a structured list of document objects for frontend consumption.
     * </p>
     *
     * @param company the company entity containing document information
     * @return list of CompanyDocument DTOs
     */
    private List<CompanyDocument> mapCompanyDocuments(Company company) {
        List<CompanyDocument> documents = new ArrayList<>();

        // Map verification document URL
        if (company.getVerificationDocumentUrl() != null && !company.getVerificationDocumentUrl().trim().isEmpty()) {
            documents.add(CompanyDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .type(CompanyDocument.DocumentType.VERIFICATION)
                    .name("Company Verification Document")
                    .url(company.getVerificationDocumentUrl())
                    .uploadedAt(company.getCreatedAt()) // Use company creation date as fallback
                    .category(CompanyDocument.DocumentType.VERIFICATION.getCategory())
                    .build());
        }

        // Map certifications list items (URLs)
        if (company.getCertifications() != null && !company.getCertifications().isEmpty()) {
            for (int i = 0; i < company.getCertifications().size(); i++) {
                String certificationUrl = company.getCertifications().get(i);
                if (certificationUrl != null && !certificationUrl.trim().isEmpty()) {
                    documents.add(CompanyDocument.builder()
                            .id(UUID.randomUUID().toString())
                            .type(CompanyDocument.DocumentType.CERTIFICATION_ITEM)
                            .name("Certification Document " + (i + 1))
                            .url(certificationUrl.trim())
                            .uploadedAt(company.getCreatedAt())
                            .category(CompanyDocument.DocumentType.CERTIFICATION_ITEM.getCategory())
                            .build());
                }
            }
        }

        return documents;
    }

    // Response DTOs

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CompanySearchResponse {
        private List<CompanySearchResult> companies;
        private long totalElements;
        private int totalPages;
        private int currentPage;
        private int pageSize;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class CompanySearchResult {
        private UUID companyId;
        private String name;
        private CompanyType companyType;
        private String description;
        private String city;
        private Boolean isAuftraggeber;
        private Boolean isAuftragnehmer;
        private Boolean verified;
        private Double qualityScore;
        private String logoUrl;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ComprehensiveCompanyInfo {
        // Basic information
        private UUID companyId;
        private String name;
        private CompanyType companyType;
        private com.indusync.indusync_backend.shared.domain.enums.CompanyStatus status;
        private Boolean verified;
        private java.time.LocalDateTime verifiedAt;
        private UUID verifiedBy;

        // Contact and location
        private String contactEmail;
        private String contactPhone;
        private String website;
        private com.indusync.indusync_backend.shared.domain.valueobjects.Address address;
        private com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation location;

        // Business information
        private String description;
        private String businessHours;
        private Integer workRadiusKm;
        private List<String> specializations;
        private List<String> industries;
        private List<String> orderCategories;
        private List<String> certifications;
        private String verificationDocumentUrl;

        // Business roles
        private Boolean isAuftraggeber;
        private Boolean isAuftragnehmer;

        // Financial and legal
        private Integer foundedYear;
        private Integer employeeCount;
        private Long annualRevenue;
        private String taxId;
        private String registrationNumber;
        private String vatNumber;
        private Boolean insuranceCoverage;

        // Performance metrics
        private Double qualityScore;
        private Double completionRate;
        private Integer averageResponseHours;
        private Integer totalOrdersCompleted;
        private Integer totalOrdersReceived;

        // Media
        private String logoUrl;

        // System information
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime updatedAt;
        private UUID createdBy;
        private UUID updatedBy;

        // Company members
        private Integer totalMembers;
        private List<MemberInfo> members;

        // Company documents
        private List<CompanyDocument> documents;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class MemberInfo {
        private UUID memberId;
        private UUID userId;
        private CompanyMemberRole role;
        private Boolean isPrimaryContact;
        private Boolean canCreateOrders;
        private Boolean canManageEmployees;
        private Boolean canAssignProjects;
        private Boolean canViewFinancials;
        private Boolean canManageCompanySettings;
        private java.time.LocalDateTime joinedAt;
        private Boolean active;
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PublicCompanyInfo {
        private UUID companyId;
        private String name;
        private CompanyType companyType;
        private String description;
        private String website;
        private String city;
        private Boolean isAuftraggeber;
        private Boolean isAuftragnehmer;
        private List<String> specializations;
        private List<String> industries;
        private Boolean verified;
        private Integer foundedYear;
        private Integer employeeCount;
        private String logoUrl;

        // Additional fields as per requirements
        private String contactEmail;
        private String contactPhone;
        private String businessHours;
        private String vatNumber;
        private Address address;
        private LocalDateTime createdAt;
        private Double qualityScore;
        private Double completionRate;
        private Boolean insuranceCoverage;
        private List<CompanyDocument> documents;
    }

    // Exception classes (reusing from CompanyRegistrationService pattern)

    public static class CompanyNotFoundException extends RuntimeException {
        public CompanyNotFoundException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedAccessException extends RuntimeException {
        public UnauthorizedAccessException(String message) {
            super(message);
        }
    }
}