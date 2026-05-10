package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.company.application.CompanyManagementService;
import com.indusync.indusync_backend.order.api.dto.*;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.application.service.OrderLifecycleService;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.exception.ErrorResponse;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * REST controller for basic order lifecycle operations.
 * 
 * This controller handles:
 * - Creating draft orders
 * - Publishing orders
 * - Updating orders
 * - Retrieving order details
 * - Getting user's orders
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/orders")
@Slf4j
@Tag(name = "Order Lifecycle", description = "Basic order management operations")
public class OrderLifecycleController extends BaseController {

    private final OrderFacadeService orderFacadeService;
    private final OrderMapper orderMapper;
    private final CompanyManagementService companyManagementService;

    public OrderLifecycleController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderFacadeService orderFacadeService,
            OrderMapper orderMapper,
            CompanyManagementService companyManagementService) {
        super(authHelper, responseHelper);
        this.orderFacadeService = orderFacadeService;
        this.orderMapper = orderMapper;
        this.companyManagementService = companyManagementService;
    }

    @PostMapping("/draft")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create a draft order", description = "Creates a new order in draft status for the authenticated user's company")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Order draft created successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "User does not have permission to create orders")
    })
    public ResponseEntity<?> createDraft(
            @Valid @RequestBody CreateOrderRequest request,
            Authentication authentication) {

        log.info("Creating draft order with title: {}", request.getTitle());

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return handleUnauthorized(getCurrentRequestPath());
            }

            CreateOrderCommand command = orderMapper.toCommand(request);
            OrderResponse orderResponse = orderFacadeService.createDraft(command, authentication);
            OrderDetailResponse response = orderMapper.toDetailResponse(orderResponse);

            log.info("Draft order created successfully with ID: {}", response.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (OrderFacadeService.ValidationException e) {
            log.warn("Validation error creating draft order: {}", e.getMessage());
            return handleValidationError(e.getMessage(), "/v1/orders/draft");

        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access creating draft order: {}", e.getMessage());
            return handleForbidden("Keine Berechtigung: " + e.getMessage(), "/v1/orders/draft");

        } catch (Exception e) {
            log.error("Error creating draft order", e);
            return handleInternalServerError("/v1/orders/draft");
        }
    }

    @PostMapping("/{orderId}/publish")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Publish an order", description = "Publishes a draft order, making it available to service providers")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order published successfully"),
            @ApiResponse(responseCode = "400", description = "Order cannot be published"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "User does not have permission to publish this order"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<?> publishOrder(
            @Parameter(description = "Order ID to publish") @PathVariable UUID orderId,
            Authentication authentication) {

        log.info("Publishing order with ID: {}", orderId);

        try {
            UUID userId = getCurrentUserId(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return handleUnauthorized("/v1/orders/" + orderId + "/publish");
            }

            OrderResponse orderResponse = orderFacadeService.publishOrder(orderId, authentication);
            OrderDetailResponse response = orderMapper.toDetailResponse(orderResponse);

            log.info("Order published successfully with ID: {}", response.getId());
            return ResponseEntity.ok(response);

        } catch (OrderFacadeService.OrderNotFoundException e) {
            return handleNotFound("Auftrag nicht gefunden", "/v1/orders/" + orderId + "/publish");

        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            return handleForbidden("Keine Berechtigung: " + e.getMessage(), "/v1/orders/" + orderId + "/publish");

        } catch (OrderFacadeService.ValidationException e) {
            return handleValidationError(e.getMessage(), "/v1/orders/" + orderId + "/publish");

        } catch (Exception e) {
            return handleInternalServerError("/v1/orders/" + orderId + "/publish");
        }
    }

    @PutMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Update an order", description = "Updates an existing order in draft status")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request data or order cannot be updated"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "User does not have permission to update this order"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<?> updateOrder(
            @Parameter(description = "Order ID to update") @PathVariable UUID orderId,
            @Valid @RequestBody UpdateOrderRequest request,
            Authentication authentication) {

        log.info("Updating order with ID: {}", orderId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                log.warn("Could not extract user ID from authentication");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UpdateOrderCommand command = orderMapper.toUpdateCommand(orderId, request);
            OrderResponse orderResponse = orderFacadeService.updateOrder(command, authentication);
            OrderDetailResponse response = orderMapper.toDetailResponse(orderResponse);

            log.info("Order updated successfully with ID: {}", response.getId());
            return ResponseEntity.ok(response);

        } catch (OrderFacadeService.OrderNotFoundException e) {
            log.warn("Order not found: {}", e.getMessage());

            var errorResponse = ErrorResponse.builder()
                    .timestamp(java.time.LocalDateTime.now())
                    .status(404)
                    .message("Auftrag nicht gefunden")
                    .path("/v1/orders/" + orderId)
                    .build();

            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);

        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access updating order: {}", e.getMessage());

            var errorResponse = ErrorResponse.builder()
                    .timestamp(java.time.LocalDateTime.now())
                    .status(403)
                    .message("Keine Berechtigung: " + e.getMessage())
                    .path("/v1/orders/" + orderId)
                    .build();

            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);

        } catch (OrderFacadeService.ValidationException e) {
            log.warn("Validation error updating order: {}", e.getMessage());

            var errorResponse = ErrorResponse.builder()
                    .timestamp(java.time.LocalDateTime.now())
                    .status(400)
                    .message("Validierungsfehler: " + e.getMessage())
                    .path("/v1/orders/" + orderId)
                    .build();

            return ResponseEntity.badRequest().body(errorResponse);

        } catch (Exception e) {
            log.error("Error updating order", e);

            var errorResponse = ErrorResponse.builder()
                    .timestamp(java.time.LocalDateTime.now())
                    .status(500)
                    .message("Ein interner Serverfehler ist aufgetreten")
                    .path("/v1/orders/" + orderId)
                    .build();

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get order details", description = "Retrieves detailed information about a specific order")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Order details retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Access denied"),
            @ApiResponse(responseCode = "404", description = "Order not found")
    })
    public ResponseEntity<OrderDetailResponse> getOrder(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        log.info("Getting order details for ID: {}", orderId);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            OrderResponse orderResponse = orderFacadeService.getOrder(orderId, authentication);
            OrderDetailResponse response = orderMapper.toDetailResponse(orderResponse);
            List<OrderDetailResponse.OrderDocumentDto> docs = orderFacadeService
                    .getOrderDocuments(orderId, authentication).stream()
                    .map(d -> OrderDetailResponse.OrderDocumentDto.builder()
                            .id(d.id())
                            .fileName(d.fileName())
                            .originalFileName(d.originalFileName())
                            .documentType(d.documentType())
                            .description(d.description())
                            .fileSize(d.fileSize())
                            .contentType(d.contentType())
                            .uploadedAt(d.uploadedAt())
                            .downloadUrl(d.getDownloadUrl())
                            .build())
                    .collect(Collectors.toList());
            response.setDocuments(docs);

            response.setCompanyName(companyManagementService.findCompanyNameById(orderResponse.companyId()));

            return ResponseEntity.ok(response);

        } catch (OrderFacadeService.OrderNotFoundException e) {
            log.warn("Order not found: {}", e.getMessage());
            return ResponseEntity.notFound().build();

        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            log.warn("Unauthorized access to order: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        } catch (Exception e) {
            log.error("Error retrieving order with ID: {}", orderId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get my company's orders", description = "Retrieves orders for the authenticated user's company")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<OrderListResponse>> getMyOrders(
            @RequestParam(defaultValue = "client") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            Authentication authentication) {

        log.info("Getting orders for authenticated user, page: {}, size: {}", page, size);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            OrderLifecycleService.MyOrderRole r = "provider".equalsIgnoreCase(role)
                    ? OrderLifecycleService.MyOrderRole.PROVIDER
                    : OrderLifecycleService.MyOrderRole.CLIENT;
            Page<OrderResponse> orders = (status == null || status.isBlank())
                    ? orderFacadeService.getMyOrders(r, authentication, pageable)
                    : orderFacadeService.getMyOrders(r, status, authentication, pageable);
            Page<OrderListResponse> response;
            try (ExecutorService vtExecutor = Executors.newVirtualThreadPerTaskExecutor()) {
                response = orders.map(orderMapper::toListResponse)
                        .map(res -> {
                            CompletableFuture<String> nameFuture = CompletableFuture.supplyAsync(
                                    () -> companyManagementService.getCompanyName(res.getCompanyId()),
                                    vtExecutor);
                            CompletableFuture<Long> countFuture = CompletableFuture.supplyAsync(
                                    () -> orderFacadeService.getInterestedProviderCount(res.getId(),
                                            res.getCompanyId()),
                                    vtExecutor);

                            res.setCompanyName(nameFuture.join());
                            res.setApplicationsCount(countFuture.join());
                            return res;
                        });
            }

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving user orders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/my/completed")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get my company's completed orders", description = "Retrieves completed orders for the authenticated user's company")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Completed orders retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<Page<OrderListResponse>> getMyCompletedOrders(
            @RequestParam(defaultValue = "client") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            Authentication authentication) {

        log.info("Getting completed orders for authenticated user, page: {}, size: {}", page, size);

        try {
            UUID userId = getUserIdFromAuthentication(authentication);
            if (userId == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Sort sort = Sort.by(sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            OrderLifecycleService.MyOrderRole r = "provider".equalsIgnoreCase(role)
                    ? OrderLifecycleService.MyOrderRole.PROVIDER
                    : OrderLifecycleService.MyOrderRole.CLIENT;
            Page<OrderResponse> orders = orderFacadeService.getMyCompletedOrders(r, authentication, pageable);
            Page<OrderListResponse> response = orders.map(orderMapper::toListResponse)
                    .map(res -> {
                        res.setCompanyName(companyManagementService.getCompanyName(res.getCompanyId()));
                        return res;
                    });

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Error retrieving completed user orders", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // === Helper Methods ===

    /**
     * Extracts user ID from Spring Security Authentication.
     */
    private UUID getUserIdFromAuthentication(Authentication authentication) {
        return getCurrentUserId(authentication);
    }
}