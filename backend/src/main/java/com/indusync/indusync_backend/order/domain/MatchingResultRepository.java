package com.indusync.indusync_backend.order.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchingResultRepository extends JpaRepository<MatchingResult, UUID> {
    
    /**
     * Find all results for a matching query ordered by match score descending.
     */
    List<MatchingResult> findByMatchingQueryIdOrderByMatchScoreDesc(UUID matchingQueryId);
    
    /**
     * Find all results for a matching query.
     */
    List<MatchingResult> findByMatchingQueryId(UUID matchingQueryId);
} 