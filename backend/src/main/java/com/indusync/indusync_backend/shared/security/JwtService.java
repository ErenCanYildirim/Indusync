package com.indusync.indusync_backend.shared.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.security.SecureRandom;
import java.util.*;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

     @Value("${security.jwt.secret:}")
    private String jwtSecret;

    @Value("${security.jwt.expiration:86400000}") // 24 hours default
    private long jwtExpiration;

    @Value("${security.jwt.refresh-token.expiration:604800000}") // 7 days default
    private long refreshExpiration;

    @Value("${security.jwt.issuer:indusync-backend}")
    private String jwtIssuer;

    @Value("${security.jwt.audience:indusync-client}")
    private String jwtAudience;

    @Value("${security.jwt.not-before-leeway:30000}") // 30 seconds default
    private long notBeforeLeeway;

    @Value("${security.jwt.enhanced-validation:true}")
    private boolean enhancedValidationEnabled;

    @Value("${security.jwt.key-rotation.enabled:true}")
    private boolean keyRotationEnabled;

    private final SecureRandom secureRandom = new SecureRandom();
    private final JwtKeyRotationService keyRotationService;
    private final JwtEntropyValidator entropyValidator;
    private final SecureSecretGenerator secretGenerator;

    @Autowired
    public JwtService(JwtKeyRotationService keyRotationService,
            JwtEntropyValidator entropyValidator,
            SecureSecretGenerator secretGenerator) {
        this.keyRotationService = keyRotationService;
        this.entropyValidator = entropyValidator;
        this.secretGenerator = secretGenerator;
    }

      public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

     /**
     * Generate token with user context information
     */
    public String generateToken(String email, UUID userId, String accountType, UUID currentCompanyId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("user_id", userId.toString());
        claims.put("account_type", accountType);
        if (currentCompanyId != null) {
            claims.put("current_company_id", currentCompanyId.toString());
        }
        claims.put("roles", List.of("USER"));
        claims.put("token_type", "access");

        return buildEnhancedToken(claims, email, jwtExpiration);
    }

    /**
     * Generate enhanced token with security metadata
     */
    public String generateTokenWithMetadata(String email, UUID userId, String accountType, UUID currentCompanyId,
            String ipAddress, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("user_id", userId.toString());
        claims.put("account_type", accountType);
        if (currentCompanyId != null) {
            claims.put("current_company_id", currentCompanyId.toString());
        }
        claims.put("roles", List.of("USER"));
        claims.put("token_type", "access");

        // Add security metadata
        if (ipAddress != null) {
            claims.put("ip", ipAddress);
        }
        if (userAgent != null) {
            claims.put("ua", userAgent);
        }

        return buildEnhancedToken(claims, email, jwtExpiration);
    }

    /**
     * Generate refresh token
     */
    public String generateRefreshToken(UserDetails userDetails) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("token_type", "refresh");
        return buildEnhancedToken(claims, userDetails.getUsername(), refreshExpiration);
    }

     /**
     * Generate refresh token with security metadata
     */
    public String generateRefreshTokenWithMetadata(String email, UUID userId, String ipAddress, String userAgent) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("token_type", "refresh");
        claims.put("user_id", userId.toString());

        // Add security metadata
        if (ipAddress != null) {
            claims.put("ip", ipAddress);
        }
        if (userAgent != null) {
            claims.put("ua", userAgent);
        }

        return buildEnhancedToken(claims, email, refreshExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return buildEnhancedToken(extraClaims, userDetails.getUsername(), expiration);
    }

    /**
     * Build enhanced JWT token with all security claims
     */
    private String buildEnhancedToken(Map<String, Object> extraClaims, String subject, long expiration) {
        long currentTimeMillis = System.currentTimeMillis();
        Date issuedAt = new Date(currentTimeMillis);
        Date expiresAt = new Date(currentTimeMillis + expiration);
        Date notBefore = new Date(currentTimeMillis - notBeforeLeeway); // Allow a small clock skew

        // Generate unique JWT ID for tracking
        String jwtId = generateJwtId();

        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(subject)
                .setIssuedAt(issuedAt)
                .setExpiration(expiresAt)
                .setNotBefore(notBefore)
                .setIssuer(jwtIssuer)
                .setAudience(jwtAudience)
                .setId(jwtId)
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    /**
     * Generate cryptographically secure JWT ID with enhanced entropy
     */
    private String generateJwtId() {
        return secretGenerator.generateSecureJwtId();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && validateTokenSecurity(token);
    }

    /**
     * Validate token without requiring UserDetails
     */
    public boolean validateToken(String token) {
        try {
            return validateTokenSecurity(token);
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }

     /**
     * Enhanced token validation with security claims verification and entropy
     * analysis
     */
    public boolean validateTokenSecurity(String token) {
        try {
            Claims claims = extractAllClaims(token);

            // Validate expiration
            if (isTokenExpired(token)) {
                log.debug("Token has expired");
                return false;
            }

            // Validate not-before claim
            if (isTokenNotYetValid(claims)) {
                log.debug("Token is not yet valid (nbf claim)");
                return false;
            }

            // Validate issuer
            if (!isValidIssuer(claims)) {
                log.debug("Invalid token issuer");
                return false;
            }

            // Validate audience
            if (!isValidAudience(claims)) {
                log.debug("Invalid token audience");
                return false;
            }

            // Validate JWT ID exists and has sufficient entropy
            if (!hasValidJwtId(claims)) {
                log.debug("Missing or invalid JWT ID");
                return false;
            }

            // Enhanced cryptographic validation
            if (!validateTokenCryptographicSecurity(token)) {
                log.debug("Token failed cryptographic security validation");
                return false;
            }

            // Enhanced validation if enabled
            if (enhancedValidationEnabled) {
                if (!validateTokenEntropy(token)) {
                    log.debug("Token failed entropy validation");
                    return false;
                }

                if (!validateSecurityClaims(claims)) {
                    log.debug("Token failed security claims validation");
                    return false;
                }
            }

            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Token validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if the token is not yet valid based on nbf claim
     */
    private boolean isTokenNotYetValid(Claims claims) {
        Date notBefore = claims.getNotBefore();
        if (notBefore == null) {
            return false; // No nbf claim, consider valid for backward compatibility
        }
        return notBefore.after(new Date());
    }

    /**
     * Validate token issuer
     */
    private boolean isValidIssuer(Claims claims) {
        String issuer = claims.getIssuer();
        return jwtIssuer.equals(issuer);
    }

    /**
     * Validate token audience
     */
    private boolean isValidAudience(Claims claims) {
        String audience = claims.getAudience();
        return jwtAudience.equals(audience);
    }

    /**
     * Check if JWT ID is present and valid with sufficient entropy
     */
    private boolean hasValidJwtId(Claims claims) {
        String jwtId = claims.getId();
        if (jwtId == null || jwtId.trim().isEmpty()) {
            return false;
        }

        // Validate JWT ID entropy if enhanced validation is enabled
        if (enhancedValidationEnabled) {
            return entropyValidator.validateJwtIdEntropy(jwtId);
        }

        return true;
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        // Use key rotation service if available and enabled
        if (keyRotationService != null && keyRotationEnabled) {
            try {
                return keyRotationService.getCurrentSigningKey();
            } catch (Exception e) {
                log.warn("Failed to get key from rotation service, falling back to configured secret: {}",
                        e.getMessage());
            }
        }

        // Fallback to configured secret
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret is not configured and key rotation service is not available");
        }

        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Extract token from HTTP request
     */
    public String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    /**
     * Extract user ID from token
     */
    public UUID extractUserId(String token) {
        Claims claims = extractAllClaims(token);
        String userIdStr = claims.get("user_id", String.class);
        return userIdStr != null ? UUID.fromString(userIdStr) : null;
    }

    /**
     * Extract account type from token
     */
    public String extractAccountType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("account_type", String.class);
    }

    /**
     * Extract current company ID from token
     */
    public UUID extractCurrentCompanyId(String token) {
        Claims claims = extractAllClaims(token);
        String companyIdStr = claims.get("current_company_id", String.class);
        log.debug(companyIdStr != null ? companyIdStr : "null");
        return companyIdStr != null ? UUID.fromString(companyIdStr) : null;
    }

    /**
     * Extract roles from token
     */
    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("roles", List.class);
    }

    /**
     * Get token type (access or refresh)
     */
    public String getTokenType(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("token_type", String.class);
    }

    /**
     * Check if token is refresh token
     */
    public boolean isRefreshToken(String token) {
        return "refresh".equals(getTokenType(token));
    }

    /**
     * Check if token is access token
     */
    public boolean isAccessToken(String token) {
        return "access".equals(getTokenType(token));
    }

    /**
     * Extract JWT ID from token
     */
    public String extractJwtId(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getId();
    }

    /**
     * Extract issuer from token
     */
    public String extractIssuer(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getIssuer();
    }

    /**
     * Extract audience from token
     */
    public String extractAudience(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getAudience();
    }

    /**
     * Extract not-before timestamp from token
     */
    public Date extractNotBefore(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getNotBefore();
    }

    /**
     * Extract issued-at timestamp from token
     */
    public Date extractIssuedAt(String token) {
        Claims claims = extractAllClaims(token);
        return claims.getIssuedAt();
    }

    /**
     * Extract IP address from token metadata
     */
    public String extractIpAddress(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("ip", String.class);
    }

    /**
     * Extract user agent from token metadata
     */
    public String extractUserAgent(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("ua", String.class);
    }

    /**
     * Get token security metadata
     */
    public TokenSecurityMetadata getTokenSecurityMetadata(String token) {
        Claims claims = extractAllClaims(token);
        return TokenSecurityMetadata.builder()
                .jwtId(claims.getId())
                .issuer(claims.getIssuer())
                .audience(claims.getAudience())
                .issuedAt(claims.getIssuedAt())
                .expiresAt(claims.getExpiration())
                .notBefore(claims.getNotBefore())
                .ipAddress(claims.get("ip", String.class))
                .userAgent(claims.get("ua", String.class))
                .build();
    }

    /**
     * Validate cryptographic security aspects of the token
     */
    private boolean validateTokenCryptographicSecurity(String token) {
        try {
            // validate signature strength and algorithm
            if (!validateSignatureStrength(token)) {
                log.debug("Token signature validation failed");
                return false;
            }

              // Validate key rotation compatibility
            if (!validateKeyRotationCompatibility(token)) {
                log.debug("Token key rotation compatibility failed");
                return false;
            }

            // Validate token structure integrity
            if (!validateTokenStructureIntegrity(token)) {
                log.debug("Token structure integrity validation failed");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.debug("Cryptographic security validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate signature strength and cryptographic properties
     */
    private boolean validateSignatureStrength(String token) {
        try {
            String[] tokenParts = token.split("\\.");
            if (tokenParts.length != 3) {
                return false;
            }

            String signature = tokenParts[2];

            // Validate signature length (HS512 should produce 512-bit signature)
            byte[] signatureBytes = Base64.getUrlDecoder().decode(signature);
            if (signatureBytes.length < 32) { // Minimum 256 bits
                log.debug("Signature too short: {} bytes", signatureBytes.length);
                return false;
            }

            // Validate signature entropy
            if (enhancedValidationEnabled && entropyValidator != null) {
                EntropyAnalysis signatureEntropy = entropyValidator.analyzeEntropy(signature);
                if (!signatureEntropy.acceptable()) {
                    log.debug("Signature has insufficient entropy");
                    return false;
                }
            }

            return true;
        } catch (Exception e) {
            log.debug("Signature strength validation failed: {}", e.getMessage());
            return false;
        }
    }

     /**
     * Validate key rotation compatibility and key security
     */
    private boolean validateKeyRotationCompatibility(String token) {
        try {
            // Skip advanced checks if rotation is disabled or service not present
            if (!keyRotationEnabled || keyRotationService == null) {
                return true; // Skip if key rotation is not configured
            }

            // Check if current signing key is secure
            SecretKey currentKey = keyRotationService.getCurrentSigningKey();
            if (enhancedValidationEnabled) {
                if (!keyRotationService.validateKeyEntropy(currentKey)) {
                    log.warn("Current signing key has insufficient entropy");
                    return false;
                }
            } else {
                log.debug("Skipping key entropy validation (enhanced validation disabled)");
            }

            // Check if key rotation is overdue
            if (keyRotationService.isRotationNeeded()) {
                log.info("Key rotation is needed but token is still valid for backward compatibility");
            }

            return true;
        } catch (Exception e) {
            log.debug("Key rotation compatibility validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate token structure integrity and format
     */
    private boolean validateTokenStructureIntegrity(String token) {
        try {
            String[] tokenParts = token.split("\\.");
            if (tokenParts.length != 3) {
                return false;
            }

            // Validate each part is properly base64url encoded
            for (String part : tokenParts) {
                if (part.isEmpty()) {
                    return false;
                }

                // Check for valid base64url characters
                if (!part.matches("^[A-Za-z0-9_-]*$")) {
                    log.debug("Invalid base64url encoding in token part");
                    return false;
                }
            }

            // Validate header structure
            String header = tokenParts[0];
            return validateTokenHeader(header);
        } catch (Exception e) {
            log.debug("Token structure integrity validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate JWT header for security requirements
     */
    private boolean validateTokenHeader(String headerPart) {
        try {
            byte[] headerBytes = Base64.getUrlDecoder().decode(headerPart);
            String headerJson = new String(headerBytes);

            // Basic validation - should contain algorithm
            if (!headerJson.contains("\"alg\"")) {
                log.debug("JWT header missing algorithm claim");
                return false;
            }

            // Validate algorithm is secure (should be HS512 for our implementation)
            if (!headerJson.contains("\"HS512\"")) {
                log.debug("JWT header uses insecure algorithm");
                return false;
            }

            return true;
        } catch (Exception e) {
            log.debug("JWT header validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate token entropy using entropy validator
     */
    private boolean validateTokenEntropy(String token) {
        if (entropyValidator == null) {
            return true; // Skip if entropy validator is not available
        }

        try {
            TokenEntropyResult entropyResult = entropyValidator.validateTokenEntropy(token);
            return entropyResult.valid();
        } catch (Exception e) {
            log.debug("Token entropy validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate security claims using security claims validator
     */
    private boolean validateSecurityClaims(Claims claims) {
        if (entropyValidator == null) {
            return true; // Skip if validator is not available
        }

        try {
            SecurityClaimsValidation validation = entropyValidator.validateSecurityClaims(claims);
            return validation.valid();
        } catch (Exception e) {
            log.debug("Security claims validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Refresh access token using refresh token (legacy method for backward
     * compatibility)
     */
    public String refreshAccessToken(String refreshToken) {
        TokenRotationResult result = refreshTokensWithRotation(refreshToken, null, null);
        return result.accessToken();
    }

    /**
     * Enhanced token refresh with automatic rotation and single-use enforcement
     */
    public TokenRotationResult refreshTokensWithRotation(String refreshToken, String ipAddress, String userAgent) {
        if (!validateToken(refreshToken) || !isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        String username = extractUsername(refreshToken);
        UUID userId = extractUserId(refreshToken);
        String accountType = extractAccountType(refreshToken);
        UUID currentCompanyId = extractCurrentCompanyId(refreshToken);

        // Preserve security metadata from a refresh token if not provided
        String tokenIpAddress = ipAddress != null ? ipAddress : extractIpAddress(refreshToken);
        String tokenUserAgent = userAgent != null ? userAgent : extractUserAgent(refreshToken);

        // Generate new access token
        String newAccessToken = generateTokenWithMetadata(username, userId, accountType, currentCompanyId,
                tokenIpAddress, tokenUserAgent);

        // Generate new refresh token (rotation)
        String newRefreshToken = generateRefreshTokenWithMetadata(username, userId, tokenIpAddress, tokenUserAgent);

        return new TokenRotationResult(newAccessToken, newRefreshToken, extractJwtId(refreshToken));
    }

    /**
     * Refresh tokens with comprehensive security checks and blacklist integration
     */
    public TokenRotationResult secureRefreshTokens(String refreshToken, String ipAddress, String userAgent,
            JwtBlacklistService blacklistService) {
        // Validate refresh token
        if (!validateToken(refreshToken) || !isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        // Check if refresh token is blacklisted
        if (blacklistService != null && blacklistService.isTokenBlacklisted(refreshToken)) {
            throw new IllegalArgumentException("Refresh token has been revoked");
        }

        String oldRefreshTokenId = extractJwtId(refreshToken);
        UUID userId = extractUserId(refreshToken);

        // Generate new tokens
        TokenRotationResult result = refreshTokensWithRotation(refreshToken, ipAddress, userAgent);

        // Store new tokens in blacklist service for tracking
        if (blacklistService != null) {
            // Store new access token
            blacklistService.storeToken(result.accessToken(), userId, ipAddress, userAgent, null);

            // Store new refresh token
            blacklistService.storeToken(result.newRefreshToken(), userId, ipAddress, userAgent, null);

            // Revoke old refresh token (single-use enforcement)
            if (oldRefreshTokenId != null) {
                blacklistService.revokeToken(refreshToken, "Token rotated");
            }
        }

        return result;
    }

    /**
     * Refresh tokens with rate-limiting and comprehensive security checks
     */
    public TokenRotationResult secureRefreshTokensWithRateLimit(String refreshToken, String ipAddress, String userAgent,
            JwtBlacklistService blacklistService,
            JwtRateLimitService rateLimitService) {
        UUID userId = extractUserId(refreshToken);

        // Check rate limits
        if (rateLimitService != null) {
            if (!rateLimitService.canRefreshToken(userId)) {
                long resetTimeMinutes = rateLimitService.getRefreshResetTimeMinutes(userId);
                throw new IllegalArgumentException(
                        "Token refresh rate limit exceeded. Try again in " + resetTimeMinutes + " minutes");
            }

            if (ipAddress != null && !rateLimitService.canPerformJwtOperation(ipAddress)) {
                throw new IllegalArgumentException("IP address rate limit exceeded");
            }
        }

        try {
            // Perform secure token refresh
            TokenRotationResult result = secureRefreshTokens(refreshToken, ipAddress, userAgent, blacklistService);

            // Record successful refresh attempt
            if (rateLimitService != null) {
                rateLimitService.recordRefreshAttempt(userId);
                if (ipAddress != null) {
                    rateLimitService.recordJwtOperation(ipAddress);
                }
            }

            return result;
        } catch (Exception e) {
            // Record failed refresh attempt
            if (rateLimitService != null) {
                rateLimitService.recordRefreshAttempt(userId);
                if (ipAddress != null) {
                    rateLimitService.recordJwtOperation(ipAddress);
                }
            }
            throw e;
        }
    }
}