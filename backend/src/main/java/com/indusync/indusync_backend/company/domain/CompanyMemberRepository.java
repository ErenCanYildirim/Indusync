package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
 * Repository interface for CompanyMember entity operations.
 * <p>
 * This repository provides comprehensive data access methods for:
 * - User-company relationship management
 * - Role-based access control
 * - Invitation system
 * - Membership lifecycle management
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface CompanyMemberRepository extends JpaRepository<CompanyMember, UUID> {

    // ====================
    // Basic Relationship Queries
    // ====================

    /**
     * Finds a company member by company and user IDs.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return Optional containing the membership if found
     */
    Optional<CompanyMember> findByCompanyIdAndUserId(UUID companyId, UUID userId);

    /**
     * Checks if a user is a member of a company.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if membership exists
     */
    boolean existsByCompanyIdAndUserId(UUID companyId, UUID userId);

    /**
     * Checks if a user is an active member of a company.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if active membership exists
     */
    @Query("SELECT COUNT(cm) > 0 FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.userId = :userId AND cm.active = true")
    boolean existsByCompanyIdAndUserIdAndActiveTrue(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    /**
     * Finds all memberships for a user.
     *
     * @param userId the user ID
     * @return list of user's company memberships
     */
    List<CompanyMember> findByUserId(UUID userId);

    /**
     * Finds all active memberships for a user.
     *
     * @param userId the user ID
     * @return list of user's active company memberships
     */
    List<CompanyMember> findByUserIdAndActiveTrue(UUID userId);

    /**
     * Finds all active memberships for a user with specified status.
     *
     * @param userId the user ID
     * @param active the active status
     * @return list of user's company memberships with specified status
     */
    List<CompanyMember> findByUserIdAndActive(UUID userId, Boolean active);

    /**
     * Finds a company member by company and user IDs with active status.
     *
     * @param userId    the user ID
     * @param companyId the company ID
     * @param active    the active status
     * @return Optional containing the membership if found
     */
    Optional<CompanyMember> findByUserIdAndCompanyIdAndActive(UUID userId, UUID companyId, Boolean active);

    /**
     * Finds all members of a company.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of company members
     */
    Page<CompanyMember> findByCompanyId(UUID companyId, Pageable pageable);

    /**
     * Finds all active members of a company.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of active company members
     */
    Page<CompanyMember> findByCompanyIdAndActiveTrue(UUID companyId, Pageable pageable);

    // ====================
    // Role-Based Queries
    // ====================

    /**
     * Finds the owner of a company.
     *
     * @param companyId the company ID
     * @return Optional containing the owner if found
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.role = 'OWNER' AND cm.active = true")
    Optional<CompanyMember> findOwnerByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds members by company and role.
     *
     * @param companyId the company ID
     * @param role      the member role
     * @return list of members with the specified role
     */
    List<CompanyMember> findByCompanyIdAndRole(UUID companyId, CompanyMemberRole role);

    /**
     * Finds active members by company and role.
     *
     * @param companyId the company ID
     * @param role      the member role
     * @return list of active members with the specified role
     */
    List<CompanyMember> findByCompanyIdAndRoleAndActiveTrue(UUID companyId, CompanyMemberRole role);

    /**
     * Finds admins and owners of a company.
     *
     * @param companyId the company ID
     * @return list of administrative members
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.role IN ('OWNER', 'ADMIN') AND cm.active = true")
    List<CompanyMember> findAdministrativeMembers(@Param("companyId") UUID companyId);

    /**
     * Checks if a user has admin rights in a company.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if user has admin rights
     */
    @Query("SELECT COUNT(cm) > 0 FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.userId = :userId AND cm.role IN ('OWNER', 'ADMIN') AND cm.active = true")
    boolean hasAdminRights(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    /**
     * Checks if a user is the owner of a company.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @return true if user is the owner
     */
    @Query("SELECT COUNT(cm) > 0 FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.userId = :userId AND cm.role = 'OWNER' AND cm.active = true")
    boolean isOwner(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    // ====================
    // Permission-Based Queries
    // ====================

    /**
     * Finds members who can create orders in a company.
     *
     * @param companyId the company ID
     * @return list of members who can create orders
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.canCreateOrders = true AND cm.active = true")
    List<CompanyMember> findMembersWhoCanCreateOrders(@Param("companyId") UUID companyId);

    /**
     * Finds members who can manage employees in a company.
     *
     * @param companyId the company ID
     * @return list of members who can manage employees
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.canManageEmployees = true AND cm.active = true")
    List<CompanyMember> findMembersWhoCanManageEmployees(@Param("companyId") UUID companyId);

    /**
     * Checks if a user has a specific permission in a company.
     *
     * @param companyId  the company ID
     * @param userId     the user ID
     * @param permission the permission name
     * @return true if user has the permission
     */
    @Query("""
            SELECT CASE
                WHEN :permission = 'CREATE_ORDERS' THEN cm.canCreateOrders
                WHEN :permission = 'MANAGE_EMPLOYEES' THEN cm.canManageEmployees
                WHEN :permission = 'ASSIGN_PROJECTS' THEN cm.canAssignProjects
                WHEN :permission = 'VIEW_FINANCIALS' THEN cm.canViewFinancials
                WHEN :permission = 'MANAGE_COMPANY_SETTINGS' THEN cm.canManageCompanySettings
                ELSE false
            END
            FROM CompanyMember cm
            WHERE cm.companyId = :companyId AND cm.userId = :userId AND cm.active = true
            """)
    Optional<Boolean> hasPermission(@Param("companyId") UUID companyId,
            @Param("userId") UUID userId,
            @Param("permission") String permission);

    // ====================
    // Invitation System Queries
    // ====================

    /**
     * Finds a member by invitation token.
     *
     * @param invitationToken the invitation token
     * @return Optional containing the member if found
     */
    Optional<CompanyMember> findByInvitationToken(String invitationToken);

    /**
     * Finds pending invitations for a company.
     *
     * @param companyId the company ID
     * @return list of pending invitations
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.invitationToken IS NOT NULL AND cm.invitationAcceptedAt IS NULL AND cm.active = false")
    List<CompanyMember> findPendingInvitations(@Param("companyId") UUID companyId);

    /**
     * Finds expired invitations.
     *
     * @param now current timestamp
     * @return list of expired invitations
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.invitationToken IS NOT NULL AND cm.invitationExpiresAt < :now AND cm.invitationAcceptedAt IS NULL")
    List<CompanyMember> findExpiredInvitations(@Param("now") LocalDateTime now);

    /**
     * Deletes expired invitations.
     *
     * @param now current timestamp
     */
    @Modifying
    @Query("DELETE FROM CompanyMember cm WHERE cm.invitationToken IS NOT NULL AND cm.invitationExpiresAt < :now AND cm.invitationAcceptedAt IS NULL")
    void deleteExpiredInvitations(@Param("now") LocalDateTime now);

    // ====================
    // Contact and Communication Queries
    // ====================

    /**
     * Finds the primary contact for a company.
     *
     * @param companyId the company ID
     * @return Optional containing the primary contact if found
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.isPrimaryContact = true AND cm.active = true")
    Optional<CompanyMember> findPrimaryContact(@Param("companyId") UUID companyId);

    /**
     * Finds all contacts for a company (primary and secondary).
     *
     * @param companyId the company ID
     * @return list of company contacts
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND (cm.isPrimaryContact = true OR cm.role IN ('OWNER', 'ADMIN')) AND cm.active = true")
    List<CompanyMember> findCompanyContacts(@Param("companyId") UUID companyId);

    // ====================
    // Statistics and Analytics
    // ====================

    /**
     * Counts active members in a company.
     *
     * @param companyId the company ID
     * @return number of active members
     */
    @Query("SELECT COUNT(cm) FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.active = true")
    long countActiveMembers(@Param("companyId") UUID companyId);

    /**
     * Counts members by role in a company.
     *
     * @param companyId the company ID
     * @param role      the member role
     * @return number of members with the role
     */
    long countByCompanyIdAndRoleAndActiveTrue(UUID companyId, CompanyMemberRole role);

    /**
     * Gets member count by role for a company.
     *
     * @param companyId the company ID
     * @return list of [Role, Count] tuples
     */
    @Query("SELECT cm.role, COUNT(cm) FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.active = true GROUP BY cm.role")
    List<Object[]> getMemberCountByRole(@Param("companyId") UUID companyId);

    /**
     * Finds companies where a user has a specific role.
     *
     * @param userId the user ID
     * @param role   the member role
     * @return list of companies where user has the role
     */
    @Query("SELECT cm.companyId FROM CompanyMember cm WHERE cm.userId = :userId AND cm.role = :role AND cm.active = true")
    List<UUID> findCompanyIdsByUserIdAndRole(@Param("userId") UUID userId, @Param("role") CompanyMemberRole role);

    /**
     * Finds companies owned by a user.
     *
     * @param userId the user ID
     * @return list of company IDs owned by the user
     */
    @Query("SELECT cm.companyId FROM CompanyMember cm WHERE cm.userId = :userId AND cm.role = 'OWNER' AND cm.active = true")
    List<UUID> findOwnedCompanies(@Param("userId") UUID userId);

    // ====================
    // Membership Lifecycle Queries
    // ====================

    /**
     * Finds recently joined members.
     *
     * @param companyId the company ID
     * @param days      number of days to look back
     * @return list of recently joined members
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.joinedAt >= CURRENT_TIMESTAMP - :days DAY AND cm.active = true ORDER BY cm.joinedAt DESC")
    List<CompanyMember> findRecentlyJoined(@Param("companyId") UUID companyId, @Param("days") int days);

    /**
     * Finds inactive/left members.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of inactive members
     */
    Page<CompanyMember> findByCompanyIdAndActiveFalse(UUID companyId, Pageable pageable);

    /**
     * Reactivates a deactivated member.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     */
    @Modifying
    @Query("UPDATE CompanyMember cm SET cm.active = true, cm.leftAt = null, cm.joinedAt = CURRENT_TIMESTAMP WHERE cm.companyId = :companyId AND cm.userId = :userId")
    void reactivateMember(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    /**
     * Deactivates a member.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     */
    @Modifying
    @Query("UPDATE CompanyMember cm SET cm.active = false, cm.leftAt = CURRENT_TIMESTAMP WHERE cm.companyId = :companyId AND cm.userId = :userId")
    void deactivateMember(@Param("companyId") UUID companyId, @Param("userId") UUID userId);

    // ====================
    // Email-Based Queries (for notifications)
    // ====================

    /**
     * Checks if a user is a member of a company by email.
     * This requires joining with the User entity.
     *
     * @param email     the user's email
     * @param companyId the company ID
     * @return true if user is a member
     */
    @Query("""
            SELECT COUNT(cm) > 0 FROM CompanyMember cm
            JOIN User u ON cm.userId = u.id
            WHERE u.email.value = :email AND cm.companyId = :companyId AND cm.active = true
            """)
    boolean existsByUserEmailAndCompanyIdAndActiveTrue(@Param("email") String email,
            @Param("companyId") UUID companyId);

    /**
     * Finds members who should receive notifications for a company.
     *
     * @param companyId the company ID
     * @return list of members who should receive notifications
     */
    @Query("SELECT cm FROM CompanyMember cm WHERE cm.companyId = :companyId AND cm.role IN ('OWNER', 'ADMIN') AND cm.active = true")
    List<CompanyMember> findNotificationRecipients(@Param("companyId") UUID companyId);

    // ====================
    // Bulk Operations
    // ====================

    /**
     * Updates role for a member.
     *
     * @param companyId the company ID
     * @param userId    the user ID
     * @param newRole   the new role
     */
    @Modifying
    @Query("UPDATE CompanyMember cm SET cm.role = :newRole WHERE cm.companyId = :companyId AND cm.userId = :userId")
    void updateMemberRole(@Param("companyId") UUID companyId, @Param("userId") UUID userId,
            @Param("newRole") CompanyMemberRole newRole);

    /**
     * Removes all members from a company (used when deleting company).
     *
     * @param companyId the company ID
     */
    @Modifying
    @Query("DELETE FROM CompanyMember cm WHERE cm.companyId = :companyId")
    void deleteAllByCompanyId(@Param("companyId") UUID companyId);
}