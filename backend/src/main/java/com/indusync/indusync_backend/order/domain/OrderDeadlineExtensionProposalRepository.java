package com.indusync.indusync_backend.order.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface OrderDeadlineExtensionProposalRepository extends JpaRepository<OrderDeadlineExtensionProposal, UUID> {

    java.util.Optional<OrderDeadlineExtensionProposal> findByOrderIdAndStatus(UUID orderId, OrderDeadlineExtensionProposal.Status status);

    java.util.Optional<OrderDeadlineExtensionProposal> findTopByOrderIdOrderByCreatedAtDesc(UUID orderId);

    List<OrderDeadlineExtensionProposal> findByOrderIdOrderByCreatedAtDesc(UUID orderId);

    long countByOrderIdAndStatus(UUID orderId, OrderDeadlineExtensionProposal.Status status);
}