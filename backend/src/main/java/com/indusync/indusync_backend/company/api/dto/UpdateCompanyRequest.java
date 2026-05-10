package com.indusync.indusync_backend.company.api.dto;

import lombok.Data;
import java.util.List;

@Data
public class UpdateCompanyRequest {
    private String name;
    private String description;
    private String website;
    private String contactPhone;
    private String contactEmail;
    private String businessHours;
    private Integer workRadiusKm;
    private List<String> specializations;
    private List<String> industries;
    private List<String> orderCategories;
    private Boolean isAuftraggeber;
    private Boolean isAuftragnehmer;
    private String logoUrl;
    private String vatNumber;
    private String taxId;
    private AddressDto address;
    
    @Data
    public static class AddressDto {
        private String street;
        private String houseNumber;
        private String postalCode;
        private String city;
        private String country;
    }
}