package com.indusync.indusync_backend.shared.domain.enums;

/**
 * Enumeration representing German company legal forms (Rechtsformen).
 * <p>
 * This enum covers the most common legal forms for businesses in Germany:
 * - Individual enterprises (Einzelunternehmen)
 * - Partnerships (GbR, OHG, KG)
 * - Corporations (GmbH, AG, UG)
 * - Mixed forms (GmbH & Co. KG)
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
public enum CompanyType {
    
    /**
     * Einzelunternehmen - Individual/sole proprietorship.
     * Simple business form for individual entrepreneurs.
     */
    EINZELUNTERNEHMEN("Einzelunternehmen"),
    
    /**
     * Gesellschaft bürgerlichen Rechts - Civil law partnership.
     * Simple partnership form for multiple partners.
     */
    GBR("GbR"),
    
    /**
     * Gesellschaft mit beschränkter Haftung - Limited liability company.
     * Most common corporate form in Germany.
     */
    GMBH("GmbH"),
    
    /**
     * Aktiengesellschaft - Stock corporation.
     * Large corporate form with shares.
     */
    AG("AG"),
    
    /**
     * Unternehmergesellschaft (haftungsbeschränkt) - Entrepreneurial company.
     * Mini-GmbH with reduced capital requirements.
     */
    UG("UG (haftungsbeschränkt)"),
    
    /**
     * Offene Handelsgesellschaft - General partnership.
     * Commercial partnership with unlimited liability.
     */
    OHG("OHG"),
    
    /**
     * Kommanditgesellschaft - Limited partnership.
     * Partnership with limited and general partners.
     */
    KG("KG"),
    
    /**
     * GmbH & Co. KG - Limited partnership with GmbH as general partner.
     * Complex form combining corporation and partnership.
     */
    GMBH_CO_KG("GmbH & Co. KG"),
    
    /**
     * Other legal forms not covered by the standard types.
     */
    OTHER("Sonstige");

    private final String displayName;

    /**
     * Constructor for CompanyType enum.
     *
     * @param displayName the German display name for the company type
     */
    CompanyType(String displayName) {
        this.displayName = displayName;
    }

    /**
     * Gets the German display name for this company type.
     *
     * @return the display name in German
     */
    public String getDisplayName() {
        return displayName;
    }

    /**
     * Checks if this company type requires commercial registration.
     *
     * @return true if commercial registration is required
     */
    public boolean requiresCommercialRegistration() {
        return switch (this) {
            case GMBH, AG, UG, OHG, KG, GMBH_CO_KG -> true;
            case EINZELUNTERNEHMEN, GBR -> false;
            case OTHER -> false; // Depends on specific type
        };
    }

    /**
     * Checks if this company type has limited liability.
     *
     * @return true if liability is limited
     */
    public boolean hasLimitedLiability() {
        return switch (this) {
            case GMBH, AG, UG, GMBH_CO_KG -> true;
            case EINZELUNTERNEHMEN, GBR, OHG, KG -> false;
            case OTHER -> false; // Depends on specific type
        };
    }

    /**
     * Gets the minimum capital requirement in EUR.
     *
     * @return minimum capital in EUR, 0 if no requirement
     */
    public int getMinimumCapitalEur() {
        return switch (this) {
            case GMBH -> 25000;
            case AG -> 50000;
            case UG -> 1;
            case EINZELUNTERNEHMEN, GBR, OHG, KG, GMBH_CO_KG, OTHER -> 0;
        };
    }

    /**
     * Checks if this company type is suitable for small businesses.
     *
     * @return true if suitable for small businesses
     */
    public boolean isSuitableForSmallBusiness() {
        return switch (this) {
            case EINZELUNTERNEHMEN, GBR, UG -> true;
            case GMBH, AG, OHG, KG, GMBH_CO_KG -> false;
            case OTHER -> true; // Assume yes for flexibility
        };
    }

    /**
     * Gets the company type from a string value (case-insensitive).
     *
     * @param value the string value to parse
     * @return the corresponding CompanyType
     * @throws IllegalArgumentException if the value doesn't match any company type
     */
    public static CompanyType fromString(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Company type value cannot be null or empty");
        }
        
        try {
            return CompanyType.valueOf(value.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid company type: " + value + 
                ". Valid values are: " + java.util.Arrays.toString(CompanyType.values()));
        }
    }

    /**
     * Gets company types suitable for startup businesses.
     *
     * @return array of startup-friendly company types
     */
    public static CompanyType[] getStartupFriendlyTypes() {
        return new CompanyType[]{EINZELUNTERNEHMEN, GBR, UG};
    }

    /**
     * Gets company types that require notarization.
     *
     * @return array of company types requiring notarization
     */
    public static CompanyType[] getNotarizationRequiredTypes() {
        return new CompanyType[]{GMBH, AG, UG, GMBH_CO_KG};
    }
} 