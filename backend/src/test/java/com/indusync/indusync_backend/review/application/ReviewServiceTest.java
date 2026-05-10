package com.indusync.indusync_backend.review.application;

import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.review.domain.*;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link ReviewService} business logic.
 */
@ExtendWith(MockitoExtension.class)
class ReviewServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private ReviewRatingRepository reviewRatingRepository;

    @Mock
    private OrderFacadeService orderFacadeService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ReviewService reviewService;

    // Test data
    private UUID orderId;
    private UUID clientCompanyId;
    private UUID providerCompanyId;

    private Order completedOrder;
    private OrderResponse completedOrderResponse;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        clientCompanyId = UUID.randomUUID();
        providerCompanyId = UUID.randomUUID();

        // Build minimal Order entity in COMPLETED status
        completedOrder = new Order();
        completedOrder.setId(orderId);
        completedOrder.setTitle("Test");
        completedOrder.setDescription("desc");
        completedOrder.setStatus(OrderStatus.COMPLETED);
        completedOrder.setCompanyId(clientCompanyId);
        completedOrder.setProviderId(providerCompanyId);

        completedOrderResponse = OrderResponse.fromOrder(completedOrder);
    }

    @Nested
    @DisplayName("createReview")
    class CreateReviewTests {
        @Test
        @DisplayName("Should create review and publish event when valid")
        void shouldCreateReviewWhenValid() {
            // Given
            when(orderFacadeService.getOrder(orderId)).thenReturn(completedOrderResponse);
            when(reviewRepository.existsByOrderIdAndReviewerCompanyId(orderId, clientCompanyId)).thenReturn(false);
            when(reviewRepository.save(any(Review.class))).thenAnswer(invocation -> {
                Review r = invocation.getArgument(0);
                r.setId(UUID.randomUUID());
                return r;
            });
            when(reviewRatingRepository.save(any(ReviewRating.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            List<ReviewRating> ratings = List.of(
                    new ReviewRating(null, ReviewRating.Category.QUALITY, 90, "Great work"));

            // When
            Review result = reviewService.createReview(orderId, clientCompanyId, providerCompanyId, ratings);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getOrderId()).isEqualTo(orderId);
            assertThat(result.getReviewerCompanyId()).isEqualTo(clientCompanyId);
            assertThat(result.getRevieweeCompanyId()).isEqualTo(providerCompanyId);

            verify(reviewRepository).save(any(Review.class));
            verify(reviewRatingRepository, times(1)).save(any(ReviewRating.class));

            // Capture the published event
            ArgumentCaptor<ReviewCreatedEvent> captor = ArgumentCaptor.forClass(ReviewCreatedEvent.class);
            verify(eventPublisher).publishEvent(captor.capture());
            ReviewCreatedEvent evt = captor.getValue();
            assertThat(evt.orderId()).isEqualTo(orderId);
            assertThat(evt.reviewerCompanyId()).isEqualTo(clientCompanyId);
            assertThat(evt.revieweeCompanyId()).isEqualTo(providerCompanyId);
        }

        @Test
        @DisplayName("Should throw when order not completed")
        void shouldThrowWhenOrderNotCompleted() {
            // Given
            completedOrder.setStatus(OrderStatus.IN_PROGRESS);
            when(orderFacadeService.getOrder(orderId)).thenReturn(OrderResponse.fromOrder(completedOrder));

            List<ReviewRating> ratings = List.of(new ReviewRating(null, ReviewRating.Category.QUALITY, 80, null));

            // When & Then
            assertThatThrownBy(() -> reviewService.createReview(orderId, clientCompanyId, providerCompanyId, ratings))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("COMPLETED");
        }

        @Test
        @DisplayName("Should throw when reviewer not participant")
        void shouldThrowWhenReviewerNotParticipant() {
            // Given reviewer not participant
            UUID outsider = UUID.randomUUID();
            when(orderFacadeService.getOrder(orderId)).thenReturn(completedOrderResponse);
            List<ReviewRating> ratings = List.of(new ReviewRating(null, ReviewRating.Category.QUALITY, 80, null));

            assertThatThrownBy(() -> reviewService.createReview(orderId, outsider, providerCompanyId, ratings))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("participants");
        }

        @Test
        @DisplayName("Should throw when reviewee not participant")
        void shouldThrowWhenRevieweeNotParticipant() {
            // Given reviewee not participant
            UUID outsider = UUID.randomUUID();
            when(orderFacadeService.getOrder(orderId)).thenReturn(completedOrderResponse);
            List<ReviewRating> ratings = List.of(new ReviewRating(null, ReviewRating.Category.QUALITY, 80, null));

            assertThatThrownBy(() -> reviewService.createReview(orderId, clientCompanyId, outsider, ratings))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("participants");
        }

        @Test
        @DisplayName("Should throw when self review")
        void shouldThrowWhenSelfReview() {
            // Given reviewer same as reviewee
            when(orderFacadeService.getOrder(orderId)).thenReturn(completedOrderResponse);
            List<ReviewRating> ratings = List.of(new ReviewRating(null, ReviewRating.Category.QUALITY, 80, null));

            assertThatThrownBy(() -> reviewService.createReview(orderId, clientCompanyId, clientCompanyId, ratings))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("same company");
        }

        @Test
        @DisplayName("Should throw when duplicate review")
        void shouldThrowWhenDuplicateReview() {
            when(orderFacadeService.getOrder(orderId)).thenReturn(completedOrderResponse);
            when(reviewRepository.existsByOrderIdAndReviewerCompanyId(orderId, clientCompanyId)).thenReturn(true);
            List<ReviewRating> ratings = List.of(new ReviewRating(null, ReviewRating.Category.QUALITY, 80, null));

            assertThatThrownBy(() -> reviewService.createReview(orderId, clientCompanyId, providerCompanyId, ratings))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("already exists");
        }
    }
}