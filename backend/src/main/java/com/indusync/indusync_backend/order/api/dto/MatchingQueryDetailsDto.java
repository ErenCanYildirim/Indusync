package com.indusync.indusync_backend.order.api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class MatchingQueryDetailsDto {
    
    private MatchingQueryHistoryDto query;
    
    private List<MatchingCompanyResponseDto> matches;
} 