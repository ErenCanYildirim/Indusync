package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.api.dto.OrderCalendarResponse;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for calendar-specific order operations
 * Handles fetching and transforming orders for calendar display
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class OrderCalendarService {

    private final OrderRepository orderRepository;

    /**
     * Get calendar orders for a client (orders they created)
     * Only returns orders with both startDate and deadline
     */
    public List<OrderCalendarResponse> getClientCalendarOrders(UUID companyId) {
        log.debug("Fetching calendar orders for client company: {}", companyId);

        List<Order> orders = orderRepository.findCalendarOrdersByCompanyId(companyId);

        return orders.stream()
                .map(this::mapToClientCalendarResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get calendar orders for a provider (orders assigned to them)
     * Only returns orders with both startDate and deadline
     */
    public List<OrderCalendarResponse> getProviderCalendarOrders(UUID providerId) {
        log.debug("Fetching calendar orders for provider: {}", providerId);

        List<Order> orders = orderRepository.findCalendarOrdersByProviderId(providerId);

        return orders.stream()
                .map(this::mapToProviderCalendarResponse)
                .collect(Collectors.toList());
    }

     /**
     * Get calendar orders for a client within a specific date range
     */
    public List<OrderCalendarResponse> getClientCalendarOrdersInRange(
            UUID companyId, LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching calendar orders for client company: {} in range {} to {}",
                companyId, startDate, endDate);

        List<Order> orders = orderRepository.findCalendarOrdersByCompanyIdAndDateRange(
                companyId, startDate, endDate);

        return orders.stream()
                .map(this::mapToClientCalendarResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get calendar orders for a provider within a specific date range
     */
    public List<OrderCalendarResponse> getProviderCalendarOrdersInRange(
            UUID providerId, LocalDateTime startDate, LocalDateTime endDate) {
        log.debug("Fetching calendar orders for provider: {} in range {} to {}",
                providerId, startDate, endDate);

        List<Order> orders = orderRepository.findCalendarOrdersByProviderIdAndDateRange(
                providerId, startDate, endDate);

        return orders.stream()
                .map(this::mapToProviderCalendarResponse)
                .collect(Collectors.toList());
    }

    /**
     * Map Order entity to OrderCalendarResponse for client view
     */
    private OrderCalendarResponse mapToClientCalendarResponse(Order order) {
        return OrderCalendarResponse.forClient(
                order.getId(),
                order.getTitle(),
                order.getDescription(),
                order.getStatus(),
                order.getCompanyId(),
                getCompanyName(order), // Will extract from company or use cached value
                order.getProviderId(),
                order.getStartDate(),
                order.getDeadline(),
                order.getUrgency(),
                extractPrimaryCategory(order),
                order.getBudget(),
                extractCity(order),
                extractFullAddress(order));
    }

    /**
     * Map Order entity to OrderCalendarResponse for provider view
     * Includes distance calculation if provider location is available
     */
    private OrderCalendarResponse mapToProviderCalendarResponse(Order order) {
        return OrderCalendarResponse.forProvider(
                order.getId(),
                order.getTitle(),
                order.getDescription(),
                order.getStatus(),
                order.getCompanyId(),
                getCompanyName(order),
                order.getProviderId(),
                order.getStartDate(),
                order.getDeadline(),
                order.getUrgency(),
                extractPrimaryCategory(order),
                order.getBudget(),
                extractCity(order),
                extractFullAddress(order),
                calculateDistance(order) // Distance calculation not available in this context
        );
    }

    /**
     * Extract company name from order
     * For now returns null, can be enhanced to fetch from company service
     */
    private String getCompanyName(Order order) {
        // TODO: Consider caching company names or fetching from company service
        return null;
    }

    /**
     * Extract primary category from order's categories
     */
    private String extractPrimaryCategory(Order order) {
        if (order.getPrimaryCategory() != null) {
            return order.getPrimaryCategory().toString();
        }
        return null;
    }

    /**
     * Extract city from order's service address
     */
    private String extractCity(Order order) {
        if (order.getServiceAddress() != null) {
            return order.getServiceAddress().getCity();
        }
        return null;
    }

    /**
     * Extract full address from order's service address
     */
    private String extractFullAddress(Order order) {
        if (order.getServiceAddress() != null) {
            // Use direct field access instead of importing ServiceAddress
            return String.format("%s %s, %s %s",
                    order.getServiceAddress().getStreet(),
                    order.getServiceAddress().getHouseNumber(),
                    order.getServiceAddress().getPostalCode(),
                    order.getServiceAddress().getCity());
        }
        return null;
    }

    /**
     * Calculate distance from provider to order location.
     *
     * NOTE: Provider latitude/longitude data is currently not available in the
     * order
     * module. Once the provider location is exposed, implement a standard haversine
     * distance calculation here.
     *
     * @param order the order containing the service location
     * @return distance in kilometres, or {@code null} when not computable
     */
    private Double calculateDistance(Order order) {
        // Location data missing -> cannot compute distance at this layer
        return null;
    }
}