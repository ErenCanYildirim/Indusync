package com.indusync.indusync_backend.company.api;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.company.application.CompanyRegistrationService;
import com.indusync.indusync_backend.company.application.CompanyRoleManagementService;
import com.indusync.indusync_backend.company.application.dto.RegisterCompanyCommand;
import com.indusync.indusync_backend.company.application.dto.CompanyRegistrationResponse;
import com.indusync.indusync_backend.company.api.dto.RegisterCompanyRequest;
import com.indusync.indusync_backend.company.api.dto.CompanyDetailResponse;
import com.indusync.indusync_backend.company.api.dto.UpdateCompanyRequest;
import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.company.api.dto.CompanyRoleAdditionResponse;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.infrastructure.FileStorageService;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

/**
 * REST controller for company management operations.
 * <p>
 * This controller provides endpoints for:
 * - Company registration
 * - Company information retrieval
 * - Company updates
 * - Member management
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/companies")
@Slf4j
public class CompanyController extends BaseController {

    private final CompanyRegistrationService companyRegistrationService;
    private final CompanyMemberRepository companyMemberRepository;
    private final CompanyManagementService companyManagementService;
    private final CompanyRoleManagementService companyRoleManagementService;
    private final FileStorageService fileStorageService;

    public CompanyController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            CompanyRegistrationService companyRegistrationService,
            CompanyMemberRepository companyMemberRepository,
            CompanyManagementService companyManagementService,
            CompanyRoleManagementService companyRoleManagementService,
            FileStorageService fileStorageService) {
        super(authHelper, responseHelper);
        this.companyRegistrationService = companyRegistrationService;
        this.companyMemberRepository = companyMemberRepository;
        this.companyManagementService = companyManagementService;
        this.companyRoleManagementService = companyRoleManagementService;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Registers a new company for a business user.
     *
     * @param request        the company registration request
     * @param authentication the authenticated user
     * @return the registration response
     */
    @PostMapping("/register")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CompanyRegistrationResponse> registerCompany(
            @Valid @RequestBody RegisterCompanyRequest request,
            Authentication authentication) {

        log.info("Company registration request received for: {}", request.getCompanyName());

        try {
            UUID userId = getUserIdFromAuthentication(authentication);

            // Build the registration command
            RegisterCompanyCommand command = RegisterCompanyCommand.builder()
                    .userId(userId)
                    .companyName(request.getCompanyName())
                    .companyType(CompanyType.valueOf(request.getCompanyType().toUpperCase()))
                    .taxId(request.getTaxId())
                    .registrationNumber(request.getRegistrationNumber())
                    .address(buildAddress(request))
                    .contactEmail(request.getContactEmail())
                    .contactPhone(request.getContactPhone())
                    .website(request.getWebsite())
                    .description(request.getDescription())
                    .workRadiusKm(request.getWorkRadiusKm())
                    .specializations(request.getSpecializations())
                    .industries(request.getIndustries())
                    .orderCategories(request.getOrderCategories())
                    .isAuftraggeber(request.getIsAuftraggeber())
                    .isAuftragnehmer(request.getIsAuftragnehmer())
                    .businessHours(request.getBusinessHours())
                    .foundedYear(request.getFoundedYear())
                    .employeeCount(request.getEmployeeCount())
                    .annualRevenue(request.getAnnualRevenue())
                    .vatNumber(request.getVatNumber())
                    .certifications(request.getCertifications())
                    .insuranceCoverage(request.getInsuranceCoverage())
                    .logoUrl(request.getLogoUrl())
                    .build();

            CompanyRegistrationResponse response = companyRegistrationService.registerCompany(command);
            log.info("Company registered successfully: {} (ID: {})",
                    response.getCompanyName(), response.getCompanyId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (CompanyRegistrationService.UserNotFoundException e) {
            log.warn("User not found during company registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(CompanyRegistrationResponse.error("Benutzer nicht gefunden"));

        } catch (CompanyRegistrationService.InvalidAccountTypeException e) {
            log.warn("Invalid account type for company registration: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(CompanyRegistrationResponse.error("Nur Geschäftskunden können Unternehmen registrieren"));

        } catch (CompanyRegistrationService.CompanyAlreadyExistsException e) {
            log.warn("Company name already exists: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(CompanyRegistrationResponse.error("Unternehmen mit diesem Namen existiert bereits"));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid company type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(CompanyRegistrationResponse.error("Ungültige Unternehmensform"));

        } catch (Exception e) {
            log.error("Unexpected error during company registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CompanyRegistrationResponse.error("Ein unerwarteter Fehler ist aufgetreten"));
        }
    }

    /**
     * Retrieves company details by ID.
     *
     * @param companyId      the company ID
     * @param authentication the authenticated user
     * @return the company details
     */
    @GetMapping("/{companyId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CompanyRegistrationResponse> getCompany(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("Company details requested for ID: {}", companyId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            // Use a separate cached method for the actual business logic
            CompanyRegistrationResponse response = getCachedCompanyDetails(companyId, userId);
            return ResponseEntity.ok(response);

        } catch (CompanyRegistrationService.CompanyNotFoundException e) {
            log.warn("Company not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(CompanyRegistrationResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (CompanyRegistrationService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(CompanyRegistrationResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (Exception e) {
            log.error("Error retrieving company details for ID: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CompanyRegistrationResponse.builder()
                            .message("Ein unerwarteter Fehler ist aufgetreten")
                            .build());
        }
    }

    /**
     * Cached method for getting company details - separates caching logic from HTTP handling
     */
    @Cacheable(value = "companyDetails", key = "#companyId")
    public CompanyRegistrationResponse getCachedCompanyDetails(UUID companyId, UUID userId) {
        return companyRegistrationService.getCompanyProfile(companyId, userId);
    }

    /**
     * Retrieves the current user's company profile.
     * This is a convenience endpoint that uses the currentCompanyId from the JWT
     * token.
     *
     * @param authentication the authenticated user
     * @return the company details
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCurrentCompanyProfile(Authentication authentication) {
        log.info("Current company profile requested");

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            String username = authentication.getName();

            // Use a separate cached method for the actual business logic
            Object profileData = getCachedUserCompanyProfile(userId, username);
            return ResponseEntity.ok(profileData);

        } catch (CompanyRegistrationService.CompanyNotFoundException e) {
            log.warn("Current company not found: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(CompanyRegistrationResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (CompanyRegistrationService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to current company: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(CompanyRegistrationResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (Exception e) {
            log.error("Error retrieving current company profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CompanyRegistrationResponse.builder()
                            .message("Ein unerwarteter Fehler ist aufgetreten")
                            .build());
        }
    }

    /**
     * Cached method for getting user company profile - separates caching logic from HTTP handling
     */
    @Cacheable(value = "userCompanyProfile", key = "#username")
    public Object getCachedUserCompanyProfile(UUID userId, String username) {
        // Extract current company ID from JWT token
        Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        UUID currentCompanyId = getCurrentCompanyIdFromAuthentication(authentication);

        // If no current company in token, get the first active company membership
        if (currentCompanyId == null) {
            List<CompanyMember> memberships = companyMemberRepository
                    .findByUserIdAndActiveTrue(userId);

            if (memberships.isEmpty()) {
                throw new CompanyRegistrationService.CompanyNotFoundException("Kein Unternehmen gefunden");
            }

            // Use the first membership (primary company)
            currentCompanyId = memberships.getFirst().getCompanyId();
        }

        // Check if user is owner/manager to provide comprehensive info
        Optional<CompanyMember> membership = companyMemberRepository
                .findByCompanyIdAndUserId(currentCompanyId, userId);

        if (membership.isPresent() && membership.get().getActive() &&
                (membership.get()
                        .getRole() == CompanyMemberRole.OWNER ||
                        membership.get()
                                .getRole() == CompanyMemberRole.MANAGER
                        ||
                        membership.get().getCanViewFinancials()
                        || membership.get().getCanManageCompanySettings())) {

            // Return comprehensive information for owners/managers
            return companyManagementService.getComprehensiveCompanyInfo(currentCompanyId, userId);
        } else {
            // Return a basic company profile for regular employees
            return companyRegistrationService.getCompanyProfile(currentCompanyId, userId);
        }
    }

    /**
     * Updates company information.
     *
     * @param companyId      the company ID
     * @param request        the update request
     * @param authentication the authenticated user
     * @return the updated company details
     */
    @PutMapping("/{companyId}")
    @PreAuthorize("hasRole('USER')")
    @CacheEvict(value = {"companyDetails", "userCompanyProfile", "companyPublic", "companySearch", "companyNearby", "companyName", "companyContactEmail"}, allEntries = true)
    public ResponseEntity<CompanyDetailResponse> updateCompany(
            @PathVariable UUID companyId,
            @Valid @RequestBody UpdateCompanyRequest request,
            Authentication authentication) {

        log.info("Company update requested for ID: {}", companyId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(CompanyDetailResponse.builder()
                                .message("Ungültige Authentifizierung")
                                .build());
            }

            CompanyDetailResponse response = companyManagementService.updateCompany(companyId, request, userId);
            return ResponseEntity.ok(response);

        } catch (CompanyManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for update: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(CompanyDetailResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (CompanyManagementService.UnauthorizedAccessException e) {
            log.warn("Unauthorized company update attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(CompanyDetailResponse.builder()
                            .message(e.getMessage())
                            .build());

        } catch (Exception e) {
            log.error("Error updating company ID: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CompanyDetailResponse.builder()
                            .message("Ein unerwarteter Fehler ist aufgetreten")
                            .build());
        }
    }

    /**
     * Searches companies based on criteria.
     *
     * @param name            company name filter
     * @param city            city filter
     * @param specialization  specialization filter
     * @param isAuftragnehmer provider filter
     * @param page            page number
     * @param size            page size
     * @return search results
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchCompanies(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String specialization,
            @RequestParam(required = false) Boolean isAuftragnehmer,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Company search requested with filters - name: {}, city: {}, specialization: {}",
                name, city, specialization);

        try {
            CompanyManagementService.CompanySearchResponse searchResults = companyManagementService
                    .searchCompanies(name, city, specialization, isAuftragnehmer, page, size);

            return ResponseEntity.ok(searchResults);

        } catch (Exception e) {
            log.error("Error searching companies", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein Fehler ist bei der Suche aufgetreten: " + e.getMessage());
        }
    }

     /**
     * Gets companies by geographic location.
     *
     * @param lat      latitude
     * @param lng      longitude
     * @param radiusKm radius in kilometers
     * @param page     page number
     * @param size     page size
     * @return companies within radius
     */
    @GetMapping("/nearby")
    public ResponseEntity<?> getNearbyCompanies(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam double radiusKm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("Nearby companies requested for location: {}, {} with radius: {} km",
                lat, lng, radiusKm);

        try {
            CompanyManagementService.CompanySearchResponse nearbyCompanies = companyManagementService
                .findNearbyCompanies(lat, lng, radiusKm, page, size);

            return ResponseEntity.ok(nearbyCompanies);
        } catch (Exception e) {
            log.error("Error finding nearby companies", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Ein Fehler ist bei der geographischen Suche aufgetreten: " + e.getMessage());
        }
    }

     /**
     * Gets comprehensive company information for admins or company owners.
     * This includes all company data including sensitive information.
     *
     * @param companyId      the company ID
     * @param authentication the authenticated user
     * @return comprehensive company information
     */
    @GetMapping("/{companyId}/comprehensive")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getComprehensiveCompanyInfo(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("Comprehensive company info requested for ID: {}", companyId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            // Use a separate cached method for the actual business logic
            CompanyManagementService.ComprehensiveCompanyInfo comprehensiveInfo = getCachedComprehensiveCompanyInfo(companyId, userId, authentication.getName());

            return ResponseEntity.ok(comprehensiveInfo);

        } catch (CompanyManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for comprehensive info request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Unternehmen nicht gefunden");

        } catch (CompanyManagementService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to comprehensive company info: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(e.getMessage());

        } catch (Exception e) {
            log.error("Error retrieving comprehensive company info for ID: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein Fehler ist aufgetreten: " + e.getMessage());
        }
    }

     /**
     * Cached method for getting comprehensive company info - separates caching logic from HTTP handling
     */
    @Cacheable(value = "companyComprehensive", key = "#companyId + ':' + #username")
    public CompanyManagementService.ComprehensiveCompanyInfo getCachedComprehensiveCompanyInfo(UUID companyId, UUID userId, String username) {
        return companyManagementService.getComprehensiveCompanyInfo(companyId, userId);
    }

    /**
     * Gets public company information with authentication and authorization.
     * This endpoint provides complete company profile data including documents and
     * contact details
     * for authenticated users viewing company profiles in the context of order
     * matching.
     *
     * @param companyId      the company ID
     * @param authentication the authenticated user
     * @return public company information
     */
    @GetMapping("/{companyId}/public")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getPublicCompanyInfo(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("Public company info requested for ID: {} by authenticated user", companyId);

        // Validate company ID parameter
        if (companyId == null) {
            log.warn("Invalid company ID provided: null");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ungültige Unternehmens-ID");
        }

        try {
            // Get user ID for logging and potential future authorization logic
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            log.debug("User {} requesting public company info for company {}", userId, companyId);

            // Get complete public company information including documents and contact
            // details - this already uses service-layer caching
            CompanyManagementService.PublicCompanyInfo publicInfo = companyManagementService
                    .getPublicCompanyInfo(companyId);

            log.info("Successfully retrieved public company info for ID: {}", companyId);
            return ResponseEntity.ok(publicInfo);

        } catch (CompanyManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for public info request: {} - {}", companyId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Unternehmen nicht gefunden");

        } catch (IllegalArgumentException e) {
            log.warn("Invalid company ID format: {} - {}", companyId, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ungültige Unternehmens-ID Format");

        } catch (Exception e) {
            log.error("Unexpected error retrieving public company info for ID: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein unerwarteter Fehler ist aufgetreten");
        }
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('USER')")
    @CacheEvict(value = {"companyDetails", "userCompanyProfile", "companyPublic", "companySearch", "companyNearby"}, allEntries = true)
    public ResponseEntity<?> uploadCompanyLogo(
            @RequestParam("file") MultipartFile logoFile,
            Authentication authentication) {

        UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
        try {
            log.info("Company logo upload requested");
            // Validate file
            if (logoFile.isEmpty()) {
                return ResponseEntity.badRequest().body("Keine Datei hochgeladen");
            }
            Optional<UUID> userId = Optional.ofNullable(getUserIdFromAuthentication(authentication));
            if (userId.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            // Upload a file to Cloudinary
            String logoUrl = fileStorageService.uploadFile(logoFile, "company-logos", UUID.randomUUID().toString());

            // Update company with new logo URL
            CompanyDetailResponse response = companyManagementService.updateCompanyLogo(companyId, logoUrl, userId);

            return ResponseEntity.ok(response);

        } catch (CompanyManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for logo upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Unternehmen nicht gefunden");

        } catch (CompanyManagementService.UnauthorizedAccessException e) {
            log.warn("Unauthorized company logo update attempt: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(e.getMessage());

        } catch (IllegalArgumentException e) {
            // This catches validation errors including the house number issue
            log.warn("Validation error during logo upload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(e.getMessage());

        } catch (Exception e) {
            log.error("Error uploading company logo for ID: {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein Fehler ist aufgetreten: " + e.getMessage());
        }
    }

    // ========== ROLE MANAGEMENT ENDPOINTS ==========

    /**
     * Adds a business role to an existing company.
     * <p>
     * This endpoint allows companies to add new business roles (Auftraggeber or
     * Auftragnehmer)
     * after their initial registration. The request must include all required data
     * for the
     * specific role being added, following the same validation patterns as
     * registration.
     * </p>
     *
     * @param companyId      the ID of the company to modify
     *                       the role addition request with required data
     * @param authentication an authenticated user
     * @return response indicating success or failure with details
     */
    @PostMapping("/{companyId}/roles/add")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<CompanyRoleAdditionResponse> addBusinessRole(
            @PathVariable UUID companyId,
            @RequestParam("role") BusinessRole role,
            @RequestParam(value = "specializations", required = false) List<String> specializations,
            @RequestParam(value = "industries", required = false) List<String> industries,
            @RequestParam(value = "orderCategories", required = false) List<String> orderCategories,
            @RequestParam(value = "workRadiusKm", required = false) Integer workRadiusKm,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "certifications", required = false) List<String> certifications,
            @RequestParam(value = "contactPersonName", required = false) String contactPersonName,
            @RequestParam(value = "contactPersonEmail", required = false) String contactPersonEmail,
            @RequestParam(value = "contactPersonPhone", required = false) String contactPersonPhone,
            @RequestParam(value = "employeeCount", required = false) Integer employeeCount,
            @RequestParam(value = "businessHours", required = false) String businessHours,
            @RequestParam(value = "verificationDocument", required = false) MultipartFile verificationDocument,
            @RequestParam(value = "certificatesDocument", required = false) MultipartFile certificatesDocument,
            Authentication authentication) {

        log.info("Business role addition requested for company {} with role {}", companyId, role);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(CompanyRoleAdditionResponse.error("Ungültige Authentifizierung"));
            }

            // Handle file uploads only for an Auftragnehmer (provider) role
            String verificationDocumentUrl;
            String certificatesDocumentUrl;

            if (role == BusinessRole.AUFTRAGNEHMER) {
                // Asynchronous upload for verification and certificates documents
                CompletableFuture<String> verificationFuture = CompletableFuture.completedFuture(null);
                if (verificationDocument != null && !verificationDocument.isEmpty()) {
                    verificationFuture = CompletableFuture.supplyAsync(() -> {
                        String fileId = UUID.randomUUID().toString();
                        String fileName = sanitizeFileName(verificationDocument.getOriginalFilename());
                        String publicId = fileId + "_" + fileName;
                        return fileStorageService.uploadFile(verificationDocument, "company-verification", publicId);
                    });
                } else {
                    log.warn("Verification document is required for Auftragnehmer role but not provided");
                    return ResponseEntity.badRequest()
                            .body(CompanyRoleAdditionResponse
                                    .error("Verifizierungsdokument ist für die Auftragnehmer-Rolle erforderlich"));
                }
                CompletableFuture<String> certificatesFuture = CompletableFuture.completedFuture(null);
                if (certificatesDocument != null && !certificatesDocument.isEmpty()) {
                    certificatesFuture = CompletableFuture.supplyAsync(() -> {
                        String fileId = UUID.randomUUID().toString();
                        String fileName = sanitizeFileName(certificatesDocument.getOriginalFilename());
                        String publicId = fileId + "_" + fileName;
                        return fileStorageService.uploadFile(certificatesDocument, "company-certificates", publicId);
                    });
                }
                // Wait for both uploads to complete
                CompletableFuture.allOf(verificationFuture, certificatesFuture).join();
                try {
                    verificationDocumentUrl = verificationFuture.get();
                    certificatesDocumentUrl = certificatesFuture.get();
                    log.info("Verification document uploaded: {}", verificationDocumentUrl);
                    if (certificatesDocumentUrl != null) {
                        log.info("Certificates document uploaded: {}", certificatesDocumentUrl);
                    }
                } catch (InterruptedException | ExecutionException e) {
                    log.error("Failed uploading documents for company {}", companyId, e);
                    return ResponseEntity.badRequest()
                            .body(CompanyRoleAdditionResponse
                                    .error("Fehler beim Hochladen der Dokumente: " + e.getMessage()));
                }
            } else if (role == BusinessRole.AUFTRAGGEBER) {
                log.info("Adding Auftraggeber role - no file uploads required");
                verificationDocumentUrl = null;
                certificatesDocumentUrl = null;
            } else {
                verificationDocumentUrl = null;
                certificatesDocumentUrl = null;
            }

            // Build the request object
            AddBusinessRoleRequest request = AddBusinessRoleRequest.builder()
                    .role(role)
                    .specializations(specializations)
                    .industries(industries)
                    .orderCategories(orderCategories)
                    .workRadiusKm(workRadiusKm)
                    .description(description)
                    .certifications(certifications)
                    .contactPersonName(contactPersonName)
                    .contactPersonEmail(contactPersonEmail)
                    .contactPersonPhone(contactPersonPhone)
                    .employeeCount(employeeCount)
                    .businessHours(businessHours)
                    .verificationDocumentUrl(verificationDocumentUrl)
                    .certificatesDocumentUrl(certificatesDocumentUrl)
                    .build();

            // Call the service to add the business role
            CompanyRoleAdditionResponse response = companyRoleManagementService.addBusinessRole(
                    companyId, role, request, userId);

            // Return the appropriate HTTP status based on response
            if (response.isSuccessful()) {
                log.info("Successfully added role {} to company {}", request.getRole(), companyId);
                return ResponseEntity.ok(response);
            } else {
                // Determine appropriate HTTP status based on error code
                HttpStatus status = HttpStatus.BAD_REQUEST;
                if (response.getErrorCode() != null) {
                    status = switch (response.getErrorCode()) {
                        case "UNAUTHORIZED" -> HttpStatus.FORBIDDEN;
                        case "COMPANY_NOT_FOUND" -> HttpStatus.NOT_FOUND;
                        case "ROLE_ALREADY_EXISTS" -> HttpStatus.CONFLICT;
                        case "VALIDATION_ERROR" -> HttpStatus.BAD_REQUEST;
                        default -> HttpStatus.BAD_REQUEST;
                    };
                }

                log.warn("Role addition failed for company {}: {}", companyId, response.getMessage());
                return ResponseEntity.status(status).body(response);
            }

        } catch (IllegalArgumentException e) {
            log.warn("Invalid parameters for role addition: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(CompanyRoleAdditionResponse.error("Ungültige Parameter: " + e.getMessage()));

        } catch (Exception e) {
            log.error("Unexpected error during role addition for company {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(CompanyRoleAdditionResponse.error("Ein unerwarteter Fehler ist aufgetreten"));
        }
    }

    /**
     * Gets the list of business roles that can be added to a company.
     * <p>
     * This endpoint returns the roles that are available for addition based on
     * the company's current role configuration. Companies can only add roles
     * they don't already have.
     * </p>
     *
     * @param companyId      the ID of the company
     * @param authentication the authenticated user
     * @return list of available business roles
     */
    @GetMapping("/{companyId}/available-roles")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getAvailableRoles(
            @PathVariable UUID companyId,
            Authentication authentication) {

        log.info("Available roles requested for company {}", companyId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            // Use a separate cached method for the actual business logic
            List<BusinessRole> availableRoles = getCachedAvailableRoles(companyId, userId);

            log.info("Found {} available roles for company {}", availableRoles.size(), companyId);
            return ResponseEntity.ok(availableRoles);

        } catch (CompanyRoleManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for available roles request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Unternehmen nicht gefunden");

        } catch (CompanyRoleManagementService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to available roles: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(e.getMessage());

        } catch (IllegalArgumentException e) {
            log.warn("Invalid parameters for available roles request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ungültige Parameter: " + e.getMessage());

        } catch (Exception e) {
            log.error("Error retrieving available roles for company {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein Fehler ist aufgetreten: " + e.getMessage());
        }
    }

    /**
     * Cached method for getting available roles - separates caching logic from HTTP handling
     */
    @Cacheable(value = "companyAvailableRoles", key = "#companyId")
    public List<BusinessRole> getCachedAvailableRoles(UUID companyId, UUID userId) {
        return companyRoleManagementService.getAvailableRoles(companyId, userId);
    }

    /**
     * Gets the requirements for adding a specific business role to a company.
     * <p>
     * This endpoint returns detailed information about what data is required
     * when adding a specific role, helping the frontend display appropriate
     * forms and validation messages.
     * </p>
     *
     * @param companyId      the ID of the company
     * @param role           the business role to get requirements for
     * @param authentication an authenticated user
     * @return role requirements information
     */
    @GetMapping("/{companyId}/role-requirements")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getRoleRequirements(
            @PathVariable UUID companyId,
            @RequestParam BusinessRole role,
            Authentication authentication) {

        log.info("Role requirements requested for role {} on company {}", role, companyId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Ungültige Authentifizierung");
            }

            // Use a separate cached method for the actual business logic
            CompanyRoleManagementService.RoleRequirements requirements = getCachedRoleRequirements(companyId, role, userId);

            log.info("Retrieved role requirements for role {} on company {}", role, companyId);
            return ResponseEntity.ok(requirements);

        } catch (CompanyRoleManagementService.CompanyNotFoundException e) {
            log.warn("Company not found for role requirements request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Unternehmen nicht gefunden");

        } catch (CompanyRoleManagementService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to role requirements: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(e.getMessage());

        } catch (IllegalArgumentException e) {
            log.warn("Invalid parameters for role requirements request: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Ungültige Parameter: " + e.getMessage());

        } catch (Exception e) {
            log.error("Error retrieving role requirements for company {}", companyId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Ein Fehler ist aufgetreten: " + e.getMessage());
        }
    }

     /**
     * Cached method for getting role requirements - separates caching logic from HTTP handling
     */
    @Cacheable(value = "companyRoleRequirements", key = "#companyId + ':' + #role")
    public CompanyRoleManagementService.RoleRequirements getCachedRoleRequirements(UUID companyId, BusinessRole role, UUID userId) {
        return companyRoleManagementService.getRoleRequirements(companyId, role, userId);
    }

    // Helper Methods

    /*
     * Extracts user
     * ID from
     * the authentication context.
     */

    private UUID getUserIdFromAuthentication(Authentication authentication) {
        return getCurrentUserId(authentication);
    }

    /**
     * Extracts current company ID from an authentication context.
     */
    private UUID getCurrentCompanyIdFromAuthentication(Authentication authentication) {
        return getCurrentCompanyId(authentication);
    }

    /**
     * Extracts JWT token from a Spring Security Authentication object.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }

    /**
     * Builds an Address object from the request.
     *
     * @param request the registration request
     * @return Address object or null if no address data
     */
    private Address buildAddress(RegisterCompanyRequest request) {
        if (request.getStreet() == null && request.getCity() == null && request.getPostalCode() == null) {
            return null;
        }

        return Address.builder()
                .street(request.getStreet())
                .houseNumber(request.getHouseNumber())
                .postalCode(request.getPostalCode())
                .city(request.getCity())
                .country(request.getCountry() != null ? request.getCountry() : "Deutschland")
                .build();
    }

    /**
     * Sanitizes file names to prevent security issues.
     *
     * @param fileName the original file name
     * @return sanitized file name
     */
    private String sanitizeFileName(String fileName) {
        if (fileName == null) {
            return "unnamed_file";
        }

        // Remove or replace potentially dangerous characters
        return fileName.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}