package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Industries served in the IndusSync platform.
 * Represents different industrial sectors that orders can target.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum Industry {

    // === Manufacturing Industries ===
    AUTOMOTIVE("Automobilindustrie", "Fahrzeugherstellung und -zulieferer"),
    AEROSPACE("Luft- und Raumfahrt", "Flugzeug- und Raumfahrttechnik"),
    MACHINERY("Maschinenbau", "Maschinen- und Anlagenbau"),
    STEEL_METAL("Stahl- und Metallindustrie", "Metallverarbeitung und -produktion"),
    CHEMICAL("Chemische Industrie", "Chemikalien und petrochemische Produkte"),
    PHARMACEUTICAL("Pharmaindustrie", "Arzneimittel und medizinische Produkte"),

    // === Energy & Utilities ===
    POWER_GENERATION("Energieerzeugung", "Kraftwerke und Energieanlagen"),
    RENEWABLE_ENERGY("Erneuerbare Energien", "Solar-, Wind- und Wasserkraft"),
    OIL_GAS("Öl und Gas", "Petrochemie und Gasverarbeitung"),
    UTILITIES("Versorgungsunternehmen", "Strom-, Gas- und Wasserversorgung"),

    // === Process Industries ===
    FOOD_BEVERAGE("Lebensmittel und Getränke", "Nahrungsmittelproduktion"),
    PAPER_PULP("Papier und Zellstoff", "Papierherstellung und -verarbeitung"),
    TEXTILES("Textilindustrie", "Textilproduktion und -verarbeitung"),
    CEMENT("Zement und Baustoffe", "Baustoffproduktion"),
    GLASS("Glasindustrie", "Glasherstellung und -verarbeitung"),

    // === Infrastructure ===
    CONSTRUCTION("Bauwesen", "Hoch- und Tiefbau"),
    TRANSPORTATION("Transport und Logistik", "Gütertransport und Logistik"),
    RAILWAYS("Schienenverkehr", "Eisenbahn und öffentlicher Verkehr"),
    PORTS_SHIPPING("Häfen und Schifffahrt", "Maritime Industrie"),
    AIRPORTS("Flughäfen", "Luftverkehr und Flughafenbetrieb"),

    // === Technology & Electronics ===
    ELECTRONICS("Elektronikindustrie", "Elektronische Bauteile und Geräte"),
    TELECOMMUNICATIONS("Telekommunikation", "Kommunikationstechnik"),
    DATA_CENTERS("Rechenzentren", "IT-Infrastruktur und Cloud-Services"),

    // === Mining & Resources ===
    MINING("Bergbau", "Rohstoffgewinnung und -verarbeitung"),
    QUARRYING("Steinbrüche", "Gesteinsabbau und -verarbeitung"),

    // === Waste & Environment ===
    WASTE_MANAGEMENT("Abfallwirtschaft", "Entsorgung und Recycling"),
    WATER_TREATMENT("Wasseraufbereitung", "Wasser- und Abwasserbehandlung"),
    ENVIRONMENTAL("Umwelttechnik", "Umweltschutz und -sanierung"),

    // === Healthcare & Public ===
    HOSPITALS("Krankenhäuser", "Medizinische Einrichtungen"),
    RESEARCH_LABS("Forschungseinrichtungen", "Labore und Forschungsinstitute"),
    PUBLIC_SECTOR("Öffentlicher Sektor", "Behörden und öffentliche Einrichtungen"),

    // === General ===
    MANUFACTURING("Allgemeine Fertigung", "Diverse Fertigungsbetriebe"),
    OTHER("Sonstiges", "Andere nicht aufgeführte Branchen");

    private final String displayName;
    private final String description;

    /**
     * Constructor for Industry enum.
     *
     * @param displayName German display name
     * @param description brief description of the industry
     */
    Industry(String displayName, String description) {
        this.displayName = displayName;
        this.description = description;
    }

    /**
     * Gets the German display name for this industry.
     *
     * @return German display name
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Gets the description for this industry.
     *
     * @return industry description
     */
    public String getDescription() {
        return description;
    }

    /**
     * Checks if this industry has high safety requirements.
     *
     * @return true if industry involves high-risk operations
     */
    public boolean isHighRiskIndustry() {
        return this == CHEMICAL ||
                this == OIL_GAS ||
                this == POWER_GENERATION ||
                this == MINING ||
                this == PHARMACEUTICAL ||
                this == AEROSPACE;
    }

    /**
     * Checks if this industry requires specialized certifications.
     *
     * @return true if industry typically requires special certifications
     */
    public boolean requiresSpecialCertifications() {
        return this == PHARMACEUTICAL ||
               this == AEROSPACE ||
               this == CHEMICAL ||
               this == POWER_GENERATION ||
               this == FOOD_BEVERAGE ||
               this == HOSPITALS;
    }

    /**
     * Gets the industry from a display name.
     *
     * @param displayName the German display name
     * @return matching Industry or OTHER if not found
     */
    public static Industry fromDisplayName(String displayName) {
        if (displayName == null || displayName.trim().isEmpty()) {
            return OTHER;
        }

        for (Industry industry : values()) {
            if (industry.displayName.equalsIgnoreCase(displayName.trim())) {
                return industry;
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