package com.indusync.indusync_backend.order.api.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class MatchingCompanyResponseDto {
    
    private UUID companyId;
    
    private String companyName;
    
    private BigDecimal matchScore;
    
    private BigDecimal distanceKm;
    
    // Detailed score breakdown
    private BigDecimal industryScore;
    
    private BigDecimal skillsScore;
    
    private BigDecimal contractScore;
    
    private BigDecimal certificatesScore;
    
    private BigDecimal verificationScore;
    
    private BigDecimal radiusScore;
    
    // Additional company info for display
    private String city;
    
    private String description;
    
    private Boolean verified;
} 