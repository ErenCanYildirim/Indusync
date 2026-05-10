package com.indusync.indusync_backend.shared.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Base entity class providing common fields for all entities in the system.
 * <p>
 * This class provides:
 * - UUID-based primary key generation
 * - Automatic timestamp management (created_at, updated_at)
 * - Optimistic locking with version field
 * - Proper equals and hashCode implementation
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
public abstract class BaseEntity {
    /**
     * Primary key using UUID for better security and distribution.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    /**
     * Timestamp when the entity was created.
     * Automatically set by JPA auditing.
     */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the entity was last updated.
     * Automatically updated by JPA auditing.
     */
    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * Version field for optimistic locking.
     * Automatically managed by JPA.
     */
    @Version
    @Column(name = "version", nullable = false)
    private Long version = 0L;

    /**
     * Default constructor for JPA.
     */
    protected BaseEntity() {
        // JPA requires a no-arg constructor
    }

    /**
     * Indicates whether this entity is new (not yet persisted).
     *
     * @return true if the entity is new, false otherwise
     */
    public boolean isNew() {
        return this.id == null;
    }

    /**
     * Equals implementation based on ID.
     * Returns true only if both objects have the same ID and are not null.
     */
    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null || getClass() != obj.getClass()) {
            return false;
        }

        BaseEntity that = (BaseEntity) obj;
        return id != null && Objects.equals(id, that.id);
    }

    /**
     * HashCode implementation based on ID.
     * Uses the class hashcode for new entities to maintain consistency.
     */
    @Override
    public int hashCode() {
        return id != null ? Objects.hash(id) : getClass().hashCode();
    }

    /**
     * String representation including class name and ID.
     */
    @Override
    public String toString() {
        return String.format("%s{id=%s}", getClass().getSimpleName(), id);
    }
}