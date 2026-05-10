package com.indusync.indusync_backend.shared.domain.valueobjects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Getter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Objects;

/**
 * Value object representing a geographic location with latitude and longitude.
 * <p>
 * This embeddable value object:
 * - Stores coordinates with high precision (8 decimal places for latitude, 11
 * for longitude)
 * - Provides distance calculation using the Haversine formula
 * - Validates coordinate ranges (latitude: -90 to 90, longitude: -180 to 180)
 * - Supports German geographic context
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
@Embeddable
public class GeoLocation {

    
    /**
     * Earth's radius in kilometers for distance calculations.
     */
    private static final double EARTH_RADIUS_KM = 6371.0;

    /**
     * Maximum valid latitude value.
     */
    private static final double MAX_LATITUDE = 90.0;

    /**
     * Minimum valid latitude value.
     */
    private static final double MIN_LATITUDE = -90.0;

    /**
     * Maximum valid longitude value.
     */
    private static final double MAX_LONGITUDE = 180.0;

    /**
     * Minimum valid longitude value.
     */
    private static final double MIN_LONGITUDE = -180.0;

    /**
     * -- GETTER --
     * Gets the latitude coordinate.
     *
     * @return the latitude
     */
    @Column(name = "latitude", columnDefinition = "NUMERIC(10,8)")
    private BigDecimal latitude;

    /**
     * -- GETTER --
     * Gets the longitude coordinate.
     *
     * @return the longitude
     */
    @Column(name = "longitude", columnDefinition = "NUMERIC(11,8)")
    private BigDecimal longitude;

    /**
     * Default constructor for JPA.
     */
    protected GeoLocation() {
        // JPA requires no-arg constructor
    }

    /**
     * Creates a new GeoLocation with validation.
     *
     * @param latitude  the latitude coordinate
     * @param longitude the longitude coordinate
     * @throws IllegalArgumentException if coordinates are invalid
     */
    public GeoLocation(BigDecimal latitude, BigDecimal longitude) {
        validateCoordinates(latitude, longitude);
        this.latitude = latitude;
        this.longitude = longitude;
    }

    /**
     * Creates a new GeoLocation from double values.
     *
     * @param latitude  the latitude coordinate
     * @param longitude the longitude coordinate
     * @throws IllegalArgumentException if coordinates are invalid
     */
    public GeoLocation(double latitude, double longitude) {
        this(
                BigDecimal.valueOf(latitude).setScale(8, RoundingMode.HALF_UP),
                BigDecimal.valueOf(longitude).setScale(8, RoundingMode.HALF_UP));
    }

    /**
     * Validates coordinate values.
     *
     * @param latitude  the latitude to validate
     * @param longitude the longitude to validate
     * @throws IllegalArgumentException if coordinates are invalid
     */
    private void validateCoordinates(BigDecimal latitude, BigDecimal longitude) {
        if (latitude == null || longitude == null) {
            throw new IllegalArgumentException("Breitengrad und Längengrad dürfen nicht null sein");
        }

        double latValue = latitude.doubleValue();
        double lonValue = longitude.doubleValue();

        if (latValue < MIN_LATITUDE || latValue > MAX_LATITUDE) {
            throw new IllegalArgumentException(
                    String.format("Breitengrad muss zwischen %f und %f liegen, aber war: %f",
                            MIN_LATITUDE, MAX_LATITUDE, latValue));
        }

        if (lonValue < MIN_LONGITUDE || lonValue > MAX_LONGITUDE) {
            throw new IllegalArgumentException(
                    String.format("Längengrad muss zwischen %f und %f liegen, aber war: %f",
                            MIN_LONGITUDE, MAX_LONGITUDE, lonValue));
        }
    }

    /**
     * Calculates the distance to another GeoLocation using the Haversine formula.
     *
     * @param other the other location
     * @return the distance in kilometers
     * @throws IllegalArgumentException if other location is null
     * 
     */
    public double distanceToKm(GeoLocation other) {
        if (other == null) {
            throw new IllegalArgumentException("Andere Position darf nicht null sein");
        }

        if (this.equals(other)) {
            return 0.0;
        }

        double lat1Rad = Math.toRadians(this.latitude.doubleValue());
        double lat2Rad = Math.toRadians(other.latitude.doubleValue());
        double deltaLatRad = Math.toRadians(other.latitude.subtract(this.latitude).doubleValue());
        double deltaLonRad = Math.toRadians(other.longitude.subtract(this.longitude).doubleValue());

        double a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
                Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                        Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return EARTH_RADIUS_KM * c;
    }

    /**
     * Calculates the distance to another GeoLocation in meters.
     *
     * @param other the other location
     * @return the distance in meters
     */
    public double distanceToMeters(GeoLocation other) {
        return distanceToKm(other) * 1000.0;
    }

    /**
     * Checks if this location is within the specified radius of another location.
     *
     * @param other    the center location
     * @param radiusKm the radius in kilometers
     * @return true if within the radius
     */
    public boolean isWithinRadius(GeoLocation other, double radiusKm) {
        if (other == null || radiusKm < 0) {
            return false;
        }
        return distanceToKm(other) <= radiusKm;
    }

    /**
     * Checks if this location is in Germany (approximate bounds).
     * This is a rough approximation for business logic.
     *
     * @return true if likely in Germany
     */
    public boolean isInGermany() {
        if (latitude == null || longitude == null) {
            return false;
        }

        double lat = latitude.doubleValue();
        double lon = longitude.doubleValue();

        // Approximate bounds for Germany
        return lat >= 47.27 && lat <= 55.1 && lon >= 5.87 && lon <= 15.04;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj)
            return true;
        if (obj == null || getClass() != obj.getClass())
            return false;
        GeoLocation that = (GeoLocation) obj;
        return Objects.equals(latitude, that.latitude) && Objects.equals(longitude, that.longitude);
    }

    @Override
    public int hashCode() {
        return Objects.hash(latitude, longitude);
    }

    @Override
    public String toString() {
        return String.format("GeoLocation{lat=%s, lon=%s}", latitude, longitude);
    }

    /**
     * Creates a GeoLocation from double values.
     * Convenience factory method.
     *
     * @param latitude  the latitude
     * @param longitude the longitude
     * @return GeoLocation instance
     */
    public static GeoLocation of(double latitude, double longitude) {
        return new GeoLocation(latitude, longitude);
    }

    /**
     * Creates a GeoLocation from BigDecimal values.
     * Convenience factory method.
     *
     * @param latitude  the latitude
     * @param longitude the longitude
     * @return GeoLocation instance
     */
    public static GeoLocation of(BigDecimal latitude, BigDecimal longitude) {
        return new GeoLocation(latitude, longitude);
    }
}