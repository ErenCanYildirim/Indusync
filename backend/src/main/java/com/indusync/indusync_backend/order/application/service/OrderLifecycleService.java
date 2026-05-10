package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderRepository;
import com.indusync.indusync_backend.shared.domain.enums.OrderStatus;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.ContactPerson;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service responsible for order lifecycle management.
 * Handles core CRUD operations and basic order state transitions.
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class OrderLifecycleService {

    private final OrderRepository orderRepository;
    private final OrderValidationService validationService;
    private final OrderEventPublisher eventPublisher;
    private final CompanyManagementService companyManagementService;

    /**
     * Creates a new order in DRAFT status.
     */
    @CacheEvict(value = {
            com.indusync.indusync_backend.shared.config.CacheConfig.ORDER_BY_ID_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_BY_STATUS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_COMPLETED_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDER_DETAILS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.NEARBY_ORDERS_CACHE
    }, allEntries = true)
    public OrderResponse createDraft(CreateOrderCommand command, UUID companyId) {
        log.info("Creating draft order '{}' for company: {}", command.title(), companyId);

        var company = companyManagementService.getPublicCompanyInfo(companyId);
        Boolean isClient = company.getIsAuftraggeber();
        if (!java.lang.Boolean.TRUE.equals(isClient)) {
            throw new OrderValidationService.ValidationException("Provider cant create order");
        }

        // Validate command
        validationService.validateCreateOrderCommand(command, companyId);

        // Create value objects
        ContactPerson contactPerson = ContactPerson.of(
                command.contactName(),
                command.contactEmail(),
                command.contactPhone());

        Address serviceAddress = new Address(
                command.street(),
                command.houseNumber(),
                command.postalCode(),
                command.city(),
                command.getEffectiveCountry());

        GeoLocation location = GeoLocation.of(command.latitude(), command.longitude());

        // Create order entity
        Order order = new Order(
                command.title(),
                command.description(),
                companyId,
                contactPerson,
                serviceAddress,
                location,
                command.searchRadiusKm(),
                command.primaryCategory());

        // Set additional fields from command
        populateOrderFromCommand(order, command);

        // Save order
        Order savedOrder = orderRepository.save(order);

        log.info("Created draft order with ID: {} for company: {} with category: {}",
                savedOrder.getId(), companyId, savedOrder.getPrimaryCategory());

        return OrderResponse.fromOrder(savedOrder);
    }

    /**
     * Publishes an order, making it visible to service providers.
     */
    @CacheEvict(value = {
            com.indusync.indusync_backend.shared.config.CacheConfig.ORDER_BY_ID_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_BY_STATUS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_COMPLETED_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDER_DETAILS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.NEARBY_ORDERS_CACHE
    }, allEntries = true)
    public OrderResponse publishOrder(UUID orderId, UUID companyId) {
        log.info("Publishing order: {}", orderId);

        var company = companyManagementService.getPublicCompanyInfo(companyId);
        Boolean isClient = company.getIsAuftraggeber();
        if (!java.lang.Boolean.TRUE.equals(isClient)) {
            throw new OrderValidationService.ValidationException("Provider cant publish order");
        }

        // Find order
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Verify ownership
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, diesen Auftrag zu veröffentlichen");
        }

        // Validate order can be published
        validationService.validateOrderCanBePublished(order);
        validationService.validateOrderForPublishing(order);

        // Publish order
        order.publish();

        // Save updated order
        Order savedOrder = orderRepository.save(order);

        log.info("Published order: {} at {}", orderId, savedOrder.getPublishedAt());

        // Publish event
        eventPublisher.publishOrderPublishedEvent(savedOrder);

        return OrderResponse.fromOrder(savedOrder);
    }

    /**
     * Retrieves an order by ID.
     */
    @Cacheable(value = com.indusync.indusync_backend.shared.config.CacheConfig.ORDER_BY_ID_CACHE, key = "#orderId")
    public OrderResponse getOrder(UUID orderId) {
        log.debug("Retrieving order: {}", orderId);

        Order order = orderRepository.findByIdWithCollections(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        // Manually initialize collections to ensure they are loaded for caching
        // This prevents lazy initialization exceptions when the entity is cached in
        // Redis
        if (order.getTargetIndustries() != null) {
            order.getTargetIndustries().size(); // Force initialization
        }
        if (order.getPlacementTypes() != null) {
            order.getPlacementTypes().size(); // Force initialization
        }

        return OrderResponse.fromOrder(order);
    }

    /**
     * Retrieves orders for a company filtered by role.
     */
    public Page<OrderResponse> getMyOrders(MyOrderRole role, UUID companyId, Pageable pageable) {
        log.debug("Retrieving {} orders for company: {}", role, companyId);

        Page<Order> orders;
        if (role == MyOrderRole.PROVIDER) {
            orders = orderRepository.findByProviderIdAndStatusNot(companyId, OrderStatus.COMPLETED, pageable);
        } else { // CLIENT default
            orders = orderRepository.findByCompanyIdAndStatusNot(companyId, OrderStatus.COMPLETED, pageable);
        }

        return orders.map(OrderResponse::fromOrder);
    }

    /**
     * Retrieves orders filtered by specific status for a company and role.
     */
    public Page<OrderResponse> getMyOrders(MyOrderRole role, UUID companyId, String status, Pageable pageable) {
        log.debug("Retrieving {} orders for company: {} with status {}", role, companyId, status);

        OrderStatus parsed;
        try {
            parsed = OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException _) {
            // Fallback to default behavior when status is invalid
            Page<Order> orders;
            if (role == MyOrderRole.PROVIDER) {
                orders = orderRepository.findByProviderIdAndStatusNot(companyId, OrderStatus.COMPLETED, pageable);
            } else {
                orders = orderRepository.findByCompanyIdAndStatusNot(companyId, OrderStatus.COMPLETED, pageable);
            }
            return orders.map(OrderResponse::fromOrder);
        }

        Page<Order> orders;
        if (role == MyOrderRole.PROVIDER) {
            orders = orderRepository.findByProviderIdAndStatus(companyId, parsed, pageable);
        } else {
            orders = orderRepository.findByCompanyIdAndStatus(companyId, parsed, pageable);
        }
        return orders.map(OrderResponse::fromOrder);
    }

    /**
     * Retrieves completed orders for a company filtered by role.
     */
    public Page<OrderResponse> getMyCompletedOrders(MyOrderRole role, UUID companyId, Pageable pageable) {
        log.debug("Retrieving completed {} orders for company: {}", role, companyId);

        Page<Order> orders;
        if (role == MyOrderRole.PROVIDER) {
            orders = orderRepository.findByProviderIdAndStatus(companyId, OrderStatus.COMPLETED, pageable);
        } else { // CLIENT default
            orders = orderRepository.findByCompanyIdAndStatus(companyId, OrderStatus.COMPLETED, pageable);
        }

        return orders.map(OrderResponse::fromOrder);
    }

    /**
     * Cancels an order.
     */
    @CacheEvict(value = {
            com.indusync.indusync_backend.shared.config.CacheConfig.ORDER_BY_ID_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_BY_STATUS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_COMPLETED_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDER_DETAILS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.NEARBY_ORDERS_CACHE
    }, allEntries = true)
    public OrderResponse cancelOrder(UUID orderId) {
        log.info("Cancelling order: {}", orderId);

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + orderId));

        validationService.validateOrderCanBeCancelled(order);

        order.cancel();
        Order savedOrder = orderRepository.save(order);

        log.info("Cancelled order: {}", orderId);

        return OrderResponse.fromOrder(savedOrder);
    }

    /**
     * Updates an existing order with new data.
     */
    @CacheEvict(value = {
            com.indusync.indusync_backend.shared.config.CacheConfig.ORDER_BY_ID_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_ORDERS_BY_STATUS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.MY_COMPLETED_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDERS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.AVAILABLE_ORDER_DETAILS_CACHE,
            com.indusync.indusync_backend.shared.config.CacheConfig.NEARBY_ORDERS_CACHE
    }, allEntries = true)
    public OrderResponse updateOrder(UpdateOrderCommand command, UUID companyId) {
        log.info("Updating order: {} for company: {}", command.orderId(), companyId);

        var company = companyManagementService.getPublicCompanyInfo(companyId);
        Boolean isClient = company.getIsAuftraggeber();
        if (!java.lang.Boolean.TRUE.equals(isClient)) {
            throw new OrderValidationService.ValidationException("Provider cant update order");
        }

        // Validate command
        validationService.validateUpdateCommandHasFields(command);
        validationService.validateUpdateOrderCommand(command);

        // Find order
        Order order = orderRepository.findById(command.orderId())
                .orElseThrow(() -> new OrderNotFoundException("Auftrag nicht gefunden: " + command.orderId()));

        // Check ownership
        if (!order.getCompanyId().equals(companyId)) {
            throw new UnauthorizedAccessException("Keine Berechtigung, diesen Auftrag zu bearbeiten");
        }

        // Validate order can be updated
        validationService.validateOrderCanBeUpdated(order);

        // Apply updates
        updateOrderFromCommand(order, command);

        // Save updated order
        Order savedOrder = orderRepository.save(order);

        log.info("Updated order: {} for company: {}", command.orderId(), companyId);

        return OrderResponse.fromOrder(savedOrder);
    }

    /**
     * Populates order entity with additional fields from command.
     */
    private void populateOrderFromCommand(Order order, CreateOrderCommand command) {
        // Set categories
        if (command.additionalCategories() != null && !command.additionalCategories().isEmpty()) {
            String secondaryCategories = command.additionalCategories().stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
            order.setSecondaryCategories(secondaryCategories);
        }

        // Set industries (collection)
        if (command.targetIndustries() != null) {
            order.setTargetIndustries(new HashSet<>(command.targetIndustries()));
        }

        // Set placement types (collection)
        if (command.placementTypes() != null) {
            order.setPlacementTypes(new HashSet<>(command.placementTypes()));
        }

        // Set skills and requirements
        if (command.requiredSpecializations() != null && !command.requiredSpecializations().isEmpty()) {
            order.setRequiredSpecializations(String.join(",", command.requiredSpecializations()));
        }

        if (command.requiredSkills() != null && !command.requiredSkills().isEmpty()) {
            order.setRequiredSkills(String.join(",", command.requiredSkills()));
        }

        if (command.requiredVerifications() != null && !command.requiredVerifications().isEmpty()) {
            order.setRequiredVerifications(String.join(",", command.requiredVerifications()));
        }

        if (command.requiredCertifications() != null && !command.requiredCertifications().isEmpty()) {
            order.setRequiredCertifications(String.join(",", command.requiredCertifications()));
        }

        // Set timeline and urgency
        order.setUrgency(command.getEffectiveUrgency());
        order.setStartDate(command.startDate());
        order.setDeadline(command.deadline());

        // Set response time
        if (command.responseTimeHours() != null) {
            order.setResponseTimeHours(command.responseTimeHours());
        } else {
            order.setResponseTimeHours(command.getEffectiveUrgency().getResponseTimeHours());
        }

        // Set budget
        order.setBudget(command.budget());
    }

    /**
     * Updates order entity with fields from update command.
     */
    private void updateOrderFromCommand(Order order, UpdateOrderCommand command) {
        // Update basic information
        if (command.title() != null) {
            order.setTitle(command.title());
        }
        if (command.description() != null) {
            order.setDescription(command.description());
        }

        // Update contact person if any contact field is provided
        if (command.contactName() != null || command.contactEmail() != null || command.contactPhone() != null) {
            ContactPerson currentContact = order.getContactPerson();
            ContactPerson updatedContact = ContactPerson.of(
                    command.contactName() != null ? command.contactName() : currentContact.getName(),
                    command.contactEmail() != null ? command.contactEmail() : currentContact.getEmail(),
                    command.contactPhone() != null ? command.contactPhone() : currentContact.getPhone());
            order.setContactPerson(updatedContact);
        }

        // Update service address if any address field is provided
        if (command.street() != null || command.houseNumber() != null ||
                command.postalCode() != null || command.city() != null || command.country() != null) {
            Address currentAddress = order.getServiceAddress();
            Address updatedAddress = new Address(
                    command.street() != null ? command.street() : currentAddress.getStreet(),
                    command.houseNumber() != null ? command.houseNumber() : currentAddress.getHouseNumber(),
                    command.postalCode() != null ? command.postalCode() : currentAddress.getPostalCode(),
                    command.city() != null ? command.city() : currentAddress.getCity(),
                    command.country() != null ? command.getEffectiveCountry() : currentAddress.getCountry());
            order.setServiceAddress(updatedAddress);
        }

        // Update location if coordinates are provided
        if (command.latitude() != null || command.longitude() != null) {
            GeoLocation currentLocation = order.getLocation();
            GeoLocation updatedLocation = GeoLocation.of(
                    command.latitude() != null ? command.latitude() : currentLocation.getLatitude().doubleValue(),
                    command.longitude() != null ? command.longitude() : currentLocation.getLongitude().doubleValue());
            order.setLocation(updatedLocation);
        }

        // Update search radius
        if (command.searchRadiusKm() != null) {
            order.setSearchRadiusKm(command.searchRadiusKm());
        }

        // Update categorization
        if (command.primaryCategory() != null) {
            order.setPrimaryCategory(command.primaryCategory());
        }

        if (command.additionalCategories() != null) {
            String secondaryCategories = command.additionalCategories().stream()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
            order.setSecondaryCategories(secondaryCategories);
        }

        if (command.targetIndustries() != null) {
            order.setTargetIndustries(new HashSet<>(command.targetIndustries()));
        }

        if (command.placementTypes() != null) {
            order.setPlacementTypes(new HashSet<>(command.placementTypes()));
        }

        // Update requirements
        if (command.requiredSpecializations() != null) {
            order.setRequiredSpecializations(String.join(",", command.requiredSpecializations()));
        }

        if (command.requiredSkills() != null) {
            order.setRequiredSkills(String.join(",", command.requiredSkills()));
        }

        if (command.requiredVerifications() != null) {
            order.setRequiredVerifications(String.join(",", command.requiredVerifications()));
        }

        if (command.requiredCertifications() != null) {
            order.setRequiredCertifications(String.join(",", command.requiredCertifications()));
        }

        // Update timeline and urgency
        if (command.urgency() != null) {
            order.setUrgency(command.urgency());
        }

        if (command.startDate() != null) {
            order.setStartDate(command.startDate());
        }

        if (command.deadline() != null) {
            order.setDeadline(command.deadline());
        }

        if (command.responseTimeHours() != null) {
            order.setResponseTimeHours(command.responseTimeHours());
        } else if (command.urgency() != null) {
            order.setResponseTimeHours(command.getEffectiveUrgency().getResponseTimeHours());
        }

        // Update budget
        if (command.budget() != null) {
            order.setBudget(command.budget());
        }
    }

    public enum MyOrderRole {
        CLIENT, PROVIDER
    }

    // Exception classes
    public static class OrderNotFoundException extends RuntimeException {
        public OrderNotFoundException(String message) {
            super(message);
        }
    }

    public static class UnauthorizedAccessException extends RuntimeException {
        public UnauthorizedAccessException(String message) {
            super(message);
        }
    }
}