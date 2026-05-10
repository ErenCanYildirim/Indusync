package com.indusync.indusync_backend.order.api.dto;

import com.indusync.indusync_backend.shared.domain.enums.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * REST API response DTO for order details.
 * Updated to support all comprehensive order fields.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Data
@Builder
public class OrderDetailResponse {

    // === Core Information ===
    private UUID id;
    private String title;
    private String description;
    private OrderStatus status;
    private UUID companyId;
    private String companyName;

    private UUID providerId ;

    // === Contact Information ===
    private ContactPersonDto contactPerson;

    // === Service Location ===
    private AddressDto serviceAddress;
    private GeoLocationDto location;
    private Integer searchRadiusKm;

    // === Categories & Classification ===
    private OrderCategory primaryCategory;
    private Set<OrderCategory> additionalCategories;
    private Set<Industry> targetIndustries;
    private Set<PlacementType> placementTypes;

    // === Skills & Requirements ===
    private List<String> requiredSpecializations;
    private List<String> requiredSkills;
    private List<String> requiredVerifications;
    private List<String> requiredCertifications;

    // === Timeline & Urgency ===
    private Urgency urgency;
    private LocalDateTime startDate;
    private LocalDateTime deadline;
    private Integer responseTimeHours;

    // === Financial ===
    private BigDecimal budget;

    // === Lifecycle Timestamps ===
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime completedAt;

    // === Provider View (calculated fields) ===
    private Double distanceKm;

    // === Documents ===
    private List<OrderDocumentDto> documents;

    @Data
    @Builder
    public static class ContactPersonDto {
        private String name;
        private String email;
        private String phone;
    }

    @Data
    @Builder
    public static class AddressDto {
        private String street;
        private String houseNumber;
        private String postalCode;
        private String city;
        private String country;

        public String getFormattedAddress() {
            StringBuilder sb = new StringBuilder();
            if (street != null)
                sb.append(street);
            if (houseNumber != null)
                sb.append(" ").append(houseNumber);
            sb.append(", ");
            if (postalCode != null)
                sb.append(postalCode).append(" ");
            if (city != null)
                sb.append(city);
            if (country != null && !country.equalsIgnoreCase("Deutschland")) {
                sb.append(", ").append(country);
            }
            return sb.toString();
        }

        public String getFullStreetAddress() {
            if (street == null)
                return "";
            return houseNumber != null ? street + " " + houseNumber : street;
        }
    }

    @Data
    @Builder
    public static class GeoLocationDto {
        private BigDecimal latitude;
        private BigDecimal longitude;

        public double getLatitudeAsDouble() {
            return latitude != null ? latitude.doubleValue() : 0.0;
        }

        public double getLongitudeAsDouble() {
            return longitude != null ? longitude.doubleValue() : 0.0;
        }
    }

    @Data
    @Builder
    public static class OrderDocumentDto {
        private UUID id;
        private String fileName;
        private String originalFileName;
        private String documentType;
        private String description;
        private Long fileSize;
        private String contentType;
        private LocalDateTime uploadedAt;
        private String downloadUrl;

        /**
         * Gets human-readable file size.
         */
        public String getFormattedFileSize() {
            if (fileSize == null)
                return "Unknown";

            if (fileSize < 1024)
                return fileSize + " B";
            if (fileSize < 1024 * 1024)
                return String.format("%.1f KB", fileSize / 1024.0);
            if (fileSize < 1024 * 1024 * 1024)
                return String.format("%.1f MB", fileSize / (1024.0 * 1024.0));
            return String.format("%.1f GB", fileSize / (1024.0 * 1024.0 * 1024.0));
        }
    }

    // === Helper Methods ===

    /**
     * Checks if the order is urgent.
     */
    public boolean isUrgent() {
        return urgency == Urgency.HIGH || urgency == Urgency.URGENT;
    }

    /**
     * Checks if the order has a deadline.
     */
    public boolean hasDeadline() {
        return deadline != null;
    }

    /**
     * Checks if the order has budget information.
     */
    public boolean hasBudget() {
        return budget != null && budget.compareTo(BigDecimal.ZERO) > 0;
    }

    /**
     * Gets the status display name.
     */
    public String getStatusDisplayName() {
        return status != null ? status.getDisplayName() : "";
    }

    /**
     * Checks if the order is published.
     */
    public boolean isPublished() {
        return status == OrderStatus.PUBLISHED;
    }

    /**
     * Checks if the order is in a final state.
     */
    public boolean isFinalState() {
        return status == OrderStatus.COMPLETED || status == OrderStatus.CANCELLED;
    }

    /**
     * Gets the formatted contact information.
     */
    public String getFormattedContact() {
        if (contactPerson == null)
            return "";
        StringBuilder sb = new StringBuilder();
        if (contactPerson.name != null)
            sb.append(contactPerson.name);
        if (contactPerson.email != null) {
            if (sb.length() > 0)
                sb.append(" - ");
            sb.append(contactPerson.email);
        }
        if (contactPerson.phone != null) {
            if (sb.length() > 0)
                sb.append(" - ");
            sb.append(contactPerson.phone);
        }
        return sb.toString();
    }

    /**
     * Gets the formatted location information.
     */
    public String getFormattedLocation() {
        if (serviceAddress == null)
            return "";
        return serviceAddress.getFormattedAddress();
    }
}