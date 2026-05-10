package com.indusync.indusync_backend.shared.domain.valueobjects;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Objects;

/**
 * Value object representing a German address.
 * <p>
 * This embeddable value object handles German address formats including:
 * - Street names with proper German characters
 * - House numbers (including formats like "12a", "15-17")
 * - German postal codes (5 digits)
 * - City names with German characters
 * - Country (defaulting to Germany)
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Embeddable
@JsonIgnoreProperties(ignoreUnknown = true)
public class Address {

    @NotBlank(message = "Straße ist erforderlich")
    @Size(max = 100, message = "Straße darf maximal 100 Zeichen lang sein")
    @Column(name = "street", length = 100)
    private String street;

    @NotBlank(message = "Hausnummer ist erforderlich")
    @Size(max = 10, message = "Hausnummer darf maximal 10 Zeichen lang sein")
    @Column(name = "house_number", length = 10)
    private String houseNumber;

    @NotBlank(message = "Postleitzahl ist erforderlich")
    @Pattern(regexp = "^[0-9]{5}$", message = "Postleitzahl muss 5 Ziffern haben")
    @Column(name = "postal_code", length = 5)
    private String postalCode;

    @NotBlank(message = "Stadt ist erforderlich")
    @Size(max = 100, message = "Stadt darf maximal 100 Zeichen lang sein")
    @Column(name = "city", length = 100)
    private String city;

    @Size(max = 50, message = "Land darf maximal 50 Zeichen lang sein")
    @Column(name = "country", length = 50)
    private String country = "Deutschland";

    /**
     * Default constructor for JPA.
     */
    protected Address() {
    }

    /**
     * Creates a new Address with all required fields.
     *
     * @param street      the street name
     * @param houseNumber the house number
     * @param postalCode  the postal code (5 digits)
     * @param city        the city name
     */
    public Address(String street, String houseNumber, String postalCode, String city) {
        this(street, houseNumber, postalCode, city, "Deutschland");
    }

    /**
     * Creates a new Address with all fields including country.
     *
     * @param street      the street name
     * @param houseNumber the house number
     * @param postalCode  the postal code
     * @param city        the city name
     * @param country     the country name
     */
    public Address(String street, String houseNumber, String postalCode, String city, String country) {
        this.street = validateAndTrimString(street, "Straße");
        this.houseNumber = validateAndTrimString(houseNumber, "Hausnummer");
        this.postalCode = validateAndTrimString(postalCode, "Postleitzahl");
        this.city = validateAndTrimString(city, "Stadt");
        this.country = country != null ? country.trim() : "Deutschland";

        validatePostalCode();
    }

    private String validateAndTrimString(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " ist erforderlich");
        }
        return value.trim();
    }

    private void validatePostalCode() {
        if (!this.postalCode.matches("^[0-9]{5}$")) {
            throw new IllegalArgumentException("Postleitzahl muss 5 Ziffern haben: " + this.postalCode);
        }
    }

    /**
     * Gets the street name.
     *
     * @return the street name
     */
    public String getStreet() {
        return street;
    }

    /**
     * Gets the house number.
     *
     * @return the house number
     */
    public String getHouseNumber() {
        return houseNumber;
    }

    /**
     * Gets the postal code.
     *
     * @return the postal code
     */
    public String getPostalCode() {
        return postalCode;
    }

    /**
     * Gets the city name.
     *
     * @return the city name
     */
    public String getCity() {
        return city;
    }

    /**
     * Gets the country.
     *
     * @return the country name
     */
    public String getCountry() {
        return country;
    }

    /**
     * Gets the full street address (street + house number).
     *
     * @return formatted street address
     */
    public String getFullStreetAddress() {
        return street + " " + houseNumber;
    }

    /**
     * Gets the formatted full address.
     *
     * @return complete formatted address
     */
    public String getFormattedAddress() {
        return String.format("%s %s, %s %s, %s",
                street, houseNumber, postalCode, city, country);
    }

    /**
     * Gets a compact address format (without country if Germany).
     *
     * @return compact formatted address
     */
    public String getCompactAddress() {
        if ("Deutschland".equals(country)) {
            return String.format("%s %s, %s %s", street, houseNumber, postalCode, city);
        }
        return getFormattedAddress();
    }

    /**
     * Checks if this address is in Germany.
     *
     * @return true if country is Germany
     */
    @JsonIgnore
    public boolean isInGermany() {
        return "Deutschland".equals(country) || "Germany".equalsIgnoreCase(country);
    }

    /**
     * Gets the German state (Bundesland) based on postal code.
     * This is a simplified mapping for common postal code ranges.
     *
     * @return the German state name, or "Unbekannt" if cannot be determined
     */
    public String getGermanState() {
        if (!isInGermany()) {
            return "Nicht Deutschland";
        }

        int postalCodeInt;
        try {
            postalCodeInt = Integer.parseInt(postalCode);
        } catch (NumberFormatException e) {
            return "Unbekannt";
        }

        return switch (postalCodeInt / 10000) {
            case 0 -> switch (postalCodeInt / 1000) {
                case 0 -> "Sachsen"; // 01xxx
                case 1 -> "Brandenburg"; // 01xxx - 19xxx
                default -> "Ostdeutschland";
            };
            case 2 -> "Hamburg/Schleswig-Holstein";
            case 3 -> "Niedersachsen";
            case 4 -> "Nordrhein-Westfalen";
            case 5 -> "Nordrhein-Westfalen";
            case 6 -> "Hessen";
            case 7 -> "Baden-Württemberg";
            case 8 -> "Bayern";
            case 9 -> "Bayern/Thüringen";
            default -> "Unbekannt";
        };
    }

    /**
     * Checks if the postal code is valid for the specified German state.
     *
     * @param expectedState the expected German state
     * @return true if postal code matches the state
     */
    public boolean isValidForState(String expectedState) {
        return expectedState.equals(getGermanState());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Address address = (Address) o;
        return Objects.equals(street, address.street) &&
                Objects.equals(houseNumber, address.houseNumber) &&
                Objects.equals(postalCode, address.postalCode) &&
                Objects.equals(city, address.city) &&
                Objects.equals(country, address.country);
    }

    @Override
    public int hashCode() {
        return Objects.hash(street, houseNumber, postalCode, city, country);
    }

    @Override
    public String toString() {
        return getFormattedAddress();
    }

    /**
     * Builder for creating Address instances.
     */
    public static class Builder {
        private String street;
        private String houseNumber;
        private String postalCode;
        private String city;
        private String country = "Deutschland";

        public Builder street(String street) {
            this.street = street;
            return this;
        }

        public Builder houseNumber(String houseNumber) {
            this.houseNumber = houseNumber;
            return this;
        }

        public Builder postalCode(String postalCode) {
            this.postalCode = postalCode;
            return this;
        }

        public Builder city(String city) {
            this.city = city;
            return this;
        }

        public Builder country(String country) {
            this.country = country;
            return this;
        }

        public Address build() {
            return new Address(street, houseNumber, postalCode, city, country);
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