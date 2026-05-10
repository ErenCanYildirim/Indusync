package com.indusync.indusync_backend.shared.domain.events;

import com.indusync.indusync_backend.shared.domain.enums.AccountType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Domain event fired when a new user is registered.
 * <p>
 * This event is used for cross-module communication, particularly
 * to trigger company creation for business users without creating
 * direct dependencies between modules.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public record UserRegisteredEvent(
        // === Core User Data ===
        UUID userId,
        String email,
        AccountType accountType,
        String firstName,
        String lastName,
        String phone,
        String website,

        // === Basic Company Data ===
        String companyName,
        String companyType,
        String taxId,
        String registrationNumber,

        // === Address Data ===
        String street,
        String houseNumber,
        String postalCode,
        String city,
        String country,

        // === Location Data ===
        Double latitude,
        Double longitude,

        // === Business-specific Data ===
        Integer workRadiusKm,
        List<String> specializations,
        List<String> industries,
        List<String> orderCategories,
        String description,

        // === Role Flags ===
        Boolean companyTypeAuftraggeber,
        Boolean companyTypeAuftragnehmer,

        // === Auftragnehmer-specific Data ===
        String companyDetailsName,
        String companyAddress,
        String companyPostalCode,
        String companyCity,
        String workRadius,
        String countrySelection,
        Integer contactPersonCount,
        String contactPersonName,
        String contactDepartment,
        String contactEmail,
        String contactPhone,
        Integer employeeCount,
        String companyDescription,
        String companyVerificationFile,
        String companyCertificatesFile,

        // === User Preferences ===
        Boolean emailNotifications,
        List<String> interests,
        String referralSource,

        // === Metadata ===
        LocalDateTime registeredAt) {

    /**
     * Creates a user registered event with validation.
     */
    public UserRegisteredEvent {
        if (userId == null) {
            throw new IllegalArgumentException("User ID cannot be null");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("Email cannot be null or empty");
        }
        if (accountType == null) {
            throw new IllegalArgumentException("Account type cannot be null");
        }
        if (registeredAt == null) {
            registeredAt = LocalDateTime.now();
        }
    }

    /**
     * Checks if this event is for a business user.
     *
     * @return true if account type is BUSINESS
     */
    public boolean isBusinessUser() {
        return accountType == AccountType.BUSINESS;
    }

    /**
     * Checks if this is an Auftragnehmer registration.
     *
     * @return true if user selected Auftragnehmer role
     */
    public boolean isAuftragnehmer() {
        return Boolean.TRUE.equals(companyTypeAuftragnehmer);
    }

    /**
     * Checks if this is an Auftraggeber registration.
     *
     * @return true if user selected Auftraggeber role
     */
    public boolean isAuftraggeber() {
        return Boolean.TRUE.equals(companyTypeAuftraggeber);
    }

    /**
     * Checks if user selected both roles.
     *
     * @return true if both Auftraggeber and Auftragnehmer
     */
    public boolean isBothRoles() {
        return isAuftraggeber() && isAuftragnehmer();
    }

    /**
     * Gets the event type identifier.
     *
     * @return event type
     */
    public String getEventType() {
        return "UserRegistered";
    }

    /**
     * Creates an event for a personal user registration.
     *
     * @param userId             the user ID
     * @param email              the user's email
     * @param firstName          the user's first name
     * @param lastName           the user's last name
     * @param phone              the user's phone
     * @param website            the user's website
     * @param emailNotifications email notification preference
     * @param interests          user interests
     * @param referralSource     how user found the platform
     * @return user registered event
     */
    public static UserRegisteredEvent forPersonalUser(
            UUID userId, String email, String firstName, String lastName,
            String phone, String website, Boolean emailNotifications,
            List<String> interests, String referralSource) {
        return new UserRegisteredEvent(
                // Core user data
                userId, email, AccountType.PERSONAL, firstName, lastName, phone, website,
                // Basic company data (null for personal users)
                null, null, null, null,
                // Address data (null for personal users)
                null, null, null, null, null,
                // Location data
                null, null,
                // Business-specific data (null for personal users)
                null, null, null, null, null,
                // Role flags (null for personal users)
                null, null,
                // Auftragnehmer-specific data (null for personal users)
                null, null, null, null, null, null, null, null, null, null, null, null, null, null, null,
                // User preferences
                emailNotifications, interests, referralSource,
                // Metadata
                LocalDateTime.now());
    }

    /**
     * Creates an event for a business user registration with complete data.
     *
     * @param userId                   the user ID
     * @param email                    the user's email
     * @param firstName                the user's first name
     * @param lastName                 the user's last name
     * @param phone                    the user's phone
     * @param website                  the user's website
     * @param companyName              the desired company name
     * @param companyType              the desired company type
     * @param taxId                    company tax ID
     * @param registrationNumber       company registration number
     * @param street                   address street
     * @param houseNumber              address house number
     * @param postalCode               address postal code
     * @param city                     address city
     * @param country                  address country
     * @param latitude                 location latitude
     * @param longitude                location longitude
     * @param workRadiusKm             work radius in kilometers
     * @param specializations          company specializations
     * @param industries               company industries
     * @param orderCategories          order categories
     * @param description              company description
     * @param companyTypeAuftraggeber  is Auftraggeber
     * @param companyTypeAuftragnehmer is Auftragnehmer
     * @param companyDetailsName       detailed company name
     * @param companyAddress           company headquarters address
     * @param companyPostalCode        company postal code
     * @param companyCity              company city
     * @param workRadius               work radius string
     * @param countrySelection         country selection
     * @param contactPersonCount       number of contact persons
     * @param contactPersonName        contact person name
     * @param contactDepartment        contact department
     * @param contactEmail             contact email
     * @param contactPhone             contact phone
     * @param employeeCount            number of employees
     * @param companyDescription       detailed company description
     * @param companyVerificationFile  verification document
     * @param companyCertificatesFile  certificates document
     * @param emailNotifications       email notification preference
     * @param interests                user interests
     * @param referralSource           how user found the platform
     * @return user registered event
     */
    public static UserRegisteredEvent forBusinessUser(
            UUID userId, String email, String firstName, String lastName,
            String phone, String website, String companyName, String companyType,
            String taxId, String registrationNumber, String street, String houseNumber,
            String postalCode, String city, String country, Double latitude, Double longitude,
            Integer workRadiusKm, List<String> specializations, List<String> industries,
            List<String> orderCategories, String description, Boolean companyTypeAuftraggeber,
            Boolean companyTypeAuftragnehmer, String companyDetailsName, String companyAddress,
            String companyPostalCode, String companyCity, String workRadius, String countrySelection,
            Integer contactPersonCount, String contactPersonName, String contactDepartment,
            String contactEmail, String contactPhone, Integer employeeCount,
            String companyDescription, String companyVerificationFile, String companyCertificatesFile,
            Boolean emailNotifications, List<String> interests, String referralSource) {
        return new UserRegisteredEvent(
                // Core user data
                userId, email, AccountType.BUSINESS, firstName, lastName, phone, website,
                // Basic company data
                companyName, companyType, taxId, registrationNumber,
                // Address data
                street, houseNumber, postalCode, city, country,
                // Location data
                latitude, longitude,
                // Business-specific data
                workRadiusKm, specializations, industries, orderCategories, description,
                // Role flags
                companyTypeAuftraggeber, companyTypeAuftragnehmer,
                // Auftragnehmer-specific data
                companyDetailsName, companyAddress, companyPostalCode, companyCity, workRadius,
                countrySelection, contactPersonCount, contactPersonName, contactDepartment,
                contactEmail, contactPhone, employeeCount, companyDescription,
                companyVerificationFile, companyCertificatesFile,
                // User preferences
                emailNotifications, interests, referralSource,
                // Metadata
                LocalDateTime.now());
    }

    /**
     * Simplified factory method for basic business user registration.
     * For backward compatibility with existing code.
     */
    public static UserRegisteredEvent forBusinessUser(UUID userId, String email,
            String firstName, String lastName, String phone, String website,
            String companyName, String companyType) {
        return forBusinessUser(
                userId, email, firstName, lastName, phone, website, companyName, companyType,
                // taxId, registrationNumber, street, houseNumber, postalCode, city, country
                null, null, null, null, null, null, null,
                // latitude, longitude, workRadiusKm, specializations, industries,
                // orderCategories, description
                null, null, null, null, null, null, null,
                // companyTypeAuftraggeber, companyTypeAuftragnehmer, companyDetailsName,
                // companyAddress, companyPostalCode, companyCity, workRadius
                null, null, null, null, null, null, null,
                // countrySelection, contactPersonCount, contactPersonName, contactDepartment,
                // contactEmail, contactPhone, employeeCount
                null, null, null, null, null, null, null,
                // companyDescription, companyVerificationFile, companyCertificatesFile,
                // emailNotifications, interests, referralSource
                null, null, null, null, null, null);
    }
}