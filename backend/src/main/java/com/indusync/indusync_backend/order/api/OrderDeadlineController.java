package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.order.api.dto.DeadlineExtensionRequest;
import com.indusync.indusync_backend.order.api.dto.DeadlineExtensionRejectionRequest;
import com.indusync.indusync_backend.order.application.OrderFacadeService;
import com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposalRepository;
import com.indusync.indusync_backend.shared.api.ApiResponseHelper;
import com.indusync.indusync_backend.shared.api.BaseController;
import com.indusync.indusync_backend.shared.security.JwtAuthenticationHelper;
import com.indusync.indusync_backend.shared.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;



/**
 * REST controller for order deadline extension operations.
 * 
 * This controller handles:
 * - Proposing deadline extensions
 * - Confirming deadline extensions
 * - Retrieving deadline extension proposals
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@RestController
@RequestMapping("/v1/orders")
@Slf4j
@Tag(name = "Order Deadlines", description = "Order deadline extension operations")
public class OrderDeadlineController extends BaseController {

    private final OrderFacadeService orderFacadeService;
    private final OrderMapper orderMapper;
    private final OrderDeadlineExtensionProposalRepository extensionProposalRepository;

    public OrderDeadlineController(
            JwtAuthenticationHelper authHelper,
            ApiResponseHelper responseHelper,
            OrderFacadeService orderFacadeService,
            OrderMapper orderMapper,
            OrderDeadlineExtensionProposalRepository extensionProposalRepository) {
        super(authHelper, responseHelper);
        this.orderFacadeService = orderFacadeService;
        this.orderMapper = orderMapper;
        this.extensionProposalRepository = extensionProposalRepository;
    }

    /**
     * Propose or confirm deadline extension.
     */
    @PatchMapping("/{orderId}/extend-deadline")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Propose or confirm deadline extension", description = "If confirm=false (default) this creates a deadline extension proposal. If confirm=true the counterpart confirms it and the deadline is updated.")
    public ResponseEntity<?> extendDeadline(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            @Valid @RequestBody DeadlineExtensionRequest body,
            Authentication authentication) {

        UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);

        try {
            if (Boolean.TRUE.equals(body.getConfirm())) {
                orderFacadeService.confirmDeadlineExtension(orderId, companyId);
            } else {
                orderFacadeService.proposeDeadlineExtension(orderId, body.getProposedDeadline(), companyId);
            }

            return ResponseEntity.accepted().build();

        } catch (OrderFacadeService.ValidationException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Reject deadline extension proposal.
     */
    @PostMapping("/{orderId}/deadline-extension/reject")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Reject deadline extension", description = "Counterpart rejects the pending deadline extension proposal")
    public ResponseEntity<?> rejectDeadlineExtension(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            @Valid @RequestBody DeadlineExtensionRejectionRequest request,
            Authentication authentication) {

        UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);

        try {
            orderFacadeService.rejectDeadlineExtension(orderId, companyId, request.getRejectionReason());
            return ResponseEntity.ok().build();

        } catch (OrderFacadeService.ValidationException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Cancel deadline extension proposal.
     */
    @DeleteMapping("/{orderId}/deadline-extension/cancel")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Cancel deadline extension proposal", description = "Requester cancels their pending deadline extension proposal")
    public ResponseEntity<?> cancelDeadlineExtensionProposal(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);

        try {
            orderFacadeService.cancelDeadlineExtensionProposal(orderId, companyId);
            return ResponseEntity.ok().build();

        } catch (OrderFacadeService.ValidationException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (OrderFacadeService.UnauthorizedAccessException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    /**
     * Get current deadline extension proposal.
     */
    @GetMapping("/{orderId}/deadline-extension-proposal")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get current deadline extension proposal", description = "Returns the latest deadline extension proposal for this order if present.")
    public ResponseEntity<?> getDeadlineExtensionProposal(
            @Parameter(description = "Order ID") @PathVariable UUID orderId,
            Authentication authentication) {

        UUID companyId = getCurrentCompanyIdFromAuthentication(authentication);
        try {
            // authorization: must be a party of the order
            var order = orderFacadeService.getOrder(orderId, authentication);
            assert companyId != null;
            if (!companyId.equals(order.companyId()) && !companyId.equals(order.providerId())) {
                return ResponseEntity.noContent().build();
            }

            var proposalOpt = extensionProposalRepository.findTopByOrderIdOrderByCreatedAtDesc(orderId);
            if (proposalOpt.isEmpty()) {
                return ResponseEntity.noContent().build();
            }
            var dto = orderMapper.toProposalDto(proposalOpt.get());
            return ResponseEntity.ok(dto);
        } catch (OrderFacadeService.OrderNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving proposal");
        }
    }

    // === Helper Methods ===

    /**
     * Extracts JWT token from Spring Security Authentication object.
     */
    private String getTokenFromAuthentication(Authentication authentication) {
        return authHelper.getTokenFromAuthentication(authentication);
    }

    /**
     * Helper method to extract company id from authentication.
     */
    private UUID getCurrentCompanyIdFromAuthentication(Authentication authentication) {
        return getCurrentCompanyId(authentication);
    }
}