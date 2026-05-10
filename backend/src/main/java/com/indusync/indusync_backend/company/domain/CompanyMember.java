package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.enums.CompanyMemberRole;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Entity representing the relationship between a user and a company.
 * <p>
 * This entity manages:
 * - User membership in companies
 * - Role-based permissions within companies
 * - Invitation and joining workflow
 * - Company member lifecycle
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Entity
@Table(name = "company_members", schema = "company", indexes = {
    @Index(name = "idx_company_members_company", columnList = "company_id"),
    @Index(name = "idx_company_members_user", columnList = "user_id"),
    @Index(name = "idx_company_members_lookup", columnList = "company_id, user_id, active"),
    @Index(name = "idx_company_members_owner", columnList = "company_id, role, active"),
    @Index(name = "idx_company_members_active", columnList = "active")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_company_members_user_company", columnNames = {"company_id", "user_id"})
})
public class CompanyMember extends AuditableEntity {

    @NotNull(message = "Unternehmen ist erforderlich")
    @Column(name = "company_id", columnDefinition = "uuid", nullable = false)
    private UUID companyId;

    @NotNull(message = "Benutzer ist erforderlich")
    @Column(name = "user_id", columnDefinition = "uuid", nullable = false)
    private UUID userId;

    @NotNull(message = "Rolle ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private CompanyMemberRole role;

    @Size(max = 100, message = "Positionsbezeichnung darf maximal 100 Zeichen lang sein")
    @Column(name = "position_title", length = 100)
    private String positionTitle;

    @Column(name = "is_primary_contact", nullable = false)
    private Boolean isPrimaryContact = false;

    // Permission flags for fine-grained access control
    @Column(name = "can_create_orders", nullable = false)
    private Boolean canCreateOrders = false;

    @Column(name = "can_manage_employees", nullable = false)
    private Boolean canManageEmployees = false;

    @Column(name = "can_assign_projects", nullable = false)
    private Boolean canAssignProjects = false;

    @Column(name = "can_view_financials", nullable = false)
    private Boolean canViewFinancials = false;

    @Column(name = "can_manage_company_settings", nullable = false)
    private Boolean canManageCompanySettings = false;

    @NotNull(message = "Beitrittsdatum ist erforderlich")
    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "left_at")
    private LocalDateTime leftAt;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    // Invitation system fields
    @Size(max = 255, message = "Einladungstoken darf maximal 255 Zeichen lang sein")
    @Column(name = "invitation_token", length = 255)
    private String invitationToken;

    @Column(name = "invitation_expires_at")
    private LocalDateTime invitationExpiresAt;

    @Column(name = "invitation_accepted_at")
    private LocalDateTime invitationAcceptedAt;

    @Size(max = 500, message = "Notizen dürfen maximal 500 Zeichen lang sein")
    @Column(name = "notes", length = 500)
    private String notes;

    /**
     * Default constructor for JPA.
     */
    public CompanyMember() {
        super();
    }

    /**
     * Constructor for creating a new company member.
     *
     * @param companyId the company ID
     * @param userId the user ID
     * @param role the member role
     */
    public CompanyMember(UUID companyId, UUID userId, CompanyMemberRole role) {
        super();
        setCompanyId(companyId);
        setUserId(userId);
        setRole(role);
        this.joinedAt = LocalDateTime.now();
        setDefaultPermissions();
    }

    // Getters and Setters

    public UUID getCompanyId() {
        return companyId;
    }

    public void setCompanyId(UUID companyId) {
        if (companyId == null) {
            throw new IllegalArgumentException("Unternehmen ist erforderlich");
        }
        this.companyId = companyId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Benutzer ist erforderlich");
        }
        this.userId = userId;
    }

    public CompanyMemberRole getRole() {
        return role;
    }

    public void setRole(CompanyMemberRole role) {
        if (role == null) {
            throw new IllegalArgumentException("Rolle ist erforderlich");
        }
        this.role = role;
        setDefaultPermissions();
    }

    public String getPositionTitle() {
        return positionTitle;
    }

    public void setPositionTitle(String positionTitle) {
        this.positionTitle = positionTitle != null ? positionTitle.trim() : null;
    }

    public Boolean getIsPrimaryContact() {
        return isPrimaryContact;
    }

    public void setIsPrimaryContact(Boolean isPrimaryContact) {
        this.isPrimaryContact = isPrimaryContact != null ? isPrimaryContact : false;
    }

    public Boolean getCanCreateOrders() {
        return canCreateOrders;
    }

    public void setCanCreateOrders(Boolean canCreateOrders) {
        this.canCreateOrders = canCreateOrders != null ? canCreateOrders : false;
    }

    public Boolean getCanManageEmployees() {
        return canManageEmployees;
    }

    public void setCanManageEmployees(Boolean canManageEmployees) {
        this.canManageEmployees = canManageEmployees != null ? canManageEmployees : false;
    }

    public Boolean getCanAssignProjects() {
        return canAssignProjects;
    }

    public void setCanAssignProjects(Boolean canAssignProjects) {
        this.canAssignProjects = canAssignProjects != null ? canAssignProjects : false;
    }

    public Boolean getCanViewFinancials() {
        return canViewFinancials;
    }

    public void setCanViewFinancials(Boolean canViewFinancials) {
        this.canViewFinancials = canViewFinancials != null ? canViewFinancials : false;
    }

    public Boolean getCanManageCompanySettings() {
        return canManageCompanySettings;
    }

    public void setCanManageCompanySettings(Boolean canManageCompanySettings) {
        this.canManageCompanySettings = canManageCompanySettings != null ? canManageCompanySettings : false;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt != null ? joinedAt : LocalDateTime.now();
    }

    public LocalDateTime getLeftAt() {
        return leftAt;
    }

    public void setLeftAt(LocalDateTime leftAt) {
        this.leftAt = leftAt;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active != null ? active : true;
    }

    public String getInvitationToken() {
        return invitationToken;
    }

    public void setInvitationToken(String invitationToken) {
        this.invitationToken = invitationToken != null ? invitationToken.trim() : null;
    }

    public LocalDateTime getInvitationExpiresAt() {
        return invitationExpiresAt;
    }

    public void setInvitationExpiresAt(LocalDateTime invitationExpiresAt) {
        this.invitationExpiresAt = invitationExpiresAt;
    }

    public LocalDateTime getInvitationAcceptedAt() {
        return invitationAcceptedAt;
    }

    public void setInvitationAcceptedAt(LocalDateTime invitationAcceptedAt) {
        this.invitationAcceptedAt = invitationAcceptedAt;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes != null ? notes.trim() : null;
    }

    // Business Methods

    /**
     * Sets default permissions based on the member role.
     */
    private void setDefaultPermissions() {
        if (this.role == null) return;

        this.canCreateOrders = this.role.canCreateOrders();
        this.canManageEmployees = this.role.canManageEmployees();
        this.canAssignProjects = this.role.canAssignProjects();
        this.canViewFinancials = this.role.canViewFinancials();
        this.canManageCompanySettings = this.role.canManageCompanySettings();
    }

    /**
     * Checks if this member has the specified permission.
     *
     * @param permission the permission to check
     * @return true if the member has the permission
     */
    public boolean hasPermission(String permission) {
        if (permission == null) return false;

        return switch (permission.toUpperCase()) {
            case "CREATE_ORDERS" -> Boolean.TRUE.equals(canCreateOrders);
            case "MANAGE_EMPLOYEES" -> Boolean.TRUE.equals(canManageEmployees);
            case "ASSIGN_PROJECTS" -> Boolean.TRUE.equals(canAssignProjects);
            case "VIEW_FINANCIALS" -> Boolean.TRUE.equals(canViewFinancials);
            case "MANAGE_COMPANY_SETTINGS" -> Boolean.TRUE.equals(canManageCompanySettings);
            default -> false;
        };
    }

    /**
     * Checks if this member is an owner or admin.
     *
     * @return true if owner or admin
     */
    public boolean isOwnerOrAdmin() {
        return this.role == CompanyMemberRole.OWNER || this.role == CompanyMemberRole.ADMIN;
    }

    /**
     * Checks if this member can manage other members.
     *
     * @param targetMember the member to check against
     * @return true if can manage the target member
     */
    public boolean canManage(CompanyMember targetMember) {
        if (targetMember == null || !Boolean.TRUE.equals(this.active)) {
            return false;
        }

        return this.role.canManage(targetMember.getRole());
    }

    /**
     * Accepts an invitation to join the company.
     */
    public void acceptInvitation() {
        if (this.invitationToken == null) {
            throw new IllegalStateException("Keine Einladung vorhanden");
        }

        if (this.invitationExpiresAt != null && this.invitationExpiresAt.isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Einladung ist abgelaufen");
        }

        this.invitationAcceptedAt = LocalDateTime.now();
        this.active = true;
        this.joinedAt = LocalDateTime.now();
    }

    /**
     * Deactivates the member (removes from company).
     */
    public void deactivate() {
        if (this.role == CompanyMemberRole.OWNER) {
            throw new IllegalStateException("Inhaber kann nicht entfernt werden");
        }

        this.active = false;
        this.leftAt = LocalDateTime.now();
    }

    /**
     * Reactivates a deactivated member.
     */
    public void reactivate() {
        this.active = true;
        this.leftAt = null;
        this.joinedAt = LocalDateTime.now();
    }

    /**
     * Updates the member's role and adjusts permissions accordingly.
     *
     * @param newRole the new role
     * @param updatedBy the user making the change
     */
    public void updateRole(CompanyMemberRole newRole, UUID updatedBy) {
        if (newRole == null) {
            throw new IllegalArgumentException("Neue Rolle ist erforderlich");
        }

        if (this.role == CompanyMemberRole.OWNER && newRole != CompanyMemberRole.OWNER) {
            throw new IllegalStateException("Inhaberrolle kann nicht geändert werden ohne Eigentumsübertragung");
        }

        this.role = newRole;
        setDefaultPermissions();
    }

    /**
     * Creates an invitation token for this member.
     *
     * @param token the invitation token
     * @param expiresAt when the invitation expires
     */
    public void createInvitation(String token, LocalDateTime expiresAt) {
        if (token == null || token.trim().isEmpty()) {
            throw new IllegalArgumentException("Einladungstoken ist erforderlich");
        }

        this.invitationToken = token.trim();
        this.invitationExpiresAt = expiresAt;
        this.active = false; // Inactive until invitation is accepted
    }

    /**
     * Checks if the invitation is still valid.
     *
     * @return true if invitation is valid
     */
    public boolean hasValidInvitation() {
        return this.invitationToken != null && 
               this.invitationAcceptedAt == null &&
               (this.invitationExpiresAt == null || this.invitationExpiresAt.isAfter(LocalDateTime.now()));
    }

    /**
     * Gets a display name for this member's role and position.
     *
     * @return formatted role description
     */
    public String getRoleDisplayName() {
        if (this.positionTitle != null && !this.positionTitle.trim().isEmpty()) {
            return this.positionTitle + " (" + this.role.getDisplayName() + ")";
        }
        return this.role.getDisplayName();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        CompanyMember that = (CompanyMember) o;
        return Objects.equals(companyId, that.companyId) && Objects.equals(userId, that.userId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(companyId, userId);
    }

    @Override
    public String toString() {
        return String.format("CompanyMember{companyId=%s, userId=%s, role=%s, active=%s}", 
            companyId, userId, role, active);
    }

    /**
     * Builder for creating CompanyMember instances.
     */
    public static class Builder {
        private UUID companyId;
        private UUID userId;
        private CompanyMemberRole role;
        private String positionTitle;
        private Boolean isPrimaryContact = false;
        private Boolean canCreateOrders;
        private Boolean canManageEmployees;
        private Boolean canAssignProjects;
        private Boolean canViewFinancials;
        private Boolean canManageCompanySettings;
        private LocalDateTime joinedAt;
        private Boolean active = true;
        private String invitationToken;
        private LocalDateTime invitationExpiresAt;

        public Builder companyId(UUID companyId) {
            this.companyId = companyId;
            return this;
        }

        public Builder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public Builder role(CompanyMemberRole role) {
            this.role = role;
            return this;
        }

        public Builder positionTitle(String positionTitle) {
            this.positionTitle = positionTitle;
            return this;
        }

        public Builder isPrimaryContact(Boolean isPrimaryContact) {
            this.isPrimaryContact = isPrimaryContact;
            return this;
        }

        public Builder canCreateOrders(Boolean canCreateOrders) {
            this.canCreateOrders = canCreateOrders;
            return this;
        }

        public Builder canManageEmployees(Boolean canManageEmployees) {
            this.canManageEmployees = canManageEmployees;
            return this;
        }

        public Builder canAssignProjects(Boolean canAssignProjects) {
            this.canAssignProjects = canAssignProjects;
            return this;
        }

        public Builder canViewFinancials(Boolean canViewFinancials) {
            this.canViewFinancials = canViewFinancials;
            return this;
        }

        public Builder canManageCompanySettings(Boolean canManageCompanySettings) {
            this.canManageCompanySettings = canManageCompanySettings;
            return this;
        }

        public Builder joinedAt(LocalDateTime joinedAt) {
            this.joinedAt = joinedAt;
            return this;
        }

        public Builder active(Boolean active) {
            this.active = active;
            return this;
        }

        public Builder invitationToken(String invitationToken) {
            this.invitationToken = invitationToken;
            return this;
        }

        public Builder invitationExpiresAt(LocalDateTime invitationExpiresAt) {
            this.invitationExpiresAt = invitationExpiresAt;
            return this;
        }

        public CompanyMember build() {
            CompanyMember member = new CompanyMember(companyId, userId, role);
            member.setPositionTitle(positionTitle);
            member.setIsPrimaryContact(isPrimaryContact);
            
            // Set custom permissions if provided, otherwise use defaults
            if (canCreateOrders != null) member.setCanCreateOrders(canCreateOrders);
            if (canManageEmployees != null) member.setCanManageEmployees(canManageEmployees);
            if (canAssignProjects != null) member.setCanAssignProjects(canAssignProjects);
            if (canViewFinancials != null) member.setCanViewFinancials(canViewFinancials);
            if (canManageCompanySettings != null) member.setCanManageCompanySettings(canManageCompanySettings);
            
            if (joinedAt != null) member.setJoinedAt(joinedAt);
            member.setActive(active);
            
            // Set invitation details if provided
            if (invitationToken != null) {
                member.createInvitation(invitationToken, invitationExpiresAt);
            }
            
            return member;
        }
    }

    /**
     * Creates a new builder instance.
     *
     * @return new Builder instance
     */
    public static Builder builder() {
        return new Builder();
    }
} 