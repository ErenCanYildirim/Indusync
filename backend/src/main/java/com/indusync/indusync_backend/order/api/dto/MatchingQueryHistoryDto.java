package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.OrderCategory;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MatchingQueryHistoryDto {

    private UUID queryId;

    private LocalDateTime createdAt;

    private OrderCategory primaryCategory;

    private Integer searchRadiusKm;

    private Integer totalMatches;

    private BigDecimal averageScore;

    private BigDecimal bestMatchScore;
}