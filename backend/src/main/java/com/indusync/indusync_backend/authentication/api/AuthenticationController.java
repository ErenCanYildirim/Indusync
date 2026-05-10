package com.indusync.indusync_backend.authentication.api;

import com.indusync.indusync_backend.authentication.api.dto.ChangePasswordRequest;
import com.indusync.indusync_backend.authentication.api.dto.LoginRequest;
import com.indusync.indusync_backend.authentication.api.dto.RegisterUserRequest;
import com.indusync.indusync_backend.authentication.api.dto.ResetPasswordRequest;
import com.indusync.indusync_backend.authentication.api.dto.UpdateProfileRequest;
import com.indusync.indusync_backend.authentication.application.AuthenticationApplicationService;
import com.indusync.indusync_backend.authentication.application.dto.*;
import com.indusync.indusync_backend.authentication.application.service.UserCompanyMembershipService;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.infrastructure.FileUploadService;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import com.indusync.indusync_backend.shared.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/v1/auth")
@Validated
@Slf4j
public class AuthenticationController extends BaseController {

    private final AuthenticationApplicationService authService;
    private final FileUploadService fileUploadService;
    private final JwtService jwtService;
    private final UserCompanyMembershipService userCompanyMembershipService;

    public AuthenticationController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            AuthenticationApplicationService authService,
            FileUploadService fileUploadService,
            JwtService jwtService,
            UserCompanyMembershipService userCompanyMembershipService) {
        super(authHelper, responseHelper);
        this.authService = authService;
        this.fileUploadService = fileUploadService;
        this.jwtService = jwtService;
        this.userCompanyMembershipService = userCompanyMembershipService;
    }

    @PostMapping(value = "/register", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AuthenticationResponse> register(
            @Valid @ModelAttribute RegisterUserRequest request,
            @RequestParam(value = "companyVerificationFile", required = false) MultipartFile companyVerificationFile,
            @RequestParam(value = "companyCertificatesFile", required = false) MultipartFile companyCertificatesFile,
            HttpServletRequest httpRequest) {

        log.info("Registration request received for email: {}", request.getEmail());

        if (!request.isPasswordConfirmed()) {
            log.warn("Registration failed - password confirmation mismatch for: {}", request.getEmail());
            throw new AuthenticationApplicationService.PasswordMismatchException(
                    "Passwort und Passwort-Bestätigung stimmen nicht überein");
        }

        if (request.isBusinessAccount()) {
            validateBusinessAccountDetails(request);
        }

        CompletableFuture<String> verificationFileFuture = CompletableFuture.completedFuture(null);
        if (companyVerificationFile != null && !companyVerificationFile.isEmpty()) {
            verificationFileFuture = fileUploadService.uploadFile(companyVerificationFile, "verification");
        }

        CompletableFuture<String> certificatesFileFuture = CompletableFuture.completedFuture(null);
        if (companyCertificatesFile != null && !companyCertificatesFile.isEmpty()) {
            certificatesFileFuture = fileUploadService.uploadFile(companyCertificatesFile, "certificates");
        }

        CompletableFuture.allOf(verificationFileFuture, certificatesFileFuture).join();

        String verificationFileName;
        String certificatesFileName;
        try {
            verificationFileName = verificationFileFuture.get();
            certificatesFileName = certificatesFileFuture.get();
        } catch (InterruptedException | ExecutionException e) {
            log.error("File upload failed for user: {}", request.getEmail(), e);
            throw new RuntimeException("File upload failed: " + e.getMessage(), e);
        }

        RegisterUserCommand command = RegisterUserCommand.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .confirmPassword(request.getConfirmPassword())
                .accountType(AccountType.valueOf(request.getAccountType().toUpperCase()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .phone(request.getPhone())
                .website(request.getWebsite())
                .companyName(request.getCompanyName())
                .companyType(
                        request.getCompanyType() != null ? CompanyType.valueOf(request.getCompanyType().toUpperCase())
                                : null)
                .taxId(request.getTaxId())
                .registrationNumber(request.getRegistrationNumber())
                .street(request.getStreet())
                .houseNumber(request.getHouseNumber())
                .postalCode(request.getPostalCode())
                .city(request.getCity())
                .country(request.getCountry())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .workRadiusKm(request.getWorkRadiusKm())
                .specializations(request.getSpecializations())
                .industries(request.getIndustries())
                .orderCategories(request.getOrderCategories())
                .description(request.getDescription())
                .companyTypeAuftraggeber(request.getCompanyTypeAuftraggeber())
                .companyTypeAuftragnehmer(request.getCompanyTypeAuftragnehmer())
                .companyDetailsName(request.getCompanyDetailsName())
                .companyAddress(request.getCompanyAddress())
                .companyPostalCode(request.getCompanyPostalCode())
                .companyCity(request.getCompanyCity())
                .workRadius(request.getWorkRadius())
                .countrySelection(request.getCountrySelection())
                .contactPersonCount(request.getContactPersonCount())
                .contactPersonName(request.getContactPersonName())
                .contactDepartment(request.getContactDepartment())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .employeeCount(request.getEmployeeCount())
                .companyDescription(request.getCompanyDescription())
                .companyVerificationFile(verificationFileName)
                .companyCertificatesFile(certificatesFileName)
                .emailNotifications(request.getEmailNotifications())
                .interests(request.getInterests())
                .referralSource(request.getReferralSource())
                .ipAddress(getClientIpAddress(httpRequest))
                .build();

        AuthenticationResponse response = authService.registerUser(command);

        log.info("User registered successfully: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    private void validateBusinessAccountDetails(RegisterUserRequest request) {
        validateField(request.getCompanyName(), "Firmenname");
        validateField(request.getStreet(), "Straße");
        validateField(request.getHouseNumber(), "Hausnummer");
        validateField(request.getPostalCode(), "Postleitzahl");
        validateField(request.getCity(), "Stadt");
        validateField(request.getCountry(), "Land");
    }

    private void validateField(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " ist für Geschäftskonten erforderlich");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        log.info("Login request received for email: {}", request.getEmail());

        LoginCommand command = LoginCommand.builder()
                .email(request.getEmail())
                .password(request.getPassword())
                .ipAddress(getClientIpAddress(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .deviceFingerprint(request.getDeviceFingerprint())
                .rememberMe(request.getRememberMe())
                .build();

        AuthenticationResponse response = authService.authenticateUser(command);

        log.info("User authenticated successfully: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> logout(
            @RequestParam(value = "sessionId", required = false) String sessionId,
            HttpServletRequest request) {
        String token = extractTokenFromRequest(request);
        if (token != null) {
            authService.logout(token, sessionId);
            log.info("User logged out successfully");
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@RequestParam String token) {
        log.info("Email verification request for token: {}", token);
        authService.verifyEmail(token);
        log.info("Email verified successfully for token: {}", token);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/resend-verification-email")
    public ResponseEntity<Void> resendVerificationEmail(@RequestParam String email) {
        log.info("Resend verification email request for email: {}", email);
        authService.resendVerificationEmail(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> requestPasswordReset(@RequestParam String email) {
        log.info("Password reset request for email: {}", email);
        authService.requestPasswordReset(email);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Password reset attempt with token");
        authService.resetPassword(request.getToken(), request.getNewPassword(), request.getConfirmPassword());
        log.info("Password reset successful");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> checkAuthentication(HttpServletRequest request) {
        return ResponseEntity.ok().build();
    }

     @PostMapping("/refresh")
    public ResponseEntity<AuthenticationResponse> refreshToken(HttpServletRequest request) {
        String refreshToken = extractTokenFromRequest(request);
        if (refreshToken == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Refresh token nicht gefunden");
        }
        String ip = getClientIpAddress(request);
        String ua = request.getHeader("User-Agent");
        AuthenticationResponse response = authService.refreshAccessTokenSecure(refreshToken, ip, ua);
        log.info("Access token refreshed successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            HttpServletRequest httpRequest) {

        log.info("Password change request received");

        String token = extractTokenFromRequest(httpRequest);
        if (token == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Ungültiger Token");
        }

        // Extract user ID from JWT token
        UUID userId = jwtService.extractUserId(token);

        authService.changePassword(
                userId,
                request.getCurrentPassword(),
                request.getNewPassword(),
                request.getConfirmPassword());

        log.info("Password changed successfully");
        return ResponseEntity.ok().build();
    }

    @GetMapping("/profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<com.indusync.indusync_backend.authentication.application.dto.UserDto> getUserProfile(
            HttpServletRequest request) {
        log.info("User profile request received");
        String token = extractTokenFromRequest(request);
        if (token == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Ungültiger Token");
        }
        UserDto userProfile = authService
                .getUserProfile(token);
        log.info("User profile retrieved successfully for user: {}", userProfile.getEmail());
        return ResponseEntity.ok(userProfile);
    }

    @PutMapping("/update-profile")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserDto> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {

        log.info("Profile update request received");

        String token = extractTokenFromRequest(httpRequest);
        if (token == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Ungültiger Token");
        }

        // Extract user ID from a JWT token
        UUID userId = jwtService.extractUserId(token);

        UserDto updatedProfile = authService.updateProfile(
                userId, request);

        log.info("Profile updated successfully for user: {}", userId);
        return ResponseEntity.ok(updatedProfile);
    }

    /**
     * Gets the user's company memberships.
     */
    @GetMapping("/company-memberships")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<CompanyMembershipDto>> getCompanyMemberships(
            HttpServletRequest request) {
        log.info("Company memberships request received");
        String token = extractTokenFromRequest(request);
        if (token == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Ungültiger Token");
        }

        UUID userId = jwtService.extractUserId(token);
        List<CompanyMembershipDto> memberships = userCompanyMembershipService.getUserCompanyMemberships(userId);

        log.info("Company memberships retrieved successfully for user: {}", userId);
        return ResponseEntity.ok(memberships);
    }

    /**
     * Checks if the user has a specific permission in their current company.
     */
    @GetMapping("/check-permission")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> checkPermission(
            @RequestParam String permission,
            HttpServletRequest request) {
        log.info("Permission check request for: {}", permission);
        String token = extractTokenFromRequest(request);
        if (token == null) {
            throw new AuthenticationApplicationService.InvalidCredentialsException("Ungültiger Token");
        }

        UUID userId = jwtService.extractUserId(token);
        // Get current company ID from user profile
        com.indusync.indusync_backend.authentication.application.dto.UserDto userProfile = authService
                .getUserProfile(token);
        UUID currentCompanyId = userProfile.getCurrentCompanyId();

        try {
            UserCompanyMembershipService.CompanyPermission companyPermission = UserCompanyMembershipService.CompanyPermission
                    .valueOf(permission.toUpperCase());
            boolean hasPermission = userCompanyMembershipService.hasPermission(userId, currentCompanyId,
                    companyPermission);

            log.info("Permission check result for {}: {}", permission, hasPermission);
            return ResponseEntity.ok(hasPermission);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid permission requested: {}", permission);
            return ResponseEntity.badRequest().build();
        }
    }

    private String getClientIpAddress(HttpServletRequest request) {
        return authHelper.getClientIpAddress(request);
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        return authHelper.extractTokenFromRequest(request);
    }
}