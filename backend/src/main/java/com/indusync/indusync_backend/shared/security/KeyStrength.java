package com.indusync.indusync_backend.shared.security;

import lombok.Getter;

/**
 * Enumeration of cryptographic key strength levels.
 * Used for assessing the security strength of JWT signing keys.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Getter
public enum KeyStrength {
    
    /**
     * No key present or key is completely insecure
     */
    NONE("No key present", 0),
    
    /**
     * Key has significant security weaknesses
     */
    WEAK("Weak security", 1),
    
    /**
     * Key has moderate security but could be improved
     */
    MODERATE("Moderate security", 2),
    
    /**
     * Key has strong security characteristics
     */
    STRONG("Strong security", 3),
    
    /**
     * Key has excellent security characteristics
     */
    EXCELLENT("Excellent security", 4);

    /**
     * -- GETTER --
     *  Get human-readable description of the strength level
     */
    private final String description;
    /**
     * -- GETTER --
     *  Get numeric level (0-4, higher is better)
     */
    private final int level;

    KeyStrength(String description, int level) {
        this.description = description;
        this.level = level;
    }

    /**
     * Check if this strength level is acceptable for production use
     */
    public boolean isAcceptable() {
        return level >= 2; // MODERATE or higher
    }

    /**
     * Check if this strength level requires immediate attention
     */
    public boolean requiresAttention() {
        return level <= 1; // WEAK or NONE
    }
}