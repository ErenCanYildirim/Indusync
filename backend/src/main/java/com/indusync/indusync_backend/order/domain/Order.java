package com.indusync.indusync_backend.order.domain;

import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.enums.*;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.ContactPerson;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Order entity representing service orders in the IndusSync platform.
 * <p>
 * Enhanced entity supporting:
 * - Order lifecycle management (draft, published, matched, etc.)
 * - Geographic location and work radius
 * - Company assignment and matching
 * - Rich frontend form data including categories, industries, specializations
 * - Contact information and detailed requirements
 * - Budget and timeline management
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Setter
@Entity
@Table(name = "orders", schema = "\"order\"", indexes = {
        @Index(name = "idx_orders_status", columnList = "status"),
        @Index(name = "idx_orders_company", columnList = "company_id"),
        @Index(name = "idx_orders_location", columnList = "location_lat, location_lng"),
        @Index(name = "idx_orders_published", columnList = "published_at"),
        @Index(name = "idx_orders_created", columnList = "created_at"),
        @Index(name = "idx_orders_category", columnList = "primary_category"),
        @Index(name = "idx_orders_urgency", columnList = "urgency"),
        @Index(name = "idx_orders_deadline", columnList = "deadline")
})
public class Order extends AuditableEntity {

    /**
     * Title/name of the order.
     */
    @NotBlank(message = "Auftragstitel ist erforderlich")
    @Size(max = 200, message = "Auftragstitel darf maximal 200 Zeichen lang sein")
    @Column(name = "title", nullable = false, length = 200)
    private String title;

    /**
     * Detailed description of the order requirements.
     */
    @NotBlank(message = "Auftragsbeschreibung ist erforderlich")
    @Size(max = 2000, message = "Auftragsbeschreibung darf maximal 2000 Zeichen lang sein")
    @Column(name = "description", nullable = false, length = 2000)
    private String description;

    /**
     * Current status of the order.
     */
    @NotNull(message = "Auftragsstatus ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private OrderStatus status = OrderStatus.DRAFT;

    /**
     * Company that created this order (Auftraggeber).
     */
    @NotNull(message = "Unternehmen ist erforderlich")
    @Column(name = "company_id", columnDefinition = "uuid", nullable = false)
    private UUID companyId;

    /**
     * Provider company that has been selected to execute this order (nullable until
     * selection).
     */
    @Column(name = "provider_id", columnDefinition = "uuid")
    private UUID providerId;

    /**
     * Timestamp when the client accepted the provider, automatically set on
     * provider assignment.
     */
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    // === Contact Information ===

    /**
     * Primary contact person for this order.
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "name", column = @Column(name = "contact_name", length = 100)),
            @AttributeOverride(name = "email", column = @Column(name = "contact_email", length = 150)),
            @AttributeOverride(name = "phone", column = @Column(name = "contact_phone", length = 20))
    })
    private ContactPerson contactPerson;

    // === Location & Service Details ===

    /**
     * Service location address.
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "street", column = @Column(name = "street", length = 100)),
            @AttributeOverride(name = "houseNumber", column = @Column(name = "house_number", length = 10)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "postal_code", length = 5)),
            @AttributeOverride(name = "city", column = @Column(name = "city", length = 100)),
            @AttributeOverride(name = "country", column = @Column(name = "country", length = 50))
    })
    private Address serviceAddress;

    /**
     * Geographic coordinates of the service location.
     */
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "latitude", column = @Column(name = "location_lat")),
            @AttributeOverride(name = "longitude", column = @Column(name = "location_lng"))
    })
    private GeoLocation location;

    /**
     * Search radius for finding providers (in kilometers).
     */
    @NotNull(message = "Suchradius ist erforderlich")
    @Positive(message = "Suchradius muss größer als 0 sein")
    @Column(name = "search_radius_km", nullable = false)
    private Integer searchRadiusKm;

    // === Categories & Classification ===

    /**
     * Primary order category.
     */
    @NotNull(message = "Auftragskategorie ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "primary_category", nullable = false, length = 50)
    private OrderCategory primaryCategory;

    /**
     * Secondary order categories (stored as comma-separated string).
     */
    @Column(name = "secondary_categories", length = 500)
    private String secondaryCategories;

    /**
     * Target industries for this order.
     */
    @ElementCollection(targetClass = Industry.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "order_industries", schema = "\"order\"", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "industry", length = 50)
    private Set<Industry> targetIndustries = new HashSet<>();

    /**
     * Placement types applicable to this order.
     */
    @ElementCollection(targetClass = PlacementType.class)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "order_placement_types", schema = "\"order\"", joinColumns = @JoinColumn(name = "order_id"))
    @Column(name = "placement_type", length = 50)
    private Set<PlacementType> placementTypes = new HashSet<>();

    /**
     * Required specializations (stored as comma-separated string).
     */
    @Column(name = "required_specializations", length = 5000)
    private String requiredSpecializations;

    /**
     * Required skills (stored as comma-separated string).
     */
    @Column(name = "required_skills", length = 5000)
    private String requiredSkills;

    // === Timeline & Urgency ===

    /**
     * Urgency level of this order.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "urgency", length = 20)
    private Urgency urgency = Urgency.MEDIUM;

    /**
     * Preferred start date for the work.
     */
    @Column(name = "start_date")
    private LocalDateTime startDate;

    /**
     * Deadline for completion.
     */
    @Column(name = "deadline")
    private LocalDateTime deadline;

    /**
     * Response time expectations (in hours).
     */
    @Column(name = "response_time_hours")
    private Integer responseTimeHours;

    // === Financial ===

    /**
     * Budget for this order (optional).
     */
    @DecimalMin(value = "0.0", message = "Budget muss größer oder gleich 0 sein")
    @Column(name = "budget", precision = 10, scale = 2)
    private BigDecimal budget;

    // === Document & Verification Requirements ===

    /**
     * Required verifications (stored as comma-separated string).
     */
    @Column(name = "required_verifications", length = 500)
    private String requiredVerifications;

    /**
     * Required certifications (stored as comma-separated string).
     */
    @Column(name = "required_certifications", length = 500)
    private String requiredCertifications;

    // === Lifecycle Timestamps ===

    /**
     * When the order was published (null for drafts).
     */
    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    /**
     * When the order was completed (null until completed).
     */
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    /**
     * Default constructor for JPA.
     */
    public Order() {
        super();
    }

    /**
     * Creates a new order in DRAFT status with minimal required fields.
     *
     * @param title           the order title
     * @param description     the order description
     * @param companyId       the company creating the order
     * @param contactPerson   the primary contact
     * @param serviceAddress  the service location
     * @param location        the geographic coordinates
     * @param searchRadiusKm  the search radius in kilometers
     * @param primaryCategory the main category
     */
    public Order(String title, String description, UUID companyId,
            ContactPerson contactPerson, Address serviceAddress,
            GeoLocation location, Integer searchRadiusKm,
            OrderCategory primaryCategory) {
        this.title = title;
        this.description = description;
        this.companyId = companyId;
        this.contactPerson = contactPerson;
        this.serviceAddress = serviceAddress;
        this.location = location;
        this.searchRadiusKm = searchRadiusKm;
        this.primaryCategory = primaryCategory;
        this.status = OrderStatus.DRAFT;
        this.urgency = Urgency.MEDIUM;
    }

    /**
     * @deprecated Legacy constructor kept to avoid breaking existing tests.
     */
    @Deprecated
    public Order(String title, String description, UUID companyId,
            Address serviceAddress, GeoLocation location, Integer searchRadiusKm) {
        this(title, description, companyId, null, serviceAddress, location, searchRadiusKm, OrderCategory.OTHER);
    }

    // === Business Logic Methods ===

    /**
     * Publishes the order, making it visible to service providers.
     * Can only be done from DRAFT status.
     *
     * @throws IllegalStateException if order cannot be published
     */
    public void publish() {
        if (!status.canBePublished()) {
            throw new IllegalStateException(
                    String.format("Cannot publish order in status %s", status));
        }
        this.status = OrderStatus.PUBLISHED;
        this.publishedAt = LocalDateTime.now();
    }

    /**
     * Cancels the order.
     * Can only be done from DRAFT, PUBLISHED, or MATCHED status.
     *
     * @throws IllegalStateException if order cannot be cancelled
     */
    public void cancel() {
        if (!status.canBeCancelled()) {
            throw new IllegalStateException(
                    String.format("Cannot cancel order in status %s", status));
        }
        this.status = OrderStatus.CANCELLED;
    }

    /**
     * Marks the order as matched with a provider.
     * Can only be done from PUBLISHED status.
     *
     * @throws IllegalStateException if order cannot be matched
     */
    public void markAsMatched() {
        if (!status.canBeMatched()) {
            throw new IllegalStateException(
                    String.format("Cannot match order in status %s", status));
        }
        this.status = OrderStatus.MATCHED;
    }

    /**
     * Sets the order to in progress.
     * Can only be done from MATCHED status.
     *
     * @throws IllegalStateException if order cannot be set to in progress
     */
    public void setInProgress() {
        if (!status.canBeSetInProgress()) {
            throw new IllegalStateException(
                    String.format("Cannot set order to in progress in status %s", status));
        }
        this.status = OrderStatus.IN_PROGRESS;
    }

    /**
     * Completes the order.
     * Can only be done from IN_PROGRESS status.
     *
     * @throws IllegalStateException if order cannot be completed
     */
    public void complete() {
        if (!status.canBeCompleted()) {
            throw new IllegalStateException(
                    String.format("Cannot complete order in status %s", status));
        }
        this.status = OrderStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();
    }

    // === Provider Assignment ===

    /**
     * Assigns a provider to this order and automatically transitions the status to
     * IN_PROGRESS.
     * Can only be invoked when the order is published or matched.
     *
     * @param providerId the selected provider company ID
     */
    public void assignProvider(UUID providerId) {
        if (status != OrderStatus.PUBLISHED && status != OrderStatus.MATCHED) {
            throw new IllegalStateException("Provider can only be assigned when order is published or matched");
        }
        if (providerId == null) {
            throw new IllegalArgumentException("providerId must not be null");
        }
        this.providerId = providerId;
        this.acceptedAt = LocalDateTime.now();
        this.status = OrderStatus.IN_PROGRESS;
    }

    // === Helper Methods ===

    /**
     * Checks if the order is in draft status.
     *
     * @return true if order is in draft
     */
    public boolean isDraft() {
        return status == OrderStatus.DRAFT;
    }

    /**
     * Checks if the order is published.
     *
     * @return true if order is published
     */
    public boolean isPublished() {
        return status == OrderStatus.PUBLISHED;
    }

    /**
     * Checks if the order is in a final status.
     *
     * @return true if order is completed or cancelled
     */
    public boolean isFinal() {
        return status.isFinalStatus();
    }

    /**
     * Checks if the order can be modified.
     *
     * @return true if order can be modified
     */
    public boolean canBeModified() {
        return status.isModifiable();
    }

    /**
     * Checks if the order is urgent.
     *
     * @return true if urgency is high or urgent
     */
    public boolean isUrgent() {
        return urgency != null && urgency.isHighPriority();
    }

    /**
     * Checks if the order is overdue.
     *
     * @return true if deadline has passed
     */
    public boolean isOverdue() {
        return deadline != null && LocalDateTime.now().isAfter(deadline);
    }

    /**
     * Gets the display name for the current status.
     *
     * @return German display name for status
     */
    public String getStatusDisplayName() {
        return status.getDisplayName();
    }

    /**
     * Gets the primary contact email.
     *
     * @return contact email or null if no contact
     */
    public String getContactEmail() {
        return contactPerson != null ? contactPerson.getEmail() : null;
    }

    /**
     * Gets the primary contact name.
     *
     * @return contact name or null if no contact
     */
    public String getContactName() {
        return contactPerson != null ? contactPerson.getName() : null;
    }

    /**
     * Enhanced string representation including key order information.
     */
    @Override
    public String toString() {
        return String.format("Order{id=%s, title='%s', status=%s, category=%s, companyId=%s}",
                getId(), title, status, primaryCategory, companyId);
    }
}