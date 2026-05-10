package com.indusync.indusync_backend.shared.domain;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for BaseEntity and AuditableEntity infrastructure.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@DisplayName("Base Entity Infrastructure Tests")
class BaseEntityTest {

    private TestEntity entity1;
    private TestEntity entity2;
    private TestAuditableEntity auditableEntity;

    @BeforeEach
    void setUp() {
        entity1 = new TestEntity();
        entity2 = new TestEntity();
        auditableEntity = new TestAuditableEntity();
    }

    @Test
    @DisplayName("Should create entities with null ID initially")
    void shouldCreateEntitiesWithNullId() {
        assertThat(entity1.getId()).isNull();
        assertThat(entity1.isNew()).isTrue();
    }

    @Test
    @DisplayName("Should have proper equals and hashCode behavior")
    void shouldHaveProperEqualsAndHashCode() {
        // New entities (no ID) should not be equal, but hashCode might be same for same
        // class
        assertThat(entity1).isNotEqualTo(entity2);
        // For new entities, hashCode is based on class, so it might be the same
        // The important thing is that equals() returns false

        // Entity should be equal to itself
        assertThat(entity1).isEqualTo(entity1);

        // Entities with same ID should be equal
        UUID testId = UUID.randomUUID();
        entity1.setId(testId);
        entity2.setId(testId);

        assertThat(entity1).isEqualTo(entity2);
        assertThat(entity1.hashCode()).isEqualTo(entity2.hashCode());
        assertThat(entity1.isNew()).isFalse();

        // Entities with different IDs should not be equal
        UUID differentId = UUID.randomUUID();
        entity2.setId(differentId);
        assertThat(entity1).isNotEqualTo(entity2);
    }

    @Test
    @DisplayName("Should have proper toString representation")
    void shouldHaveProperToString() {
        assertThat(entity1.toString()).contains("TestEntity");
        assertThat(entity1.toString()).contains("id=null");

        UUID testId = UUID.randomUUID();
        entity1.setId(testId);
        assertThat(entity1.toString()).contains(testId.toString());
    }

    @Test
    @DisplayName("Should initialize timestamps correctly")
    void shouldInitializeTimestampsCorrectly() {
        LocalDateTime now = LocalDateTime.now();
        entity1.setCreatedAt(now);
        entity1.setUpdatedAt(now);

        assertThat(entity1.getCreatedAt()).isEqualTo(now);
        assertThat(entity1.getUpdatedAt()).isEqualTo(now);
    }

    @Test
    @DisplayName("Should handle version field correctly")
    void shouldHandleVersionFieldCorrectly() {
        assertThat(entity1.getVersion()).isEqualTo(0L);

        entity1.setVersion(5L);
        assertThat(entity1.getVersion()).isEqualTo(5L);
    }

    @Test
    @DisplayName("AuditableEntity should track user information")
    void auditableEntityShouldTrackUserInformation() {
        UUID createdBy = UUID.randomUUID();
        UUID updatedBy = UUID.randomUUID();

        auditableEntity.setCreatedBy(createdBy);
        auditableEntity.setUpdatedBy(updatedBy);

        assertThat(auditableEntity.getCreatedBy()).isEqualTo(createdBy);
        assertThat(auditableEntity.getUpdatedBy()).isEqualTo(updatedBy);
        assertThat(auditableEntity.isCreatedBy(createdBy)).isTrue();
        assertThat(auditableEntity.isLastModifiedBy(updatedBy)).isTrue();
        assertThat(auditableEntity.isCreatedBy(updatedBy)).isFalse();
    }

    @Test
    @DisplayName("AuditableEntity should have enhanced toString")
    void auditableEntityShouldHaveEnhancedToString() {
        UUID createdBy = UUID.randomUUID();
        UUID updatedBy = UUID.randomUUID();
        LocalDateTime now = LocalDateTime.now();

        auditableEntity.setCreatedBy(createdBy);
        auditableEntity.setUpdatedBy(updatedBy);
        auditableEntity.setCreatedAt(now);
        auditableEntity.setUpdatedAt(now);

        String toString = auditableEntity.toString();
        assertThat(toString).contains("TestAuditableEntity");
        assertThat(toString).contains(createdBy.toString());
        assertThat(toString).contains(updatedBy.toString());
    }

    // Test entities for testing purposes
    private static class TestEntity extends BaseEntity {
        // No additional fields needed for testing
    }

    private static class TestAuditableEntity extends AuditableEntity {
        // No additional fields needed for testing
    }
}