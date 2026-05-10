package com.indusync.indusync_backend.authentication.domain;

import com.indusync.indusync_backend.shared.domain.enums.AccountType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for User entity operations.
 * <p>
 * This repository provides:
 * - Standard CRUD operations
 * - Authentication-specific queries
 * - User management operations
 * - Geographic and security-related queries
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    // === Authentication Queries ===

    /**
     * Finds a user by email address.
     *
     * @param email the email address to search for
     * @return Optional containing the user if found
     */
    @Query("SELECT u FROM User u WHERE u.email.value = :email")
    Optional<User> findByEmail(@Param("email") String email);

    /**
     * Checks if a user exists with the given email address.
     *
     * @param email the email address to check
     * @return true if a user exists with this email
     */
    @Query("SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END FROM User u WHERE u.email.value = :email")
    boolean existsByEmail(@Param("email") String email);

    /**
     * Finds all active users.
     *
     * @return list of active users
     */
    List<User> findByActiveTrue();

    /**
     * Finds all users with verified emails.
     *
     * @return list of users with verified emails
     */
    List<User> findByEmailVerifiedTrue();

    // === Account Type Queries ===

    /**
     * Finds all users by account type.
     *
     * @param accountType the account type to filter by
     * @return list of users with the specified account type
     */
    List<User> findByAccountType(AccountType accountType);

    /**
     * Finds all active business users.
     *
     * @return list of active business users
     */
    @Query("SELECT u FROM User u WHERE u.accountType = 'BUSINESS' AND u.active = true")
    List<User> findActiveBusinessUsers();

    /**
     * Finds all active personal users.
     *
     * @return list of active personal users
     */
    @Query("SELECT u FROM User u WHERE u.accountType = 'PERSONAL' AND u.active = true")
    List<User> findActivePersonalUsers();

    // === Company Association Queries ===

    /**
     * Finds all users associated with a specific company.
     *
     * @param companyId the company ID
     * @return list of users associated with the company
     */
    List<User> findByCurrentCompanyId(UUID companyId);

    /**
     * Finds all active users associated with a specific company.
     *
     * @param companyId the company ID
     * @return list of active users associated with the company
     */
    @Query("SELECT u FROM User u WHERE u.currentCompanyId = :companyId AND u.active = true")
    List<User> findActiveUsersByCompanyId(@Param("companyId") UUID companyId);

    // === Security Queries ===

    /**
     * Finds all currently locked users.
     *
     * @return list of users whose accounts are currently locked
     */
    @Query("SELECT u FROM User u WHERE u.lockedUntil IS NOT NULL AND u.lockedUntil > CURRENT_TIMESTAMP")
    List<User> findLockedUsers();

    /**
     * Finds users with failed login attempts above a threshold.
     *
     * @param threshold the minimum number of failed attempts
     * @return list of users with failed attempts above threshold
     */
    @Query("SELECT u FROM User u WHERE u.failedLoginAttempts >= :threshold")
    List<User> findUsersWithFailedAttempts(@Param("threshold") Integer threshold);

    /**
     * Unlocks accounts that have passed their lock expiration time.
     *
     * @return number of accounts unlocked
     */
    @Modifying
    @Query("UPDATE User u SET u.lockedUntil = NULL, u.failedLoginAttempts = 0 WHERE u.lockedUntil IS NOT NULL AND u.lockedUntil <= CURRENT_TIMESTAMP")
    int unlockExpiredAccounts();

    // === Activity Queries ===

    /**
     * Finds users who haven't logged in since a specific date.
     *
     * @param since the date to check against
     * @return list of inactive users
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginAt IS NULL OR u.lastLoginAt < :since")
    List<User> findInactiveUsersSince(@Param("since") LocalDateTime since);

    /**
     * Finds users who logged in within a specific time period.
     *
     * @param since the start of the time period
     * @return list of recently active users
     */
    @Query("SELECT u FROM User u WHERE u.lastLoginAt >= :since")
    List<User> findRecentlyActiveUsers(@Param("since") LocalDateTime since);

    // === Geographic Queries ===

    /**
     * Finds users within a geographic bounding box.
     * This is a basic implementation - for production, consider using PostGIS.
     *
     * @param minLat minimum latitude
     * @param maxLat maximum latitude
     * @param minLng minimum longitude
     * @param maxLng maximum longitude
     * @return list of users within the bounding box
     */
    @Query("SELECT u FROM User u WHERE u.location IS NOT NULL " +
           "AND u.location.latitude BETWEEN :minLat AND :maxLat " +
           "AND u.location.longitude BETWEEN :minLng AND :maxLng")
    List<User> findUsersInBoundingBox(
        @Param("minLat") Double minLat,
        @Param("maxLat") Double maxLat,
        @Param("minLng") Double minLng,
        @Param("maxLng") Double maxLng
    );

    // === Search Queries ===

    /**
     * Searches users by name (first name or last name).
     *
     * @param searchTerm the search term
     * @return list of users matching the search term
     */
    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    List<User> searchByName(@Param("searchTerm") String searchTerm);

    /**
     * Searches active users by name and account type.
     *
     * @param searchTerm  the search term
     * @param accountType the account type to filter by
     * @return list of users matching the criteria
     */
    @Query("SELECT u FROM User u WHERE u.active = true " +
           "AND u.accountType = :accountType " +
           "AND (LOWER(u.firstName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(u.lastName) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<User> searchActiveUsersByNameAndType(
        @Param("searchTerm") String searchTerm,
        @Param("accountType") AccountType accountType
    );

    // === Statistics Queries ===

    /**
     * Counts users by account type.
     *
     * @param accountType the account type to count
     * @return number of users with the specified account type
     */
    long countByAccountType(AccountType accountType);

    /**
     * Counts active users.
     *
     * @return number of active users
     */
    long countByActiveTrue();

    /**
     * Counts users with verified emails.
     *
     * @return number of users with verified emails
     */
    long countByEmailVerifiedTrue();

    // === GDPR and Compliance ===

    /**
     * Finds users who haven't accepted terms and conditions.
     *
     * @return list of users without terms acceptance
     */
    @Query("SELECT u FROM User u WHERE u.termsAcceptedAt IS NULL")
    List<User> findUsersWithoutTermsAcceptance();

    /**
     * Finds users who haven't accepted privacy policy.
     *
     * @return list of users without privacy policy acceptance
     */
    @Query("SELECT u FROM User u WHERE u.privacyAcceptedAt IS NULL")
    List<User> findUsersWithoutPrivacyAcceptance();

    /**
     * Deletes users who have been inactive for a specified period and haven't accepted terms.
     * This method supports GDPR right to be forgotten for incomplete registrations.
     *
     * @param cutoffDate the cutoff date for deletion
     * @return number of users deleted
     */
    @Modifying
    @Query("DELETE FROM User u WHERE u.termsAcceptedAt IS NULL AND u.createdAt < :cutoffDate")
    int deleteIncompleteRegistrationsBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Finds a user by their email verification token.
     *
     * @param token the email verification token
     * @return Optional containing the user if found
     */
    Optional<User> findByEmailVerificationToken(String token);

    /**
     * Finds a user by their password reset token.
     *
     * @param token the password reset token
     * @return Optional containing the user if found
     */
    Optional<User> findByPasswordResetToken(String token);
}