package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for Company entity operations.
 * <p>
 * This repository provides comprehensive data access methods for:
 * - Basic CRUD operations
 * - Business-specific searches
 * - Geographic queries
 * - Status and verification management
 * - Performance analytics
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, UUID> {

    // ====================
    // Basic Queries
    // ====================

    /**
     * Finds a company by its name (exact match).
     *
     * @param name the company name
     * @return Optional containing the company if found
     */
    Optional<Company> findByName(String name);

    /**
     * Finds companies by name containing the given text (case-insensitive).
     *
     * @param name the partial name to search for
     * @param pageable pagination information
     * @return page of matching companies
     */
    @Query("SELECT c FROM Company c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Company> findByNameContainingIgnoreCase(@Param("name") String name, Pageable pageable);

    /**
     * Checks if a company with the given name exists.
     *
     * @param name the company name
     * @return true if company exists
     */
    boolean existsByName(String name);

    // ====================
    // Status and Verification Queries
    // ====================

    /**
     * Finds companies by status.
     *
     * @param status the company status
     * @param pageable pagination information
     * @return page of companies with the given status
     */
    Page<Company> findByStatus(CompanyStatus status, Pageable pageable);

    /**
     * Finds all active companies (status = ACTIVE).
     *
     * @param pageable pagination information
     * @return page of active companies
     */
    @Query("SELECT c FROM Company c WHERE c.status = 'ACTIVE'")
    Page<Company> findActiveCompanies(Pageable pageable);

    /**
     * Finds all verified companies.
     *
     * @param pageable pagination information
     * @return page of verified companies
     */
    Page<Company> findByVerifiedTrue(Pageable pageable);

    /**
     * Finds companies pending verification.
     *
     * @param pageable pagination information
     * @return page of unverified companies
     */
    @Query("SELECT c FROM Company c WHERE c.verified = false AND c.status = 'PENDING'")
    Page<Company> findPendingVerification(Pageable pageable);

    /**
     * Counts companies by status.
     *
     * @param status the company status
     * @return number of companies with the given status
     */
    long countByStatus(CompanyStatus status);

    // ====================
    // Business Role Queries
    // ====================

    /**
     * Finds companies that can act as clients (Auftraggeber).
     *
     * @param pageable pagination information
     * @return page of client companies
     */
    @Query("SELECT c FROM Company c WHERE c.isAuftraggeber = true AND c.status = 'ACTIVE'")
    Page<Company> findAuftraggeberCompanies(Pageable pageable);

    /**
     * Finds companies that can act as service providers (Auftragnehmer).
     *
     * @param pageable pagination information
     * @return page of service provider companies
     */
    @Query("SELECT c FROM Company c WHERE c.isAuftragnehmer = true AND c.status = 'ACTIVE'")
    Page<Company> findAuftragnehmehrCompanies(Pageable pageable);

    /**
     * Finds companies that can act in both roles.
     *
     * @param pageable pagination information
     * @return page of companies with both roles
     */
    @Query("SELECT c FROM Company c WHERE c.isAuftraggeber = true AND c.isAuftragnehmer = true AND c.status = 'ACTIVE'")
    Page<Company> findBothRoleCompanies(Pageable pageable);

    // ====================
    // Geographic Queries
    // ====================

    /**
     * Finds companies within a geographic bounding box.
     *
     * @param minLat minimum latitude
     * @param maxLat maximum latitude
     * @param minLng minimum longitude
     * @param maxLng maximum longitude
     * @param pageable pagination information
     * @return page of companies within the bounding box
     */
    @Query("SELECT c FROM Company c WHERE c.location.latitude BETWEEN :minLat AND :maxLat " +
           "AND c.location.longitude BETWEEN :minLng AND :maxLng " +
           "AND c.status = 'ACTIVE'")
    Page<Company> findByLocationBounds(@Param("minLat") BigDecimal minLat,
                                       @Param("maxLat") BigDecimal maxLat,
                                       @Param("minLng") BigDecimal minLng,
                                       @Param("maxLng") BigDecimal maxLng,
                                       Pageable pageable);

    /**
     * Finds service providers within a radius of a given location.
     * Uses the Haversine formula for distance calculation.
     *
     * @param centerLat center latitude
     * @param centerLng center longitude
     * @param radiusKm search radius in kilometers
     * @param pageable pagination information
     * @return page of service providers within radius
     */
    @Query(value = """
        SELECT * FROM company.companies c
        WHERE c.is_auftragnehmer = true
        AND c.status = 'ACTIVE'
        AND c.location_lat IS NOT NULL
        AND c.location_lng IS NOT NULL
        AND (
            /* distance between order location and provider */
            6371 * acos(
                cos(radians(?1)) * cos(radians(c.location_lat)) *
                cos(radians(c.location_lng) - radians(?2)) +
                sin(radians(?1)) * sin(radians(c.location_lat))
            )
        ) <= ?3 /* within order search radius */
        AND (
            c.work_radius_km IS NULL /* provider has no explicit radius */
            OR (
                6371 * acos(
                    cos(radians(?1)) * cos(radians(c.location_lat)) *
                    cos(radians(c.location_lng) - radians(?2)) +
                    sin(radians(?1)) * sin(radians(c.location_lat))
                )
            ) <= c.work_radius_km /* order location within provider radius */
        )
        ORDER BY (
            6371 * acos(
                cos(radians(?1)) * cos(radians(c.location_lat)) *
                cos(radians(c.location_lng) - radians(?2)) +
                sin(radians(?1)) * sin(radians(c.location_lat))
            )
        )
        """, nativeQuery = true)
    List<Company> findServiceProvidersWithinRadius(double centerLat,
                                                    double centerLng,
                                                    double radiusKm,
                                                    Pageable pageable);

    /**
     * Finds companies by postal code.
     *
     * @param postalCode the postal code
     * @return list of companies in the postal code area
     */
    @Query("SELECT c FROM Company c WHERE c.address.postalCode = :postalCode AND c.status = 'ACTIVE'")
    List<Company> findByPostalCode(@Param("postalCode") String postalCode);

    /**
     * Finds companies by city.
     *
     * @param city the city name
     * @param pageable pagination information
     * @return page of companies in the city
     */
    @Query("SELECT c FROM Company c WHERE LOWER(c.address.city) = LOWER(:city) AND c.status = 'ACTIVE'")
    Page<Company> findByCity(@Param("city") String city, Pageable pageable);

    // ====================
    // Business Category Queries
    // ====================

    /**
     * Finds companies by company type.
     *
     * @param companyType the legal form
     * @param pageable pagination information
     * @return page of companies with the given type
     */
    Page<Company> findByCompanyType(CompanyType companyType, Pageable pageable);

    /**
     * Finds companies that have specific specializations.
     * Uses JSON search capabilities.
     *
     * @param specialization the specialization to search for
     * @param pageable pagination information
     * @return page of companies with the specialization
     */
    @Query(value = """
        SELECT * FROM company.companies c
        WHERE c.specializations IS NOT NULL
        AND jsonb_exists(c.specializations::jsonb, :specialization)
        AND c.status = 'ACTIVE'
        AND c.is_auftragnehmer = true
        """,
        countQuery = """
        SELECT COUNT(*) FROM company.companies c
        WHERE c.specializations IS NOT NULL
        AND jsonb_exists(c.specializations::jsonb, :specialization)
        AND c.status = 'ACTIVE'
        AND c.is_auftragnehmer = true
        """,
        nativeQuery = true)
    Page<Company> findBySpecialization(@Param("specialization") String specialization, Pageable pageable);

    /**
     * Finds companies in specific industries.
     *
     * @param industry the industry to search for
     * @param pageable pagination information
     * @return page of companies in the industry
     */
    @Query(value = """
        SELECT * FROM company.companies c
        WHERE c.industries IS NOT NULL
        AND jsonb_exists(c.industries::jsonb, :industry)
        AND c.status = 'ACTIVE'
        """,
        countQuery = """
        SELECT COUNT(*) FROM company.companies c
        WHERE c.industries IS NOT NULL
        AND jsonb_exists(c.industries::jsonb, :industry)
        AND c.status = 'ACTIVE'
        """,
        nativeQuery = true)
    Page<Company> findByIndustry(@Param("industry") String industry, Pageable pageable);

    // ====================
    // Quality and Performance Queries
    // ====================

    /**
     * Finds companies with quality score above threshold.
     *
     * @param minScore minimum quality score
     * @param pageable pagination information
     * @return page of high-quality companies
     */
    @Query("SELECT c FROM Company c WHERE c.qualityScore >= :minScore AND c.status = 'ACTIVE' ORDER BY c.qualityScore DESC")
    Page<Company> findByQualityScoreGreaterThanEqual(@Param("minScore") Double minScore, Pageable pageable);

    /**
     * Finds companies with high completion rates.
     *
     * @param minRate minimum completion rate
     * @param pageable pagination information
     * @return page of reliable companies
     */
    @Query("SELECT c FROM Company c WHERE c.completionRate >= :minRate AND c.status = 'ACTIVE' ORDER BY c.completionRate DESC")
    Page<Company> findByCompletionRateGreaterThanEqual(@Param("minRate") Double minRate, Pageable pageable);

    /**
     * Finds companies with fast response times.
     *
     * @param maxHours maximum response time in hours
     * @param pageable pagination information
     * @return page of responsive companies
     */
    @Query("SELECT c FROM Company c WHERE c.averageResponseHours <= :maxHours AND c.status = 'ACTIVE' ORDER BY c.averageResponseHours ASC")
    Page<Company> findByAverageResponseHoursLessThanEqual(@Param("maxHours") Integer maxHours, Pageable pageable);

    /**
     * Finds companies with insurance coverage.
     *
     * @param pageable pagination information
     * @return page of insured companies
     */
    @Query("SELECT c FROM Company c WHERE c.insuranceCoverage = true AND c.status = 'ACTIVE'")
    Page<Company> findInsuredCompanies(Pageable pageable);

    // ====================
    // Search and Filter Queries
    // ====================

    /**
     * Comprehensive search across multiple company fields.
     *
     * @param searchTerm the search term
     * @param pageable pagination information
     * @return page of matching companies
     */
    @Query("""
        SELECT c FROM Company c WHERE c.status = 'ACTIVE' AND (
            LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(c.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR
            LOWER(c.address.city) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
        )
        """)
    Page<Company> searchCompanies(@Param("searchTerm") String searchTerm, Pageable pageable);

    /**
     * Advanced search with multiple filters.
     *
     * @param name company name filter (optional)
     * @param city city filter (optional)
     * @param companyType legal form filter (optional)
     * @param isAuftraggeber client role filter (optional)
     * @param isAuftragnehmer provider role filter (optional)
     * @param verified verification status filter (optional)
     * @param pageable pagination information
     * @return page of filtered companies
     */
    @Query("""
        SELECT c FROM Company c WHERE c.status = 'ACTIVE'
        AND (:name IS NULL OR LOWER(c.name) LIKE LOWER(CONCAT('%', :name, '%')))
        AND (:city IS NULL OR LOWER(c.address.city) = LOWER(:city))
        AND (:companyType IS NULL OR c.companyType = :companyType)
        AND (:isAuftraggeber IS NULL OR c.isAuftraggeber = :isAuftraggeber)
        AND (:isAuftragnehmer IS NULL OR c.isAuftragnehmer = :isAuftragnehmer)
        AND (:verified IS NULL OR c.verified = :verified)
        """)
    Page<Company> findWithFilters(@Param("name") String name,
                                  @Param("city") String city,
                                  @Param("companyType") CompanyType companyType,
                                  @Param("isAuftraggeber") Boolean isAuftraggeber,
                                  @Param("isAuftragnehmer") Boolean isAuftragnehmer,
                                  @Param("verified") Boolean verified,
                                  Pageable pageable);

    // ====================
    // Statistics and Analytics
    // ====================

    /**
     * Gets company count by company type.
     *
     * @return list of [CompanyType, Count] tuples
     */
    @Query("SELECT c.companyType, COUNT(c) FROM Company c WHERE c.status = 'ACTIVE' GROUP BY c.companyType")
    List<Object[]> getCompanyCountByType();

    /**
     * Gets company count by city.
     *
     * @return list of [City, Count] tuples
     */
    @Query("SELECT c.address.city, COUNT(c) FROM Company c WHERE c.status = 'ACTIVE' AND c.address.city IS NOT NULL GROUP BY c.address.city ORDER BY COUNT(c) DESC")
    List<Object[]> getCompanyCountByCity();

    /**
     * Gets average quality score.
     *
     * @return average quality score
     */
    @Query("SELECT AVG(c.qualityScore) FROM Company c WHERE c.qualityScore IS NOT NULL AND c.status = 'ACTIVE'")
    Optional<Double> getAverageQualityScore();

    /**
     * Gets companies with missing important information.
     *
     * @return list of companies that need attention
     */
    @Query("""
        SELECT c FROM Company c WHERE c.status = 'ACTIVE' AND (
            c.description IS NULL OR c.description = '' OR
            c.website IS NULL OR c.website = '' OR
            c.contactEmail IS NULL OR c.contactEmail = '' OR
            c.location IS NULL
        )
        """)
    List<Company> findCompaniesWithMissingInformation();

    // ====================
    // Administrative Queries
    // ====================

    /**
     * Finds companies that need admin attention.
     *
     * @return list of companies requiring attention
     */
    @Query("SELECT c FROM Company c WHERE c.status IN ('PENDING', 'SUSPENDED') OR c.verified = false")
    List<Company> findCompaniesNeedingAttention();

    /**
     * Finds companies by verifier admin.
     *
     * @param verifierId the admin who verified the companies
     * @return list of companies verified by the admin
     */
    List<Company> findByVerifiedBy(UUID verifierId);

    /**
     * Finds recently registered companies.
     *
     * @param days number of days to look back
     * @return list of recently registered companies
     */
    @Query("SELECT c FROM Company c WHERE c.createdAt >= CURRENT_TIMESTAMP - :days DAY ORDER BY c.createdAt DESC")
    List<Company> findRecentlyRegistered(@Param("days") int days);
} 