package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "matching_results", schema = "\"order\"")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingResult extends AuditableEntity {
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matching_query_id", nullable = false)
    private MatchingQuery matchingQuery;

    @Column(name = "provider_company_id", nullable = false)
    private UUID providerCompanyId;

    @Column(name = "match_score", precision = 4, scale = 3, nullable = false)
    private BigDecimal matchScore;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "distance_km", precision = 6, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "industry_score", precision = 4, scale = 3)
    private BigDecimal industryScore;

    @Column(name = "skills_score", precision = 4, scale = 3)
    private BigDecimal skillsScore;

    @Column(name = "contract_score", precision = 4, scale = 3)
    private BigDecimal contractScore;

    @Column(name = "certificates_score", precision = 4, scale = 3)
    private BigDecimal certificatesScore;

    @Column(name = "verification_score", precision = 4, scale = 3)
    private BigDecimal verificationScore;

    @Column(name = "radius_score", precision = 4, scale = 3)
    private BigDecimal radiusScore;

    // Add more minimal fields as needed for preview/history (e.g., company name,
    // etc.)
}