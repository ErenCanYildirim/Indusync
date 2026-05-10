package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.order.api.dto.OrderCalendarResponse;
import com.indusync.indusync_backend.order.application.service.OrderCalendarService;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import com.indusync.indusync_backend.shared.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for order calendar operations
 * Provides endpoints for fetching orders specifically for calendar display
 */
@RestController
@RequestMapping("/v1/orders/calendar")
@Slf4j
@Tag(name = "Order Calendar", description = "Calendar-specific order operations")
public class OrderCalendarController extends BaseController {

    private final OrderCalendarService orderCalendarService;

    public OrderCalendarController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderCalendarService orderCalendarService) {
        super(authHelper, responseHelper);
        this.orderCalendarService = orderCalendarService;
    }

    /**
     * Get calendar orders for the current user's company
     * Returns different data based on a role: client sees created orders, provider sees assigned orders
     * 
     * @param role The role perspective ('client' or 'provider')
     * @param startDate Optional start date for filtering (ISO format: 2024-01-01T00:00:00)
     * @param endDate Optional end date for filtering (ISO format: 2024-01-31T23:59:59)
     * @return List of orders suitable for calendar display
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(
        summary = "Get calendar orders",
        description = "Fetches orders for calendar display. Only returns orders with both startDate and deadline. " +
                     "Client role returns orders created by the company, provider role returns orders assigned to the company."
    )
    public ResponseEntity<List<OrderCalendarResponse>> getCalendarOrders(
            @Parameter(description = "Role perspective: client or provider", required = true)
            @RequestParam("role") String role,
            
            @Parameter(description = "Start date for filtering (ISO format)", example = "2024-01-01T00:00:00")
            @RequestParam(value = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,
            
            @Parameter(description = "End date for filtering (ISO format)", example = "2024-01-31T23:59:59")
            @RequestParam(value = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate,
            Authentication authentication
    ) {
        log.info("Fetching calendar orders for role: {} with date range: {} to {}", role, startDate, endDate);

        try {
            // Get company ID from a security context
            UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
            
            List<OrderCalendarResponse> orders;
            
            if ("provider".equalsIgnoreCase(role)) {
                orders = getProviderCalendarOrders(companyId, startDate, endDate);
            } else if ("client".equalsIgnoreCase(role)) {
                orders = getClientCalendarOrders(companyId, startDate, endDate);
            } else {
                return ResponseEntity.badRequest().build();
            }

            log.info("Found {} calendar orders for role: {}", orders.size(), role);
            
            return ResponseEntity.ok(orders);

        } catch (Exception e) {
            log.error("Error fetching calendar orders for role: {}", role, e);
            return ResponseEntity.internalServerError().build();
        }
    }

     /**
     * Get calendar orders for a specific company (admin endpoint)
     * Useful for testing or administrative purposes
     */
    @GetMapping("/company/{companyId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
        summary = "Get calendar orders for specific company",
        description = "Admin endpoint to fetch calendar orders for any company"
    )
    public ResponseEntity<List<OrderCalendarResponse>> getCalendarOrdersForCompany(
            @Parameter(description = "Company ID", required = true)
            @PathVariable UUID companyId,
            
            @Parameter(description = "Role perspective: client or provider", required = true)
            @RequestParam("role") String role,
            
            @Parameter(description = "Start date for filtering")
            @RequestParam(value = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime startDate,
            
            @Parameter(description = "End date for filtering")
            @RequestParam(value = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime endDate) {

        log.info("Admin fetching calendar orders for company: {} with role: {}", companyId, role);

        try {
            List<OrderCalendarResponse> orders;
            
            if ("provider".equalsIgnoreCase(role)) {
                orders = getProviderCalendarOrders(companyId, startDate, endDate);
            } else if ("client".equalsIgnoreCase(role)) {
                orders = getClientCalendarOrders(companyId, startDate, endDate);
            } else {
                return ResponseEntity.badRequest().build();
            }

            return ResponseEntity.ok(orders);

        } catch (Exception e) {
            log.error("Error fetching calendar orders for company: {}", companyId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

     /**
     * Helper method to get client calendar orders with optional date filtering
     */
    private List<OrderCalendarResponse> getClientCalendarOrders(
            UUID companyId, LocalDateTime startDate, LocalDateTime endDate) {
        
        if (startDate != null && endDate != null) {
            return orderCalendarService.getClientCalendarOrdersInRange(companyId, startDate, endDate);
        } else {
            return orderCalendarService.getClientCalendarOrders(companyId);
        }
    }

    /**
     * Helper method to get provider calendar orders with optional date filtering
     */
    private List<OrderCalendarResponse> getProviderCalendarOrders(
            UUID companyId, LocalDateTime startDate, LocalDateTime endDate) {
        
        if (startDate != null && endDate != null) {
            return orderCalendarService.getProviderCalendarOrdersInRange(companyId, startDate, endDate);
        } else {
            return orderCalendarService.getProviderCalendarOrders(companyId);
        }
    }

    /**
     * Extracts company ID from an authentication context.
     */
    private UUID getCurrentCompanyIdFromAuthentication(Authentication authentication) {
        return getCurrentCompanyId(authentication);
    }

    /**
     * Extracts JWT token from authentication.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }
}