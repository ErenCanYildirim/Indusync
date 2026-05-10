package com.indusync.indusync_backend.authentication.application;

import com.indusync.indusync_backend.authentication.application.dto.AuthenticationResponse;
import com.indusync.indusync_backend.authentication.application.dto.CompanyMembershipDto;
import com.indusync.indusync_backend.authentication.application.dto.LoginCommand;
import com.indusync.indusync_backend.authentication.application.dto.RegisterUserCommand;
import com.indusync.indusync_backend.authentication.application.dto.UserDto;
import com.indusync.indusync_backend.authentication.application.service.UserCompanyMembershipService;
import com.indusync.indusync_backend.authentication.application.service.SessionManager;
import com.indusync.indusync_backend.authentication.application.service.DeviceFingerprintingService;
import com.indusync.indusync_backend.authentication.application.service.SessionSecurityService;
import com.indusync.indusync_backend.authentication.domain.User;
import com.indusync.indusync_backend.authentication.domain.UserRepository;
import com.indusync.indusync_backend.authentication.domain.UserSession;
import com.indusync.indusync_backend.company.domain.Company;
import com.indusync.indusync_backend.company.domain.CompanyMember;
import com.indusync.indusync_backend.company.domain.CompanyMemberRepository;
import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.events.UserRegisteredEvent;
import com.indusync.indusync_backend.shared.domain.events.UserRequiresEmailVerificationEvent;
import com.indusync.indusync_backend.shared.domain.events.UserPasswordResetRequestedEvent;
import com.indusync.indusync_backend.shared.domain.valueobjects.EmailAddress;
import com.indusync.indusync_backend.shared.security.JwtService;
import com.indusync.indusync_backend.shared.security.JwtBlacklistService;
import com.indusync.indusync_backend.shared.security.TokenRotationResult;
import com.indusync.indusync_backend.shared.security.RateLimitingService;
import com.indusync.indusync_backend.shared.security.SecurityAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthenticationApplicationService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;
    private final JwtService jwtService;
    private final UserCompanyMembershipService userCompanyMembershipService;
    private final SessionManager sessionManager;
    private final DeviceFingerprintingService deviceFingerprintingService;
    private final SessionSecurityService sessionSecurityService;

    private final CompanyMemberRepository companyMemberRepository;
    private final CompanyRepository companyRepository;
    private final JwtBlacklistService jwtBlacklistService;
    private final RateLimitingService rateLimitingService;
    private final SecurityAuditService securityAuditService;

    @org.springframework.beans.factory.annotation.Value("${security.jwt.maxTokensPerUser:5}")
    private int maxTokensPerUser;

    public AuthenticationResponse registerUser(RegisterUserCommand command) {
        log.info("Attempting to register user with email: {}", command.getEmail());

        if (userRepository.existsByEmail(command.getEmail())) {
            log.warn("Registration failed - email already exists: {}", command.getEmail());
            throw new EmailAlreadyExistsException("E-Mail bereits registriert");
        }

        if (!command.getPassword().equals(command.getConfirmPassword())) {
            throw new PasswordMismatchException("Passwort und Passwort-Bestätigung stimmen nicht überein");
        }

        User user = User.builder()
                .email(EmailAddress.of(command.getEmail()))
                .passwordHash(passwordEncoder.encode(command.getPassword()))
                .accountType(command.getAccountType())
                .firstName(command.getFirstName())
                .lastName(command.getLastName())
                .phone(command.getPhone())
                .website(command.getWebsite())
                .termsAcceptedAt(LocalDateTime.now())
                .privacyAcceptedAt(LocalDateTime.now())
                .consentIp(command.getIpAddress())
                .referralSource(command.getReferralSource())
                .emailNotifications(command.getEmailNotifications() != null ? command.getEmailNotifications() : true)
                .build();

        if (command.getInterests() != null) {
            command.getInterests().forEach(user::addInterest);
        }

        user.generateEmailVerificationToken();
        user = userRepository.save(user);
        log.info("User successfully registered with ID: {} and email: {}", user.getId(), user.getEmail().getValue());

        eventPublisher.publishEvent(new UserRequiresEmailVerificationEvent(
                user.getId(),
                user.getEmail().getValue(),
                user.getFirstName() != null ? user.getFirstName() : command.getCompanyName(),
                user.getEmailVerificationToken()));
        log.info("Email verification event published for: {}", user.getEmail().getValue());

        if (command.getAccountType() == AccountType.BUSINESS) {
            eventPublisher.publishEvent(UserRegisteredEvent.forBusinessUser(
                    user.getId(),
                    user.getEmail().getValue(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    user.getWebsite(),
                    command.getCompanyName(),
                    command.getCompanyType() != null ? command.getCompanyType().name() : null,
                    command.getTaxId(),
                    command.getRegistrationNumber(),
                    command.getStreet(),
                    command.getHouseNumber(),
                    command.getPostalCode(),
                    command.getCity(),
                    command.getCountry(),
                    command.getLatitude(),
                    command.getLongitude(),
                    command.getWorkRadiusKm(),
                    command.getSpecializations(),
                    command.getIndustries(),
                    command.getOrderCategories(),
                    command.getDescription(),
                    command.getCompanyTypeAuftraggeber(),
                    command.getCompanyTypeAuftragnehmer(),
                    command.getCompanyDetailsName(),
                    command.getCompanyAddress(),
                    command.getCompanyPostalCode(),
                    command.getCompanyCity(),
                    command.getWorkRadius(),
                    command.getCountrySelection(),
                    command.getContactPersonCount(),
                    command.getContactPersonName(),
                    command.getContactDepartment(),
                    command.getContactEmail() != null ? command.getContactEmail() : user.getEmail().toString(),
                    command.getContactPhone() != null ? command.getContactPhone() : user.getPhone(),
                    command.getEmployeeCount(),
                    command.getCompanyDescription(),
                    command.getCompanyVerificationFile(),
                    command.getCompanyCertificatesFile(),
                    command.getEmailNotifications(),
                    command.getInterests(),
                    command.getReferralSource()));
            log.info("Business user registered - comprehensive company creation event published for: {}",
                    user.getEmail().getValue());
        } else {
            eventPublisher.publishEvent(UserRegisteredEvent.forPersonalUser(
                    user.getId(),
                    user.getEmail().getValue(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getPhone(),
                    user.getWebsite(),
                    command.getEmailNotifications(),
                    command.getInterests(),
                    command.getReferralSource()));
            log.info("Personal user registered - user registration event published for: {}",
                    user.getEmail().getValue());
        }

        String accessToken = jwtService.generateTokenWithMetadata(
                user.getEmail().getValue(),
                user.getId(),
                user.getAccountType().name(),
                user.getCurrentCompanyId(),
                command.getIpAddress(),
                "");

        String refreshToken = jwtService.generateRefreshTokenWithMetadata(
                user.getEmail().getValue(),
                user.getId(),
                command.getIpAddress(),
                "");

        return AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .user(UserDto.from(user))
                .build();
    }

    public AuthenticationResponse authenticateUser(LoginCommand command) {
        log.info("Attempting to authenticate user with email: {}", command.getEmail());

        User user = userRepository.findByEmail(command.getEmail())
                .orElseThrow(() -> {
                    log.warn("Authentication failed - user not found: {}", command.getEmail());
                    return new InvalidCredentialsException("Ungültige Anmeldedaten");
                });

        if (!user.getActive()) {
            log.warn("Authentication failed - account deactivated: {}", command.getEmail());
            throw new AccountDeactivatedException("Konto ist deaktiviert");
        }

        if (user.isLocked()) {
            log.warn("Authentication failed - account locked: {}", command.getEmail());
            throw new AccountLockedException("Konto ist gesperrt bis: " + user.getLockedUntil());
        }

        if (!passwordEncoder.matches(command.getPassword(), user.getPasswordHash())) {
            log.warn("Authentication failed - invalid password for: {}", command.getEmail());
            user.recordFailedLogin(command.getIpAddress());
            userRepository.save(user);
            throw new InvalidCredentialsException("Ungültige Anmeldedaten");
        }

        user.updateLastLogin(command.getIpAddress());
        userRepository.save(user);

        // Create a session with device fingerprinting and IP tracking
        String deviceFingerprint = deviceFingerprintingService.generateDeviceFingerprint(
                command.getUserAgent(), command.getIpAddress(), command.getDeviceFingerprint());

        SessionManager.SessionCreationContext sessionContext = new SessionManager.SessionCreationContext(
                user.getId(), deviceFingerprint, command.getIpAddress(), command.getUserAgent());

        // Extract device information from the user agent
        sessionContext.setBrowser(deviceFingerprintingService.extractBrowser(command.getUserAgent()));
        sessionContext.setOperatingSystem(deviceFingerprintingService.extractOperatingSystem(command.getUserAgent()));
        sessionContext.setDeviceType(deviceFingerprintingService.extractDeviceType(command.getUserAgent()));

        UserSession session = sessionManager.createSession(sessionContext);

        // Perform an initial security assessment of the new session
        SessionSecurityService.SessionRiskAssessment riskAssessment = sessionSecurityService.assessSessionRisk(session);

        if (riskAssessment.isRequiresAction()) {
            log.warn("New session {} requires security action: {}",
                    session.getSessionId(), riskAssessment.getRiskFactors());
            sessionSecurityService.handleHighRiskSession(session, riskAssessment);
        }

        log.info("User authenticated successfully: {} with session: {} (risk level: {})",
                command.getEmail(), session.getSessionId(), riskAssessment.getNewRiskLevel());

        var companyId = companyMemberRepository.findByUserIdAndActiveTrue(user.getId())
                .stream()
                .findFirst()
                .map(CompanyMember::getCompanyId)
                .orElse(null);

        String accessToken = jwtService.generateTokenWithMetadata(
                user.getEmail().getValue(),
                user.getId(),
                user.getAccountType().name(),
                companyId,
                command.getIpAddress(),
                command.getUserAgent());

        String refreshToken = jwtService.generateRefreshTokenWithMetadata(
                user.getEmail().getValue(),
                user.getId(),
                command.getIpAddress(),
                command.getUserAgent());

        // Store issued tokens for tracking and enforce token limits
        try {
            jwtBlacklistService.storeToken(accessToken, user.getId(), command.getIpAddress(), command.getUserAgent(),
                    command.getDeviceFingerprint());
            jwtBlacklistService.storeToken(refreshToken, user.getId(), command.getIpAddress(), command.getUserAgent(),
                    command.getDeviceFingerprint());
            jwtBlacklistService.enforceTokenLimit(user.getId(), maxTokensPerUser);
        } catch (Exception e) {
            log.warn("Failed to track issued tokens for user {}: {}", user.getId(), e.getMessage());
        }

        // Audit
        securityAuditService.logAuthSuccess(user.getId(), command.getIpAddress(), command.getUserAgent(),
                session.getSessionId());

        return buildAuthenticationResponse(accessToken, refreshToken, user);
    }

    private AuthenticationResponse buildAuthenticationResponse(String accessToken, String refreshToken, User user) {
        AuthenticationResponse.AuthenticationResponseBuilder responseBuilder = AuthenticationResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(86400L)
                .user(UserDto.from(user));

        if (user.getAccountType() == AccountType.BUSINESS) {
            try {
                List<AuthenticationResponse.CompanyMembership> memberships = getUserCompanyMemberships(user.getId());
                UUID currentCompanyId = user.getCurrentCompanyId();

                if (currentCompanyId == null && !memberships.isEmpty()) {
                    AuthenticationResponse.CompanyMembership primaryMembership = memberships.stream()
                            .filter(AuthenticationResponse.CompanyMembership::getIsPrimaryContact)
                            .findFirst()
                            .orElse(memberships.getFirst());
                    currentCompanyId = primaryMembership.getCompanyId();
                    user.setCurrentCompanyId(currentCompanyId);
                    userRepository.save(user);
                }

                if (currentCompanyId != null) {
                    AuthenticationResponse.CompanyContext currentCompany = getCurrentCompanyContext(currentCompanyId);
                    responseBuilder.currentCompany(currentCompany);

                    final UUID finalCurrentCompanyId = currentCompanyId;
                    memberships.stream()
                            .filter(membership -> membership.getCompanyId().equals(finalCurrentCompanyId))
                            .findFirst().ifPresent(responseBuilder::companyMembership);

                }
            } catch (Exception e) {
                log.warn("Failed to fetch company information for user {}: {}", user.getId(), e.getMessage());
            }
        }

        return responseBuilder.build();
    }

    private AuthenticationResponse.CompanyContext getCurrentCompanyContext(UUID companyId) {
        return companyRepository.findById(companyId)
                .map(company -> AuthenticationResponse.CompanyContext.builder()
                        .companyId(company.getId())
                        .companyName(company.getName())
                        .companyType(company.getCompanyType().name())
                        .companyRole(determineCompanyRole(company))
                        .verified(company.getVerified())
                        .status(company.getStatus().name())
                        .build())
                .orElse(null);
    }

    private List<AuthenticationResponse.CompanyMembership> getUserCompanyMemberships(UUID userId) {
        List<CompanyMember> memberships = companyMemberRepository.findByUserIdAndActiveTrue(userId);
        return memberships.stream()
                .map(this::buildCompanyMembership)
                .collect(java.util.stream.Collectors.toList());
    }

    private AuthenticationResponse.CompanyMembership buildCompanyMembership(CompanyMember member) {
        String companyName = companyRepository.findById(member.getCompanyId())
                .map(Company::getName)
                .orElse("Unknown Company");

        return AuthenticationResponse.CompanyMembership.builder()
                .companyId(member.getCompanyId())
                .companyName(companyName)
                .role(member.getRole().name())
                .positionTitle(member.getPositionTitle())
                .isPrimaryContact(member.getIsPrimaryContact())
                .active(member.getActive())
                .canCreateOrders(member.getCanCreateOrders())
                .canManageEmployees(member.getCanManageEmployees())
                .canAssignProjects(member.getCanAssignProjects())
                .canViewFinancials(member.getCanViewFinancials())
                .canManageCompanySettings(member.getCanManageCompanySettings())
                .build();
    }

    private String determineCompanyRole(Company company) {
        boolean isAuftraggeber = Boolean.TRUE.equals(company.getIsAuftraggeber());
        boolean isAuftragnehmer = Boolean.TRUE.equals(company.getIsAuftragnehmer());

        if (isAuftraggeber && isAuftragnehmer) {
            return "BOTH";
        } else if (isAuftragnehmer) {
            return "AUFTRAGNEHMER";
        } else {
            return "AUFTRAGGEBER";
        }
    }

    public void verifyEmail(String verificationToken) {
        log.info("Attempting to verify email with token: {}", verificationToken);

        User user = userRepository.findByEmailVerificationToken(verificationToken)
                .orElseThrow(
                        () -> new TokenNotFoundException("Ungültiger oder bereits verwendeter Verifizierungstoken"));

        if (user.getEmailVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new TokenExpiredException("Verifizierungstoken ist abgelaufen");
        }

        user.verifyEmail();
        userRepository.save(user);

        log.info("Email verified successfully for user: {}", user.getEmail().getValue());
    }

    public void resendVerificationEmail(String email) {
        log.info("Resending verification email to: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UserNotFoundException("Benutzer nicht gefunden"));

        if (user.getEmailVerified()) {
            throw new EmailAlreadyVerifiedException("E-Mail-Adresse ist bereits verifiziert");
        }

        user.generateEmailVerificationToken();
        userRepository.save(user);

        eventPublisher.publishEvent(new UserRequiresEmailVerificationEvent(
                user.getId(),
                user.getEmail().getValue(),
                user.getFirstName(),
                user.getEmailVerificationToken()));

        log.info("Verification email resent successfully to: {}", email);
    }

    public void requestPasswordReset(String email) {
        log.info("Password reset requested for email: {}", email);
        userRepository.findByEmail(email).ifPresentOrElse(
                user -> {
                    // Generate a password reset token
                    user.generatePasswordResetToken();
                    userRepository.save(user);

                    // Publish event for sending password reset email
                    eventPublisher.publishEvent(new UserPasswordResetRequestedEvent(
                            user.getId(),
                            user.getEmail().getValue(),
                            user.getFirstName() != null ? user.getFirstName() : "User",
                            user.getPasswordResetToken()));

                    log.info("Password reset token generated for user: {}", email);
                },
                () -> {
                    // For security reasons, don't reveal if the email exists
                    log.info("Password reset request processed (email may not exist): {}", email);
                });
    }

    /**
     * Resets a user's password using a valid reset token.
     *
     * @param token           the password reset token
     * @param newPassword     the new password
     * @param confirmPassword confirmation of the new password
     * @throws InvalidCredentialsException if the token is invalid or expired
     * @throws PasswordMismatchException   if the passwords don't match
     */
    public void resetPassword(String token, String newPassword, String confirmPassword) {
        log.info("Password reset attempt with token: {}", token);

        if (!newPassword.equals(confirmPassword)) {
            log.warn("Password reset failed - password confirmation mismatch");
            throw new PasswordMismatchException("Passwort und Passwort-Bestätigung stimmen nicht überein");
        }

        User user = userRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> {
                    log.warn("Password reset failed - invalid token");
                    return new TokenNotFoundException("Ungültiger oder bereits verwendeter Token");
                });

        if (user.isPasswordResetTokenExpired()) {
            log.warn("Password reset failed - expired token for user: {}", user.getEmail().getValue());
            throw new TokenExpiredException("Token ist abgelaufen");
        }

        // Update the password and clear the reset token
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.clearPasswordResetToken();
        userRepository.save(user);

        log.info("Password successfully reset for user: {}", user.getEmail().getValue());
    }

    public void logout(String token, String sessionId) {
        log.info("User logout requested for session: {}", sessionId);

        if (sessionId != null && !sessionId.trim().isEmpty()) {
            sessionManager.terminateSession(sessionId, "User logout");
        }

        try {
            // Revoke current access token and all refresh tokens for the user
            jwtBlacklistService.revokeToken(token, "User logout");
            UUID userId = jwtService.extractUserId(token);
            if (userId != null) {
                jwtBlacklistService.revokeAllRefreshTokens(userId, "User logout");
            }
        } catch (Exception e) {
            log.warn("Failed to revoke tokens on logout: {}", e.getMessage());
        }

        log.info("User logged out successfully");
    }

    public UserDto getUserProfile(String token) {
        log.info("Getting user profile from token");
        try {
            String userEmail = jwtService.extractUsername(token);
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> {
                        log.warn("User not found for profile request: {}", userEmail);
                        return new UserNotFoundException("Benutzer nicht gefunden");
                    });

            // Get company memberships for business users
            List<CompanyMembershipDto> companyMemberships = null;
            CompanyMembershipDto currentCompanyMembership = null;

            if (user.getAccountType() == AccountType.BUSINESS) {
                companyMemberships = getCachedUserCompanyMemberships(user.getId());
                currentCompanyMembership = getCachedCurrentCompanyMembership(user.getId(), user.getCurrentCompanyId())
                        .orElse(null);
            }

            log.info("User profile retrieved successfully for: {}", userEmail);
            return UserDto.from(user, companyMemberships, currentCompanyMembership);
        } catch (Exception e) {
            log.warn("Failed to get user profile: {}", e.getMessage());
            throw new InvalidCredentialsException("Ungültiger Token");
        }
    }

    @org.springframework.cache.annotation.Cacheable(cacheNames = com.indusync.indusync_backend.shared.config.CacheConfig.AUTH_USER_MEMBERSHIPS_CACHE, key = "#userId", unless = "#result == null || #result.isEmpty()")
    public java.util.List<CompanyMembershipDto> getCachedUserCompanyMemberships(java.util.UUID userId) {
        return userCompanyMembershipService.getUserCompanyMemberships(userId);
    }

    @org.springframework.cache.annotation.Cacheable(cacheNames = com.indusync.indusync_backend.shared.config.CacheConfig.AUTH_CURRENT_MEMBERSHIP_CACHE, key = "#userId.toString() + ':' + (#currentCompanyId != null ? #currentCompanyId.toString() : 'none')", unless = "#result == null")
    public java.util.Optional<CompanyMembershipDto> getCachedCurrentCompanyMembership(java.util.UUID userId,
            java.util.UUID currentCompanyId) {
        return userCompanyMembershipService.getCurrentCompanyMembership(userId, currentCompanyId);
    }

    public AuthenticationResponse refreshAccessTokenSecure(String refreshToken, String ipAddress, String userAgent) {
        log.info("Access token refresh requested");
        try {
            if (!jwtService.validateToken(refreshToken)) {
                throw new InvalidCredentialsException("Ungültiger Refresh Token");
            }

            if (!jwtService.isRefreshToken(refreshToken)) {
                throw new InvalidCredentialsException("Ungültiger Refresh Token-Typ");
            }

            UUID userId = jwtService.extractUserId(refreshToken);
            if (userId == null) {
                log.debug("UserID is null");
                throw new InvalidCredentialsException("Ungültiger Refresh Token");
            }

            // Rate limit refresh attempts per user
            if (!rateLimitingService.canRefreshToken(userId.toString())) {
                throw new InvalidCredentialsException("Token-Refresh-Rate-Limit überschritten");
            }

            TokenRotationResult rotation = jwtService.secureRefreshTokens(refreshToken, ipAddress, userAgent,
                    jwtBlacklistService);

            String userEmail = jwtService.extractUsername(rotation.newRefreshToken());
            User user = userRepository.findByEmail(userEmail)
                    .orElseThrow(() -> new InvalidCredentialsException("Benutzer nicht gefunden"));

            // Enforce per-user token limits (tokens already stored inside
            // secureRefreshTokens)
            try {
                jwtBlacklistService.enforceTokenLimit(user.getId(), maxTokensPerUser);
            } catch (Exception e) {
                log.warn("Failed to enforce token limit for user {}: {}", user.getId(), e.getMessage());
            }

            log.info("Access token refreshed successfully for user: {}", userEmail);
            return buildAuthenticationResponse(rotation.accessToken(), rotation.newRefreshToken(), user);
        } catch (InvalidCredentialsException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Failed to refresh access token: {}", e.getMessage());
            throw new InvalidCredentialsException("Ungültiger Refresh Token");
        }
    }

    /**
     * Changes a user's password after validating their current password.
     *
     * @param userId          the ID of the user changing their password
     * @param currentPassword the user's current password
     * @param newPassword     the new password
     * @param confirmPassword confirmation of the new password
     * @throws InvalidCredentialsException if the current password is invalid
     * @throws PasswordMismatchException   if the new password and confirmation do
     *                                     not match
     */
    public void changePassword(UUID userId, String currentPassword, String newPassword, String confirmPassword) {
        log.info("Password change attempt for user ID: {}", userId);

        if (!newPassword.equals(confirmPassword)) {
            log.warn("Password change failed - password confirmation mismatch");
            throw new PasswordMismatchException("Neues Passwort und Bestätigung stimmen nicht überein");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Password change failed - user not found: {}", userId);
                    return new UserNotFoundException("Benutzer nicht gefunden");
                });

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            log.warn("Password change failed - incorrect current password for user ID: {}", userId);
            throw new InvalidCredentialsException("Aktuelles Passwort ist nicht korrekt");
        }

        String newPasswordHash = passwordEncoder.encode(newPassword);

        // Check if password is in history
        if (user.isPasswordInHistory(newPasswordHash)) {
            log.warn("Password change failed - password reuse for user ID: {}", userId);
            throw new PasswordMismatchException(
                    "Das neue Passwort darf nicht mit einem der letzten 5 Passwörter übereinstimmen");
        }

        user.changePasswordSecurely(newPasswordHash);
        userRepository.save(user);

        log.info("Password changed successfully for user ID: {}", userId);

        // Terminate all other sessions when password is changed for security
        sessionManager.terminateAllUserSessions(userId, "Password changed");
    }

    /**
     * Updates a user's profile information.
     *
     * @param userId  the ID of the user updating their profile
     * @param request the profile update request containing new profile data
     * @return UserDto with updated profile information
     * @throws UserNotFoundException if the user is not found
     */
    public UserDto updateProfile(UUID userId,
            com.indusync.indusync_backend.authentication.api.dto.UpdateProfileRequest request) {
        log.info("Profile update attempt for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.warn("Profile update failed - user not found: {}", userId);
                    return new UserNotFoundException("Benutzer nicht gefunden");
                });

        // Update user entity fields with new profile data
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhone(request.getPhone());
        user.setWebsite(request.getWebsite());

        // Handle emailNotifications - if null, keep the existing value
        if (request.getEmailNotifications() != null) {
            user.setEmailNotifications(request.getEmailNotifications());
        }

        // Save the updated user
        user = userRepository.save(user);

        log.info("Profile updated successfully for user ID: {}", userId);

        // Get company memberships for business users to return complete UserDto
        List<CompanyMembershipDto> companyMemberships = null;
        CompanyMembershipDto currentCompanyMembership = null;

        if (user.getAccountType() == AccountType.BUSINESS) {
            companyMemberships = userCompanyMembershipService.getUserCompanyMemberships(user.getId());
            currentCompanyMembership = userCompanyMembershipService
                    .getCurrentCompanyMembership(user.getId(), user.getCurrentCompanyId())
                    .orElse(null);
        }

        // Return updated UserDto with the latest information
        return UserDto.from(user, companyMemberships, currentCompanyMembership);
    }

    /**
     * Gets all active sessions for a user.
     *
     * @param userId the user ID
     * @return list of active sessions
     */
    public List<UserSession> getUserActiveSessions(UUID userId) {
        log.info("Getting active sessions for user ID: {}", userId);
        return sessionManager.getUserActiveSessions(userId);
    }

    /**
     * Terminates a specific session for a user.
     *
     * @param userId    the user ID
     * @param sessionId the session ID to terminate
     * @return true if session was terminated successfully
     */
    public boolean terminateUserSession(UUID userId, String sessionId) {
        log.info("Terminating session {} for user ID: {}", sessionId, userId);

        // Verify the session belongs to the user for security
        Optional<UserSession> session = sessionManager.getSessionInfo(sessionId);
        if (session.isEmpty() || !session.get().getUserId().equals(userId)) {
            log.warn("Session {} does not belong to user {}", sessionId, userId);
            return false;
        }

        return sessionManager.terminateSession(sessionId, "User requested termination");
    }

    /**
     * Terminates all other sessions for a user except the current one.
     *
     * @param userId           the user ID
     * @param currentSessionId the current session ID to keep active
     * @return number of sessions terminated
     */
    public int terminateOtherUserSessions(UUID userId, String currentSessionId) {
        log.info("Terminating other sessions for user ID: {} except: {}", userId, currentSessionId);
        return sessionManager.terminateOtherUserSessions(userId, currentSessionId,
                "User requested termination of other sessions");
    }

    /**
     * Gets security statistics for monitoring and reporting.
     *
     * @return security statistics
     */
    public SessionSecurityService.SecurityStatistics getSecurityStatistics() {
        log.info("Getting security statistics");
        return sessionSecurityService.getSecurityStatistics();
    }

    /**
     * Performs automated security checks on all active sessions.
     *
     * @return number of sessions that required action
     */
    public int performSecurityChecks() {
        log.info("Performing automated security checks");
        return sessionSecurityService.performAutomatedSecurityChecks();
    }

    public static class EmailAlreadyExistsException extends RuntimeException {
        public EmailAlreadyExistsException(String message) {
            super(message);
        }
    }

    public static class PasswordMismatchException extends RuntimeException {
        public PasswordMismatchException(String message) {
            super(message);
        }
    }

    public static class InvalidCredentialsException extends RuntimeException {
        public InvalidCredentialsException(String message) {
            super(message);
        }
    }

    public static class AccountDeactivatedException extends RuntimeException {
        public AccountDeactivatedException(String message) {
            super(message);
        }
    }

    public static class AccountLockedException extends RuntimeException {
        public AccountLockedException(String message) {
            super(message);
        }
    }

    public static class UserNotFoundException extends RuntimeException {
        public UserNotFoundException(String message) {
            super(message);
        }
    }

    public static class TokenNotFoundException extends RuntimeException {
        public TokenNotFoundException(String message) {
            super(message);
        }
    }

    public static class TokenExpiredException extends RuntimeException {
        public TokenExpiredException(String message) {
            super(message);
        }
    }

    public static class EmailAlreadyVerifiedException extends RuntimeException {
        public EmailAlreadyVerifiedException(String message) {
            super(message);
        }
    }
}