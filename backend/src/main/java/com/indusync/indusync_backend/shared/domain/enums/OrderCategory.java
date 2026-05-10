package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Order categories in the IndusSync platform.
 * Represents different types of industrial services that can be ordered.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum OrderCategory {

    // === Main Industrial Services ===
    MECHANICAL_ENGINEERING("Maschinenbau", "Mechanische Wartung und Reparaturen"),
    ELECTRICAL_WORK("Elektrotechnik", "Elektrische Installationen und Wartungen"),
    PLUMBING("Sanitärtechnik", "Rohrleitungen und Sanitäranlagen"),
    HVAC("Heizung/Lüftung/Klima", "Klimaanlagen und Heizungssysteme"),
    INDUSTRIAL_CLEANING("Industriereinigung", "Spezielle Reinigungsarbeiten"),

    // === Construction & Building ===
    CONSTRUCTION("Bauwesen", "Bauarbeiten und Renovierungen"),
    WELDING("Schweißarbeiten", "Metallverbindungen und Reparaturen"),
    PAINTING("Malerei/Beschichtung", "Oberflächenbehandlung und Schutz"),
    INSULATION("Isolierung", "Wärme- und Schalldämmung"),

    // === Technical Services ===
    AUTOMATION("Automatisierung", "Steuerungs- und Regelungstechnik"),
    INSTRUMENTATION("Messtechnik", "Mess- und Prüfgeräte"),
    MAINTENANCE("Instandhaltung", "Vorbeugende und korrektive Wartung"),
    SAFETY_INSPECTION("Sicherheitsprüfung", "Sicherheits- und Compliance-Checks"),

    // === Specialized Services ===
    CRANE_OPERATION("Kranservice", "Hebe- und Transportarbeiten"),
    SCAFFOLDING("Gerüstbau", "Arbeitsgerüste und Absturzsicherung"),
    CONFINED_SPACE("Behälterarbeiten", "Arbeiten in engen Räumen"),
    HEIGHT_WORK("Höhenarbeiten", "Arbeiten in der Höhe"),

    // === Emergency & Special ===
    EMERGENCY_REPAIR("Notfallreparatur", "Dringende Reparaturarbeiten"),
    SHUTDOWN_MAINTENANCE("Stillstandsarbeiten", "Wartung während Anlagenstillstand"),

    // === General ===
    CONSULTING("Beratung", "Technische Beratungsdienstleistungen"),
    OTHER("Sonstiges", "Andere nicht aufgeführte Dienstleistungen");

    private final String displayName;
    private final String description;

    /**
     * Constructor for OrderCategory enum.
     *
     * @param displayName German display name
     * @param description brief description of the category
     */
    OrderCategory(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * Gets the German display name for this category.
     *
     * @return German display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the description for this category.
     *
     * @return category description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Checks if this category requires special safety considerations.
     *
     * @return true if category involves high-risk work
     */
    public boolean isHighRiskCategory() {
        return this == CONFINED_SPACE ||
                this == HEIGHT_WORK ||
                this == WELDING ||
                this == ELECTRICAL_WORK ||
                this == CRANE_OPERATION ||
                this == EMERGENCY_REPAIR;
    }

    /**
     * Checks if this category typically requires emergency response.
     *
     * @return true if category is emergency-related
     */
    public boolean isEmergencyCategory() {
        return this == EMERGENCY_REPAIR ||
                this == SHUTDOWN_MAINTENANCE;
    }

    /**
     * Gets the category from a display name.
     *
     * @param displayName the German display name
     * @return matching OrderCategory or OTHER if not found
     */
    public static OrderCategory fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return OTHER;
        }

        for (OrderCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(displayName.trim())) {
                return category;
            }
        }
        return OTHER;
    }

    /**
     * Enhanced string representation including display name.
     */
    @Override
    public String toString() {
        return String.format("%s (%s)", name(), displayName);
    }
}