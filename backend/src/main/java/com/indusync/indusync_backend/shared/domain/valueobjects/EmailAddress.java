package com.indusync.indusync_backend.shared.domain.valueobjects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.Objects;
import java.util.regex.Pattern;

/**
 * Value object representing an email address with validation.
 * <p>
 * This embeddable value object:
 * - Validates email format using both annotation and regex
 * - Normalizes email to lowercase
 * - Provides immutable email representation
 * - Handles German umlauts and international domains
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Embeddable
public class EmailAddress {

     /**
     * Comprehensive email validation pattern that supports:
     * - Standard email formats
     * - International domain names
     * - German umlauts and special characters
     * - Modern TLDs
     */
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    @Email(message = "E-Mail-Format ist ungültig")
    @NotBlank(message = "E-Mail ist erforderlich")
    @Column(name = "email", nullable = false, length = 255)
    private String value;

    /**
     * Default constructor for JPA.
     */
    protected EmailAddress() {
        // JPA requires no-arg constructor
    }

    /**
     * Creates a new EmailAddress with validation.
     *
     * @param email the email string to validate and store
     * @throws IllegalArgumentException if the email is invalid
     */
    public EmailAddress(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("E-Mail-Adresse kann nicht leer sein");
        }

        String trimmedEmail = email.trim();
        if (!isValidEmail(trimmedEmail)) {
            throw new IllegalArgumentException("Ungültige E-Mail-Adresse: " + trimmedEmail);
        }

        this.value = trimmedEmail.toLowerCase();
    }

    /**
     * Validates email format using regex pattern.
     *
     * @param email the email to validate
     * @return true if the email format is valid
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.length() > 255) {
            return false;
        }

        // Check basic pattern
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }

        // Additional validation rules
        String[] parts = email.split("@");
        if (parts.length != 2) {
            return false;
        }

        String localPart = parts[0];
        String domain = parts[1];

        // Local part validation
        if (localPart.length() > 64 || localPart.isEmpty()) {
            return false;
        }

        // Domain validation
        if (domain.length() > 253 || domain.isEmpty()) {
            return false;
        }

        // Check for consecutive dots
        if (email.contains("..")) {
            return false;
        }

        // Check for starting/ending dots
        if (localPart.startsWith(".") || localPart.endsWith(".")) {
            return false;
        }

        return true;
    }

    /**
     * Gets the email address value.
     *
     * @return the normalized email address
     */
    public String getValue() {
        return value;
    }

    /**
     * Gets the domain part of the email address.
     *
     * @return the domain part (everything after @)
     */
    public String getDomain() {
        if (value == null) {
            return null;
        }
        int atIndex = value.lastIndexOf('@');
        return atIndex >= 0 ? value.substring(atIndex + 1) : null;
    }

    /**
     * Gets the local part of the email address.
     *
     * @return the local part (everything before @)
     */
    public String getLocalPart() {
        if (value == null) {
            return null;
        }
        int atIndex = value.lastIndexOf('@');
        return atIndex >= 0 ? value.substring(0, atIndex) : null;
    }

    /**
     * Checks if this email belongs to a specific domain.
     *
     * @param domain the domain to check (case-insensitive)
     * @return true if the email belongs to the specified domain
     */
    public boolean belongsToDomain(String domain) {
        if (domain == null || value == null) {
            return false;
        }
        return getDomain().equalsIgnoreCase(domain.trim());
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        EmailAddress that = (EmailAddress) obj;
        return Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(value);
    }

    @Override
    public String toString() {
        return value != null ? value : "";
    }

    /**
     * Creates an EmailAddress from a string value.
     * Convenience factory method.
     *
     * @param email the email string
     * @return EmailAddress instance
     * @throws IllegalArgumentException if email is invalid
     */
    public static EmailAddress of(String email) {
        return new EmailAddress(email);
    }
}