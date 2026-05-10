package com.indusync.indusync_backend.order.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for OrderMatch entities.
 * <p>
 * Provides queries for:
 * - Order board functionality (finding available orders for providers)
 * - Matching result storage and retrieval
 * - Analytics and reporting on match quality
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface OrderMatchRepository extends JpaRepository<OrderMatch, UUID> {

        // === Order Board Queries ===

        /**
         * Finds all orders available to a specific provider based on existing matches.
         * Orders are sorted by match score (highest first).
         * Excludes orders created by the same company (prevents self-matching).
         *
         * @param providerId the provider company ID
         * @param pageable   pagination information
         * @return page of order matches for the provider
         */
        @Query("SELECT om FROM OrderMatch om INNER JOIN Order o ON om.orderId = o.id " +
                        "WHERE om.providerId = :providerId AND o.companyId != :providerId " +
                        "ORDER BY om.matchScore DESC, om.matchedAt DESC")
        Page<OrderMatch> findAvailableOrdersForProvider(@Param("providerId") UUID providerId,
                        Pageable pageable);

        /**
         * Finds high-quality matches for a provider (score >= 0.7).
         * Excludes orders created by the same company (prevents self-matching).
         *
         * @param providerId the provider company ID
         * @param minScore   minimum match score threshold
         * @param pageable   pagination information
         * @return page of high-quality matches
         */
        @Query("SELECT om FROM OrderMatch om INNER JOIN Order o ON om.orderId = o.id " +
                        "WHERE om.providerId = :providerId AND o.companyId != :providerId " +
                        "AND om.matchScore >= :minScore " +
                        "ORDER BY om.matchScore DESC, om.matchedAt DESC")
        Page<OrderMatch> findHighQualityMatchesForProvider(@Param("providerId") UUID providerId,
                        @Param("minScore") BigDecimal minScore,
                        Pageable pageable);

        /**
         * Finds unviewed matches for a provider.
         * Excludes orders created by the same company (prevents self-matching).
         *
         * @param providerId the provider company ID
         * @param pageable   pagination information
         * @return page of unviewed matches
         */
        @Query("SELECT om FROM OrderMatch om INNER JOIN Order o ON om.orderId = o.id " +
                        "WHERE om.providerId = :providerId AND o.companyId != :providerId " +
                        "AND om.viewedAt IS NULL " +
                        "ORDER BY om.matchScore DESC, om.matchedAt DESC")
        Page<OrderMatch> findUnviewedMatchesForProvider(@Param("providerId") UUID providerId,
                        Pageable pageable);

        // === Order Management Queries ===

        /**
         * Finds all matches for a specific order.
         *
         * @param orderId the order ID
         * @return list of matches for the order
         */
        List<OrderMatch> findByOrderId(UUID orderId);

        /**
         * Finds all matches for a specific order, sorted by score.
         *
         * @param orderId  the order ID
         * @param pageable pagination information
         * @return page of matches for the order
         */
        @Query("SELECT om FROM OrderMatch om WHERE om.orderId = :orderId " +
                        "ORDER BY om.matchScore DESC")
        Page<OrderMatch> findByOrderIdOrderByMatchScoreDesc(@Param("orderId") UUID orderId,
                        Pageable pageable);

        /**
         * Checks if a match exists between an order and provider.
         *
         * @param orderId    the order ID
         * @param providerId the provider ID
         * @return true if match exists
         */
        boolean existsByOrderIdAndProviderId(UUID orderId, UUID providerId);

        /**
         * Finds a specific match between an order and provider.
         *
         * @param orderId    the order ID
         * @param providerId the provider ID
         * @return optional match
         */
        Optional<OrderMatch> findByOrderIdAndProviderId(UUID orderId, UUID providerId);

        // === Notification Queries ===

        /**
         * Finds matches that need notifications to be sent.
         *
         * @param pageable pagination for batch processing
         * @return page of matches pending notification
         */
        @Query("SELECT om FROM OrderMatch om WHERE om.notificationSent = false " +
                        "ORDER BY om.matchedAt ASC")
        Page<OrderMatch> findMatchesPendingNotification(Pageable pageable);

        /**
         * Finds matches for which notifications failed to send.
         *
         * @param cutoffTime time cutoff for considering notifications as failed
         * @param pageable   pagination information
         * @return page of matches with failed notifications
         */
        @Query("SELECT om FROM OrderMatch om WHERE om.notificationSent = false " +
                        "AND om.matchedAt < :cutoffTime " +
                        "ORDER BY om.matchedAt ASC")
        Page<OrderMatch> findFailedNotifications(@Param("cutoffTime") LocalDateTime cutoffTime,
                        Pageable pageable);

        // === Analytics Queries ===

        /**
         * Gets the total number of matches for an order.
         *
         * @param orderId the order ID
         * @return total match count
         */
        long countByOrderId(UUID orderId);

        /**
         * Gets the number of high-quality matches for an order.
         *
         * @param orderId  the order ID
         * @param minScore minimum score threshold
         * @return high-quality match count
         */
        @Query("SELECT COUNT(om) FROM OrderMatch om WHERE om.orderId = :orderId " +
                        "AND om.matchScore >= :minScore")
        long countHighQualityMatchesByOrderId(@Param("orderId") UUID orderId,
                        @Param("minScore") BigDecimal minScore);

        /**
         * Gets average match score for an order.
         *
         * @param orderId the order ID
         * @return average match score
         */
        @Query("SELECT AVG(om.matchScore) FROM OrderMatch om WHERE om.orderId = :orderId")
        Optional<BigDecimal> findAverageMatchScoreByOrderId(@Param("orderId") UUID orderId);

        /**
         * Gets provider engagement statistics.
         *
         * @param orderId the order ID
         * @return array of [viewed_count, interested_count]
         */
        @Query("SELECT COUNT(CASE WHEN om.viewedAt IS NOT NULL THEN 1 END), " +
                        "COUNT(CASE WHEN om.interested = true THEN 1 END) " +
                        "FROM OrderMatch om WHERE om.orderId = :orderId")
        List<Object[]> getEngagementStatsByOrderId(@Param("orderId") UUID orderId);

        /**
         * Finds recent matches for analytics (last N days).
         *
         * @param daysBack number of days to look back
         * @param pageable pagination information
         * @return page of recent matches
         */
        @Query("SELECT om FROM OrderMatch om WHERE om.matchedAt >= CURRENT_TIMESTAMP - :daysBack DAY " +
                        "ORDER BY om.matchedAt DESC")
        Page<OrderMatch> findRecentMatches(@Param("daysBack") int daysBack, Pageable pageable);

        // === Performance Queries ===

        /**
         * Bulk updates notification status for multiple matches.
         *
         * @param matchIds list of match IDs to update
         * @return number of updated records
         */
        @Modifying
        @Query("UPDATE OrderMatch om SET om.notificationSent = true, " +
                        "om.notificationSentAt = CURRENT_TIMESTAMP " +
                        "WHERE om.id IN :matchIds")
        int markNotificationsSent(@Param("matchIds") List<UUID> matchIds);

        /**
         * Deletes old matches (for cleanup purposes).
         *
         * @param cutoffDate date before which to delete matches
         * @return number of deleted records
         */
        @Modifying
        @Query("DELETE FROM OrderMatch om WHERE om.matchedAt < :cutoffDate")
        int deleteOldMatches(@Param("cutoffDate") LocalDateTime cutoffDate);

        List<OrderMatch> findByOrderIdAndInterestedTrue(UUID orderId);

        long countByOrderIdAndInterestedTrue(UUID orderId);

        /**
         * Counts applications sent by a provider company with interested=true.
         *
         * @param providerId the provider company ID
         * @return count of interested applications sent by the provider
         */
        long countByProviderIdAndInterestedTrue(UUID providerId);

        /**
         * Checks if a company has applied to any orders (acts as provider).
         * Used for role detection in dashboard statistics.
         *
         * @param providerId the provider company ID
         * @return true if company has applied to orders
         */
        boolean existsByProviderId(UUID providerId);

        // === Dashboard Statistics Queries ===

        /**
         * Efficiently counts open applications received by a company as client.
         * Uses batch processing for multiple order IDs to minimize database round
         * trips.
         * 
         * Database Index Recommendation:
         * CREATE INDEX idx_order_matches_order_interested ON "order".order_matches
         * (order_id, interested);
         *
         * @param orderIds list of published order IDs for the company
         * @return total count of interested applications across all orders
         */
        @Query("SELECT COUNT(om) FROM OrderMatch om WHERE om.orderId IN :orderIds AND om.interested = true")
        long countOpenApplicationsForOrders(@Param("orderIds") List<UUID> orderIds);

        /**
         * Efficiently counts open applications sent by a company as provider.
         * 
         * Database Index Recommendation:
         * CREATE INDEX idx_order_matches_provider_interested ON "order".order_matches
         * (provider_id, interested);
         *
         * @param providerId the provider company ID
         * @return count of interested applications sent by the provider
         */
        @Query("SELECT COUNT(om) FROM OrderMatch om WHERE om.providerId = :providerId AND om.interested = true")
        long countOpenApplicationsAsProvider(@Param("providerId") UUID providerId);

        // === Order Activity Chart Queries ===

        /**
         * Gets daily application counts received by a company as client.
         * Groups applications by the date they were created for orders published by the
         * company.
         * 
         * Database Index Recommendation:
         * CREATE INDEX idx_order_matches_created_date ON "order".order_matches
         * (order_id, DATE(created_at), interested);
         *
         * @param companyId the company ID (as client)
         * @param startDate start date for the range (inclusive)
         * @param endDate   end date for the range (inclusive)
         * @return list of [date, count] pairs
         */
        @Query(value = """
                        SELECT DATE(om.created_at) as activity_date, COUNT(*) as application_count
                        FROM "order".order_matches om
                        INNER JOIN "order".orders o ON om.order_id = o.id
                        WHERE o.company_id = :companyId
                        AND om.interested = true
                        AND DATE(om.created_at) >= :startDate
                        AND DATE(om.created_at) <= :endDate
                        GROUP BY DATE(om.created_at)
                        ORDER BY activity_date
                        """, nativeQuery = true)
        List<Object[]> getDailyApplicationCountsAsClient(
                        @Param("companyId") UUID companyId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);

        /**
         * Gets daily application counts sent by a company as provider.
         * Groups applications by the date they were created by the provider.
         * 
         * Database Index Recommendation:
         * CREATE INDEX idx_order_matches_provider_created_date ON "order".order_matches
         * (provider_id, DATE(created_at), interested);
         *
         * @param providerId the provider company ID
         * @param startDate  start date for the range (inclusive)
         * @param endDate    end date for the range (inclusive)
         * @return list of [date, count] pairs
         */
        @Query(value = """
                        SELECT DATE(om.created_at) as activity_date, COUNT(*) as application_count
                        FROM "order".order_matches om
                        WHERE om.provider_id = :providerId
                        AND om.interested = true
                        AND DATE(om.created_at) >= :startDate
                        AND DATE(om.created_at) <= :endDate
                        GROUP BY DATE(om.created_at)
                        ORDER BY activity_date
                        """, nativeQuery = true)
        List<Object[]> getDailyApplicationCountsAsProvider(
                        @Param("providerId") UUID providerId,
                        @Param("startDate") LocalDateTime startDate,
                        @Param("endDate") LocalDateTime endDate);
}