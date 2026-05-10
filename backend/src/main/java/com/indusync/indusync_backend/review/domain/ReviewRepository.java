package com.indusync.indusync_backend.review.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
    Optional<Review> findByOrderIdAndReviewerCompanyId(UUID orderId, UUID reviewerCompanyId);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.orderId = :orderId")
    List<Review> findByOrderId(@Param("orderId") UUID orderId);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.orderId = :orderId AND r.reviewerCompanyId = :reviewerCompanyId")
    Optional<Review> findByOrderIdAndReviewerCompanyIdWithRatings(@Param("orderId") UUID orderId,
            @Param("reviewerCompanyId") UUID reviewerCompanyId);

    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.revieweeCompanyId = :revieweeCompanyId")
    List<Review> findByRevieweeCompanyId(@Param("revieweeCompanyId") UUID revieweeCompanyId);

    @Query("SELECT DISTINCT r.orderId FROM Review r WHERE r.revieweeCompanyId = :companyId OR r.reviewerCompanyId = :companyId")
    List<UUID> findCompletedOrdersByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Find reviews for a company with pagination support for large datasets.
     * This method efficiently fetches reviews with ratings for performance
     * optimization.
     *
     * @param revieweeCompanyId the company ID being reviewed
     * @param pageable          pagination information
     * @return paginated reviews with ratings
     */
    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.revieweeCompanyId = :revieweeCompanyId")
    Page<Review> findByRevieweeCompanyIdWithPagination(@Param("revieweeCompanyId") UUID revieweeCompanyId,
            Pageable pageable);

    /**
     * Find completed order IDs for a company with pagination support.
     * This method provides efficient pagination for large review datasets.
     *
     * @param companyId the company ID (as either reviewer or reviewee)
     * @param pageable  pagination information
     * @return paginated list of order IDs
     */
    @Query("SELECT DISTINCT r.orderId FROM Review r WHERE r.revieweeCompanyId = :companyId OR r.reviewerCompanyId = :companyId")
    Page<UUID> findCompletedOrdersByCompanyIdWithPagination(@Param("companyId") UUID companyId, Pageable pageable);

    /**
     * Find reviews with ratings efficiently for performance optimization.
     * This method uses JOIN FETCH to avoid N+1 query problems when loading ratings.
     *
     * @param revieweeCompanyId the company ID being reviewed
     * @return list of reviews with eagerly loaded ratings
     */
    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.revieweeCompanyId = :revieweeCompanyId ORDER BY r.createdAt DESC")
    List<Review> findByRevieweeCompanyIdWithRatingsOptimized(@Param("revieweeCompanyId") UUID revieweeCompanyId);

    /**
     * Find recent reviews for a company with limit for performance.
     * This method is optimized for displaying recent project reviews on company
     * profiles.
     *
     * @param revieweeCompanyId the company ID being reviewed
     * @param pageable          pagination with limit
     * @return recent reviews with ratings
     */
    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.revieweeCompanyId = :revieweeCompanyId ORDER BY r.createdAt DESC")
    Page<Review> findRecentReviewsByCompanyId(@Param("revieweeCompanyId") UUID revieweeCompanyId, Pageable pageable);

    /**
     * Count total reviews for a company for statistics.
     * This method provides efficient counting for company rating summaries.
     *
     * @param revieweeCompanyId the company ID being reviewed
     * @return total number of reviews
     */
    long countByRevieweeCompanyId(UUID revieweeCompanyId);

    /**
     * Find all reviews for a specific order with ratings for detailed review
     * display.
     * This method efficiently loads all reviews and ratings for an order.
     *
     * @param orderId the order ID
     * @return list of reviews with ratings for the order
     */
    @Query("SELECT r FROM Review r LEFT JOIN FETCH r.ratings WHERE r.orderId = :orderId ORDER BY r.createdAt ASC")
    List<Review> findByOrderIdWithRatingsOrdered(@Param("orderId") UUID orderId);

    /**
     * Find completed orders with reviews for a company.
     * This method joins with Order entity to get only COMPLETED orders with their
     * review data.
     * This is optimized for getting projects where the company participated and has
     * reviews.
     *
     * @param companyId the company ID (as either reviewer or reviewee)
     * @param pageable  pagination information
     * @return paginated list of order IDs for completed orders with reviews
     */
    @Query(value = """
            SELECT DISTINCT r.order_id
            FROM review.reviews r
            INNER JOIN "order".orders o ON r.order_id = o.id
            WHERE (r.reviewee_company_id = :companyId OR r.reviewer_company_id = :companyId)
            AND o.status = 'COMPLETED'
            ORDER BY o.completed_at DESC
            """, nativeQuery = true)
    Page<UUID> findCompletedOrdersWithReviewsByCompanyId(@Param("companyId") UUID companyId, Pageable pageable);

    /**
     * Find completed orders with reviews for a company (non-paginated).
     * This method joins with Order entity to get only COMPLETED orders with their
     * review data.
     *
     * @param companyId the company ID (as either reviewer or reviewee)
     * @return list of order IDs for completed orders with reviews
     */
    @Query(value = """
            SELECT DISTINCT r.order_id
            FROM review.reviews r
            INNER JOIN "order".orders o ON r.order_id = o.id
            WHERE (r.reviewee_company_id = :companyId OR r.reviewer_company_id = :companyId)
            AND o.status = 'COMPLETED'
            ORDER BY o.completed_at DESC
            """, nativeQuery = true)
    List<UUID> findCompletedOrdersWithReviewsByCompanyId(@Param("companyId") UUID companyId);

    boolean existsByOrderIdAndReviewerCompanyId(UUID orderId, UUID reviewerCompanyId);
}