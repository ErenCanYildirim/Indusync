package com.indusync.indusync_backend.order.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for OrderCompletionRequest entities.
 * <p>
 * Follows Interface Segregation Principle: provides only the specific methods
 * needed for completion request operations, avoiding unnecessary dependencies.
 * </p>
 * 
 * <p>
 * This interface defines the data access contract for completion requests,
 * allowing the service layer to depend on abstractions rather than concrete
 * implementations (Dependency Inversion Principle).
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface OrderCompletionRequestRepository extends JpaRepository<OrderCompletionRequest, UUID> {

    /**
     * Finds a completion request for a specific order with a specific status.
     * <p>
     * This is useful for checking if there's already a pending request for an order,
     * or to find confirmed/rejected requests.
     * </p>
     *
     * @param orderId ID of the order
     * @param status Status of the completion request to find
     * @return Optional containing the completion request if found
     */
    Optional<OrderCompletionRequest> findByOrderIdAndStatus(UUID orderId, OrderCompletionRequest.Status status);

    /**
     * Finds the most recent completion request for a specific order.
     * <p>
     * Useful for displaying the current/latest completion request status
     * in the UI, regardless of its status.
     * </p>
     *
     * @param orderId ID of the order
     * @return Optional containing the most recent completion request if any exist
     */
    Optional<OrderCompletionRequest> findTopByOrderIdOrderByCreatedAtDesc(UUID orderId);

    /**
     * Finds all completion requests for a specific order, ordered by creation date (newest first).
     * <p>
     * This provides the complete history of completion attempts for an order,
     * which can be useful for audit trails and order management.
     * </p>
     *
     * @param orderId ID of the order
     * @return List of completion requests ordered by creation date (descending)
     */
    List<OrderCompletionRequest> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    /**
     * Counts completion requests for a specific order with a specific status.
     * <p>
     * Useful for business logic validation (e.g., ensuring only one pending
     * request exists) and for analytics/reporting.
     * </p>
     *
     * @param orderId ID of the order
     * @param status Status to count
     * @return Number of completion requests with the specified status
     */
    long countByOrderIdAndStatus(UUID orderId, OrderCompletionRequest.Status status);

    /**
     * Finds all pending completion requests for a specific company.
     * <p>
     * This allows a company to see all orders where they need to respond
     * to completion requests (either as confirmer or as someone who made the request).
     * </p>
     *
     * @param companyId ID of the company
     * @return List of pending completion requests involving the company
     */
    List<OrderCompletionRequest> findByStatusAndRequesterCompanyIdOrderByCreatedAtDesc(
            OrderCompletionRequest.Status status, UUID companyId);

    /**
     * Checks if there's an active (pending) completion request for an order.
     * <p>
     * This is a convenience method to quickly check if an order has a pending
     * completion request, useful for business logic validation.
     * </p>
     *
     * @param orderId ID of the order
     * @return true if there's a pending completion request for the order
     */
    default boolean existsPendingRequestForOrder(UUID orderId) {
        return countByOrderIdAndStatus(orderId, OrderCompletionRequest.Status.REQUESTED) > 0;
    }

    /**
     * Finds the current active (pending) completion request for an order, if any.
     * <p>
     * Convenience method combining the common pattern of looking for pending requests.
     * The unique constraint ensures there can only be one pending request per order.
     * </p>
     *
     * @param orderId ID of the order
     * @return Optional containing the pending completion request if one exists
     */
    default Optional<OrderCompletionRequest> findPendingRequestForOrder(UUID orderId) {
        return findByOrderIdAndStatus(orderId, OrderCompletionRequest.Status.REQUESTED);
    }
} 