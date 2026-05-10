package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * Unit tests for Order entity business logic.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@DisplayName("Order Entity Tests")
class OrderTest {

    private Order order;
    private UUID companyId = UUID.randomUUID();
    private Address serviceAddress;
    private GeoLocation location;

    @BeforeEach
    void setUp() {
        serviceAddress = new Address("Musterstraße", "123", "12345", "Berlin", "Deutschland");
        location = GeoLocation.of(52.520008, 13.404954); // Berlin coordinates

        order = new Order(
                "Test Title",
                "Test Description",
                companyId,
                new Address("Street", "1", "12345", "City", "Country"),
                GeoLocation.of(52.52, 13.40),
                50);
    }

    // === Entity Creation Tests ===

    @Test
    @DisplayName("Should create order with DRAFT status by default")
    void shouldCreateOrderWithDraftStatus() {
        assertThat(order.getStatus()).isEqualTo(OrderStatus.DRAFT);
        assertThat(order.isDraft()).isTrue();
        assertThat(order.isPublished()).isFalse();
        assertThat(order.isFinal()).isFalse();
        assertThat(order.getPublishedAt()).isNull();
        assertThat(order.getCompletedAt()).isNull();
    }

    @Test
    @DisplayName("Should create order with correct properties")
    void shouldCreateOrderWithCorrectProperties() {
        assertThat(order.getTitle()).isEqualTo("Test Title");
        assertThat(order.getDescription()).isEqualTo("Test Description");
        assertThat(order.getCompanyId()).isEqualTo(companyId);
        assertThat(order.getServiceAddress()).isEqualTo(serviceAddress);
        assertThat(order.getLocation()).isEqualTo(location);
        assertThat(order.getSearchRadiusKm()).isEqualTo(50);
    }

    // === Status Transition Tests ===

    @Test
    @DisplayName("Should publish order successfully from DRAFT status")
    void shouldPublishOrderFromDraft() {
        LocalDateTime beforePublish = LocalDateTime.now().minusSeconds(1);

        order.publish();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.PUBLISHED);
        assertThat(order.isPublished()).isTrue();
        assertThat(order.isDraft()).isFalse();
        assertThat(order.getPublishedAt()).isNotNull();
        assertThat(order.getPublishedAt()).isAfter(beforePublish);
    }

    @Test
    @DisplayName("Should not publish order from non-DRAFT status")
    void shouldNotPublishOrderFromNonDraftStatus() {
        order.publish(); // Move to PUBLISHED

        assertThatThrownBy(() -> order.publish())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot publish order in status Veröffentlicht");
    }

    @Test
    @DisplayName("Should cancel order from DRAFT status")
    void shouldCancelOrderFromDraft() {
        order.cancel();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.isFinal()).isTrue();
        assertThat(order.canBeModified()).isFalse();
    }

    @Test
    @DisplayName("Should cancel order from PUBLISHED status")
    void shouldCancelOrderFromPublished() {
        order.publish();
        order.cancel();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(order.isFinal()).isTrue();
    }

    @Test
    @DisplayName("Should not cancel order from IN_PROGRESS status")
    void shouldNotCancelOrderFromInProgress() {
        order.publish();
        order.markAsMatched();
        order.setInProgress();

        assertThatThrownBy(() -> order.cancel())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot cancel order in status In Bearbeitung");
    }

    @Test
    @DisplayName("Should mark order as matched from PUBLISHED status")
    void shouldMarkOrderAsMatchedFromPublished() {
        order.publish();
        order.markAsMatched();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.MATCHED);
        assertThat(order.canBeModified()).isTrue();
    }

    @Test
    @DisplayName("Should not mark order as matched from DRAFT status")
    void shouldNotMarkOrderAsMatchedFromDraft() {
        assertThatThrownBy(() -> order.markAsMatched())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot match order in status Entwurf");
    }

    @Test
    @DisplayName("Should set order to in progress from MATCHED status")
    void shouldSetOrderInProgressFromMatched() {
        order.publish();
        order.markAsMatched();
        order.setInProgress();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.IN_PROGRESS);
        assertThat(order.canBeModified()).isTrue();
    }

    @Test
    @DisplayName("Should not set order to in progress from PUBLISHED status")
    void shouldNotSetOrderInProgressFromPublished() {
        order.publish();

        assertThatThrownBy(() -> order.setInProgress())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot set order to in progress in status Veröffentlicht");
    }

    @Test
    @DisplayName("Should complete order from IN_PROGRESS status")
    void shouldCompleteOrderFromInProgress() {
        order.publish();
        order.markAsMatched();
        order.setInProgress();

        LocalDateTime beforeComplete = LocalDateTime.now().minusSeconds(1);
        order.complete();

        assertThat(order.getStatus()).isEqualTo(OrderStatus.COMPLETED);
        assertThat(order.isFinal()).isTrue();
        assertThat(order.canBeModified()).isFalse();
        assertThat(order.getCompletedAt()).isNotNull();
        assertThat(order.getCompletedAt()).isAfter(beforeComplete);
    }

    @Test
    @DisplayName("Should not complete order from MATCHED status")
    void shouldNotCompleteOrderFromMatched() {
        order.publish();
        order.markAsMatched();

        assertThatThrownBy(() -> order.complete())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Cannot complete order in status Zugeordnet");
    }

    // === Status Check Tests ===

    @Test
    @DisplayName("Should correctly identify modifiable statuses")
    void shouldCorrectlyIdentifyModifiableStatuses() {
        // DRAFT should be modifiable
        assertThat(order.canBeModified()).isTrue();

        // PUBLISHED should be modifiable
        order.publish();
        assertThat(order.canBeModified()).isTrue();

        // MATCHED should be modifiable
        order.markAsMatched();
        assertThat(order.canBeModified()).isTrue();

        // IN_PROGRESS should be modifiable
        order.setInProgress();
        assertThat(order.canBeModified()).isTrue();

        // COMPLETED should not be modifiable
        order.complete();
        assertThat(order.canBeModified()).isFalse();
    }

    @Test
    @DisplayName("Should correctly identify final statuses")
    void shouldCorrectlyIdentifyFinalStatuses() {
        // Active statuses should not be final
        assertThat(order.isFinal()).isFalse();
        order.publish();
        assertThat(order.isFinal()).isFalse();
        order.markAsMatched();
        assertThat(order.isFinal()).isFalse();
        order.setInProgress();
        assertThat(order.isFinal()).isFalse();

        // Completed should be final
        order.complete();
        assertThat(order.isFinal()).isTrue();

        // Cancelled should be final
        Order cancelledOrder = new Order("Test", "Test", companyId, serviceAddress, location, 50);
        cancelledOrder.cancel();
        assertThat(cancelledOrder.isFinal()).isTrue();
    }

    // === Display Methods Tests ===

    @Test
    @DisplayName("Should return correct status display name")
    void shouldReturnCorrectStatusDisplayName() {
        assertThat(order.getStatusDisplayName()).isEqualTo("Entwurf");

        order.publish();
        assertThat(order.getStatusDisplayName()).isEqualTo("Veröffentlicht");

        order.markAsMatched();
        assertThat(order.getStatusDisplayName()).isEqualTo("Zugeordnet");

        order.setInProgress();
        assertThat(order.getStatusDisplayName()).isEqualTo("In Bearbeitung");

        order.complete();
        assertThat(order.getStatusDisplayName()).isEqualTo("Abgeschlossen");
    }

    @Test
    @DisplayName("Should have meaningful toString representation")
    void shouldHaveMeaningfulToString() {
        String toString = order.toString();

        assertThat(toString).contains("Order");
        assertThat(toString).contains(order.getTitle());
        assertThat(toString).contains(order.getStatus().toString());
        assertThat(toString).contains(order.getCompanyId().toString());
    }
}