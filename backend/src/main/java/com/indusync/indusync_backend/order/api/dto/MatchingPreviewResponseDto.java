package com.indusync.indusync_backend.order.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class MatchingPreviewResponseDto {

    private UUID queryId;

    private int totalMatches;

    private BigDecimal averageScore;

    private BigDecimal bestMatchScore;

    private List<MatchingCompanyResponseDto> topMatches;

    private String message;
}