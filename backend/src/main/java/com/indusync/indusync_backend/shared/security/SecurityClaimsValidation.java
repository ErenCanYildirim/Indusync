package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

/**
 * Result of JWT security claims validation.
 * Contains validation status for all security-related claims.
 *
 * @param valid            Overall validation result
 * @param validJwtId       Whether JWT ID (jti) is valid
 * @param validIssuer      Whether issuer (iss) is valid
 * @param validAudience    Whether audience (aud) is valid
 * @param validTimestamps  Whether timestamps (iat, exp, nbf) are valid
 * @param suspiciousClaims Whether suspicious claims were detected
 * @param details          Additional validation details
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record SecurityClaimsValidation(boolean valid, boolean validJwtId, boolean validIssuer, boolean validAudience,
                                       boolean validTimestamps, boolean suspiciousClaims, String details) {

    /**
     * Create a failed validation result
     */
    public static SecurityClaimsValidation failed(String details) {
        return SecurityClaimsValidation.builder()
                .valid(false)
                .validJwtId(false)
                .validIssuer(false)
                .validAudience(false)
                .validTimestamps(false)
                .suspiciousClaims(true)
                .details(details)
                .build();
    }

    /**
     * Create a successful validation result
     */
    public static SecurityClaimsValidation success() {
        return SecurityClaimsValidation.builder()
                .valid(true)
                .validJwtId(true)
                .validIssuer(true)
                .validAudience(true)
                .validTimestamps(true)
                .suspiciousClaims(false)
                .details("All security claims validated successfully")
                .build();
    }
}