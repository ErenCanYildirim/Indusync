package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Urgency levels for orders in the IndusSync platform.
 * Represents different priority levels for order processing and matching.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum Urgency {
    
    LOW("Niedrig", "Keine besonderen Zeitanforderungen", 7),
    MEDIUM("Normal", "Standardprioritätsbehandlung", 3),
    HIGH("Hoch", "Hohe Priorität, zeitkritisch", 1),
    URGENT("Dringend", "Sofortige Bearbeitung erforderlich", 0);

    private final String displayName;
    private final String description;
    private final int responseTimeHours;

    /**
     * Constructor for Urgency enum.
     *
     * @param displayName German display name
     * @param description brief description of the urgency level
     * @param responseTimeHours expected response time in hours
     */
    Urgency(String displayName, String description, int responseTimeHours) {
        this.displayName = displayName;
        this.description = description;
        this.responseTimeHours = responseTimeHours;
    }

    /**
     * Gets the German display name for this urgency level.
     *
     * @return German display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the description for this urgency level.
     *
     * @return urgency description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Gets the expected response time in hours.
     *
     * @return response time in hours
     */
    public int getResponseTimeHours() {
        return responseTimeHours;
    }

    /**
     * Checks if this urgency level requires immediate attention.
     *
     * @return true if urgency is high or urgent
     */
    public boolean isHighPriority() {
        return this == HIGH || this == URGENT;
    }

    /**
     * Checks if this urgency level requires emergency handling.
     *
     * @return true if urgency is urgent
     */
    public boolean isEmergency() {
        return this == URGENT;
    }

    /**
     * Gets the urgency level from a display name.
     *
     * @param displayName the German display name
     * @return matching Urgency or MEDIUM if not found
     */
    public static Urgency fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return MEDIUM;
        }
        
        for (Urgency urgency : values()) {
            if (urgency.displayName.equalsIgnoreCase(displayName.trim())) {
                return urgency;
            }
        }
        return MEDIUM;
    }

    /**
     * Gets urgency level from response time configuration.
     *
     * @param responseTime response time string from frontend
     * @return appropriate urgency level
     */
    public static Urgency fromResponseTime(String responseTime) {
        if (responseTime == null || responseTime.trim().isEmpty()) {
            return MEDIUM;
        }
        
        String normalizedTime = responseTime.toLowerCase().trim();
        
        if (normalizedTime.contains("sofort") || normalizedTime.contains("notfall") || 
            normalizedTime.contains("dringend") || normalizedTime.equals("1")) {
            return URGENT;
        } else if (normalizedTime.contains("1-3") || normalizedTime.contains("schnell") ||
                   normalizedTime.equals("3")) {
            return HIGH;
        } else if (normalizedTime.contains("1-7") || normalizedTime.contains("woche") ||
                   normalizedTime.equals("7")) {
            return MEDIUM;
        } else {
            return LOW;
        }
    }

    /**
     * Enhanced string representation including display name and response time.
     */
    @Override
    public String toString() {
        return String.format("%s (%s, %dh)", name(), displayName, responseTimeHours);
    }
} 