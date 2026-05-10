package com.indusync.indusync_backend.company.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Terms & Conditions document management.
 * <p>
 * This repository provides data access methods for:
 * - Finding active T&C documents by company
 * - Managing document versions and active status
 * - Querying document history and metadata
 * - Supporting audit and compliance requirements
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface TermsConditionsDocumentRepository extends JpaRepository<TermsConditionsDocument, UUID> {

    /**
     * Finds the active Terms & Conditions document for a specific company.
     * Only one active document per company should exist due to unique constraint.
     *
     * @param companyId the company ID
     * @return the active T&C document if it exists
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.companyId = :companyId AND t.isActive = true")
    Optional<TermsConditionsDocument> findActiveByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds all Terms & Conditions documents for a specific company, ordered by
     * document version descending.
     * This includes both active and inactive documents for version history.
     *
     * @param companyId the company ID
     * @return list of all T&C documents for the company
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.companyId = :companyId ORDER BY t.documentVersion DESC")
    List<TermsConditionsDocument> findAllByCompanyIdOrderByDocumentVersionDesc(@Param("companyId") UUID companyId);

    /**
     * Checks if a company has an active Terms & Conditions document.
     *
     * @param companyId the company ID
     * @return true if the company has an active T&C document
     */
    @Query("SELECT COUNT(t) > 0 FROM TermsConditionsDocument t WHERE t.companyId = :companyId AND t.isActive = true")
    boolean existsActiveByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds the latest document version number for a company's T&C documents.
     *
     * @param companyId the company ID
     * @return the highest document version number, or 0 if no documents exist
     */
    @Query("SELECT COALESCE(MAX(t.documentVersion), 0) FROM TermsConditionsDocument t WHERE t.companyId = :companyId")
    Integer findMaxDocumentVersionByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Deactivates all Terms & Conditions documents for a specific company.
     * This is typically used before activating a new version.
     *
     * @param companyId the company ID
     * @return the number of documents that were deactivated
     */
    @Modifying
    @Query("UPDATE TermsConditionsDocument t SET t.isActive = false WHERE t.companyId = :companyId AND t.isActive = true")
    int deactivateAllByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds Terms & Conditions documents by file checksum.
     * This can be used to detect duplicate uploads or verify file integrity.
     *
     * @param checksum the file checksum
     * @return list of documents with the specified checksum
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.checksum = :checksum")
    List<TermsConditionsDocument> findByChecksum(@Param("checksum") String checksum);

    /**
     * Finds all active Terms & Conditions documents across all companies.
     * This can be used for system-wide operations or reporting.
     *
     * @return list of all active T&C documents
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.isActive = true ORDER BY t.createdAt DESC")
    List<TermsConditionsDocument> findAllActive();

    /**
     * Finds Terms & Conditions documents created by a specific user.
     * This can be used for audit purposes or user activity tracking.
     *
     * @param userId the user ID who created the documents
     * @return list of documents created by the user
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.createdBy = :userId ORDER BY t.createdAt DESC")
    List<TermsConditionsDocument> findByCreatedBy(@Param("userId") UUID userId);

    /**
     * Finds Terms & Conditions documents that exceed a certain file size.
     * This can be used for storage management or cleanup operations.
     *
     * @param maxSizeBytes the maximum file size in bytes
     * @return list of documents exceeding the size limit
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.fileSize > :maxSizeBytes ORDER BY t.fileSize DESC")
    List<TermsConditionsDocument> findByFileSizeGreaterThan(@Param("maxSizeBytes") Long maxSizeBytes);

    /**
     * Counts the total number of Terms & Conditions documents for a company.
     *
     * @param companyId the company ID
     * @return the total count of documents (active and inactive)
     */
    @Query("SELECT COUNT(t) FROM TermsConditionsDocument t WHERE t.companyId = :companyId")
    long countByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds companies that have active Terms & Conditions documents.
     * This returns distinct company IDs that have uploaded T&C documents.
     *
     * @return list of company IDs with active T&C documents
     */
    @Query("SELECT DISTINCT t.companyId FROM TermsConditionsDocument t WHERE t.isActive = true")
    List<UUID> findCompaniesWithActiveDocuments();

    /**
     * Deletes all Terms & Conditions documents for a specific company.
     * This is typically used when a company is deleted from the system.
     *
     * @param companyId the company ID
     * @return the number of documents that were deleted
     */
    @Modifying
    @Query("DELETE FROM TermsConditionsDocument t WHERE t.companyId = :companyId")
    int deleteAllByCompanyId(@Param("companyId") UUID companyId);

    /**
     * Finds Terms & Conditions documents by original file name pattern.
     * This can be used for searching or organizing documents.
     *
     * @param pattern the file name pattern (supports SQL LIKE syntax)
     * @return list of documents matching the file name pattern
     */
    @Query("SELECT t FROM TermsConditionsDocument t WHERE t.originalFileName LIKE :pattern ORDER BY t.createdAt DESC")
    List<TermsConditionsDocument> findByOriginalFileNameLike(@Param("pattern") String pattern);
}