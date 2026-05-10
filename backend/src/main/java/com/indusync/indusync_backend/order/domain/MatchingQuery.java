package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import com.indusync.indusync_backend.shared.domain.enums.Urgency;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "matching_queries", schema = "\"order\"")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MatchingQuery extends AuditableEntity {
    @Column(name = "company_id", nullable = false)
    private UUID companyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "primary_category", length = 50)
    private OrderCategory primaryCategory;

    @ElementCollection
    @CollectionTable(name = "matching_query_industries", schema = "\"order\"", joinColumns = @JoinColumn(name = "matching_query_id"))
    @Column(name = "industry", length = 50)
    @Builder.Default
    private Set<String> targetIndustries = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "matching_query_placement_types", schema = "\"order\"", joinColumns = @JoinColumn(name = "matching_query_id"))
    @Column(name = "placement_type", length = 50)
    @Builder.Default
    private Set<String> placementTypes = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "matching_query_specializations", schema = "\"order\"", joinColumns = @JoinColumn(name = "matching_query_id"))
    @Column(name = "specialization", length = 100)
    @Builder.Default
    private Set<String> requiredSpecializations = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "matching_query_certifications", schema = "\"order\"", joinColumns = @JoinColumn(name = "matching_query_id"))
    @Column(name = "certification", length = 100)
    @Builder.Default
    private Set<String> requiredCertifications = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "matching_query_verifications", schema = "\"order\"", joinColumns = @JoinColumn(name = "matching_query_id"))
    @Column(name = "verification", length = 100)
    @Builder.Default
    private Set<String> requiredVerifications = new HashSet<>();

    @Column(name = "latitude", precision = 10, scale = 8)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 11, scale = 8)
    private BigDecimal longitude;

    @Column(name = "search_radius_km")
    private Integer searchRadiusKm;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency", length = 20)
    private Urgency urgency;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "deadline")
    private LocalDateTime deadline;

    @Column(name = "budget", precision = 10, scale = 2)
    private BigDecimal budget;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "query_payload", columnDefinition = "jsonb")
    @Builder.Default
    private String queryPayload = "";

    @Column(name = "total_matches", nullable = false)
    @Builder.Default
    private Integer totalMatches = 0;

    @Column(name = "average_score", precision = 4, scale = 3)
    private BigDecimal averageScore;

    @Column(name = "best_match_score", precision = 4, scale = 3)
    private BigDecimal bestMatchScore;
}