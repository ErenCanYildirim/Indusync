package com.indusync.indusync_backend.order.application.service;

import com.indusync.indusync_backend.order.domain.OrderCompletionRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service interface for order completion workflow operations.
 * <p>
 * Follows Dependency Inversion Principle: high-level modules (controllers,
 * facades)
 * depend on this abstraction rather than concrete implementations.
 * </p>
 * 
 * <p>
 * This interface defines the contract for managing the dual-confirmation
 * completion workflow where both client and provider must agree on order
 * completion.
 * </p>
 * 
 * <p>
 * Business Rules Enforced:
 * - Only orders with status IN_PROGRESS can have completion requests
 * - Only one pending completion request per order at a time
 * - Either party (client or provider) can request completion
 * - Only the counterpart can confirm or reject a completion request
 * - Only the original requester can cancel their pending request
 * - Successful confirmation transitions order to COMPLETED status
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public interface OrderCompletionService {

    /**
     * Requests completion of an order by either the client or provider.
     * <p>
     * This operation:
     * - Validates that the order is in IN_PROGRESS status
     * - Ensures no pending completion request already exists
     * - Creates a new completion request with status REQUESTED
     * - Notifies the counterpart about the completion request
     * </p>
     *
     * @param orderId            ID of the order to request completion for
     * @param requesterCompanyId ID of the company requesting completion
     * @param completionMessage  Optional message explaining the completion
     * @return The created completion request
     * @throws IllegalArgumentException if order doesn't exist or requester is not
     *                                  involved
     * @throws IllegalStateException    if order is not in progress or has pending
     *                                  request
     */
    OrderCompletionRequest requestCompletion(UUID orderId, UUID requesterCompanyId, String completionMessage);

    /**
     * Confirms a pending completion request by the counterpart.
     * <p>
     * This operation:
     * - Validates that a pending request exists for the order
     * - Ensures the confirming company is the counterpart (not the requester)
     * - Updates the completion request status to CONFIRMED
     * - Transitions the order status to COMPLETED
     * - Triggers calendar updates and notifications
     * - Makes reviews available for both parties
     * </p>
     *
     * @param orderId             ID of the order with the completion request
     * @param confirmingCompanyId ID of the company confirming completion
     * @return The confirmed completion request
     * @throws IllegalArgumentException if order doesn't exist or company is not
     *                                  authorized
     * @throws IllegalStateException    if no pending request exists
     */
    OrderCompletionRequest confirmCompletion(UUID orderId, UUID confirmingCompanyId);

    /**
     * Rejects a pending completion request by the counterpart.
     * <p>
     * This operation:
     * - Validates that a pending request exists for the order
     * - Ensures the rejecting company is the counterpart (not the requester)
     * - Updates the completion request status to REJECTED
     * - Notifies the original requester about the rejection
     * - Allows the requester to modify and re-request completion
     * </p>
     *
     * @param orderId            ID of the order with the completion request
     * @param rejectingCompanyId ID of the company rejecting completion
     * @param rejectionReason    Optional reason for rejection
     * @return The rejected completion request
     * @throws IllegalArgumentException if order doesn't exist or company is not
     *                                  authorized
     * @throws IllegalStateException    if no pending request exists
     */
    OrderCompletionRequest rejectCompletion(UUID orderId, UUID rejectingCompanyId, String rejectionReason);

    /**
     * Cancels a pending completion request by the original requester.
     * <p>
     * This operation:
     * - Validates that a pending request exists for the order
     * - Ensures the cancelling company is the original requester
     * - Updates the completion request status to CANCELLED
     * - Notifies the counterpart about the cancellation
     * - Allows for new completion requests to be made
     * </p>
     *
     * @param orderId             ID of the order with the completion request
     * @param cancellingCompanyId ID of the company cancelling the request
     * @return The cancelled completion request
     * @throws IllegalArgumentException if order doesn't exist or company is not
     *                                  authorized
     * @throws IllegalStateException    if no pending request exists
     */
    OrderCompletionRequest cancelCompletion(UUID orderId, UUID cancellingCompanyId);

    /**
     * Retrieves the current completion request for an order, if any.
     * <p>
     * Returns the most recent completion request regardless of status.
     * This is useful for displaying the current completion state in the UI.
     * </p>
     *
     * @param orderId ID of the order
     * @return Optional containing the current completion request, empty if none
     *         exists
     */
    Optional<OrderCompletionRequest> getCurrentCompletionRequest(UUID orderId);

    /**
     * Retrieves the pending completion request for an order, if any.
     * <p>
     * Returns only completion requests with status REQUESTED.
     * This is useful for displaying actionable completion requests in the UI.
     * </p>
     *
     * @param orderId ID of the order
     * @return Optional containing the pending completion request, empty if none
     *         exists
     */
    Optional<OrderCompletionRequest> getPendingCompletionRequest(UUID orderId);

    /**
     * Retrieves the complete history of completion requests for an order.
     * <p>
     * Returns all completion requests (pending, confirmed, rejected, cancelled)
     * ordered by creation date (newest first). Useful for audit trails and
     * understanding the completion workflow history.
     * </p>
     *
     * @param orderId ID of the order
     * @return List of completion requests ordered by creation date (descending)
     */
    List<OrderCompletionRequest> getCompletionRequestHistory(UUID orderId);

    /**
     * Checks if an order can have a completion request created.
     * <p>
     * An order can have a completion request if:
     * - Order exists and is in IN_PROGRESS status
     * - No pending completion request already exists
     * - The requesting company is either the client or provider of the order
     * </p>
     *
     * @param orderId            ID of the order
     * @param requesterCompanyId ID of the company that would make the request
     * @return true if a completion request can be created
     */
    boolean canRequestCompletion(UUID orderId, UUID requesterCompanyId);

    /**
     * Checks if a company can confirm a pending completion request.
     * <p>
     * A company can confirm if:
     * - There's a pending completion request for the order
     * - The company is involved in the order but is not the original requester
     * </p>
     *
     * @param orderId   ID of the order
     * @param companyId ID of the company that would confirm
     * @return true if the company can confirm the completion request
     */
    boolean canConfirmCompletion(UUID orderId, UUID companyId);

    /**
     * Checks if a company can reject a pending completion request.
     * <p>
     * A company can reject if:
     * - There's a pending completion request for the order
     * - The company is involved in the order but is not the original requester
     * </p>
     *
     * @param orderId   ID of the order
     * @param companyId ID of the company that would reject
     * @return true if the company can reject the completion request
     */
    boolean canRejectCompletion(UUID orderId, UUID companyId);

    /**
     * Checks if a company can cancel a pending completion request.
     * <p>
     * A company can cancel if:
     * - There's a pending completion request for the order
     * - The company is the original requester of the completion request
     * </p>
     *
     * @param orderId   ID of the order
     * @param companyId ID of the company that would cancel
     * @return true if the company can cancel the completion request
     */
    boolean canCancelCompletion(UUID orderId, UUID companyId);

    /**
     * Checks if a company has access to view completion requests for an order.
     * <p>
     * This is a more efficient security check that verifies the company is involved
     * in the order without checking specific permissions.
     * </p>
     *
     * @param orderId   ID of the order to check access for
     * @param companyId ID of the company to check access for
     * @return true if the company has access to view completion requests for the
     *         order
     */
    boolean hasAccessToOrderCompletionRequests(UUID orderId, UUID companyId);
}