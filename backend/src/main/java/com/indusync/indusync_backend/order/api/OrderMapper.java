package com.indusync.indusync_backend.order.api;

import com.indusync.indusync_backend.order.api.dto.CreateOrderRequest;
import com.indusync.indusync_backend.order.api.dto.UpdateOrderRequest;
import com.indusync.indusync_backend.order.api.dto.OrderDetailResponse;
import com.indusync.indusync_backend.order.api.dto.OrderListResponse;
import com.indusync.indusync_backend.order.application.dto.CreateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.UpdateOrderCommand;
import com.indusync.indusync_backend.order.application.dto.OrderResponse;
import com.indusync.indusync_backend.order.application.dto.OrderDocumentResponse;
import com.indusync.indusync_backend.order.domain.Order;
import com.indusync.indusync_backend.order.domain.OrderDocument;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import com.indusync.indusync_backend.shared.domain.enums.*;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Mapper for converting between API DTOs and domain/application objects.
 * Updated to handle all comprehensive order fields.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
public class OrderMapper {

    public CreateOrderCommand toCommand(CreateOrderRequest request) {
        return new CreateOrderCommand(
                // Core fields
                request.getTitle(),
                request.getDescription(),
                null, // companyId will be set from authentication

                // Contact information
                request.getContactName(),
                request.getContactEmail(),
                request.getContactPhone(),
                null, // additional contacts not supported in simple form

                // Address fields
                request.getStreet(),
                request.getHouseNumber(),
                request.getPostalCode(),
                request.getCity(),
                request.getEffectiveCountry(),

                // Geographic coordinates
                request.getLocationLat() != null ? request.getLocationLat().doubleValue() : null,
                request.getLocationLng() != null ? request.getLocationLng().doubleValue() : null,

                // Matching configuration
                request.getSearchRadiusKm(),

                // Categories & classification
                request.getPrimaryCategory(),
                request.getAdditionalCategories(),
                convertGermanNamesToIndustries(request.getTargetIndustries()),
                convertGermanNamesToPlacementTypes(request.getPlacementTypes()),

                // Skills & requirements
                request.getRequiredSpecializations(),
                request.getRequiredSkills(),
                request.getRequiredVerifications(),
                request.getRequiredCertifications(),

                // Timeline & urgency
                request.getEffectiveUrgency(),
                request.getStartDate(),
                request.getDeadline(),
                request.getResponseTimeHours(),

                // Financial
                request.getBudget());
    }

    public UpdateOrderCommand toUpdateCommand(UUID orderId, UpdateOrderRequest request) {
        return UpdateOrderCommand.builder()
                .orderId(orderId)

                // Basic information
                .title(request.getTitle())
                .description(request.getDescription())

                // Contact information
                .contactName(request.getContactName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())

                // Address fields
                .street(request.getStreet())
                .houseNumber(request.getHouseNumber())
                .postalCode(request.getPostalCode())
                .city(request.getCity())
                .country(request.getCountry())

                // Geographic coordinates
                .latitude(request.getLocationLat())
                .longitude(request.getLocationLng())

                // Matching configuration
                .searchRadiusKm(request.getSearchRadiusKm())

                // Categories & classification
                .primaryCategory(request.getPrimaryCategory())
                .additionalCategories(request.getAdditionalCategories())
                .targetIndustries(convertGermanNamesToIndustriesForUpdate(request.getTargetIndustries()))
                .placementTypes(convertGermanNamesToPlacementTypesForUpdate(request.getPlacementTypes()))

                // Skills & requirements
                .requiredSpecializations(request.getRequiredSpecializations())
                .requiredSkills(request.getRequiredSkills())
                .requiredVerifications(request.getRequiredVerifications())
                .requiredCertifications(request.getRequiredCertifications())

                // Timeline & urgency
                .urgency(request.getUrgency())
                .startDate(request.getStartDate())
                .deadline(request.getDeadline())
                .responseTimeHours(request.getResponseTimeHours())

                // Financial
                .budget(request.getBudget())
                .build();
    }

    public OrderDetailResponse toDetailResponse(Order order) {
        return OrderDetailResponse.builder()
                // Core information
                .id(order.getId())
                .title(order.getTitle())
                .description(order.getDescription())
                .status(order.getStatus())
                .companyId(order.getCompanyId())
                .companyName(null) // To be populated by service layer

                // Contact information
                .contactPerson(toContactPersonDto(order))

                // Service location
                .serviceAddress(toAddressDto(order.getServiceAddress()))
                .location(toGeoLocationDto(order.getLocation()))
                .searchRadiusKm(order.getSearchRadiusKm())

                // Categories & classification
                .primaryCategory(order.getPrimaryCategory())
                .additionalCategories(parseAdditionalCategories(order.getSecondaryCategories()))
                .targetIndustries(order.getTargetIndustries())
                .placementTypes(order.getPlacementTypes())

                // Skills & requirements
                .requiredSpecializations(parseStringList(order.getRequiredSpecializations()))
                .requiredSkills(parseStringList(order.getRequiredSkills()))
                .requiredVerifications(parseStringList(order.getRequiredVerifications()))
                .requiredCertifications(parseStringList(order.getRequiredCertifications()))

                // Timeline & urgency
                .urgency(order.getUrgency())
                .startDate(order.getStartDate())
                .deadline(order.getDeadline())
                .responseTimeHours(order.getResponseTimeHours())

                // Financial
                .budget(order.getBudget())

                // Lifecycle timestamps
                .publishedAt(order.getPublishedAt())
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .completedAt(order.getCompletedAt())

                // Provider view
                .distanceKm(null) // To be calculated by service layer

                // Documents
                .documents(Collections.emptyList()) // To be populated separately

                .build();
    }

    public OrderDetailResponse toDetailResponse(OrderResponse orderResponse) {
        OrderDetailResponse.ContactPersonDto contactPerson = null;
        if (orderResponse.contactName() != null || orderResponse.contactEmail() != null) {
            contactPerson = OrderDetailResponse.ContactPersonDto.builder()
                    .name(orderResponse.contactName())
                    .email(orderResponse.contactEmail())
                    .phone(orderResponse.contactPhone())
                    .build();
        }

        OrderDetailResponse.AddressDto serviceAddress = null;
        if (orderResponse.street() != null) {
            serviceAddress = OrderDetailResponse.AddressDto.builder()
                    .street(orderResponse.street())
                    .houseNumber(orderResponse.houseNumber())
                    .postalCode(orderResponse.postalCode())
                    .city(orderResponse.city())
                    .country(orderResponse.country())
                    .build();
        }

        OrderDetailResponse.GeoLocationDto location = null;
        if (orderResponse.latitude() != null && orderResponse.longitude() != null) {
            location = OrderDetailResponse.GeoLocationDto.builder()
                    .latitude(java.math.BigDecimal.valueOf(orderResponse.latitude()))
                    .longitude(java.math.BigDecimal.valueOf(orderResponse.longitude()))
                    .build();
        }

        return OrderDetailResponse.builder()
                .id(orderResponse.id())
                .title(orderResponse.title())
                .description(orderResponse.description())
                .status(orderResponse.status())
                .companyId(orderResponse.companyId())
                .companyName(null) // To be populated by service layer
                .contactPerson(contactPerson)
                .serviceAddress(serviceAddress)
                .location(location)
                .searchRadiusKm(orderResponse.searchRadiusKm())
                .primaryCategory(orderResponse.primaryCategory())
                .additionalCategories(
                        orderResponse.additionalCategories() != null ? Set.copyOf(orderResponse.additionalCategories())
                                : Collections.emptySet())
                .targetIndustries(orderResponse.targetIndustries())
                .placementTypes(orderResponse.placementTypes())
                .requiredSpecializations(orderResponse.requiredSpecializations())
                .requiredSkills(orderResponse.requiredSkills())
                .requiredVerifications(orderResponse.requiredVerifications())
                .requiredCertifications(orderResponse.requiredCertifications())
                .urgency(orderResponse.urgency())
                .startDate(orderResponse.startDate())
                .deadline(orderResponse.deadline())
                .responseTimeHours(orderResponse.responseTimeHours())
                .budget(orderResponse.budget())
                .publishedAt(orderResponse.publishedAt())
                .createdAt(orderResponse.createdAt())
                .providerId(orderResponse.providerId())
                .updatedAt(orderResponse.updatedAt())
                .completedAt(orderResponse.completedAt())
                .distanceKm(null) // To be calculated by service layer
                .documents(Collections.emptyList())
                .build();
    }

    public OrderListResponse toListResponse(Order order) {
        Address serviceAddress = order.getServiceAddress();
        String fullAddress = null;
        if (serviceAddress != null) {
            fullAddress = buildFullAddress(serviceAddress);
        }

        return OrderListResponse.builder()
                .id(order.getId())
                .title(order.getTitle())
                .description(order.getDescription())
                .city(serviceAddress != null ? serviceAddress.getCity() : null)
                .postalCode(serviceAddress != null ? serviceAddress.getPostalCode() : null)
                .fullAddress(fullAddress)
                .searchRadiusKm(order.getSearchRadiusKm())
                .budget(order.getBudget())
                .deadline(order.getDeadline())
                .status(order.getStatus())
                .publishedAt(order.getPublishedAt())
                .createdAt(order.getCreatedAt())
                .companyId(order.getCompanyId())
                .requiredSkills(parseStringList(order.getRequiredSkills()))
                .urgency(order.getUrgency())
                .primaryCategory(order.getPrimaryCategory())
                .build();
    }

    public OrderListResponse toListResponse(OrderResponse orderResponse) {
        return OrderListResponse.builder()
                .id(orderResponse.id())
                .title(orderResponse.title())
                .description(orderResponse.description())
                .city(orderResponse.city())
                .postalCode(orderResponse.postalCode())
                .fullAddress(orderResponse.fullAddress())
                .searchRadiusKm(orderResponse.searchRadiusKm())
                .budget(orderResponse.budget())
                .deadline(orderResponse.deadline())
                .status(orderResponse.status())
                .publishedAt(orderResponse.publishedAt())
                .createdAt(orderResponse.createdAt())
                .companyId(orderResponse.companyId())
                .companyName(null)
                .distanceKm(null)
                .requiredSkills(orderResponse.requiredSkills())
                .urgency(orderResponse.urgency())
                .primaryCategory(orderResponse.primaryCategory())
                .build();
    }

    public OrderDetailResponse.OrderDocumentDto toDocumentDto(OrderDocumentResponse documentResponse) {
        return OrderDetailResponse.OrderDocumentDto.builder()
                .id(documentResponse.id())
                .fileName(documentResponse.fileName())
                .originalFileName(documentResponse.originalFileName())
                .documentType(documentResponse.documentType())
                .description(documentResponse.description())
                .fileSize(documentResponse.fileSize())
                .contentType(documentResponse.contentType())
                .uploadedAt(documentResponse.uploadedAt())
                .downloadUrl(documentResponse.getDownloadUrl())
                .build();
    }

    public OrderDetailResponse.OrderDocumentDto toDocumentDto(OrderDocument document) {
        return OrderDetailResponse.OrderDocumentDto.builder()
                .id(document.getId())
                .fileName(document.getFileName())
                .originalFileName(document.getOriginalFileName())
                .documentType(document.getDocumentType())
                .description(document.getDescription())
                .fileSize(document.getFileSize())
                .contentType(document.getContentType())
                .uploadedAt(document.getCreatedAt())
                .downloadUrl(
                        "/v1/orders/" + document.getOrder().getId() + "/documents/" + document.getId() + "/download")
                .build();
    }

    // === Private Helper Methods ===

    private OrderDetailResponse.ContactPersonDto toContactPersonDto(Order order) {
        if (order.getContactPerson() == null)
            return null;

        return OrderDetailResponse.ContactPersonDto.builder()
                .name(order.getContactPerson().getName())
                .email(order.getContactPerson().getEmail())
                .phone(order.getContactPerson().getPhone())
                .build();
    }

    private OrderDetailResponse.AddressDto toAddressDto(Address address) {
        if (address == null)
            return null;

        return OrderDetailResponse.AddressDto.builder()
                .street(address.getStreet())
                .houseNumber(address.getHouseNumber())
                .postalCode(address.getPostalCode())
                .city(address.getCity())
                .country(address.getCountry())
                .build();
    }

    private OrderDetailResponse.GeoLocationDto toGeoLocationDto(GeoLocation geoLocation) {
        if (geoLocation == null)
            return null;

        return OrderDetailResponse.GeoLocationDto.builder()
                .latitude(geoLocation.getLatitude())
                .longitude(geoLocation.getLongitude())
                .build();
    }

    private List<String> parseStringList(String commaSeparatedString) {
        if (commaSeparatedString == null || commaSeparatedString.trim().isEmpty()) {
            return Collections.emptyList();
        }
        return Stream.of(commaSeparatedString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    private Set<OrderCategory> parseAdditionalCategories(String commaSeparatedString) {
        if (commaSeparatedString == null || commaSeparatedString.trim().isEmpty()) {
            return Collections.emptySet();
        }
        return Stream.of(commaSeparatedString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(categoryName -> {
                    try {
                        return OrderCategory.valueOf(categoryName);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    private Set<Industry> convertGermanNamesToIndustries(List<String> germanNames) {
        if (germanNames == null || germanNames.isEmpty()) {
            return Set.of(Industry.OTHER);
        }
        return germanNames.stream()
                .map(Industry::fromDisplayName)
                .collect(Collectors.toSet());
    }

    private Set<PlacementType> convertGermanNamesToPlacementTypes(List<String> germanNames) {
        if (germanNames == null || germanNames.isEmpty()) {
            return Set.of(PlacementType.PROJECT_CONTRACT);
        }
        return germanNames.stream()
                .map(PlacementType::fromDisplayName)
                .collect(Collectors.toSet());
    }

    private List<Industry> convertGermanNamesToIndustriesForUpdate(List<String> germanNames) {
        if (germanNames == null) {
            return null; // null means don't update this field
        }
        if (germanNames.isEmpty()) {
            return List.of(Industry.OTHER);
        }
        return germanNames.stream()
                .map(Industry::fromDisplayName)
                .collect(Collectors.toList());
    }

    private List<PlacementType> convertGermanNamesToPlacementTypesForUpdate(List<String> germanNames) {
        if (germanNames == null) {
            return null; // null means don't update this field
        }
        if (germanNames.isEmpty()) {
            return List.of(PlacementType.PROJECT_CONTRACT);
        }
        return germanNames.stream()
                .map(PlacementType::fromDisplayName)
                .collect(Collectors.toList());
    }

    private String buildFullAddress(Address address) {
        StringBuilder fullAddress = new StringBuilder();
        if (address.getStreet() != null) {
            fullAddress.append(address.getStreet());
        }
        if (address.getHouseNumber() != null) {
            fullAddress.append(" ").append(address.getHouseNumber());
        }
        if (address.getPostalCode() != null) {
            fullAddress.append(" ").append(address.getPostalCode());
        }
        if (address.getCity() != null) {
            fullAddress.append(", ").append(address.getCity());
        }
        if (address.getCountry() != null) {
            fullAddress.append(", ").append(address.getCountry());
        }
        return fullAddress.toString();
    }

    // === Deadline Extension ===
    public com.indusync.indusync_backend.order.api.dto.DeadlineExtensionProposalDto toProposalDto(
            com.indusync.indusync_backend.order.domain.OrderDeadlineExtensionProposal p) {
        if (p == null) return null;
        return com.indusync.indusync_backend.order.api.dto.DeadlineExtensionProposalDto.builder()
                .id(p.getId())
                .orderId(p.getOrderId())
                .proposedDeadline(p.getProposedDeadline())
                .requesterCompanyId(p.getRequesterCompanyId())
                .status(p.getStatus().name())
                .confirmedByCompanyId(p.getConfirmedByCompanyId())
                .confirmedAt(p.getConfirmedAt())
                .rejectedByCompanyId(p.getRejectedByCompanyId())
                .rejectedAt(p.getRejectedAt())
                .rejectionReason(p.getRejectionReason())
                .cancelledAt(p.getCancelledAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}