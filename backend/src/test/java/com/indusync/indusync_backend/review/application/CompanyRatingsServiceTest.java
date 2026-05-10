package com.indusync.indusync_backend.review.application;

import com.indusync.indusync_backend.review.application.dto.*;
import com.indusync.indusync_backend.review.domain.*;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for CompanyRatingsService.
 * Tests the rating calculation algorithms and edge case handling.
 */
@ExtendWith(MockitoExtension.class)
class CompanyRatingsServiceTest {

    @Mock
    private ReviewRepository reviewRepository;

    @Mock
    private OrderFacadeService orderFacadeService;

    @Mock
    private CompanyManagementService companyManagementService;

    private CompanyRatingsService companyRatingsService;

    private UUID testCompanyId;
    private UUID testOrderId;
    private UUID testReviewerCompanyId;

    @BeforeEach
    void setUp() {
        companyRatingsService = new CompanyRatingsService(
                reviewRepository, orderFacadeService, companyManagementService);

        testCompanyId = UUID.randomUUID();
        testOrderId = UUID.randomUUID();
        testReviewerCompanyId = UUID.randomUUID();
    }

    @Test
    void getCompanyRatingsSummary_WithNoReviews_ReturnsEmptySummary() {
        // Given
        when(reviewRepository.findByRevieweeCompanyId(testCompanyId))
                .thenReturn(Collections.emptyList());
        when(reviewRepository.findCompletedOrdersByCompanyId(testCompanyId))
                .thenReturn(Collections.emptyList());

        // When
        CompanyRatingsSummary result = companyRatingsService.getCompanyRatingsSummary(testCompanyId);

        // Then
        assertNotNull(result);
        assertEquals(testCompanyId, result.companyId());
        assertNull(result.overallRating());
        assertEquals(0, result.totalReviews());
        assertEquals(0, result.completedOrders());
        assertTrue(result.categoryRatings().isEmpty() ||
                result.categoryRatings().values().stream().allMatch(cr -> cr.averageScore() == null));
        assertTrue(result.recentProjects().isEmpty());
    }

    @Test
    void getCompanyRatingsSummary_WithReviews_CalculatesCorrectAverages() {
        // Given
        Review review = createTestReview();
        List<ReviewRating> ratings = createTestRatings(review);
        review.setRatings(ratings);

        when(reviewRepository.findByRevieweeCompanyId(testCompanyId))
                .thenReturn(List.of(review));
        when(reviewRepository.findCompletedOrdersByCompanyId(testCompanyId))
                .thenReturn(List.of(testOrderId));
        when(orderFacadeService.getOrder(testOrderId))
                .thenReturn(createTestOrderResponse());
        when(companyManagementService.getCompanyName(testReviewerCompanyId))
                .thenReturn("Test Reviewer Company");

        // When
        CompanyRatingsSummary result = companyRatingsService.getCompanyRatingsSummary(testCompanyId);

        // Then
        assertNotNull(result);
        assertEquals(testCompanyId, result.companyId());
        assertEquals(1, result.totalReviews());
        assertEquals(1, result.completedOrders());
        assertNotNull(result.overallRating());
        assertTrue(result.overallRating() > 0);
        assertFalse(result.categoryRatings().isEmpty());
        assertFalse(result.recentProjects().isEmpty());
    }

    @Test
    void getCompanyProjectReviews_WithValidData_ReturnsPaginatedResults() {
        // Given
        Review review = createTestReview();
        review.setRatings(createTestRatings(review));

        when(reviewRepository.findByRevieweeCompanyId(testCompanyId))
                .thenReturn(List.of(review));
        when(orderFacadeService.getOrder(testOrderId))
                .thenReturn(createTestOrderResponse());
        when(companyManagementService.getCompanyName(testReviewerCompanyId))
                .thenReturn("Test Reviewer Company");

        // When
        Page<ProjectReviewSummary> result = companyRatingsService.getCompanyProjectReviews(testCompanyId, 0, 10);

        // Then
        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals(1, result.getContent().size());

        ProjectReviewSummary summary = result.getContent().get(0);
        assertEquals(testOrderId, summary.orderId());
        assertNotNull(summary.projectName());
        assertNotNull(summary.overallRating());
    }

    @Test
    void getOrderReviewDetails_WithValidOrder_ReturnsDetailedReviews() {
        // Given
        Review review = createTestReview();
        review.setRatings(createTestRatings(review));

        when(orderFacadeService.getOrder(testOrderId))
                .thenReturn(createTestOrderResponse());
        when(reviewRepository.findByOrderId(testOrderId))
                .thenReturn(List.of(review));
        when(companyManagementService.getCompanyName(testReviewerCompanyId))
                .thenReturn("Test Reviewer Company");
        when(companyManagementService.getCompanyName(testCompanyId))
                .thenReturn("Test Company");

        // When
        OrderReviewDetails result = companyRatingsService.getOrderReviewDetails(testOrderId);

        // Then
        assertNotNull(result);
        assertEquals(testOrderId, result.orderId());
        assertFalse(result.reviews().isEmpty());
        assertEquals(1, result.reviews().size());

        DetailedReview detailedReview = result.reviews().get(0);
        assertEquals(review.getId(), detailedReview.reviewId());
        assertNotNull(detailedReview.ratings());
        assertFalse(detailedReview.ratings().isEmpty());
    }

    @Test
    void getOrderReviewDetails_WithNoReviews_ReturnsEmptyDetails() {
        // Given
        when(orderFacadeService.getOrder(testOrderId))
                .thenReturn(createTestOrderResponse());
        when(reviewRepository.findByOrderId(testOrderId))
                .thenReturn(Collections.emptyList());

        // When
        OrderReviewDetails result = companyRatingsService.getOrderReviewDetails(testOrderId);

        // Then
        assertNotNull(result);
        assertEquals(testOrderId, result.orderId());
        assertTrue(result.reviews().isEmpty());
        assertFalse(result.hasReviews());
    }

    private Review createTestReview() {
        Review review = new Review(testOrderId, testReviewerCompanyId, testCompanyId);
        review.setId(UUID.randomUUID());
        review.setCreatedAt(LocalDateTime.now());
        return review;
    }

    private List<ReviewRating> createTestRatings(Review review) {
        List<ReviewRating> ratings = new ArrayList<>();
        
        // Create ratings for all categories with different scores
        ratings.add(new ReviewRating(review, ReviewRating.Category.COMMUNICATION, 85, "Good communication"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.RESPONSE_TIME, 90, "Very responsive"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.PUNCTUALITY, 80, "On time"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.QUALITY, 95, "Excellent quality"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.BUDGET, 75, "Within budget"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.FLEXIBILITY, 88, "Very flexible"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.DOCUMENTATION, 82, "Good documentation"));
        ratings.add(new ReviewRating(review, ReviewRating.Category.OVERALL_SATISFACTION, 87, "Very satisfied"));

        return ratings;
    }

private OrderResponse createTestOrderResponse() {
        return new OrderResponse(
                testOrderId,
                "Test Order",
                "Test Description",
                OrderStatus.COMPLETED,
                "Completed",
                testCompanyId,
                testReviewerCompanyId,
                LocalDateTime.now().minusDays(30),
                LocalDateTime.now().minusDays(1),
                "John Doe",
                "john@example.com",
                "+1234567890",
                "Main Street",
                "123",
                "12345",
                "Test City",
                "Germany",
                "123 Main Street, 12345 Test City, Germany",
                52.5200,
                13.4050,
                50,
                null,
                null,
                Collections.emptyList(),
                Collections.emptySet(),
                Collections.emptyList(),
                Collections.emptySet(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                null,
                null,
                LocalDateTime.now().minusDays(10),
                LocalDateTime.now().minusDays(1),
                24,
                false,
                false,
                null,
                false,
                LocalDateTime.now().minusDays(30),
                LocalDateTime.now().minusDays(1),
                false,
                true,
                true,
                false
        );
    }
}