package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import com.indusync.indusync_backend.shared.domain.valueobjects.EmailAddress;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for User entity business logic.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@DisplayName("User Entity Tests")
class UserTest {

    private User personalUser;
    private User businessUser;

    @BeforeEach
    void setUp() {
        personalUser = User.builder()
            .email(EmailAddress.of("john.doe@example.com"))
            .passwordHash("$2a$12$hashedPassword")
            .accountType(AccountType.PERSONAL)
            .firstName("John")
            .lastName("Doe")
            .active(true)
            .emailVerified(false)
            .failedLoginAttempts(0)
            .emailNotifications(true)
            .build();

        businessUser = User.builder()
            .email(EmailAddress.of("business@company.com"))
            .passwordHash("$2a$12$hashedPassword")
            .accountType(AccountType.BUSINESS)
            .firstName("Jane")
            .lastName("Smith")
            .active(true)
            .emailVerified(true)
            .emailVerifiedAt(LocalDateTime.now().minusDays(1))
            .currentCompanyId(UUID.randomUUID())
            .failedLoginAttempts(0)
            .emailNotifications(true)
            .build();
    }

    // === Account Type Tests ===

    @Test
    @DisplayName("Personal user should not be able to create companies")
    void personalUserCannotCreateCompanies() {
        assertThat(personalUser.canCreateCompanies()).isFalse();
    }

    @Test
    @DisplayName("Business user should be able to create companies")
    void businessUserCanCreateCompanies() {
        assertThat(businessUser.canCreateCompanies()).isTrue();
    }

    // === Full Name Tests ===

    @Test
    @DisplayName("Should return full name when both first and last name are present")
    void shouldReturnFullNameWhenBothNamesPresent() {
        assertThat(personalUser.getFullName()).isEqualTo("John Doe");
    }

    @Test
    @DisplayName("Should return first name when last name is null")
    void shouldReturnFirstNameWhenLastNameNull() {
        personalUser.setLastName(null);
        assertThat(personalUser.getFullName()).isEqualTo("John");
    }

    @Test
    @DisplayName("Should return last name when first name is null")
    void shouldReturnLastNameWhenFirstNameNull() {
        personalUser.setFirstName(null);
        assertThat(personalUser.getFullName()).isEqualTo("Doe");
    }

    @Test
    @DisplayName("Should return email when both names are null")
    void shouldReturnEmailWhenBothNamesNull() {
        personalUser.setFirstName(null);
        personalUser.setLastName(null);
        assertThat(personalUser.getFullName()).isEqualTo("john.doe@example.com");
    }

    // === Security Tests ===

    @Test
    @DisplayName("Should record failed login and increment counter")
    void shouldRecordFailedLogin() {
        assertThat(personalUser.getFailedLoginAttempts()).isEqualTo(0);

        personalUser.recordFailedLogin();
        assertThat(personalUser.getFailedLoginAttempts()).isEqualTo(1);
        assertThat(personalUser.getLockedUntil()).isNull();
    }

    @Test
    @DisplayName("Should lock account after 5 failed login attempts")
    void shouldLockAccountAfterFiveFailedAttempts() {
        // Record 5 failed attempts
        for (int i = 0; i < 5; i++) {
            personalUser.recordFailedLogin();
        }

        assertThat(personalUser.getFailedLoginAttempts()).isEqualTo(5);
        assertThat(personalUser.getLockedUntil()).isNotNull();
        assertThat(personalUser.getLockedUntil()).isAfter(LocalDateTime.now().plusMinutes(25));
    }

    @Test
    @DisplayName("Should detect locked account correctly")
    void shouldDetectLockedAccount() {
        personalUser.setLockedUntil(LocalDateTime.now().plusMinutes(30));
        assertThat(personalUser.isLocked()).isTrue();
    }

    @Test
    @DisplayName("Should detect unlocked account when lock time has passed")
    void shouldDetectUnlockedAccountWhenLockTimePassed() {
        personalUser.setLockedUntil(LocalDateTime.now().minusMinutes(5));
        assertThat(personalUser.isLocked()).isFalse();
    }

    @Test
    @DisplayName("Should update last login and clear failed attempts")
    void shouldUpdateLastLoginAndClearFailedAttempts() {
        personalUser.setFailedLoginAttempts(3);
        personalUser.setLockedUntil(LocalDateTime.now().plusMinutes(10));

        LocalDateTime beforeLogin = LocalDateTime.now().minusSeconds(1);
        personalUser.updateLastLogin("192.168.1.1");

        assertThat(personalUser.getLastLoginAt()).isAfter(beforeLogin);
        assertThat(personalUser.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(personalUser.getLockedUntil()).isNull();
    }

    // === Email Verification Tests ===

    @Test
    @DisplayName("Should verify email correctly")
    void shouldVerifyEmail() {
        assertThat(personalUser.getEmailVerified()).isFalse();
        assertThat(personalUser.getEmailVerifiedAt()).isNull();

        LocalDateTime beforeVerification = LocalDateTime.now().minusSeconds(1);
        personalUser.verifyEmail();

        assertThat(personalUser.getEmailVerified()).isTrue();
        assertThat(personalUser.getEmailVerifiedAt()).isAfter(beforeVerification);
    }

    // === Interest Management Tests ===

    @Test
    @DisplayName("Should add interest successfully")
    void shouldAddInterest() {
        assertThat(personalUser.getInterests()).isEmpty();

        personalUser.addInterest("Programming");
        assertThat(personalUser.getInterests()).containsExactly("Programming");
    }

    @Test
    @DisplayName("Should not add duplicate interest")
    void shouldNotAddDuplicateInterest() {
        personalUser.addInterest("Programming");
        personalUser.addInterest("Programming");

        assertThat(personalUser.getInterests()).containsExactly("Programming");
    }

    @Test
    @DisplayName("Should not add null or empty interest")
    void shouldNotAddNullOrEmptyInterest() {
        personalUser.addInterest(null);
        personalUser.addInterest("");
        personalUser.addInterest("   ");

        assertThat(personalUser.getInterests()).isEmpty();
    }

    @Test
    @DisplayName("Should remove interest successfully")
    void shouldRemoveInterest() {
        personalUser.setInterests(new ArrayList<>(Arrays.asList("Programming", "Design")));

        personalUser.removeInterest("Programming");
        assertThat(personalUser.getInterests()).containsExactly("Design");
    }

    // === Geographic Tests ===

    @Test
    @DisplayName("Should detect user within radius correctly")
    void shouldDetectUserWithinRadius() {
        // Munich coordinates
        GeoLocation munich = GeoLocation.of(48.1351, 11.5820);
        personalUser.setLocation(munich);

        // Location 10km from Munich
        GeoLocation nearby = GeoLocation.of(48.2351, 11.5820);

        assertThat(personalUser.isWithinRadius(nearby, 15.0)).isTrue();
        assertThat(personalUser.isWithinRadius(nearby, 5.0)).isFalse();
    }

    @Test
    @DisplayName("Should return false when user location is not set")
    void shouldReturnFalseWhenUserLocationNotSet() {
        GeoLocation center = GeoLocation.of(48.1351, 11.5820);

        assertThat(personalUser.isWithinRadius(center, 100.0)).isFalse();
    }

    @Test
    @DisplayName("Should return false when center location is null")
    void shouldReturnFalseWhenCenterLocationNull() {
        personalUser.setLocation(GeoLocation.of(48.1351, 11.5820));

        assertThat(personalUser.isWithinRadius(null, 100.0)).isFalse();
    }

    // === GDPR Compliance Tests ===

    @Test
    @DisplayName("Should record consent correctly")
    void shouldRecordConsent() {
        String ipAddress = "192.168.1.100";

        LocalDateTime beforeConsent = LocalDateTime.now().minusSeconds(1);
        personalUser.recordConsent(ipAddress);

        assertThat(personalUser.getTermsAcceptedAt()).isAfter(beforeConsent);
        assertThat(personalUser.getPrivacyAcceptedAt()).isAfter(beforeConsent);
        assertThat(personalUser.getConsentIp()).isEqualTo(ipAddress);
    }

    // === Builder Tests ===

    @Test
    @DisplayName("Should create user with builder pattern correctly")
    void shouldCreateUserWithBuilder() {
        User user = User.builder()
            .email(EmailAddress.of("test@example.com"))
            .passwordHash("hashedPassword")
            .accountType(AccountType.BUSINESS)
            .firstName("Test")
            .lastName("User")
            .phone("+49 123 456789")
            .website("https://example.com")
            .build();

        assertThat(user.getEmail().getValue()).isEqualTo("test@example.com");
        assertThat(user.getPasswordHash()).isEqualTo("hashedPassword");
        assertThat(user.getAccountType()).isEqualTo(AccountType.BUSINESS);
        assertThat(user.getFirstName()).isEqualTo("Test");
        assertThat(user.getLastName()).isEqualTo("User");
        assertThat(user.getPhone()).isEqualTo("+49 123 456789");
        assertThat(user.getWebsite()).isEqualTo("https://example.com");
        
        // Check default values
        assertThat(user.getActive()).isTrue();
        assertThat(user.getEmailVerified()).isFalse();
        assertThat(user.getFailedLoginAttempts()).isEqualTo(0);
        assertThat(user.getEmailNotifications()).isTrue();
        assertThat(user.getInterests()).isNotNull().isEmpty();
    }
} 