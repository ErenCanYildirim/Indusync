package com.indusync.indusync_backend.company.domain;

import com.indusync.indusync_backend.company.api.dto.AddBusinessRoleRequest;
import com.indusync.indusync_backend.company.api.dto.BusinessRole;
import com.indusync.indusync_backend.shared.domain.AuditableEntity;
import com.indusync.indusync_backend.shared.domain.enums.CompanyStatus;
import com.indusync.indusync_backend.shared.domain.enums.CompanyType;
import com.indusync.indusync_backend.shared.domain.valueobjects.Address;
import com.indusync.indusync_backend.shared.domain.valueobjects.GeoLocation;
import com.indusync.indusync_backend.shared.infrastructure.persistence.StringListConverter;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.validator.constraints.URL;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

/**
 * Company entity representing businesses in the IndusSync platform.
 * <p>
 * This entity supports German businesses with:
 * - Various legal forms (Rechtsformen)
 * - Geographic location and work radius
 * - Specializations and industry categories
 * - Verification and status management
 * - Multi-role support (Auftraggeber/Auftragnehmer)
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Entity
@Table(name = "companies", schema = "company", indexes = {
        @Index(name = "idx_companies_status", columnList = "status"),
        @Index(name = "idx_companies_verified", columnList = "verified"),
        @Index(name = "idx_companies_type", columnList = "company_type"),
        @Index(name = "idx_companies_location", columnList = "location_lat, location_lng"),
        @Index(name = "idx_companies_name", columnList = "name"),
        @Index(name = "idx_companies_tax_id", columnList = "tax_id")
})
public class Company extends AuditableEntity {

    @NotBlank(message = "Firmenname ist erforderlich")
    @Size(max = 200, message = "Firmenname darf maximal 200 Zeichen lang sein")
    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @NotNull(message = "Unternehmensform ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "company_type", nullable = false, length = 30)
    private CompanyType companyType;

    @Size(max = 20, message = "Steuernummer darf maximal 20 Zeichen lang sein")
    @Column(name = "tax_id", length = 20)
    private String taxId;

    @Size(max = 50, message = "Handelsregisternummer darf maximal 50 Zeichen lang sein")
    @Column(name = "registration_number", length = 50)
    private String registrationNumber;

    @Setter
    @Embedded
    @AttributeOverrides({
            @AttributeOverride(name = "street", column = @Column(name = "street", length = 100)),
            @AttributeOverride(name = "houseNumber", column = @Column(name = "house_number", length = 10)),
            @AttributeOverride(name = "postalCode", column = @Column(name = "postal_code", length = 5)),
            @AttributeOverride(name = "city", column = @Column(name = "city", length = 100)),
            @AttributeOverride(name = "country", column = @Column(name = "country", length = 50))
    })
    private Address address;

    @URL(message = "Ungültiges Website-Format")
    @Size(max = 255, message = "Website darf maximal 255 Zeichen lang sein")
    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Setter
    @Embedded
    @AttributeOverride(name = "latitude", column = @Column(name = "location_lat", columnDefinition = "NUMERIC(10,8)"))
    @AttributeOverride(name = "longitude", column = @Column(name = "location_lng", columnDefinition = "NUMERIC(11,8)"))
    private GeoLocation location;

    @Setter
    @Column(name = "work_radius_km")
    private Integer workRadiusKm;

    @Convert(converter = StringListConverter.class)
    @Column(name = "specializations", columnDefinition = "TEXT")
    private List<String> specializations = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(name = "industries", columnDefinition = "TEXT")
    private List<String> industries = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(name = "order_categories", columnDefinition = "TEXT")
    private List<String> orderCategories = new ArrayList<>();

    @Column(name = "is_auftraggeber", nullable = false)
    private Boolean isAuftraggeber = false;

    @Column(name = "is_auftragnehmer", nullable = false)
    private Boolean isAuftragnehmer = false;

    @NotNull(message = "Unternehmensstatus ist erforderlich")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private CompanyStatus status = CompanyStatus.PENDING;

    @Column(name = "verified", nullable = false)
    private Boolean verified = true;

    @Setter
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Setter
    @Column(name = "verified_by", columnDefinition = "uuid")
    private UUID verifiedBy;

    @Setter
    @Column(name = "employee_count")
    private Integer employeeCount;

    @Setter
    @Column(name = "founded_year")
    private Integer foundedYear;

    @Setter
    @Column(name = "annual_revenue")
    private Long annualRevenue;

    @Column(name = "vat_number", length = 20)
    private String vatNumber;

    @Column(name = "business_hours", length = 500)
    private String businessHours;

    @Column(name = "contact_email", length = 255)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "verification_document_url", length = 500)
    private String verificationDocumentUrl;

    @Convert(converter = StringListConverter.class)
    @Column(name = "certifications", columnDefinition = "TEXT")
    private List<String> certifications = new ArrayList<>();

    @Column(name = "insurance_coverage")
    private Boolean insuranceCoverage = false;

    @Setter
    @Column(name = "quality_score", columnDefinition = "NUMERIC(3,2)")
    private Double qualityScore;

    @Column(name = "completion_rate", columnDefinition = "NUMERIC(5,2)")
    private Double completionRate;

    @Setter
    @Column(name = "average_response_hours")
    private Integer averageResponseHours;

    /**
     * Default constructor for JPA.
     */
    public Company() {
        super();
    }

    /**
     * Constructor for creating a new company.
     *
     * @param name        company name
     * @param companyType legal form of the company
     */
    public Company(String name, CompanyType companyType) {
        super();
        setName(name);
        setCompanyType(companyType);
    }

    // Getters and Setters

    public void setName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Firmenname ist erforderlich");
        }
        this.name = name.trim();
    }

    public void setCompanyType(CompanyType companyType) {
        if (companyType == null) {
            throw new IllegalArgumentException("Unternehmensform ist erforderlich");
        }
        this.companyType = companyType;
    }

    public void setTaxId(String taxId) {
        this.taxId = taxId != null ? taxId.trim() : null;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber != null ? registrationNumber.trim() : null;
    }

    public void setWebsite(String website) {
        this.website = website != null ? website.trim() : null;
    }

    public void setDescription(String description) {
        this.description = description != null ? description.trim() : null;
    }

    public void setSpecializations(List<String> specializations) {
        this.specializations = StringListConverter.toMutableList(
                StringListConverter.cleanStringList(specializations));
    }

    public void setIndustries(List<String> industries) {
        this.industries = StringListConverter.toMutableList(
                StringListConverter.cleanStringList(industries));
    }

    public void setOrderCategories(List<String> orderCategories) {
        this.orderCategories = StringListConverter.toMutableList(
                StringListConverter.cleanStringList(orderCategories));
    }

    public void setIsAuftraggeber(Boolean isAuftraggeber) {
        this.isAuftraggeber = isAuftraggeber != null ? isAuftraggeber : false;
    }

    public void setIsAuftragnehmer(Boolean isAuftragnehmer) {
        this.isAuftragnehmer = isAuftragnehmer != null ? isAuftragnehmer : false;
    }

    public void setStatus(CompanyStatus status) {
        this.status = status != null ? status : CompanyStatus.PENDING;
    }

    public void setVerified(Boolean verified) {
        this.verified = verified != null ? verified : false;
    }

    public void setVatNumber(String vatNumber) {
        this.vatNumber = vatNumber != null ? vatNumber.trim() : null;
    }

    public void setBusinessHours(String businessHours) {
        this.businessHours = businessHours != null ? businessHours.trim() : null;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail != null ? contactEmail.trim() : null;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone != null ? contactPhone.trim() : null;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl != null ? logoUrl.trim() : null;
    }

    public void setVerificationDocumentUrl(String verificationDocumentUrl) {
        this.verificationDocumentUrl = verificationDocumentUrl != null ? verificationDocumentUrl.trim() : null;
    }

    public void setCertifications(List<String> certifications) {
        this.certifications = StringListConverter.toMutableList(
                StringListConverter.cleanStringList(certifications));
    }

    public void setInsuranceCoverage(Boolean insuranceCoverage) {
        this.insuranceCoverage = insuranceCoverage != null ? insuranceCoverage : false;
    }

    public void setCompletionRate(Double completionRate) {
        this.completionRate = completionRate;
    }

    // Business Methods

    /**
     * Verifies the company with admin approval.
     *
     * @param verifiedBy the admin user who verified the company
     */
    public void verify(UUID verifiedBy) {
        if (verifiedBy == null) {
            throw new IllegalArgumentException("Verifying user is required");
        }

        this.verified = true;
        this.verifiedAt = LocalDateTime.now();
        this.verifiedBy = verifiedBy;
        this.status = CompanyStatus.ACTIVE;
    }

    /**
     * Adds a specialization to the company if not already present.
     *
     * @param specialization the specialization to add
     */
    public void addSpecialization(String specialization) {
        if (specialization != null && !specialization.trim().isEmpty()) {
            String trimmed = specialization.trim();
            if (!this.specializations.contains(trimmed)) {
                this.specializations.add(trimmed);
            }
        }
    }

    /**
     * Removes a specialization from the company.
     *
     * @param specialization the specialization to remove
     */
    public void removeSpecialization(String specialization) {
        if (specialization != null) {
            this.specializations.remove(specialization.trim());
        }
    }

    /**
     * Adds an industry to the company if not already present.
     *
     * @param industry the industry to add
     */
    public void addIndustry(String industry) {
        if (industry != null && !industry.trim().isEmpty()) {
            String trimmed = industry.trim();
            if (!this.industries.contains(trimmed)) {
                this.industries.add(trimmed);
            }
        }
    }

    /**
     * Checks if the company can provide services to a customer at the given
     * location.
     *
     * @param customerLocation the customer's location
     * @return true if within work radius
     */
    public boolean isWithinWorkRadius(GeoLocation customerLocation) {
        if (this.location == null || customerLocation == null || this.workRadiusKm == null) {
            return false;
        }

        double distance = this.location.distanceToKm(customerLocation);
        return distance <= this.workRadiusKm;
    }

    /**
     * Checks if the company can create orders (is Auftraggeber).
     *
     * @return true if can create orders
     */
    public boolean canCreateOrders() {
        return Boolean.TRUE.equals(this.isAuftraggeber) && this.status.canCreateOrders();
    }

    /**
     * Checks if the company can provide services (is Auftragnehmer).
     *
     * @return true if can provide services
     */
    public boolean canProvideServices() {
        return Boolean.TRUE.equals(this.isAuftragnehmer) && this.status.canReceiveAssignments();
    }

    /**
     * Checks if the company is active and operational.
     *
     * @return true if company is active
     */
    public boolean isActive() {
        return this.status == CompanyStatus.ACTIVE;
    }

    /**
     * Checks if the company requires commercial registration.
     *
     * @return true if commercial registration is required
     */
    public boolean requiresCommercialRegistration() {
        return this.companyType.requiresCommercialRegistration();
    }

    /**
     * Gets the complete business role description.
     *
     * @return description of business roles
     */
    public String getBusinessRoleDescription() {
        if (Boolean.TRUE.equals(isAuftraggeber) && Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftraggeber und Auftragnehmer";
        } else if (Boolean.TRUE.equals(isAuftraggeber)) {
            return "Auftraggeber";
        } else if (Boolean.TRUE.equals(isAuftragnehmer)) {
            return "Auftragnehmer";
        }
        return "Rolle nicht definiert";
    }

    /**
     * Updates the company status if the transition is valid.
     *
     * @param newStatus the new status
     * @throws IllegalStateException if transition is not valid
     */
    public void updateStatus(CompanyStatus newStatus) {
        if (newStatus == null) {
            throw new IllegalArgumentException("Status cannot be null");
        }

        if (!this.status.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition from %s to %s", this.status, newStatus));
        }

        this.status = newStatus;
    }

    // ========== ROLE MANAGEMENT METHODS ==========

    /**
     * Checks if a business role can be added to this company.
     * <p>
     * A role can be added if:
     * - The company doesn't already have the role
     * - The company is in an active status that allows role modifications
     * </p>
     *
     * @param role the business role to check
     * @return true if the role can be added
     * @throws IllegalArgumentException if role is null
     */
    public boolean canAddRole(BusinessRole role) {
        if (role == null) {
            throw new IllegalArgumentException("Business role cannot be null");
        }

        // Check if the company is in a status that allows role modifications
        if (!this.status.canReceiveAssignments() && !this.status.canCreateOrders()) {
            return false;
        }

        // Check if role is not already assigned
        switch (role) {
            case AUFTRAGGEBER:
                return !Boolean.TRUE.equals(this.isAuftraggeber);
            case AUFTRAGNEHMER:
                return !Boolean.TRUE.equals(this.isAuftragnehmer);
            default:
                return false;
        }
    }

    /**
     * Adds a business role to this company with the provided role-specific data.
     * <p>
     * This method:
     * - Validates that the role can be added
     * - Updates the appropriate role flag
     * - Updates role-specific fields (especially for Auftragnehmer)
     * - Maintains data integrity and business rules
     * </p>
     *
     * @param role the business role to add
     * 
     * 
     * @throws IllegalArgumentException if role is null or request is invalid
     * @throws IllegalStateException    if role cannot be added or already exists
     */
    public void addBusinessRole(BusinessRole role, AddBusinessRoleRequest request) {
        if (role == null) {
            throw new IllegalArgumentException("Business role cannot be null");
        }

        if (request == null) {
            throw new IllegalArgumentException("Role addition request cannot be null");
        }

        if (!request.getRole().equals(role)) {
            throw new IllegalArgumentException("Request role must match the role being added");
        }

        // Validate that role can be added
        if (!canAddRole(role)) {
            throw new IllegalStateException(
                    String.format(
                            "Cannot add role %s: role already exists or company status doesn't allow modifications",
                            role.getDisplayName()));
        }

        // Validate request data for the specific role
        if (!request.isValidForRole()) {
            List<String> missingFields = request.getMissingRequiredFields();
            throw new IllegalArgumentException(
                    String.format("Invalid request for role %s. Missing required fields: %s",
                            role.getDisplayName(), String.join(", ", missingFields)));
        }

        // Add the role and update role-specific data
        switch (role) {
            case AUFTRAGGEBER:
                this.isAuftraggeber = true;
                // Auftraggeber role doesn't require additional specialization data
                // Just update contact information if provided
                updateContactInformation(request);
                break;
            case AUFTRAGNEHMER:
                this.isAuftragnehmer = true;
                // Update all Auftragnehmer-specific fields
                updateAuftragnehmberSpecificFields(request);
                updateContactInformation(request);
                break;
        }
    }

    /**
     * Updates Auftragnehmer-specific fields from the role addition request.
     * <p>
     * This method handles the business logic for updating specializations,
     * industries, and other AN-specific fields while maintaining data integrity.
     * </p>
     *
     * @param request the role addition request containing AN-specific data
     */
    private void updateAuftragnehmberSpecificFields(AddBusinessRoleRequest request) {
        // Update specializations - merge with existing ones to avoid duplicates
        if (request.getSpecializations() != null && !request.getSpecializations().isEmpty()) {
            List<String> cleanedSpecializations = StringListConverter.cleanStringList(request.getSpecializations());
            for (String specialization : cleanedSpecializations) {
                if (!this.specializations.contains(specialization)) {
                    this.specializations.add(specialization);
                }
            }
        }

        // Update industries - merge with existing ones to avoid duplicates
        if (request.getIndustries() != null && !request.getIndustries().isEmpty()) {
            List<String> cleanedIndustries = StringListConverter.cleanStringList(request.getIndustries());
            for (String industry : cleanedIndustries) {
                if (!this.industries.contains(industry)) {
                    this.industries.add(industry);
                }
            }
        }

        // Update order categories - merge with existing ones to avoid duplicates
        if (request.getOrderCategories() != null && !request.getOrderCategories().isEmpty()) {
            List<String> cleanedCategories = StringListConverter.cleanStringList(request.getOrderCategories());
            for (String category : cleanedCategories) {
                if (!this.orderCategories.contains(category)) {
                    this.orderCategories.add(category);
                }
            }
        }

        // Update work radius (replace existing value)
        if (request.getWorkRadiusKm() != null) {
            this.workRadiusKm = request.getWorkRadiusKm();
        }

        // Update company description (replace existing value)
        if (request.getDescription() != null && !request.getDescription().trim().isEmpty()) {
            this.description = request.getDescription().trim();
        }

        // Update employee count (replace existing value)
        if (request.getEmployeeCount() != null) {
            this.employeeCount = request.getEmployeeCount();
        }

        // Update business hours (replace existing value)
        if (request.getBusinessHours() != null && !request.getBusinessHours().trim().isEmpty()) {
            this.businessHours = request.getBusinessHours().trim();
        }

        // Update certifications - merge with existing ones to avoid duplicates
        if (request.getCertifications() != null && !request.getCertifications().isEmpty()) {
            List<String> cleanedCertifications = StringListConverter.cleanStringList(request.getCertifications());
            for (String certification : cleanedCertifications) {
                if (!this.certifications.contains(certification)) {
                    this.certifications.add(certification);
                }
            }
        }

        // Update verification document URL (replace existing value)
        if (request.getVerificationDocumentUrl() != null && !request.getVerificationDocumentUrl().trim().isEmpty()) {
            this.verificationDocumentUrl = request.getVerificationDocumentUrl().trim();
        }
    }

    /**
     * Updates contact information from the role addition request.
     * <p>
     * This method updates contact-related fields that are common to both roles.
     * </p>
     *
     * @param request the role addition request containing contact information
     */
    private void updateContactInformation(AddBusinessRoleRequest request) {
        // Update contact email (replace existing value)
        if (request.getContactPersonEmail() != null && !request.getContactPersonEmail().trim().isEmpty()) {
            this.contactEmail = request.getContactPersonEmail().trim();
        }

        // Update contact phone (replace existing value)
        if (request.getContactPersonPhone() != null && !request.getContactPersonPhone().trim().isEmpty()) {
            this.contactPhone = request.getContactPersonPhone().trim();
        }
    }

    /**
     * Validates that a role addition request contains all required data for the
     * specified role.
     * <p>
     * This method performs comprehensive validation to ensure data integrity
     * and business rule compliance before role addition.
     * </p>
     *
     * @param role    the business role being added
     * @param request the role addition request to validate
     * @throws IllegalArgumentException if validation fails
     */
    public void validateRoleAdditionRequest(BusinessRole role, AddBusinessRoleRequest request) {
        if (role == null) {
            throw new IllegalArgumentException("Business role cannot be null");
        }

        if (request == null) {
            throw new IllegalArgumentException("Role addition request cannot be null");
        }

        if (!request.getRole().equals(role)) {
            throw new IllegalArgumentException("Request role must match the role being validated");
        }

        // Check if role can be added
        if (!canAddRole(role)) {
            throw new IllegalArgumentException(
                    String.format(
                            "Cannot add role %s: role already exists or company status doesn't allow modifications",
                            role.getDisplayName()));
        }

        // Validate role-specific requirements
        if (!request.isValidForRole()) {
            List<String> missingFields = request.getMissingRequiredFields();
            throw new IllegalArgumentException(
                    String.format("Invalid request for role %s. Missing required fields: %s",
                            role.getDisplayName(), String.join(", ", missingFields)));
        }

        // Additional business rule validations
        if (role == BusinessRole.AUFTRAGNEHMER) {
            validateAuftragnehmberSpecificData(request);
        }
    }

    /**
     * Validates Auftragnehmer-specific data in the role addition request.
     * <p>
     * This method performs detailed validation of AN-specific fields
     * to ensure they meet business requirements.
     * </p>
     *
     * @param request the role addition request to validate
     * @throws IllegalArgumentException if validation fails
     */
    private void validateAuftragnehmberSpecificData(AddBusinessRoleRequest request) {
        // Validate work radius is within reasonable bounds
        if (request.getWorkRadiusKm() != null &&
                (request.getWorkRadiusKm() < 1 || request.getWorkRadiusKm() > 1000)) {
            throw new IllegalArgumentException("Work radius must be between 1 and 1000 km");
        }

        // Validate employee count is reasonable
        if (request.getEmployeeCount() != null &&
                (request.getEmployeeCount() < 1 || request.getEmployeeCount() > 100000)) {
            throw new IllegalArgumentException("Employee count must be between 1 and 100,000");
        }

        // Validate description length
        if (request.getDescription() != null && request.getDescription().length() > 600) {
            throw new IllegalArgumentException("Company description cannot exceed 600 characters");
        }

        // Validate that at least one specialization is provided
        if (request.getSpecializations() == null || request.getSpecializations().isEmpty()) {
            throw new IllegalArgumentException("At least one specialization is required for Auftragnehmer role");
        }

        // Validate that at least one industry is provided
        if (request.getIndustries() == null || request.getIndustries().isEmpty()) {
            throw new IllegalArgumentException("At least one industry is required for Auftragnehmer role");
        }
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Company company = (Company) o;
        return Objects.equals(getId(), company.getId());
    }

    @Override
    public int hashCode() {
        return Objects.hash(getId());
    }

    @Override
    public String toString() {
        return String.format("Company{id=%s, name='%s', type=%s, status=%s}",
                getId(), name, companyType, status);
    }

    /**
     * Checks if this company has an active Terms & Conditions document.
     * <p>
     * This is a business method that will be implemented via service layer
     * to avoid tight coupling between entities. The actual implementation
     * will query the TermsConditionsDocumentRepository.
     * </p>
     * 
     * @return true if the company has an active T&C document
     * @implNote This method returns false by default. The actual implementation
     *           should be provided by the service layer using the repository.
     */
    public boolean hasTermsConditions() {
        // This is a placeholder implementation
        // The actual logic will be implemented in the service layer
        // by querying:
        // termsConditionsDocumentRepository.existsActiveByCompanyId(this.getId())
        return false;
    }

    /**
     * Builder for creating Company instances.
     */
    public static class Builder {
        private String name;
        private CompanyType companyType;
        private String taxId;
        private String registrationNumber;
        private Address address;
        private String website;
        private String description;
        private GeoLocation location;
        private Integer workRadiusKm;
        private List<String> specializations = new ArrayList<>();
        private List<String> industries = new ArrayList<>();
        private List<String> orderCategories = new ArrayList<>();
        private Boolean isAuftraggeber = false;
        private Boolean isAuftragnehmer = false;
        private CompanyStatus status = CompanyStatus.PENDING;
        private String contactEmail;
        private String contactPhone;
        private String logoUrl;
        private String businessHours;
        private Integer employeeCount;
        private Integer foundedYear;
        private Long annualRevenue;
        private String vatNumber;
        private List<String> certifications = new ArrayList<>();
        private Boolean insuranceCoverage = false;
        private String verificationDocumentUrl;
        private Boolean isVerified;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder companyType(CompanyType companyType) {
            this.companyType = companyType;
            return this;
        }

        public Builder taxId(String taxId) {
            this.taxId = taxId;
            return this;
        }

        public Builder registrationNumber(String registrationNumber) {
            this.registrationNumber = registrationNumber;
            return this;
        }

        public Builder address(Address address) {
            this.address = address;
            return this;
        }

        public Builder website(String website) {
            this.website = website;
            return this;
        }

        public Builder description(String description) {
            this.description = description;
            return this;
        }

        public Builder location(GeoLocation location) {
            this.location = location;
            return this;
        }

        public Builder workRadiusKm(Integer workRadiusKm) {
            this.workRadiusKm = workRadiusKm;
            return this;
        }

        public Builder specializations(List<String> specializations) {
            this.specializations = specializations != null ? new ArrayList<>(specializations) : new ArrayList<>();
            return this;
        }

        public Builder industries(List<String> industries) {
            this.industries = industries != null ? new ArrayList<>(industries) : new ArrayList<>();
            return this;
        }

        public Builder orderCategories(List<String> orderCategories) {
            this.orderCategories = orderCategories != null ? new ArrayList<>(orderCategories) : new ArrayList<>();
            return this;
        }

        public Builder isAuftraggeber(Boolean isAuftraggeber) {
            this.isAuftraggeber = isAuftraggeber;
            return this;
        }

        public Builder isAuftragnehmer(Boolean isAuftragnehmer) {
            this.isAuftragnehmer = isAuftragnehmer;
            return this;
        }

        public Builder status(CompanyStatus status) {
            this.status = status;
            return this;
        }

        public Builder contactEmail(String contactEmail) {
            this.contactEmail = contactEmail;
            return this;
        }

        public Builder contactPhone(String contactPhone) {
            this.contactPhone = contactPhone;
            return this;
        }

        public Builder logoUrl(String logoUrl) {
            this.logoUrl = logoUrl;
            return this;
        }

        public Builder businessHours(String businessHours) {
            this.businessHours = businessHours;
            return this;
        }

        public Builder employeeCount(Integer employeeCount) {
            this.employeeCount = employeeCount;
            return this;
        }

        public Builder foundedYear(Integer foundedYear) {
            this.foundedYear = foundedYear;
            return this;
        }

        public Builder annualRevenue(Long annualRevenue) {
            this.annualRevenue = annualRevenue;
            return this;
        }

        public Builder vatNumber(String vatNumber) {
            this.vatNumber = vatNumber;
            return this;
        }

        public Builder certifications(List<String> certifications) {
            this.certifications = certifications != null ? new ArrayList<>(certifications) : new ArrayList<>();
            return this;
        }

        public Builder insuranceCoverage(Boolean insuranceCoverage) {
            this.insuranceCoverage = insuranceCoverage;
            return this;
        }

        public Builder verificationDocumentUrl(String verificationDocumentUrl) {
            this.verificationDocumentUrl = verificationDocumentUrl;
            return this;
        }

        public Builder verified(Boolean isVerified) {
            this.isVerified = isVerified;
            return this;
        }

        public Company build() {
            Company company = new Company(name, companyType);
            company.setTaxId(taxId);
            company.setRegistrationNumber(registrationNumber);
            company.setAddress(address);
            company.setWebsite(website);
            company.setDescription(description);
            company.setLocation(location);
            company.setWorkRadiusKm(workRadiusKm);
            company.setSpecializations(specializations);
            company.setIndustries(industries);
            company.setOrderCategories(orderCategories);
            company.setIsAuftraggeber(isAuftraggeber);
            company.setIsAuftragnehmer(isAuftragnehmer);
            company.setStatus(status);
            company.setContactEmail(contactEmail);
            company.setContactPhone(contactPhone);
            company.setLogoUrl(logoUrl);
            company.setBusinessHours(businessHours);
            company.setEmployeeCount(employeeCount);
            company.setFoundedYear(foundedYear);
            company.setAnnualRevenue(annualRevenue);
            company.setVatNumber(vatNumber);
            company.setCertifications(certifications);
            company.setInsuranceCoverage(insuranceCoverage);
            company.setVerificationDocumentUrl(verificationDocumentUrl);
            company.setVerified(isVerified);
            return company;
        }
    }

    /**
     * Creates a new builder instance.
     *
     * @return new Builder instance
     */
    public static Builder builder() {
        return new Builder();
    }
}