package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Order entity operations.
 * <p>
 * This repository provides comprehensive data access methods for:
 * - Basic CRUD operations
 * - Status-based queries
 * - Company-specific order management
 * - Geographic queries for matching
 * - Order lifecycle management
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    // === Basic Queries ===

    /**
     * Finds all orders for a specific company.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of orders
     */
    Page<Order> findByCompanyId(UUID companyId, Pageable pageable);

    /**
     * Finds all orders for a specific company with given status.
     *
     * @param companyId the company ID
     * @param status    the order status
     * @param pageable  pagination information
     * @return page of orders
     */
    Page<Order> findByCompanyIdAndStatus(UUID companyId, OrderStatus status, Pageable pageable);

    /**
     * Finds all orders with a specific status.
     *
     * @param status   the order status
     * @param pageable pagination information
     * @return page of orders
     */
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);

    /**
     * Finds all orders with status in the given list.
     *
     * @param statuses list of order statuses
     * @param pageable pagination information
     * @return page of orders
     */
    Page<Order> findByStatusIn(List<OrderStatus> statuses, Pageable pageable);

    // === Geographic Queries for Matching ===

    /**
     * Finds all published orders within a specified radius of a given location.
     * This is the core query for provider matching.
     *
     * @param latitude  the latitude of the provider location
     * @param longitude the longitude of the provider location
     * @param radiusKm  the search radius in kilometers
     * @return list of matching orders
     */
    @Query(value = """
            SELECT o.* FROM order.orders o
            WHERE o.status = 'PUBLISHED'
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                :radiusKm * 1000
            )
            ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            )
            """, nativeQuery = true)
    List<Order> findPublishedOrdersWithinRadius(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude,
            @Param("radiusKm") Integer radiusKm);

    /**
     * Finds all published orders within their own search radius of a given
     * location.
     * This allows orders to specify how far providers can be located.
     *
     * @param latitude  the latitude of the provider location
     * @param longitude the longitude of the provider location
     * @return list of matching orders
     */
    @Query(value = """
            SELECT o.* FROM order.orders o
            WHERE o.status = 'PUBLISHED'
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                o.search_radius_km * 1000
            )
            ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            )
            """, nativeQuery = true)
    List<Order> findPublishedOrdersForProviderLocation(
            @Param("latitude") Double latitude,
            @Param("longitude") Double longitude);

    // === Status-based Queries ===

    /**
     * Finds all published orders.
     *
     * @param pageable pagination information
     * @return page of published orders
     */
    default Page<Order> findPublishedOrders(Pageable pageable) {
        return findByStatus(OrderStatus.PUBLISHED, pageable);
    }

    /**
     * Finds all draft orders for a company.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of draft orders
     */
    default Page<Order> findDraftOrdersByCompany(UUID companyId, Pageable pageable) {
        return findByCompanyIdAndStatus(companyId, OrderStatus.DRAFT, pageable);
    }

    /**
     * Finds all active orders for a company (not completed or cancelled).
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of active orders
     */
    default Page<Order> findActiveOrdersByCompany(UUID companyId, Pageable pageable) {
        List<OrderStatus> activeStatuses = List.of(
                OrderStatus.DRAFT, OrderStatus.PUBLISHED,
                OrderStatus.MATCHED, OrderStatus.IN_PROGRESS);
        return findByCompanyIdAndStatusIn(companyId, activeStatuses, pageable);
    }

    /**
     * Helper method for finding orders by company and status list.
     */
    Page<Order> findByCompanyIdAndStatusIn(UUID companyId, List<OrderStatus> statuses, Pageable pageable);

    /**
     * Finds orders assigned to a provider with a specific status.
     */
    Page<Order> findByProviderIdAndStatus(UUID providerId, OrderStatus status, Pageable pageable);

    /**
     * Finds orders assigned to a provider excluding a certain status (e.g.
     * COMPLETED).
     */
    Page<Order> findByProviderIdAndStatusNot(UUID providerId, OrderStatus status, Pageable pageable);

    /** Exclude status for company (client side) */
    Page<Order> findByCompanyIdAndStatusNot(UUID companyId, OrderStatus status, Pageable pageable);

    // === Time-based Queries ===

    /**
     * Finds orders published after a specific date.
     *
     * @param publishedAfter the date threshold
     * @param pageable       pagination information
     * @return page of recent orders
     */
    Page<Order> findByPublishedAtAfter(LocalDateTime publishedAfter, Pageable pageable);

    /**
     * Finds orders completed after a specific date.
     *
     * @param completedAfter the date threshold
     * @param pageable       pagination information
     * @return page of recently completed orders
     */
    Page<Order> findByCompletedAtAfter(LocalDateTime completedAfter, Pageable pageable);

    // === Count Queries ===

    /**
     * Counts orders by status for a specific company.
     *
     * @param companyId the company ID
     * @param status    the order status
     * @return count of orders
     */
    long countByCompanyIdAndStatus(UUID companyId, OrderStatus status);

    /**
     * Counts total orders for a company.
     *
     * @param companyId the company ID
     * @return total count of orders
     */
    long countByCompanyId(UUID companyId);

    /**
     * Checks if a company has created any orders (acts as client).
     *
     * @param companyId the company ID
     * @return true if company has created orders
     */
    boolean existsByCompanyId(UUID companyId);

    /**
     * Checks if a company has been assigned to any orders (acts as provider).
     *
     * @param providerId the provider company ID
     * @return true if company has been assigned to orders
     */
    boolean existsByProviderId(UUID providerId);

    /**
     * Counts orders by company and status list.
     *
     * @param companyId the company ID
     * @param statuses  list of order statuses
     * @return count of orders
     */
    long countByCompanyIdAndStatusIn(UUID companyId, List<OrderStatus> statuses);

    /**
     * Counts orders assigned to a provider with a specific status.
     *
     * @param providerId the provider ID
     * @param status     the order status
     * @return count of orders
     */
    long countByProviderIdAndStatus(UUID providerId, OrderStatus status);

    /**
     * Counts orders by status across all companies.
     *
     * @param status the order status
     * @return count of orders
     */
    long countByStatus(OrderStatus status);

    // === Order Discovery and Filtering ===

    /**
     * Finds available published orders with comprehensive filters for service
     * providers.
     * This is the main query for the order board functionality.
     *
     * @param companyLat       the service provider company's latitude (optional)
     * @param companyLng       the service provider company's longitude (optional)
     * @param maxDistanceKm    maximum distance in kilometers to search
     * @param primaryCategory  filter by primary category (optional)
     * @param urgency          filter by urgency level (optional)
     * @param minBudget        minimum budget filter (optional)
     * @param maxBudget        maximum budget filter (optional)
     * @param specialization   search in required specializations (optional)
     * @param excludeCompanyId company ID to exclude (don't show own orders)
     * @param pageable         pagination parameters
     * @return page of matching published orders
     */
    @Query(value = """
            SELECT o.* FROM "order".orders o
            WHERE o.status = 'PUBLISHED'
            AND o.company_id != :excludeCompanyId
            AND (:primaryCategory IS NULL OR o.primary_category = CAST(:primaryCategory AS varchar))
            AND (:urgency IS NULL OR o.urgency = CAST(:urgency AS varchar))
            AND (:minBudget IS NULL OR o.budget IS NULL OR o.budget >= :minBudget)
            AND (:maxBudget IS NULL OR o.budget IS NULL OR o.budget <= :maxBudget)
            AND (:specialization IS NULL OR LOWER(o.required_specializations) LIKE LOWER(CONCAT('%', :specialization, '%')))
            AND (
                :companyLat IS NULL OR :companyLng IS NULL OR
                ST_DWithin(
                    ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                    ST_SetSRID(ST_MakePoint(:companyLng, :companyLat), 4326),
                    :maxDistanceKm * 1000
                )
            )
            ORDER BY
                CASE
                    WHEN :companyLat IS NOT NULL AND :companyLng IS NOT NULL THEN
                        ST_Distance(
                            ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                            ST_SetSRID(ST_MakePoint(:companyLng, :companyLat), 4326)
                        )
                    ELSE extract(epoch from o.published_at)
                END DESC
            """, nativeQuery = true)
    Page<Order> findAvailableOrdersWithFilters(
            @Param("companyLat") BigDecimal companyLat,
            @Param("companyLng") BigDecimal companyLng,
            @Param("maxDistanceKm") Integer maxDistanceKm,
            @Param("primaryCategory") String primaryCategory,
            @Param("urgency") String urgency,
            @Param("minBudget") BigDecimal minBudget,
            @Param("maxBudget") BigDecimal maxBudget,
            @Param("specialization") String specialization,
            @Param("excludeCompanyId") UUID excludeCompanyId,
            Pageable pageable);

    /**
     * Finds orders near a company's registered location.
     * This method joins with the company table to get the company's coordinates.
     *
     * @param companyId the company ID
     * @param radiusKm  the search radius in kilometers
     * @param pageable  pagination parameters
     * @return page of nearby orders
     */
    @Query(value = """
            SELECT o.* FROM "order".orders o
            CROSS JOIN company.companies c
            WHERE c.id = :companyId
            AND o.status = 'PUBLISHED'
            AND o.company_id != :companyId
            AND c.latitude IS NOT NULL
            AND c.longitude IS NOT NULL
            AND ST_DWithin(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326),
                :radiusKm * 1000
            )
            ORDER BY ST_Distance(
                ST_SetSRID(ST_MakePoint(o.location_lng, o.location_lat), 4326),
                ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)
            )
            """, nativeQuery = true)
    Page<Order> findNearbyOrdersForCompany(
            @Param("companyId") UUID companyId,
            @Param("radiusKm") Integer radiusKm,
            Pageable pageable);

    /**
     * Find orders for calendar display - only orders with both startDate and
     * deadline
     * For client view: all orders created by the company
     */
    @Query("SELECT o FROM Order o WHERE o.companyId = :companyId " +
            "AND o.startDate IS NOT NULL AND o.deadline IS NOT NULL " +
            "ORDER BY o.startDate ASC")
    List<Order> findCalendarOrdersByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Find orders for calendar display - only orders with both startDate and
     * deadline
     * For provider view: only orders assigned to the provider
     */
    @Query("SELECT o FROM Order o WHERE o.providerId = :providerId " +
            "AND o.startDate IS NOT NULL AND o.deadline IS NOT NULL " +
            "ORDER BY o.startDate ASC")
    List<Order> findCalendarOrdersByProviderId(@Param("providerId") UUID providerId);

    /**
     * Find orders for calendar display within a date range
     * For client view: all orders created by the company within the date range
     */
    @Query("SELECT o FROM Order o WHERE o.companyId = :companyId " +
            "AND o.startDate IS NOT NULL AND o.deadline IS NOT NULL " +
            "AND ((o.startDate >= :startDate AND o.startDate <= :endDate) " +
            "OR (o.deadline >= :startDate AND o.deadline <= :endDate) " +
            "OR (o.startDate <= :startDate AND o.deadline >= :endDate)) " +
            "ORDER BY o.startDate ASC")
    List<Order> findCalendarOrdersByCompanyIdAndDateRange(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find orders for calendar display within a date range
     * For provider view: only orders assigned to the provider within the date range
     */
    @Query("SELECT o FROM Order o WHERE o.providerId = :providerId " +
            "AND o.startDate IS NOT NULL AND o.deadline IS NOT NULL " +
            "AND ((o.startDate >= :startDate AND o.startDate <= :endDate) " +
            "OR (o.deadline >= :startDate AND o.deadline <= :endDate) " +
            "OR (o.startDate <= :startDate AND o.deadline >= :endDate)) " +
            "ORDER BY o.startDate ASC")
    List<Order> findCalendarOrdersByProviderIdAndDateRange(
            @Param("providerId") UUID providerId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    // === Dashboard Statistics Queries ===

    /**
     * Efficiently counts active orders for a company as client.
     * Active orders as client: PUBLISHED, MATCHED, IN_PROGRESS
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_company_status ON "order".orders (company_id,
     * status);
     *
     * @param companyId the company ID
     * @return count of active orders as client
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.companyId = :companyId " +
            "AND o.status IN ('PUBLISHED', 'MATCHED', 'IN_PROGRESS')")
    long countActiveOrdersAsClient(@Param("companyId") UUID companyId);

    /**
     * Efficiently counts active orders for a company as provider.
     * Active orders as provider: IN_PROGRESS (only assigned orders)
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_provider_status ON "order".orders (provider_id,
     * status);
     *
     * @param companyId the company ID (acting as provider)
     * @return count of active orders as provider
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.providerId = :companyId " +
            "AND o.status = 'IN_PROGRESS'")
    long countActiveOrdersAsProvider(@Param("companyId") UUID companyId);

    /**
     * Efficiently counts completed orders for a company as client.
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_company_status ON "order".orders (company_id,
     * status);
     *
     * @param companyId the company ID
     * @return count of completed orders as client
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.companyId = :companyId " +
            "AND o.status = 'COMPLETED'")
    long countCompletedOrdersAsClient(@Param("companyId") UUID companyId);

    /**
     * Efficiently counts completed orders for a company as provider.
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_provider_status ON "order".orders (provider_id,
     * status);
     *
     * @param companyId the company ID (acting as provider)
     * @return count of completed orders as provider
     */
    @Query("SELECT COUNT(o) FROM Order o WHERE o.providerId = :companyId " +
            "AND o.status = 'COMPLETED'")
    long countCompletedOrdersAsProvider(@Param("companyId") UUID companyId);

    /**
     * Calculates average response time for a company as client.
     * Measures time from order publication to first application received.
     * 
     * Database Index Recommendations:
     * CREATE INDEX idx_orders_company_published ON "order".orders (company_id,
     * published_at);
     * CREATE INDEX idx_order_matches_order_created ON "order".order_matches
     * (order_id, created_at);
     *
     * @param companyId the company ID
     * @return average response time in days, null if no data
     */
    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (om.created_at - o.published_at)) / 86400.0)
            FROM "order".orders o
            INNER JOIN "order".order_matches om ON o.id = om.order_id
            WHERE o.company_id = :companyId
            AND o.published_at IS NOT NULL
            AND om.interested = true
            AND om.created_at = (
                SELECT MIN(om2.created_at)
                FROM "order".order_matches om2
                WHERE om2.order_id = o.id
                AND om2.interested = true
            )
            """, nativeQuery = true)
    Double calculateAverageResponseTimeAsClient(@Param("companyId") UUID companyId);

    /**
     * Calculates average response time for a company as provider.
     * Measures time from order publication to application submission by this
     * provider.
     * 
     * Database Index Recommendations:
     * CREATE INDEX idx_order_matches_provider_interested ON "order".order_matches
     * (provider_id, interested, created_at);
     * CREATE INDEX idx_orders_published ON "order".orders (id, published_at);
     *
     * @param companyId the company ID (acting as provider)
     * @return average response time in days, null if no data
     */
    @Query(value = """
            SELECT AVG(EXTRACT(EPOCH FROM (om.created_at - o.published_at)) / 86400.0)
            FROM "order".order_matches om
            INNER JOIN "order".orders o ON om.order_id = o.id
            WHERE om.provider_id = :companyId
            AND om.interested = true
            AND o.published_at IS NOT NULL
            """, nativeQuery = true)
    Double calculateAverageResponseTimeAsProvider(@Param("companyId") UUID companyId);

    /**
     * Finds published order IDs for a company to calculate open applications.
     * Optimized query to get only IDs for subsequent application counting.
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_company_status ON "order".orders (company_id,
     * status);
     *
     * @param companyId the company ID
     * @return list of published order IDs
     */
    @Query("SELECT o.id FROM Order o WHERE o.companyId = :companyId AND o.status = 'PUBLISHED'")
    List<UUID> findPublishedOrderIdsByCompanyId(@Param("companyId") UUID companyId);

    // === Order Activity Chart Queries ===

    /**
     * Gets daily order counts for a company as client (orders created/published).
     * Groups orders by the date they were published within the specified date
     * range.
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_company_published_date ON "order".orders (company_id,
     * DATE(published_at));
     *
     * @param companyId the company ID
     * @param startDate start date for the range (inclusive)
     * @param endDate   end date for the range (inclusive)
     * @return list of [date, count] pairs
     */
    @Query(value = """
            SELECT DATE(o.published_at) as activity_date, COUNT(*) as order_count
            FROM "order".orders o
            WHERE o.company_id = :companyId
            AND o.published_at IS NOT NULL
            AND DATE(o.published_at) >= :startDate
            AND DATE(o.published_at) <= :endDate
            GROUP BY DATE(o.published_at)
            ORDER BY activity_date
            """, nativeQuery = true)
    List<Object[]> getDailyOrderCountsAsClient(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Gets daily order counts for a company as provider (orders accepted).
     * Groups orders by the date they were accepted by the client.
     * 
     * Database Index Recommendation:
     * CREATE INDEX idx_orders_provider_accepted_date ON "order".orders
     * (provider_id, DATE(accepted_at));
     *
     * @param companyId the company ID (acting as provider)
     * @param startDate start date for the range (inclusive)
     * @param endDate   end date for the range (inclusive)
     * @return list of [date, count] pairs
     */
    @Query(value = """
            SELECT DATE(o.accepted_at) as activity_date, COUNT(*) as order_count
            FROM "order".orders o
            WHERE o.provider_id = :companyId
            AND o.accepted_at IS NOT NULL
            AND DATE(o.accepted_at) >= :startDate
            AND DATE(o.accepted_at) <= :endDate
            GROUP BY DATE(o.accepted_at)
            ORDER BY activity_date
            """, nativeQuery = true)
    List<Object[]> getDailyOrderCountsAsProvider(
            @Param("companyId") UUID companyId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Finds an order by ID with all collections eagerly loaded.
     * This method ensures proper initialization of lazy collections for caching
     * purposes.
     *
     * @param orderId the order ID
     * @return optional order with eagerly loaded collections
     */
    @Query("SELECT o FROM Order o WHERE o.id = :orderId")
    Optional<Order> findByIdWithCollections(@Param("orderId") UUID orderId);
}