package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Placement types for orders in the IndusSync platform.
 * Represents different types of work arrangements and deployment models.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum PlacementType {

    // === Direct Placement ===
    DIRECT_PLACEMENT("Direktvermittlung", "Direkte Vermittlung von Fachkräften"),
    TEMPORARY_PLACEMENT("Zeitarbeit", "Befristete Arbeitnehmerüberlassung"),

    // === Contract Work ===
    PROJECT_CONTRACT("Werkvertrag", "Projektorientierte Vertragsarbeit"),
    SERVICE_CONTRACT("Dienstleistungsvertrag", "Kontinuierliche Serviceleistungen"),
    MAINTENANCE_CONTRACT("Wartungsvertrag", "Regelmäßige Wartungsarbeiten"),

    // === Emergency & Specialized ===
    EMERGENCY_DEPLOYMENT("Notfalleinsatz", "Sofortige Bereitstellung bei Notfällen"),
    STANDBY_SERVICE("Bereitschaftsdienst", "Rund-um-die-Uhr Verfügbarkeit"),
    ON_CALL_SERVICE("Abrufdienst", "Bedarfsorientierte Verfügbarkeit"),

    // === Duration-based ===
    SHORT_TERM("Kurzzeiteinsatz", "Einsätze bis zu 4 Wochen"),
    MEDIUM_TERM("Mittelfristig", "Einsätze von 1-6 Monaten"),
    LONG_TERM("Langzeiteinsatz", "Einsätze über 6 Monate"),

    // === Specialized Services ===
    CONSULTING("Beratung", "Fachberatung und Consulting"),
    TRAINING("Schulung", "Ausbildung und Weiterbildung"),
    SUPERVISION("Aufsicht", "Fachliche Überwachung und Leitung"),
    INSPECTION("Prüfung", "Inspektion und Qualitätskontrolle"),

    // === Team-based ===
    INDIVIDUAL("Einzelkraft", "Einzelne Fachkraft"),
    TEAM("Team", "Mehrere koordinierte Fachkräfte"),
    COMPLETE_CREW("Vollmannschaft", "Komplette Arbeitsgruppe mit Führung"),

    // === General ===
    OTHER("Sonstiges", "Andere Auftragsarten");

    private final String displayName;
    private final String description;

    /**
     * Constructor for PlacementType enum.
     *
     * @param displayName German display name
     * @param description brief description of the placement type
     */
    PlacementType(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * Gets the German display name for this placement type.
     *
     * @return German display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the description for this placement type.
     *
     * @return placement type description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Checks if this placement type is for emergency situations.
     *
     * @return true if placement type is emergency-related
     */
    public boolean isEmergencyType() {
        return this == EMERGENCY_DEPLOYMENT ||
                this == STANDBY_SERVICE ||
                this == ON_CALL_SERVICE;
    }

    /**
     * Checks if this placement type typically requires longer commitment.
     *
     * @return true if placement type involves long-term work
     */
    public boolean isLongTermType() {
        return this == LONG_TERM ||
                this == SERVICE_CONTRACT ||
                this == MAINTENANCE_CONTRACT;
    }

    /**
     * Checks if this placement type involves team coordination.
     *
     * @return true if placement type involves multiple people
     */
    public boolean isTeamBasedType() {
        return this == TEAM ||
                this == COMPLETE_CREW ||
                this == SUPERVISION;
    }

    /**
     * Gets the placement type from a display name.
     *
     * @param displayName the German display name
     * @return matching PlacementType or OTHER if not found
     */
    public static PlacementType fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return OTHER;
        }

        for (PlacementType type : values()) {
            if (type.displayName.equalsIgnoreCase(displayName.trim())) {
                return type;
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