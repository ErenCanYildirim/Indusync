package com.indusync.indusync_backend.company.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for company detail information.
 * <p>
 * This DTO represents company details returned by the API,
 * including all business information and status.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class CompanyDetailResponse {

    private UUID companyId;
    private String companyName;
    private String companyType;
    private CompanyStatus status;
    private Boolean verified;
    private LocalDateTime verifiedAt;

    // Address information
    private String street;
    private String houseNumber;
    private String postalCode;
    private String city;
    private String country;
    private String formattedAddress;

    // Contact information
    private String contactEmail;
    private String contactPhone;
    private String website;

    // Business information
    private String description;
    private String businessHours;
    private Integer workRadiusKm;

    // Business capabilities
    private List<String> specializations;
    private List<String> industries;
    private List<String> orderCategories;
    private List<String> certifications;

    // Business roles
    private Boolean isAuftraggeber;
    private Boolean isAuftragnehmer;
    private String businessRoleDescription;

    // Business details
    private Integer foundedYear;
    private Integer employeeCount;
    private Long annualRevenue;
    private String taxId;
    private String registrationNumber;
    private String vatNumber;

    // Quality and performance
    private Boolean insuranceCoverage;
    private Double qualityScore;
    private Double completionRate;
    private Integer averageResponseHours;

    // Media
    private String logoUrl;

    // Geographic location
    private Double latitude;
    private Double longitude;

    // Timestamps
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Response metadata
    private String message;
    private Boolean canEdit;
    private Boolean canManage;

    // Company documents
    private List<CompanyDocument> documents;

    /**
     * Gets a user-friendly status message.
     *
     * @return formatted status message
     */
    public String getStatusMessage() {
        if (status == null)
            return "Unbekannt";

        switch (status) {
            case PENDING:
                return "Wartet auf Verifizierung";
            case ACTIVE:
                return "Aktiv und einsatzbereit";
            case SUSPENDED:
                return "Vorübergehend gesperrt";
            case INACTIVE:
                return "Inaktiv";
            default:
                return "Unbekannt";
        }
    }

    /**
     * Gets the complete address as a formatted string.
     *
     * @return formatted address
     */
    public String getFormattedAddress() {
        if (formattedAddress != null) {
            return formattedAddress;
        }

        if (street == null && city == null) {
            return null;
        }

        StringBuilder address = new StringBuilder();
        if (street != null) {
            address.append(street);
            if (houseNumber != null) {
                address.append(" ").append(houseNumber);
            }
        }

        if (postalCode != null || city != null) {
            if (address.length() > 0) {
                address.append(", ");
            }
            if (postalCode != null) {
                address.append(postalCode);
            }
            if (city != null) {
                if (postalCode != null) {
                    address.append(" ");
                }
                address.append(city);
            }
        }

        return address.toString();
    }

    /**
     * Checks if the company has a complete profile.
     *
     * @return true if profile is complete
     */
    public boolean hasCompleteProfile() {
        return companyName != null &&
                description != null && !description.trim().isEmpty() &&
                contactEmail != null &&
                (street != null || city != null);
    }

    /**
     * Gets the company size category based on employee count.
     *
     * @return size category
     */
    public String getSizeCategory() {
        if (employeeCount == null) {
            return "Unbekannt";
        }

        if (employeeCount <= 10) {
            return "Kleinstunternehmen";
        } else if (employeeCount <= 50) {
            return "Kleinunternehmen";
        } else if (employeeCount <= 250) {
            return "Mittleres Unternehmen";
        } else {
            return "Großunternehmen";
        }
    }

    /**
     * Creates an error response.
     *
     * @param message the error message
     * @return error response
     */
    public static CompanyDetailResponse error(String message) {
        return CompanyDetailResponse.builder()
                .message(message)
                .build();
    }

    /**
     * Creates a CompanyDetailResponse from a Company entity.
     *
     * @param company the company entity
     * @return company detail response
     */
    public static CompanyDetailResponse from(com.indusync.indusync_backend.company.domain.Company company) {
        CompanyDetailResponseBuilder builder = CompanyDetailResponse.builder()
                .companyId(company.getId())
                .companyName(company.getName())
                .companyType(company.getCompanyType() != null ? company.getCompanyType().toString() : null)
                .status(company.getStatus())
                .verified(company.getVerified())
                .verifiedAt(company.getVerifiedAt())
                .contactEmail(company.getContactEmail())
                .contactPhone(company.getContactPhone())
                .website(company.getWebsite())
                .description(company.getDescription())
                .businessHours(company.getBusinessHours())
                .workRadiusKm(company.getWorkRadiusKm())
                .specializations(company.getSpecializations())
                .industries(company.getIndustries())
                .orderCategories(company.getOrderCategories())
                .certifications(company.getCertifications())
                .isAuftraggeber(company.getIsAuftraggeber())
                .isAuftragnehmer(company.getIsAuftragnehmer())
                .foundedYear(company.getFoundedYear())
                .employeeCount(company.getEmployeeCount())
                .annualRevenue(company.getAnnualRevenue())
                .taxId(company.getTaxId())
                .registrationNumber(company.getRegistrationNumber())
                .vatNumber(company.getVatNumber())
                .insuranceCoverage(company.getInsuranceCoverage())
                .qualityScore(company.getQualityScore())
                .completionRate(company.getCompletionRate())
                .averageResponseHours(company.getAverageResponseHours())
                .logoUrl(company.getLogoUrl())
                .createdAt(company.getCreatedAt())
                .updatedAt(company.getUpdatedAt());

        // Map address if present
        if (company.getAddress() != null) {
            builder.street(company.getAddress().getStreet())
                    .houseNumber(company.getAddress().getHouseNumber())
                    .postalCode(company.getAddress().getPostalCode())
                    .city(company.getAddress().getCity())
                    .country(company.getAddress().getCountry());
        }

        // Map location if present
        if (company.getLocation() != null) {
            builder.latitude(
                    company.getLocation().getLatitude() != null ? company.getLocation().getLatitude().doubleValue()
                            : null)
                    .longitude(company.getLocation().getLongitude() != null
                            ? company.getLocation().getLongitude().doubleValue()
                            : null);
        }

        // Add business role description
        String roleDescription = "";
        if (Boolean.TRUE.equals(company.getIsAuftraggeber()) && Boolean.TRUE.equals(company.getIsAuftragnehmer())) {
            roleDescription = "Auftraggeber und Auftragnehmer";
        } else if (Boolean.TRUE.equals(company.getIsAuftraggeber())) {
            roleDescription = "Auftraggeber";
        } else if (Boolean.TRUE.equals(company.getIsAuftragnehmer())) {
            roleDescription = "Auftragnehmer";
        }
        builder.businessRoleDescription(roleDescription);

        // Add documents
        builder.documents(mapCompanyDocuments(company));

        return builder.build();
    }

    /**
     * Maps company document fields to a list of CompanyDocument DTOs.
     * <p>
     * This method converts the various document-related fields in the Company
     * entity
     * (verificationDocumentUrl, certificatesDocumentUrl, and certifications list)
     * into a structured list of document objects for frontend consumption.
     * </p>
     *
     * @param company the company entity containing document information
     * @return list of CompanyDocument DTOs
     */
    private static List<CompanyDocument> mapCompanyDocuments(
            com.indusync.indusync_backend.company.domain.Company company) {
        List<CompanyDocument> documents = new ArrayList<>();

        // Map verification document URL
        if (company.getVerificationDocumentUrl() != null && !company.getVerificationDocumentUrl().trim().isEmpty()) {
            documents.add(CompanyDocument.builder()
                    .id(UUID.randomUUID().toString())
                    .type(CompanyDocument.DocumentType.VERIFICATION)
                    .name("Company Verification Document")
                    .url(company.getVerificationDocumentUrl())
                    .uploadedAt(company.getCreatedAt()) // Use company creation date as fallback
                    .category(CompanyDocument.DocumentType.VERIFICATION.getCategory())
                    .build());
        }

        // Map certifications list items
        if (company.getCertifications() != null && !company.getCertifications().isEmpty()) {
            for (int i = 0; i < company.getCertifications().size(); i++) {
                String certification = company.getCertifications().get(i);
                if (certification != null && !certification.trim().isEmpty()) {
                    documents.add(CompanyDocument.builder()
                            .id(UUID.randomUUID().toString())
                            .type(CompanyDocument.DocumentType.CERTIFICATION_ITEM)
                            .name(certification.trim())
                            .url(null) // Certification items are text-based, no URL
                            .uploadedAt(company.getCreatedAt())
                            .category(CompanyDocument.DocumentType.CERTIFICATION_ITEM.getCategory())
                            .build());
                }
            }
        }

        return documents;
    }
}