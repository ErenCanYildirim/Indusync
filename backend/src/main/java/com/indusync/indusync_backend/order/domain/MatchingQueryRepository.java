package com.indusync.indusync_backend.order.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchingQueryRepository extends JpaRepository<MatchingQuery, UUID> {
    
    /**
     * Find all matching queries for a company ordered by creation date descending.
     */
    List<MatchingQuery> findByCompanyIdOrderByCreatedAtDesc(UUID companyId);
    
    /**
     * Find matching queries for a company with pagination.
     */
    Page<MatchingQuery> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);
    
    /**
     * Find old matching queries for a company beyond the limit for cleanup.
     */
    @Query("SELECT mq FROM MatchingQuery mq WHERE mq.companyId = :companyId ORDER BY mq.createdAt DESC")
    List<MatchingQuery> findByCompanyIdForCleanup(@Param("companyId") UUID companyId);
} 