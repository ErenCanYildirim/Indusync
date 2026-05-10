package com.indusync.indusync_backend.company.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository interface for Terms & Conditions access log management.
 * <p>
 * This repository provides data access methods for:
 * - Tracking document access patterns
 * - Audit trail and compliance reporting
 * - User activity monitoring
 * - Access analytics and insights
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface TermsConditionsAccessLogRepository extends JpaRepository<TermsConditionsAccessLog, UUID> {

    /**
     * Finds all access log entries for a specific document, ordered by access time
     * descending.
     *
     * @param documentId the document ID
     * @param pageable   pagination information
     * @return page of access log entries for the document
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByDocumentIdOrderByCreatedAtDesc(@Param("documentId") UUID documentId,
            Pageable pageable);

    /**
     * Finds all access log entries by a specific user, ordered by access time
     * descending.
     *
     * @param userId   the user ID
     * @param pageable pagination information
     * @return page of access log entries by the user
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.accessedBy = :userId ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByAccessedByOrderByCreatedAtDesc(@Param("userId") UUID userId,
            Pageable pageable);

    /**
     * Finds access log entries by access context, ordered by access time
     * descending.
     *
     * @param accessContext the access context
     * @param pageable      pagination information
     * @return page of access log entries for the context
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.accessContext = :accessContext ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByAccessContextOrderByCreatedAtDesc(
            @Param("accessContext") AccessContext accessContext, Pageable pageable);

    /**
     * Finds access log entries for a specific order, ordered by access time
     * descending.
     *
     * @param orderId  the order ID
     * @param pageable pagination information
     * @return page of access log entries related to the order
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.orderId = :orderId ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByOrderIdOrderByCreatedAtDesc(@Param("orderId") UUID orderId, Pageable pageable);

    /**
     * Finds access log entries within a date range, ordered by access time
     * descending.
     *
     * @param startDate the start date (inclusive)
     * @param endDate   the end date (inclusive)
     * @param pageable  pagination information
     * @return page of access log entries within the date range
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.createdAt BETWEEN :startDate AND :endDate ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    /**
     * Counts the total number of access attempts for a specific document.
     *
     * @param documentId the document ID
     * @return the total access count
     */
    @Query("SELECT COUNT(a) FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId")
    long countByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Counts the total number of access attempts by a specific user.
     *
     * @param userId the user ID
     * @return the total access count by the user
     */
    @Query("SELECT COUNT(a) FROM TermsConditionsAccessLog a WHERE a.accessedBy = :userId")
    long countByAccessedBy(@Param("userId") UUID userId);

    /**
     * Counts access attempts for a document by a specific user.
     *
     * @param documentId the document ID
     * @param userId     the user ID
     * @return the access count for the document by the user
     */
    @Query("SELECT COUNT(a) FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId AND a.accessedBy = :userId")
    long countByDocumentIdAndAccessedBy(@Param("documentId") UUID documentId, @Param("userId") UUID userId);

    /**
     * Finds the most recent access log entry for a document by a specific user.
     *
     * @param documentId the document ID
     * @param userId     the user ID
     * @return the most recent access log entry, if any
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId AND a.accessedBy = :userId ORDER BY a.createdAt DESC LIMIT 1")
    List<TermsConditionsAccessLog> findMostRecentAccessByDocumentAndUser(@Param("documentId") UUID documentId,
            @Param("userId") UUID userId);

    /**
     * Finds unique users who have accessed a specific document.
     *
     * @param documentId the document ID
     * @return list of unique user IDs who accessed the document
     */
    @Query("SELECT DISTINCT a.accessedBy FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId")
    List<UUID> findDistinctAccessedByForDocument(@Param("documentId") UUID documentId);

    /**
     * Finds access log entries for documents belonging to a specific company.
     *
     * @param companyId the company ID
     * @param pageable  pagination information
     * @return page of access log entries for the company's documents
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a JOIN TermsConditionsDocument d ON a.documentId = d.id WHERE d.companyId = :companyId ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByCompanyIdOrderByCreatedAtDesc(@Param("companyId") UUID companyId,
            Pageable pageable);

    /**
     * Counts total access attempts for documents belonging to a specific company.
     *
     * @param companyId the company ID
     * @return the total access count for the company's documents
     */
    @Query("SELECT COUNT(a) FROM TermsConditionsAccessLog a JOIN TermsConditionsDocument d ON a.documentId = d.id WHERE d.companyId = :companyId")
    long countByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds access log entries by IP address for security monitoring.
     *
     * @param ipAddress the IP address
     * @param pageable  pagination information
     * @return page of access log entries from the IP address
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.ipAddress = :ipAddress ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByIpAddressOrderByCreatedAtDesc(@Param("ipAddress") String ipAddress,
            Pageable pageable);

    /**
     * Finds access log entries with suspicious activity patterns.
     * This includes multiple rapid accesses from the same IP or user.
     *
     * @param threshold  the minimum number of accesses to be considered suspicious
     * @param timeWindow the time window in hours to check for rapid accesses
     * @return list of potentially suspicious access patterns
     */
    @Query("SELECT a.accessedBy, a.ipAddress, COUNT(a) as accessCount " +
            "FROM TermsConditionsAccessLog a " +
            "WHERE a.createdAt >= :timeWindow " +
            "GROUP BY a.accessedBy, a.ipAddress " +
            "HAVING COUNT(a) >= :threshold " +
            "ORDER BY accessCount DESC")
    List<Object[]> findSuspiciousAccessPatterns(@Param("threshold") long threshold,
            @Param("timeWindow") LocalDateTime timeWindow);

    /**
     * Finds the most accessed documents within a time period.
     *
     * @param startDate the start date
     * @param endDate   the end date
     * @param limit     the maximum number of results
     * @return list of document IDs with their access counts
     */
    @Query("SELECT a.documentId, COUNT(a) as accessCount " +
            "FROM TermsConditionsAccessLog a " +
            "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
            "GROUP BY a.documentId " +
            "ORDER BY accessCount DESC " +
            "LIMIT :limit")
    List<Object[]> findMostAccessedDocuments(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("limit") int limit);

    /**
     * Finds access statistics by context for analytics.
     *
     * @param startDate the start date
     * @param endDate   the end date
     * @return list of access contexts with their counts
     */
    @Query("SELECT a.accessContext, COUNT(a) as accessCount " +
            "FROM TermsConditionsAccessLog a " +
            "WHERE a.createdAt BETWEEN :startDate AND :endDate " +
            "GROUP BY a.accessContext " +
            "ORDER BY accessCount DESC")
    List<Object[]> findAccessStatsByContext(@Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Deletes old access log entries beyond the retention period.
     * This is used for data cleanup and compliance with data retention policies.
     *
     * @param cutoffDate the cutoff date (entries older than this will be deleted)
     * @return the number of deleted entries
     */
    @Query("DELETE FROM TermsConditionsAccessLog a WHERE a.createdAt < :cutoffDate")
    int deleteOldAccessLogs(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Finds access log entries for a specific document and user combination.
     *
     * @param documentId the document ID
     * @param userId     the user ID
     * @param pageable   pagination information
     * @return page of access log entries for the document and user
     */
    @Query("SELECT a FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId AND a.accessedBy = :userId ORDER BY a.createdAt DESC")
    Page<TermsConditionsAccessLog> findByDocumentIdAndAccessedByOrderByCreatedAtDesc(
            @Param("documentId") UUID documentId,
            @Param("userId") UUID userId,
            Pageable pageable);

    /**
     * Checks if a user has accessed a specific document within a time period.
     *
     * @param documentId the document ID
     * @param userId     the user ID
     * @param since      the time threshold
     * @return true if the user has accessed the document since the specified time
     */
    @Query("SELECT COUNT(a) > 0 FROM TermsConditionsAccessLog a WHERE a.documentId = :documentId AND a.accessedBy = :userId AND a.createdAt >= :since")
    boolean hasUserAccessedDocumentSince(@Param("documentId") UUID documentId, @Param("userId") UUID userId,
            @Param("since") LocalDateTime since);
}