package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.converter.StringListConverter;
import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.valueobjects.EmailAddress;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * User entity representing both personal and business users in the IndusSync
 * system.
 * <p>
 * This entity supports:
 * - Personal users (Privatkunden) who can use the platform
 * - Business users (Unternehmen) who can create and manage companies
 * - Complete audit trail and security features
 * - Geographic location for work radius calculations
 * - GDPR compliance with consent tracking
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "users", schema = "auth")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User extends AuditableEntity {

    // === Core Identity Fields ===

    /**
     * User's email address - used as primary login identifier.
     */
    @Embedded
    @AttributeOverride(name = "value", column = @Column(name = "email", unique = true, nullable = false))
    private EmailAddress email;

    /**
     * Hashed password for authentication.
     */
    @Column(name = "password_hash", nullable = false, length = 60)
    private String passwordHash;

    /**
     * Type of account - PERSONAL or BUSINESS.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    private AccountType accountType;

    // === Personal Information ===

    /**
     * User's first name.
     */
    @Column(name = "first_name", length = 100)
    private String firstName;

    /**
     * User's last name.
     */
    @Column(name = "last_name", length = 100)
    private String lastName;

    /**
     * User's phone number.
     */
    @Column(name = "phone", length = 20)
    private String phone;

    /**
     * User's website URL.
     */
    @Column(name = "website", length = 255)
    private String website;

    // === Email Verification ===

    /**
     * Whether the user's email has been verified.
     */
    @Column(name = "email_verified", nullable = false)
    @Builder.Default
    private Boolean emailVerified = false;

    /**
     * When the email was verified.
     */
    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    /**
     * Unique token for email verification.
     */
    @Column(name = "email_verification_token")
    private String emailVerificationToken;

    /**
     * Expiration timestamp for the email verification token.
     */
    @Column(name = "email_verification_token_expires_at")
    private LocalDateTime emailVerificationTokenExpiresAt;

    // === Account Status ===

    /**
     * Whether the user account is active.
     */
    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    // === Geographic Location ===

    /**
     * User's geographic location for work radius calculations.
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "latitude", column = @Column(name = "location_lat")),
            @AttributeOverride(name = "longitude", column = @Column(name = "location_lng"))
    })
    private GeoLocation location;

    // === Company Association ===

    /**
     * Current company ID that the user is working with.
     * For business users, this points to their primary company.
     */
    @Column(name = "current_company_id", columnDefinition = "uuid")
    private UUID currentCompanyId;

    // === Security Features ===

    /**
     * Last login timestamp.
     */
    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    /**
     * Number of failed login attempts.
     */
    @Column(name = "failed_login_attempts", nullable = false)
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    /**
     * Account locked until this timestamp (null if not locked).
     */
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    // === GDPR Compliance ===

    /**
     * When the user accepted terms and conditions.
     */
    @Column(name = "terms_accepted_at")
    private LocalDateTime termsAcceptedAt;

    /**
     * When the user accepted privacy policy.
     */
    @Column(name = "privacy_accepted_at")
    private LocalDateTime privacyAcceptedAt;

    /**
     * IP address from which consent was given.
     */
    @Column(name = "consent_ip", length = 45)
    private String consentIp;

    // === User Preferences ===

    /**
     * Whether the user wants to receive email notifications.
     */
    @Column(name = "email_notifications", nullable = false)
    @Builder.Default
    private Boolean emailNotifications = true;

    /**
     * User's interests as a list of strings stored as JSON.
     */
    @Convert(converter = StringListConverter.class)
    @Column(name = "interests", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> interests = new ArrayList<>();

    /**
     * How the user found out about the platform.
     */
    @Column(name = "referral_source", length = 100)
    private String referralSource;

    /**
     * Unique token for password reset.
     */
    @Column(name = "password_reset_token")
    private String passwordResetToken;

    /**
     * Expiration timestamp for the password reset token.
     */
    @Column(name = "password_reset_token_expires_at")
    private LocalDateTime passwordResetTokenExpiresAt;

    // === Enhanced Security Fields ===

    /**
     * Maximum number of concurrent sessions allowed for this user.
     */
    @Column(name = "max_concurrent_sessions")
    @Builder.Default
    private Integer maxConcurrentSessions = 3;

    /**
     * List of trusted device fingerprints for this user.
     */
    @Convert(converter = StringListConverter.class)
    @Column(name = "trusted_devices", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> trustedDevices = new ArrayList<>();

    /**
     * Security risk score for this user (0-100, higher is riskier).
     */
    @Column(name = "security_risk_score")
    @Builder.Default
    private Integer securityRiskScore = 0;

    /**
     * Timestamp of the last security assessment.
     */
    @Column(name = "last_security_assessment_at")
    private LocalDateTime lastSecurityAssessmentAt;

    /**
     * Number of suspicious activities detected for this user.
     */
    @Column(name = "suspicious_activity_count")
    @Builder.Default
    private Integer suspiciousActivityCount = 0;

    /**
     * Timestamp when suspicious activity counter was last reset.
     */
    @Column(name = "suspicious_activity_reset_at")
    private LocalDateTime suspiciousActivityResetAt;

    /**
     * Whether the user requires additional verification for sensitive operations.
     */
    @Column(name = "requires_additional_verification")
    @Builder.Default
    private Boolean requiresAdditionalVerification = false;

    /**
     * Timestamp of the last password change.
     */
    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;

    /**
     * List of previous password hashes for password history enforcement.
     */
    @Convert(converter = StringListConverter.class)
    @Column(name = "password_history", columnDefinition = "TEXT")
    @Builder.Default
    private List<String> passwordHistory = new ArrayList<>();

    /**
     * Number of failed login attempts from different IPs in the last hour.
     */
    @Column(name = "failed_login_attempts_different_ips")
    @Builder.Default
    private Integer failedLoginAttemptsFromDifferentIps = 0;

    /**
     * Timestamp when the different IP failed login counter was last reset.
     */
    @Column(name = "failed_login_different_ips_reset_at")
    private LocalDateTime failedLoginDifferentIpsResetAt;

    /**
     * Whether the user account is under security review.
     */
    @Column(name = "under_security_review")
    @Builder.Default
    private Boolean underSecurityReview = false;

    /**
     * Reason for security review if applicable.
     */
    @Column(name = "security_review_reason", length = 500)
    private String securityReviewReason;

    /**
     * Timestamp when security review was initiated.
     */
    @Column(name = "security_review_initiated_at")
    private LocalDateTime securityReviewInitiatedAt;

    // === Business Methods ===

    /**
     * Updates the last login timestamp and clears failed login attempts.
     *
     * @param ipAddress the IP address of the login
     */
    public void updateLastLogin(String ipAddress) {
        this.lastLoginAt = LocalDateTime.now();
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;

        // Reset failed login counters on successful login
        resetFailedLoginFromDifferentIpsCounter();

        // Update security risk score
        updateSecurityRiskScore();

        // TODO: In Phase 4, emit domain event: UserLoggedInEvent
    }

    /**
     * Records a failed login attempt and locks the account if necessary.
     */
    public void recordFailedLogin() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.lockedUntil = LocalDateTime.now().plusMinutes(30);
            recordSuspiciousActivity("Account locked due to multiple failed login attempts");
        }
        updateSecurityRiskScore();
    }

    /**
     * Records a failed login attempt from a specific IP address.
     *
     * @param ipAddress the IP address of the failed attempt
     */
    public void recordFailedLogin(String ipAddress) {
        recordFailedLogin();
        if (ipAddress != null) {
            recordFailedLoginFromDifferentIp(ipAddress);
        }
    }

    /**
     * Checks if the user account is currently locked.
     *
     * @return true if the account is locked
     */
    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    /**
     * Verifies the user's email address.
     */
    public void verifyEmail() {
        this.emailVerified = true;
        this.emailVerifiedAt = LocalDateTime.now();
        this.emailVerificationToken = null;
        this.emailVerificationTokenExpiresAt = null;
        // TODO: In Phase 4, emit domain event: EmailVerifiedEvent
    }

    /**
     * Generates and sets a new email verification token.
     */
    public void generateEmailVerificationToken() {
        this.emailVerificationToken = UUID.randomUUID().toString();
        this.emailVerificationTokenExpiresAt = LocalDateTime.now().plusHours(24); // Token valid for 24 hours
    }

    /**
     * Unlocks the user account manually.
     */
    public void unlock() {
        this.lockedUntil = null;
        this.failedLoginAttempts = 0;
    }

    /**
     * Deactivates the user account.
     */
    public void deactivate() {
        this.active = false;
        // TODO: In Phase 4, emit domain event: UserDeactivatedEvent
    }

    /**
     * Activates the user account.
     */
    public void activate() {
        this.active = true;
        // TODO: In Phase 4, emit domain event: UserActivatedEvent
    }

    /**
     * Checks if the user can create companies.
     *
     * @return true if the user has a business account type
     */
    public boolean canCreateCompanies() {
        return accountType == AccountType.BUSINESS;
    }

    /**
     * Gets the user's full name.
     *
     * @return the full name or email if names are not available
     */
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else {
            return email != null ? email.getValue() : "Unknown User";
        }
    }

    /**
     * Checks if the user is in the specified geographic radius of a location.
     *
     * @param center   the center location
     * @param radiusKm the radius in kilometers
     * @return true if within radius, false if location is not set or outside radius
     */
    public boolean isWithinRadius(GeoLocation center, double radiusKm) {
        if (this.location == null || center == null) {
            return false;
        }
        return this.location.isWithinRadius(center, radiusKm);
    }

    /**
     * Adds an interest to the user's interests list.
     *
     * @param interest the interest to add
     */
    public void addInterest(String interest) {
        if (interest != null && !interest.trim().isEmpty() && !this.interests.contains(interest)) {
            this.interests.add(interest.trim());
        }
    }

    /**
     * Removes an interest from the user's interests list.
     *
     * @param interest the interest to remove
     */
    public void removeInterest(String interest) {
        this.interests.remove(interest);
    }

    /**
     * Records user consent for GDPR compliance.
     *
     * @param ipAddress the IP address from which consent was given
     */
    public void recordConsent(String ipAddress) {
        this.termsAcceptedAt = LocalDateTime.now();
        this.privacyAcceptedAt = LocalDateTime.now();
        this.consentIp = ipAddress;
    }

    /**
     * Generates and sets a new password reset token.
     */
    public void generatePasswordResetToken() {
        this.passwordResetToken = UUID.randomUUID().toString();
        this.passwordResetTokenExpiresAt = LocalDateTime.now().plusHours(2); // Token valid for 2 hours
    }

    /**
     * Clears the password reset token after it has been used.
     */
    public void clearPasswordResetToken() {
        this.passwordResetToken = null;
        this.passwordResetTokenExpiresAt = null;
    }

    /**
     * Checks if the password reset token has expired.
     *
     * @return true if the token has expired or doesn't exist
     */
    public boolean isPasswordResetTokenExpired() {
        return passwordResetTokenExpiresAt == null ||
                passwordResetTokenExpiresAt.isBefore(LocalDateTime.now());
    }

    // === Enhanced Security Business Methods ===

    /**
     * Adds a device fingerprint to the trusted devices list.
     *
     * @param deviceFingerprint the device fingerprint to trust
     */
    public void trustDevice(String deviceFingerprint) {
        if (deviceFingerprint != null && !deviceFingerprint.trim().isEmpty() &&
                !this.trustedDevices.contains(deviceFingerprint)) {
            this.trustedDevices.add(deviceFingerprint);
            // Limit the number of trusted devices to prevent abuse
            if (this.trustedDevices.size() > 10) {
                this.trustedDevices.removeFirst(); // Remove oldest trusted device
            }
        }
    }

    /**
     * Removes a device fingerprint from the trusted devices list.
     *
     * @param deviceFingerprint the device fingerprint to untruest
     */
    public void untrustDevice(String deviceFingerprint) {
        this.trustedDevices.remove(deviceFingerprint);
    }

    /**
     * Checks if a device is trusted for this user.
     *
     * @param deviceFingerprint the device fingerprint to check
     * @return true if the device is trusted
     */
    public boolean isDeviceTrusted(String deviceFingerprint) {
        return deviceFingerprint != null && this.trustedDevices.contains(deviceFingerprint);
    }

    /**
     * Records a suspicious activity for this user.
     *
     * @param activity description of the suspicious activity
     */
    public void recordSuspiciousActivity(String activity) {
        this.suspiciousActivityCount++;
        updateSecurityRiskScore();

        // Reset counter if it's been more than 24 hours since last reset
        LocalDateTime now = LocalDateTime.now();
        if (this.suspiciousActivityResetAt == null ||
                this.suspiciousActivityResetAt.isBefore(now.minusHours(24))) {
            this.suspiciousActivityResetAt = now;
        }

        // If too many suspicious activities, require additional verification
        if (this.suspiciousActivityCount >= 5) {
            this.requiresAdditionalVerification = true;
        }

        // If extremely suspicious, put under security review
        if (this.suspiciousActivityCount >= 10) {
            initiateSecurityReview("Multiple suspicious activities detected: " + activity);
        }
    }

    /**
     * Resets the suspicious activity counter.
     */
    public void resetSuspiciousActivityCounter() {
        this.suspiciousActivityCount = 0;
        this.suspiciousActivityResetAt = LocalDateTime.now();
        this.requiresAdditionalVerification = false;
        updateSecurityRiskScore();
    }

    /**
     * Updates the security risk score based on various factors.
     */
    public void updateSecurityRiskScore() {
        int riskScore = 0;

        // Base risk from suspicious activities
        int safeSuspiciousActivityCount = this.suspiciousActivityCount == null ? 0 : this.suspiciousActivityCount;
        riskScore += Math.min(safeSuspiciousActivityCount * 5, 30);

        // Risk from failed login attempts
        riskScore += Math.min(this.failedLoginAttempts * 2, 10);

        // Risk from failed login attempts from different IPs
        riskScore += Math.min(this.failedLoginAttemptsFromDifferentIps * 3, 15);

        // Risk from account being locked
        if (isLocked()) {
            riskScore += 20;
        }

        // Risk from unverified email
        if (!this.emailVerified) {
            riskScore += 10;
        }

        // Risk from old password
        if (this.passwordChangedAt != null &&
                this.passwordChangedAt.isBefore(LocalDateTime.now().minusMonths(6))) {
            riskScore += 5;
        }

        // Risk from being under security review
        boolean safeUnderSecurityReview = this.underSecurityReview != null && this.underSecurityReview;
        if (safeUnderSecurityReview) {
            riskScore += 25;
        }

        // Cap the risk score at 100
        this.securityRiskScore = Math.min(riskScore, 100);
        this.lastSecurityAssessmentAt = LocalDateTime.now();
    }

    /**
     * Records a failed login attempt from a different IP.
     *
     * @param ipAddress the IP address of the failed attempt
     */
    public void recordFailedLoginFromDifferentIp(String ipAddress) {
        this.failedLoginAttemptsFromDifferentIps++;

        // Reset counter if it's been more than 1 hour since last reset
        LocalDateTime now = LocalDateTime.now();
        if (this.failedLoginDifferentIpsResetAt == null ||
                this.failedLoginDifferentIpsResetAt.isBefore(now.minusHours(1))) {
            this.failedLoginDifferentIpsResetAt = now;
            this.failedLoginAttemptsFromDifferentIps = 1; // Reset to 1 (current attempt)
        }

        updateSecurityRiskScore();

        // If too many failed attempts from different IPs, record as suspicious
        if (this.failedLoginAttemptsFromDifferentIps >= 5) {
            recordSuspiciousActivity("Multiple failed login attempts from different IPs");
        }
    }

    /**
     * Resets the failed login attempts from different IPs counter.
     */
    public void resetFailedLoginFromDifferentIpsCounter() {
        this.failedLoginAttemptsFromDifferentIps = 0;
        this.failedLoginDifferentIpsResetAt = LocalDateTime.now();
        updateSecurityRiskScore();
    }

    /**
     * Changes the user's password and updates security metadata.
     *
     * @param newPasswordHash the new password hash
     */
    public void changePasswordSecurely(String newPasswordHash) {
        // Add current password to history
        if (this.passwordHash != null && !this.passwordHistory.contains(this.passwordHash)) {
            this.passwordHistory.add(this.passwordHash);
            // Keep only the last 5 passwords in history
            if (this.passwordHistory.size() > 5) {
                this.passwordHistory.removeFirst();
            }
        }

        this.passwordHash = newPasswordHash;
        this.passwordChangedAt = LocalDateTime.now();

        // Reset security-related counters on password change
        this.failedLoginAttempts = 0;
        this.lockedUntil = null;
        this.requiresAdditionalVerification = false;

        updateSecurityRiskScore();
    }

    /**
     * Checks if a password has been used before.
     *
     * @param passwordHash the password hash to check
     * @return true if the password has been used before
     */
    public boolean isPasswordInHistory(String passwordHash) {
        return this.passwordHistory.contains(passwordHash) ||
                (this.passwordHash != null && this.passwordHash.equals(passwordHash));
    }

    /**
     * Initiates a security review for this user.
     *
     * @param reason the reason for the security review
     */
    public void initiateSecurityReview(String reason) {
        this.underSecurityReview = true;
        this.securityReviewReason = reason;
        this.securityReviewInitiatedAt = LocalDateTime.now();
        this.requiresAdditionalVerification = true;
        updateSecurityRiskScore();
    }

    /**
     * Completes the security review for this user.
     *
     * @param clearSuspiciousActivities whether to clear a suspicious activity counter
     */
    public void completeSecurityReview(boolean clearSuspiciousActivities) {
        this.underSecurityReview = false;
        this.securityReviewReason = null;
        this.securityReviewInitiatedAt = null;
        this.requiresAdditionalVerification = false;

        if (clearSuspiciousActivities) {
            resetSuspiciousActivityCounter();
        }

        updateSecurityRiskScore();
    }

    /**
     * Checks if the user's security risk score is high.
     *
     * @return true if the risk score is 70 or higher
     */
    public boolean isHighRisk() {
        return this.securityRiskScore != null && this.securityRiskScore >= 70;
    }

    /**
     * Checks if the user's security risk score is medium.
     *
     * @return true if the risk score is between 30 and 69
     */
    public boolean isMediumRisk() {
        return this.securityRiskScore != null &&
                this.securityRiskScore >= 30 && this.securityRiskScore < 70;
    }

    /**
     * Checks if the user's security risk score is low.
     *
     * @return true if the risk score is below 30
     */
    public boolean isLowRisk() {
        return this.securityRiskScore == null || this.securityRiskScore < 30;
    }

    /**
     * Gets the number of trusted devices for this user.
     *
     * @return number of trusted devices
     */
    public int getTrustedDeviceCount() {
        return this.trustedDevices.size();
    }

    /**
     * Checks if the user has reached the maximum number of trusted devices.
     *
     * @return true if at maximum trusted device limit
     */
    public boolean hasMaxTrustedDevices() {
        return this.trustedDevices.size() >= 10;
    }

    /**
     * Safe getter for maxConcurrentSessions - ensures non-null value.
     *
     * @return the maximum number of concurrent sessions (default is 3 if null)
     */
    public int getMaxConcurrentSessions() {
        return this.maxConcurrentSessions != null ? this.maxConcurrentSessions : 3;
    }

    @PostLoad
    private void ensureNonNullFields() {
        if (this.suspiciousActivityCount == null) {
            this.suspiciousActivityCount = 0;
        }
        if (this.underSecurityReview == null) {
            this.underSecurityReview = false;
        }
        if (this.maxConcurrentSessions == null) {
            this.maxConcurrentSessions = 3;
        }
    }
}