package com.indusync.indusync_backend.dashboard.application;

import com.indusync.indusync_backend.company.domain.CompanyRepository;
import com.indusync.indusync_backend.shared.config.CacheConfig;
import com.indusync.indusync_backend.dashboard.application.dto.DashboardStatistics;
import com.indusync.indusync_backend.dashboard.application.dto.OrderActivityData;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.order.domain.OrderMatchRepository;
import com.indusync.indusync_backend.review.application.dto.CompanyRole;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Service for calculating and providing dashboard statistics for companies.
 * <p>
 * This service provides role-aware statistics that differentiate between:
 * - Client activities (orders created, applications received)
 * - Provider activities (orders assigned, applications sent)
 * - Dual-role companies (aggregated statistics from both contexts)
 * </p>
 * <p>
 * All calculations respect company context and user permissions, ensuring
 * that companies only see statistics relevant to their own activities.
 * </p>
 * <p>
 * <strong>Database Performance Optimization:</strong>
 * This service uses optimized queries with proper indexing recommendations.
 * For optimal performance, ensure the following indexes are created:
 * </p>
 * <ul>
 * <li>CREATE INDEX idx_orders_company_status ON "order".orders (company_id,
 * status);</li>
 * <li>CREATE INDEX idx_orders_provider_status ON "order".orders (provider_id,
 * status);</li>
 * <li>CREATE INDEX idx_orders_company_published ON "order". orders (company_id,
 * published_at);</li>
 * <li>CREATE INDEX idx_order_matches_order_interested ON "order".order_matches
 * (order_id, interested);</li>
 * <li>CREATE INDEX idx_order_matches_provider_interested ON
 * "order".order_matches (provider_id, interested, created_at);</li>
 * <li>CREATE INDEX idx_order_matches_order_created ON "order".order_matches
 * (order_id, created_at);</li>
 * </ul>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardStatisticsService {

    private final OrderRepository orderRepository;
    private final OrderMatchRepository orderMatchRepository;
    private final CompanyRepository companyRepository;

    /**
     * Gets comprehensive dashboard statistics for a company.
     * <p>
     * Calculates all key metrics including active orders, open applications,
     * completed orders, and average response time based on the company's role
     * as a client, provider, or both.
     * </p>
     * <p>
     * <strong>Caching:</strong> Results are cached for 5 minutes to improve
     * performance.
     * Cache key is based on company ID to ensure data isolation between companies.
     * </p>
     *
     * @param companyId the company ID to calculate statistics for
     * @return dashboard statistics with all calculated metrics and role context
     * @throws IllegalArgumentException if companyId is null
     */
    @Cacheable(value = CacheConfig.DASHBOARD_STATISTICS_CACHE, key = "#companyId")
    public DashboardStatistics getCompanyDashboardStatistics(UUID companyId) {
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID must not be null");
        }

        log.debug("Calculating dashboard statistics for company: {}", companyId);

        try {
            // Detect company roles first
            Set<CompanyRole> companyRoles = detectCompanyRoles(companyId);
            log.debug("Detected roles for company {}: {}", companyId, companyRoles);

            // Calculate all metrics
            int activeOrders = calculateActiveOrders(companyId);
            int openApplications = calculateOpenApplications(companyId);
            int completedOrders = calculateCompletedOrders(companyId);
            Double averageResponseTime = calculateAverageResponseTime(companyId);

            log.debug(
                    "Statistics calculated for company {}: active={}, applications={}, completed={}, responseTime={}, roles={}",
                    companyId, activeOrders, openApplications, completedOrders, averageResponseTime, companyRoles);

            return DashboardStatistics.of(activeOrders, openApplications, completedOrders, averageResponseTime,
                    companyRoles);

        } catch (Exception e) {
            log.error("Error calculating dashboard statistics for company {}: {}", companyId, e.getMessage(), e);
            // Return empty statistics on error to prevent dashboard from breaking
            return DashboardStatistics.empty();
        }
    }

    /**
     * Gets order activity chart data for a company over the specified number of
     * days.
     * <p>
     * Generates daily activity data showing "Aufträge" (orders) and "Anfragen"
     * (applications) based on the company's role as a client, provider, or both.
     * The data is role-aware and properly categorized for chart display.
     * </p>
     * <p>
     * <strong>Caching:</strong> Results are cached for 10 minutes to improve
     * performance.
     * Cache key combines company ID and days parameter to ensure proper cache
     * isolation.
     * </p>
     *
     * @param companyId the company ID
     * @param days      number of days to include in the chart (must be positive)
     * @return list of daily activity data, sorted by date
     * @throws IllegalArgumentException if companyId is null or days is not positive
     */
    @Cacheable(value = CacheConfig.ORDER_ACTIVITY_CACHE, key = "#companyId + '-' + #days")
    public List<OrderActivityData> getOrderActivityChart(UUID companyId, int days) {
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID must not be null");
        }
        if (days <= 0) {
            throw new IllegalArgumentException("Days must be positive");
        }

        log.debug("Generating order activity chart for company {} over {} days", companyId, days);

        try {
            // Generate a date range for the specified number of days
            LocalDateTime endDate = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59);
            LocalDateTime startDate = endDate.minusDays(days - 1).withHour(0).withMinute(0).withSecond(0);

            log.debug("Chart date range: {} to {}", startDate, endDate);

            // Get daily activity data from both client and provider perspectives
            Map<LocalDate, Integer> clientOrderCounts = getDailyOrderCountsAsClient(companyId, startDate, endDate);
            Map<LocalDate, Integer> providerOrderCounts = getDailyOrderCountsAsProvider(companyId, startDate, endDate);
            Map<LocalDate, Integer> clientApplicationCounts = getDailyApplicationCountsAsClient(companyId, startDate,
                    endDate);
            Map<LocalDate, Integer> providerApplicationCounts = getDailyApplicationCountsAsProvider(companyId,
                    startDate, endDate);

            // Generate complete date range and combine data
            List<OrderActivityData> activityData = new ArrayList<>();
            LocalDate currentDate = startDate.toLocalDate();
            LocalDate endLocalDate = endDate.toLocalDate();

            while (!currentDate.isAfter(endLocalDate)) {
                // Role-based categorization:
                // - "Aufträge": Orders created (client) + Orders assigned to me (provider)
                // - "Anfragen": Applications received (client) + Applications sent (provider)
                int auftraege = clientOrderCounts.getOrDefault(currentDate, 0) +
                        providerOrderCounts.getOrDefault(currentDate, 0);
                int anfragen = clientApplicationCounts.getOrDefault(currentDate, 0) +
                        providerApplicationCounts.getOrDefault(currentDate, 0);

                activityData.add(OrderActivityData.of(currentDate, auftraege, anfragen));
                currentDate = currentDate.plusDays(1);
            }

            log.debug("Generated {} activity data points for company {}", activityData.size(), companyId);
            return activityData;

        } catch (Exception e) {
            log.error("Error generating order activity chart for company {}: {}", companyId, e.getMessage(), e);
            // Return empty data for the requested date range to prevent chart from breaking
            return generateEmptyActivityData(days);
        }
    }

    /**
     * Calculates the number of active orders for a company.
     * <p>
     * Active orders are defined based on a company role:
     * - As a client: Orders with status PUBLISHED, MATCHED, or IN_PROGRESS
     * - As provider: Orders assigned to the company with status IN_PROGRESS
     * - Dual-role: Sum of both client and provider active orders
     * </p>
     * <p>
     * Uses optimized database queries with proper indexing for efficient
     * calculation.
     * </p>
     *
     * @param companyId the company ID
     * @return number of active orders
     */
    private int calculateActiveOrders(UUID companyId) {
        log.debug("Calculating active orders for company: {}", companyId);

        // Use optimized queries for better performance
        long clientActiveOrders = orderRepository.countActiveOrdersAsClient(companyId);
        long providerActiveOrders = orderRepository.countActiveOrdersAsProvider(companyId);

        int totalActive = (int) (clientActiveOrders + providerActiveOrders);
        log.debug("Active orders for company {}: client={}, provider={}, total={}",
                companyId, clientActiveOrders, providerActiveOrders, totalActive);

        return totalActive;
    }

    /**
     * Calculates the number of open applications related to the company's orders.
     * <p>
     * Open applications are defined based on a company role:
     * - As a client: Applications received on published orders with interested=true
     * - As provider: Applications sent to other companies with interested=true
     * - Dual-role: Sum of both received and sent applications
     * </p>
     * <p>
     * Uses optimized database queries to minimize round trips and improve
     * performance.
     * </p>
     *
     * @param companyId the company ID
     * @return number of open applications
     */
    private int calculateOpenApplications(UUID companyId) {
        log.debug("Calculating open applications for company: {}", companyId);

        // Get published order IDs efficiently (only IDs, not full entities)
        List<UUID> publishedOrderIds = orderRepository.findPublishedOrderIdsByCompanyId(companyId);

        // Use a batch query to count applications for all orders at once
        long receivedApplications = publishedOrderIds.isEmpty() ? 0
                : orderMatchRepository.countOpenApplicationsForOrders(publishedOrderIds);

        // Applications sent as provider (optimized query)
        long sentApplications = orderMatchRepository.countOpenApplicationsAsProvider(companyId);

        int totalApplications = (int) (receivedApplications + sentApplications);
        log.debug("Open applications for company {}: received={}, sent={}, total={}",
                companyId, receivedApplications, sentApplications, totalApplications);

        return totalApplications;
    }

    /**
     * Calculates the number of completed orders for the company.
     * <p>
     * Completed orders include:
     * - As a client: Orders created by the company with status COMPLETED
     * - As provider: Orders completed by the company as provider
     * - Dual-role: Sum of both client and provider completed orders
     * </p>
     * <p>
     * Uses optimized database queries with proper indexing for efficient
     * calculation.
     * </p>
     *
     * @param companyId the company ID
     * @return number of completed orders
     */
    private int calculateCompletedOrders(UUID companyId) {
        log.debug("Calculating completed orders for company: {}", companyId);

        // Use optimized queries for better performance
        long clientCompletedOrders = orderRepository.countCompletedOrdersAsClient(companyId);
        long providerCompletedOrders = orderRepository.countCompletedOrdersAsProvider(companyId);

        int totalCompleted = (int) (clientCompletedOrders + providerCompletedOrders);
        log.debug("Completed orders for company {}: client={}, provider={}, total={}",
                companyId, clientCompletedOrders, providerCompletedOrders, totalCompleted);

        return totalCompleted;
    }

    /**
     * Calculates the average response time for order interactions.
     * <p>
     * Response time is calculated based on company role:
     * - As client: Average time from order publication to first application
     * received
     * - As provider: Average time from order publication to application submission
     * - Dual-role: Weighted average based on role-specific interactions
     * </p>
     * <p>
     * Returns null if no response time data is available.
     * </p>
     *
     * @param companyId the company ID
     * @return average response time in days, or null if no data available
     */
    private Double calculateAverageResponseTime(UUID companyId) {
        log.debug("Calculating average response time for company: {}", companyId);

        try {
            // For now, implement a basic calculation
            // This will be enhanced in future iterations with more sophisticated logic

            // Get average response time as a client (time from publishing to first
            // application)
            Double clientResponseTime = calculateClientAverageResponseTime(companyId);

            // Get average response time as a provider (time from order publication to
            // application)
            Double providerResponseTime = calculateProviderAverageResponseTime(companyId);

            // Calculate weighted average if both are available
            if (clientResponseTime != null && providerResponseTime != null) {
                double weightedAverage = (clientResponseTime + providerResponseTime) / 2.0;
                log.debug("Average response time for company {}: client={} days, provider={} days, weighted={} days",
                        companyId, clientResponseTime, providerResponseTime, weightedAverage);
                return weightedAverage;
            } else if (clientResponseTime != null) {
                log.debug("Average response time for company {} (client only): {} days", companyId, clientResponseTime);
                return clientResponseTime;
            } else if (providerResponseTime != null) {
                log.debug("Average response time for company {} (provider only): {} days", companyId,
                        providerResponseTime);
                return providerResponseTime;
            } else {
                log.debug("No response time data available for company: {}", companyId);
                return null;
            }

        } catch (Exception e) {
            log.warn("Error calculating average response time for company {}: {}", companyId, e.getMessage());
            return null;
        }
    }

    /**
     * Calculates average response time for the company acting as a client.
     * <p>
     * Measures the time from order publication to receiving the first application.
     * Uses optimized database query with proper date arithmetic.
     * </p>
     *
     * @param companyId the company ID
     * @return average response time in days, or null if no data
     */
    private Double calculateClientAverageResponseTime(UUID companyId) {
        log.debug("Calculating client average response time for company: {}", companyId);

        try {
            Double responseTime = orderRepository.calculateAverageResponseTimeAsClient(companyId);
            log.debug("Client average response time for company {}: {} days", companyId, responseTime);
            return responseTime;
        } catch (Exception e) {
            log.warn("Error calculating client average response time for company {}: {}", companyId, e.getMessage());
            return null;
        }
    }

    /**
     * Calculates average response time for the company acting as a provider.
     * <p>
     * Measures the time from order publication to submitting an application.
     * Uses optimized database query with proper date arithmetic.
     * </p>
     *
     * @param companyId the company ID
     * @return average response time in days, or null if no data
     */
    private Double calculateProviderAverageResponseTime(UUID companyId) {
        log.debug("Calculating provider average response time for company: {}", companyId);

        try {
            Double responseTime = orderRepository.calculateAverageResponseTimeAsProvider(companyId);
            log.debug("Provider average response time for company {}: {} days", companyId, responseTime);
            return responseTime;
        } catch (Exception e) {
            log.warn("Error calculating provider average response time for company {}: {}", companyId, e.getMessage());
            return null;
        }
    }

    // === Order Activity Chart Helper Methods ===

    /**
     * Gets daily order counts for a company acting as a client.
     * <p>
     * Retrieves orders created/published by the company grouped by date.
     * </p>
     *
     * @param companyId the company ID
     * @param startDate start date for the range
     * @param endDate   end date for the range
     * @return map of date to order count
     */
    private Map<LocalDate, Integer> getDailyOrderCountsAsClient(UUID companyId, LocalDateTime startDate,
            LocalDateTime endDate) {
        log.debug("Getting daily order counts as client for company {} from {} to {}", companyId, startDate, endDate);

        List<Object[]> results = orderRepository.getDailyOrderCountsAsClient(companyId, startDate, endDate);
        Map<LocalDate, Integer> counts = new HashMap<>();

        for (Object[] result : results) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Integer count = ((Number) result[1]).intValue();
            counts.put(date, count);
        }

        log.debug("Found {} days with client order activity for company {}", counts.size(), companyId);
        return counts;
    }

    /**
     * Gets daily order counts for a company acting as provider.
     * <p>
     * Retrieves orders assigned to the company grouped by assignment date.
     * </p>
     *
     * @param companyId the company ID
     * @param startDate start date for the range
     * @param endDate   end date for the range
     * @return map of date to order count
     */
    private Map<LocalDate, Integer> getDailyOrderCountsAsProvider(UUID companyId, LocalDateTime startDate,
            LocalDateTime endDate) {
        log.debug("Getting daily order counts as provider for company {} from {} to {}", companyId, startDate, endDate);

        List<Object[]> results = orderRepository.getDailyOrderCountsAsProvider(companyId, startDate, endDate);
        Map<LocalDate, Integer> counts = new HashMap<>();

        for (Object[] result : results) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Integer count = ((Number) result[1]).intValue();
            counts.put(date, count);
        }

        log.debug("Found {} days with provider order activity for company {}", counts.size(), companyId);
        return counts;
    }

    /**
     * Gets daily application counts received by a company as client.
     * <p>
     * Retrieves applications received on orders published by the company.
     * </p>
     *
     * @param companyId the company ID
     * @param startDate start date for the range
     * @param endDate   end date for the range
     * @return map of date to application count
     */
    private Map<LocalDate, Integer> getDailyApplicationCountsAsClient(UUID companyId, LocalDateTime startDate,
            LocalDateTime endDate) {
        log.debug("Getting daily application counts as client for company {} from {} to {}", companyId, startDate,
                endDate);

        List<Object[]> results = orderMatchRepository.getDailyApplicationCountsAsClient(companyId, startDate, endDate);
        Map<LocalDate, Integer> counts = new HashMap<>();

        for (Object[] result : results) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Integer count = ((Number) result[1]).intValue();
            counts.put(date, count);
        }

        log.debug("Found {} days with client application activity for company {}", counts.size(), companyId);
        return counts;
    }

    /**
     * Gets daily application counts sent by a company as provider.
     * <p>
     * Retrieves applications sent by the company to other orders.
     * </p>
     *
     * @param companyId the company ID
     * @param startDate start date for the range
     * @param endDate   end date for the range
     * @return map of date to application count
     */
    private Map<LocalDate, Integer> getDailyApplicationCountsAsProvider(UUID companyId, LocalDateTime startDate,
            LocalDateTime endDate) {
        log.debug("Getting daily application counts as provider for company {} from {} to {}", companyId, startDate,
                endDate);

        List<Object[]> results = orderMatchRepository.getDailyApplicationCountsAsProvider(companyId, startDate,
                endDate);
        Map<LocalDate, Integer> counts = new HashMap<>();

        for (Object[] result : results) {
            LocalDate date = ((java.sql.Date) result[0]).toLocalDate();
            Integer count = ((Number) result[1]).intValue();
            counts.put(date, count);
        }

        log.debug("Found {} days with provider application activity for company {}", counts.size(), companyId);
        return counts;
    }

    /**
     * Generates empty activity data for the specified number of days.
     * <p>
     * Used as a fallback when chart data generation fails to prevent UI from
     * breaking.
     * </p>
     *
     * @param days number of days to generate
     * @return list of empty activity data
     */
    private List<OrderActivityData> generateEmptyActivityData(int days) {
        log.debug("Generating empty activity data for {} days", days);

        List<OrderActivityData> emptyData = new ArrayList<>();
        LocalDate currentDate = LocalDate.now().minusDays(days - 1);

        for (int i = 0; i < days; i++) {
            emptyData.add(OrderActivityData.empty(currentDate));
            currentDate = currentDate.plusDays(1);
        }

        return emptyData;
    }

    // === Company Role Detection Methods ===

    /**
     * Detects the roles a company has in the system based on their order history.
     * <p>
     * A company can have one or both of the following roles:
     * - CLIENT: Company has created orders
     * - PROVIDER: Company has been assigned to orders or has applied to orders
     * </p>
     * <p>
     * This method uses efficient database queries to determine roles without
     * loading full order entities.
     * </p>
     *
     * @param companyId the company ID to check roles for
     * @return set of roles the company has (CLIENT, PROVIDER, or both)
     */
    private Set<CompanyRole> detectCompanyRoles(UUID companyId) {
        log.debug("Detecting company roles for company: {}", companyId);

        Set<CompanyRole> roles = new HashSet<>();

        try {
            // Check if company acts as a client (has created orders)
            boolean hasCreatedOrders = orderRepository.existsByCompanyId(companyId);
            if (hasCreatedOrders) {
                roles.add(CompanyRole.CLIENT);
                log.debug("Company {} acts as CLIENT (has created orders)", companyId);
            }

            // Check if company acts as a provider (has been assigned to orders or applied
            // to orders)
            boolean hasProviderActivity = orderRepository.existsByProviderId(companyId) ||
                    orderMatchRepository.existsByProviderId(companyId);
            if (hasProviderActivity) {
                roles.add(CompanyRole.PROVIDER);
                log.debug("Company {} acts as PROVIDER (has provider activity)", companyId);
            }

            if (roles.isEmpty()) {
                log.debug("Company {} has no detected roles - may be a new company", companyId);
            } else {
                log.debug("Company {} has roles: {}", companyId, roles);
            }

            return roles;

        } catch (Exception e) {
            log.warn("Error detecting company roles for company {}: {}", companyId, e.getMessage());
            // Return empty set on error to prevent breaking the dashboard
            return new HashSet<>();
        }
    }

    // === Cache Management Methods ===

    /**
     * Evicts dashboard statistics cache for a specific company.
     * p>
     * This method should be called when order data changes that would affect
     * the company's dashboard statistics (e.g., order status changes, new orders,
     * new applications).
     * </p>
     * <p>
     * <strong>Usage Examples:</strong>
     * </p>
     * <ul>
     * <li>When an order status changes (PUBLISHED → MATCHED → IN_PROGRESS →
     * COMPLETED)</li>
     * <li>When a new order is created</li>
     * <li>When a new application is submitted</li>
     * <li>When an application status changes</li>
     * </ul>
     *
     * @param companyId the company ID whose cache should be evicted
     */
    @CacheEvict(value = CacheConfig.DASHBOARD_STATISTICS_CACHE, key = "#companyId")
    public void evictDashboardStatisticsCache(UUID companyId) {
        log.debug("Evicting dashboard statistics cache for company: {}", companyId);
    }

    /**
     * Evicts order activity chart cache for a specific company.
     * <p>
     * This method should be called when order activity data changes that would
     * affect the company's activity charts. Since chart data depends on the
     * number of days parameter, this method evicts all chart cache entries
     * for the company.
     * </p>
     * <p>
     * <strong>Note:</strong> This uses allEntries=true to evict all chart cache
     * entries for the company regardless of the days parameter, as it's more
     * efficient than trying to evict specific day combinations.
     * </p>
     *
     * @param companyId the company ID whose chart cache should be evicted
     */
    @CacheEvict(value = CacheConfig.ORDER_ACTIVITY_CACHE, allEntries = true, condition = "#companyId != null")
    public void evictOrderActivityCache(UUID companyId) {
        log.debug("Evicting order activity chart cache for company: {}", companyId);
    }

    /**
     * Evicts all dashboard-related caches for a specific company.
     * <p>
     * This is a convenience method that evicts both dashboard statistics
     * and order activity chart caches for a company. Use this when multiple
     * types of data have changed, and you want to ensure all cached data
     * is refreshed.
     * </p>
     * <p>
     * <strong>Usage Examples:</strong>
     * </p>
     * <ul>
     * <li>After bulk data updates</li>
     * <li>When company role changes</li>
     * <li>During data migration or cleanup operations</li>
     * </ul>
     *
     * @param companyId the company ID whose caches should be evicted
     */
    public void evictAllDashboardCaches(UUID companyId) {
        log.debug("Evicting all dashboard caches for company: {}", companyId);
        evictDashboardStatisticsCache(companyId);
        evictOrderActivityCache(companyId);
    }

    /**
     * Evicts all dashboard statistics caches for all companies.
     * <p>
     * This method should be used sparingly and only in cases where
     * system-wide cache invalidation is necessary (e.g., after major
     * system updates, data migrations, or configuration changes).
     * </p>
     * <p>
     * <strong>Warning:</strong> This will cause a temporary performance impact
     * as all companies will need to recalculate their statistics on the next
     * request.
     * </p>
     */
    @CacheEvict(value = { CacheConfig.DASHBOARD_STATISTICS_CACHE, CacheConfig.ORDER_ACTIVITY_CACHE }, allEntries = true)
    public void evictAllDashboardCaches() {
        log.warn("Evicting ALL dashboard caches - this will impact performance temporarily");
    }
}