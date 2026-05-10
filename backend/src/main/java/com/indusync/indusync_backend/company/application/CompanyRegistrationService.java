package com.indusync.indusync_backend.company.application;

import com.indusync.indusync_backend.company.api.dto.CompanyDocument;
import com.indusync.indusync_backend.company.application.dto.CompanyRegistrationResponse;
import com.indusync.indusync_backend.company.application.dto.RegisterCompanyCommand;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.domain.events.UserRegisteredEvent;
import com.indusync.indusync_backend.company.application.CompanyRegisteredEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service for handling company registration operations.
 * <p>
 * This service provides event-driven company management without direct
 * dependencies on authentication module entities, maintaining proper
 * module boundaries.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CompanyRegistrationService {

    private final CompanyRepository companyRepository;
    private final CompanyMemberRepository companyMemberRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Registers a new company for a business user.
     * This method creates a new company with the provided details.
     *
     * @param command the registration command containing company details
     * @return company registration response
     */
    public CompanyRegistrationResponse registerCompany(RegisterCompanyCommand command) {
        log.info("Attempting to register company: {} for user: {}",
                command.getCompanyName(), command.getUserId());

        try {
            // Create a company entity
            Company company = Company.builder()
                    .name(command.getCompanyName())
                    .companyType(command.getCompanyType())
                    .taxId(command.getTaxId())
                    .registrationNumber(command.getRegistrationNumber())
                    .address(command.getAddress())
                    .website(command.getWebsite())
                    .description(command.getDescription())
                    .workRadiusKm(command.getWorkRadiusKm())
                    .specializations(command.getSpecializations())
                    .industries(command.getIndustries())
                    .orderCategories(command.getOrderCategories())
                    .isAuftraggeber(command.getIsAuftraggeber())
                    .isAuftragnehmer(command.getIsAuftragnehmer())
                    .contactEmail(command.getContactEmail())
                    .contactPhone(command.getContactPhone())
                    .businessHours(command.getBusinessHours())
                    .foundedYear(command.getFoundedYear())
                    .employeeCount(command.getEmployeeCount())
                    .annualRevenue(command.getAnnualRevenue())
                    .vatNumber(command.getVatNumber())
                    .certifications(command.getCertifications())
                    .insuranceCoverage(command.getInsuranceCoverage())
                    .logoUrl(command.getLogoUrl())
                    .build();

            company = companyRepository.save(company);

            // Create company member relationship
            CompanyMember ownerMembership = CompanyMember.builder()
                    .companyId(company.getId())
                    .userId(command.getUserId())
                    .role(CompanyMemberRole.OWNER)
                    .isPrimaryContact(true)
                    .canCreateOrders(true)
                    .canManageEmployees(true)
                    .canAssignProjects(true)
                    .canViewFinancials(true)
                    .canManageCompanySettings(true)
                    .joinedAt(LocalDateTime.now())
                    .active(true)
                    .build();

            companyMemberRepository.save(ownerMembership);

            log.info("Company registered successfully: {} (ID: {})",
                    company.getName(), company.getId());

            // Emit domain event
            eventPublisher.publishEvent(new CompanyRegisteredEvent(
                    company.getId(),
                    command.getUserId(),
                    company.getName(),
                    determineBusinessRole(command)));

            return CompanyRegistrationResponse.builder()
                    .companyId(company.getId())
                    .companyName(company.getName())
                    .status(company.getStatus())
                    .membershipRole(CompanyMemberRole.OWNER)
                    .documents(mapCompanyDocuments(company))
                    .message("Unternehmen erfolgreich registriert")
                    .build();

        } catch (Exception e) {
            log.error("Error registering company: {}", command.getCompanyName(), e);
            return CompanyRegistrationResponse.builder()
                    .message("Fehler bei der Unternehmensregistrierung: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Creates a default company from user registration event data.
     * This method supports event-driven architecture by working with event data
     * instead of direct User entity references.
     *
     * @param event the user registration event containing user details
     * @return company registration response
     */
    public CompanyRegistrationResponse createDefaultCompanyFromEvent(UserRegisteredEvent event) {
        log.info("Creating default company from event for user: {}", event.email());

        try {
            // Determine company name
            String companyName = determineCompanyNameFromEvent(event);

            // Determine a company type
            CompanyType companyType = determineCompanyTypeFromEvent(event);

            // Build address if provided
            com.indusync.indusync_backend.shared.domain.valueobjects.Address address = null;
            if (event.street() != null || event.city() != null) {
                address = com.indusync.indusync_backend.shared.domain.valueobjects.Address.builder()
                        .street(event.street())
                        .houseNumber(event.houseNumber())
                        .postalCode(event.postalCode())
                        .city(event.city())
                        .country(event.country())
                        .build();
            }

            // Build location if provided
            com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation location = null;
            if (event.latitude() != null && event.longitude() != null) {
                location = com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation.of(
                        event.latitude(), event.longitude());
            }

            // Determine business roles
            Boolean isAuftraggeber = event.companyTypeAuftraggeber() != null ? event.companyTypeAuftraggeber() : true; // Default
                                                                                                                       // to
                                                                                                                       // client
                                                                                                                       // role
            Boolean isAuftragnehmer = event.companyTypeAuftragnehmer() != null ? event.companyTypeAuftragnehmer()
                    : false;

            List<String> certifications = new java.util.ArrayList<>();
            if (event.companyCertificatesFile() != null && !event.companyCertificatesFile().isEmpty()) {
                certifications.add(event.companyCertificatesFile());
            }

            // Create company entity with comprehensive event data
            Company company = Company.builder()
                    .name(companyName)
                    .companyType(companyType)
                    .taxId(event.taxId())
                    .registrationNumber(event.registrationNumber())
                    .address(address)
                    .location(location)
                    .website(event.website())
                    .description(event.description() != null ? event.description() : event.companyDescription())
                    .workRadiusKm(event.workRadiusKm())
                    .specializations(event.specializations())
                    .industries(event.industries())
                    .orderCategories(event.orderCategories())
                    .isAuftraggeber(isAuftraggeber)
                    .isAuftragnehmer(isAuftragnehmer)
                    .contactEmail(event.contactEmail() != null ? event.contactEmail() : event.email())
                    .contactPhone(event.contactPhone() != null ? event.contactPhone() : event.phone())
                    .employeeCount(event.employeeCount())
                    .status(CompanyStatus.ACTIVE)
                    .certifications(certifications)
                    .verificationDocumentUrl(event.companyVerificationFile())
                    .build();

            // Temporal verification
            company.verify(event.userId());

            company = companyRepository.save(company);

            // Create owner membership using event data
            CompanyMember ownerMembership = CompanyMember.builder()
                    .companyId(company.getId())
                    .userId(event.userId())
                    .role(CompanyMemberRole.OWNER)
                    .isPrimaryContact(true)
                    .canCreateOrders(true)
                    .canManageEmployees(true)
                    .canAssignProjects(true)
                    .canViewFinancials(true)
                    .canManageCompanySettings(true)
                    .joinedAt(LocalDateTime.now())
                    .active(true)
                    .build();

            companyMemberRepository.save(ownerMembership);

            log.info("Default company created successfully: {} (ID: {})",
                    company.getName(), company.getId());

            // Emit domain event for company registration
            eventPublisher.publishEvent(new CompanyRegisteredEvent(
                    company.getId(),
                    event.userId(),
                    company.getName(),
                    company.getIsAuftraggeber() && company.getIsAuftragnehmer() ? "BOTH"
                            : company.getIsAuftraggeber() ? "CLIENT" : "PROVIDER"));

            return CompanyRegistrationResponse.builder()
                    .companyId(company.getId())
                    .companyName(company.getName())
                    .status(company.getStatus())
                    .membershipRole(CompanyMemberRole.OWNER)
                    .documents(mapCompanyDocuments(company))
                    .message("Standardunternehmen erfolgreich erstellt")
                    .build();

        } catch (Exception e) {
            log.error("Error creating default company from event", e);
            return CompanyRegistrationResponse.builder()
                    .message("Fehler beim Erstellen des Standardunternehmens: " + e.getMessage())
                    .build();
        }
    }

    /**
     * Determines the business role from registration command.
     */
    private String determineBusinessRole(RegisterCompanyCommand command) {
        boolean isProvider = Boolean.TRUE.equals(command.getIsAuftragnehmer());
        boolean isClient = Boolean.TRUE.equals(command.getIsAuftraggeber());

        if (isProvider && isClient)
            return "BOTH";
        if (isProvider)
            return "PROVIDER";
        return "CLIENT";
    }

    /**
     * Determines company name from user registration event.
     */
    private String determineCompanyNameFromEvent(UserRegisteredEvent event) {
        // Use company name from event if provided
        if (event.companyName() != null && !event.companyName().trim().isEmpty()) {
            return event.companyName().trim();
        }

        // Generate the default name from user details
        StringBuilder nameBuilder = new StringBuilder();

        if (event.firstName() != null && !event.firstName().trim().isEmpty()) {
            nameBuilder.append(event.firstName().trim());
        }

        if (event.lastName() != null && !event.lastName().trim().isEmpty()) {
            if (nameBuilder.length() > 0) {
                nameBuilder.append(" ");
            }
            nameBuilder.append(event.lastName().trim());
        }

        if (nameBuilder.length() > 0) {
            nameBuilder.append(" - Unternehmen");
        } else {
            nameBuilder.append("Mein Unternehmen");
        }

        return nameBuilder.toString();
    }

    /**
     * Determines company type from user registration event.
     */
    private CompanyType determineCompanyTypeFromEvent(UserRegisteredEvent event) {
        if (event.companyType() != null && !event.companyType().trim().isEmpty()) {
            try {
                return CompanyType.valueOf(event.companyType().toUpperCase());
            } catch (IllegalArgumentException e) {
                log.warn("Invalid company type in event: {}, using default", event.companyType());
            }
        }

        return CompanyType.EINZELUNTERNEHMEN; // Default
    }

    /**
     * Maps company document fields to a list of CompanyDocument DTOs.
     * <p>
     * This method converts the various document-related fields in the Company
     * entity
     * (verificationDocumentUrl, certificatesDocumentUrl, and certifications list)
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

        // Map certifications list items
        if (company.getCertifications() != null && !company.getCertifications().isEmpty()) {
            for (int i = 0; i < company.getCertifications().size(); i++) {
                String certification = company.getCertifications().get(i);
                if (certification != null && !certification.trim().isEmpty()) {
                    documents.add(CompanyDocument.builder()
                            .id(UUID.randomUUID().toString())
                            .type(CompanyDocument.DocumentType.CERTIFICATION_ITEM)
                            .name(certification.trim())
                            .url(null) // Certification items are text-based, no URL
                            .uploadedAt(company.getCreatedAt())
                            .category(CompanyDocument.DocumentType.CERTIFICATION_ITEM.getCategory())
                            .build());
                }
            }
        }

        return documents;
    }

    /**
     * Gets company details for the authenticated user's current company.
     *
     * @param companyId the company ID to retrieve
     * @param userId    the authenticated user ID
     * @return company details
     * @throws CompanyNotFoundException    if company is not found
     * @throws UnauthorizedAccessException if user doesn't have access to the
     *                                     company
     */
    public CompanyRegistrationResponse getCompanyProfile(UUID companyId, UUID userId) {
        log.info("Getting company profile for company ID: {} and user ID: {}", companyId, userId);

        // Check if company exists
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new CompanyNotFoundException("Unternehmen nicht gefunden"));

        // Check if user has access to this company
        boolean hasAccess = companyMemberRepository.existsByCompanyIdAndUserIdAndActiveTrue(companyId, userId);
        if (!hasAccess) {
            log.warn("User {} does not have access to company {}", userId, companyId);
            throw new UnauthorizedAccessException("Kein Zugriff auf dieses Unternehmen");
        }

        log.info("Company profile retrieved successfully: {} (ID: {})", company.getName(), companyId);

        // Build response with company details including documents
        return CompanyRegistrationResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .status(company.getStatus())
                .membershipRole(CompanyMemberRole.OWNER) // Get actual role from membership
                .documents(mapCompanyDocuments(company))
                .message("Unternehmensprofil erfolgreich abgerufen")
                .build();
    }

    // Exception classes for this service
    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public static class InvalidAccountTypeException extends RuntimeException {
        public InvalidAccountTypeException(String message) {
            super(message);
        }
    }

    public static class CompanyAlreadyExistsException extends RuntimeException {
        public CompanyAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class MembershipAlreadyExistsException extends RuntimeException {
        public MembershipAlreadyExistsException(String message) {
            super(message);
        }
    }

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