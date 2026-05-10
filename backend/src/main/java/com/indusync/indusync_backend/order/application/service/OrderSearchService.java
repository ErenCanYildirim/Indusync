package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Service responsible for order search and filtering operations.
 * Handles finding available orders for service providers with various filters.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderSearchService {
    
    private final OrderRepository OrderRepository;
    private final OrderAuthorizationService authorizationService;

    /**
     * Finds available published orders that service providers can view and apply
     * for.
     * Filters orders based on location, category, budget, and other criteria.
     */
    public Page<OrderResponse> findAvailableOrders(
            BigDecimal companyLat,
            BigDecimal companyLng,
            Integer maxDistanceKm,
            OrderCategory primaryCategory,
            Urgency urgency,
            BigDecimal minBudget,
            BigDecimal maxBudget,
            String specialization,
            Pageable pageable,
            UUID companyId) {

        log.debug("Finding available orders with filters - maxDistance: {}km, category: {}, urgency: {}",
                maxDistanceKm, primaryCategory, urgency);

        // Verify the user has access to view orders (service provider companies)
        authorizationService.verifyAvailableOrdersAccess(companyId);

        // Find published orders that match the criteria
        Page<Order> orders = orderRepository.findAvailableOrdersWithFilters(
                companyLat, companyLng, maxDistanceKm,
                primaryCategory == null ? null : primaryCategory.name(),
                urgency == null ? null : urgency.name(),
                minBudget, maxBudget, specialization,
                companyId, pageable);

        return orders.map(OrderResponse::fromOrder);
    }

    /**
     * Gets detailed information about a specific published order for service
     * providers.
     */
    @Cacheable(value = com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDER_DETAILS_CACHE, key = "#orderId + '-' + #companyId")
    public OrderResponse getAvailableOrderDetails(UUID orderId, UUID companyId) {
        log.debug("Getting available order details for ID: {}", orderId);

        // verify authentication
        authorizationService.requireValidCompanyContext(companyId);

        //find the order and verify it's published and not owned by the requesting company
        Order order = orderRepository.findById(orderId)
            .orElseThrow(
                () -> new OrderLifecycleService.OrderNotFoundException("Auftrag nicht gefunden: " + orderId));
        
        // verify access permissions
        authorizationService.verifyAvailableOrderDetailsAccess(order, companyId);

        return OrderResponse.fromOrder(order);
    }

    /**
     * Gets all order categories that currently have published orders.
     */
    @Cacheable(value = com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDERS_CACHE, key = "'categories'")
    public OrderCategory[] getAvailableOrderCategories() {
        log.debug("Getting available order categories");

        // This could be optimized with a database query, but for now return all
        // categories
        // In a future iteration, we could query for distinct categories from published
        // orders
        return OrderCategory.values();
    }

    /**
     * Finds orders near the authenticated company's registered location.
     */
    public Page<OrderResponse> findNearbyOrdersForCompany(Integer radiusKm, Pageable pageable, UUID companyId) {
        log.debug("Finding nearby orders within {}km for company: {}", radiusKm, companyId);

        // Verify authentication and get company ID
        authorizationService.requireValidCompanyContext(companyId);

        // Find nearby orders using the company's registered location
        // This will query the company repository to get the company's coordinates
        Page<Order> orders = orderRepository.findNearbyOrdersForCompany(companyId, radiusKm, pageable);

        return orders.map(OrderResponse::fromOrder);
    }
}