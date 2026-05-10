package com.indusync.indusync_backend.order.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderDocumentRepository extends JpaRepository<OrderDocument, UUID> {
    /**
     * Finds all documents for a specific order.
     *
     * @param orderId the order ID
     * @return list of order documents
     */
    List<OrderDocument> findByOrder_Id(UUID orderId);

    /**
     * Finds all documents for a specific order, ordered by creation date
     * descending.
     *
     * @param orderId the order ID
     * @return list of order documents ordered by creation date (newest first)
     */
    List<OrderDocument> findByOrder_IdOrderByCreatedAtDesc(UUID orderId);

    /**
     * Finds a specific document by its ID and the order it belongs to.
     *
     * @param documentId the document ID
     * @param orderId    the order ID
     * @return optional order document
     */
    Optional<OrderDocument> findByIdAndOrder_Id(UUID documentId, UUID orderId);
}