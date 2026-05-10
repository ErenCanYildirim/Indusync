package com.indusync.indusync_backend.shared.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.LastModifiedBy;

import java.util.UUID;

/**
 * Auditable entity class extending BaseEntity with user tracking capabilities.
 * <p>
 * This class provides additional auditing fields:
 * - created_by: UUID of the user who created the entity
 * - updated_by: UUID of the user who last modified the entity
 * </p>
 * 
 * The user IDs are automatically populated by Spring Data JPA auditing
 * when a custom AuditorAware implementation is configured.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@MappedSuperclass
@Getter
@Setter
public abstract class AuditableEntity extends BaseEntity {

    /**
     * UUID of the user who created this entity.
     * Automatically set by JPA auditing when the entity is first persisted.
     */
    @CreatedBy
    @Column(name = "created_by", columnDefinition = "uuid")
    private UUID createdBy;

    /**
     * UUID of the user who last modified this entity.
     * Automatically updated by JPA auditing when the entity is modified.
     */
    @LastModifiedBy
    @Column(name = "updated_by", columnDefinition = "uuid")
    private UUID updatedBy;

    /**
     * Default constructor for JPA.
     */
    protected AuditableEntity() {
        super();
    }

    /**
     * Checks if the entity was created by the specified user.
     *
     * @param userId the user ID to check
     * @return true if the entity was created by the specified user
     */
    public boolean isCreatedBy(UUID userId) {
        return createdBy != null && createdBy.equals(userId);
    }

    /**
     * Checks if the entity was last modified by the specified user.
     *
     * @param userId the user ID to check
     * @return true if the entity was last modified by the specified user
     */
    public boolean isLastModifiedBy(UUID userId) {
        return updatedBy != null && updatedBy.equals(userId);
    }

    /**
     * Enhanced string representation including audit information.
     */
    @Override
    public String toString() {
        return String.format("%s{id=%s, createdBy=%s, updatedBy=%s, createdAt=%s, updatedAt=%s}",
                getClass().getSimpleName(),
                getId(),
                createdBy,
                updatedBy,
                getCreatedAt(),
                getUpdatedAt());
    }
}