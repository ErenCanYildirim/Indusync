package com.indusync.indusync_backend.shared.security;

import io.jsonwebtoken.Claims;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.HashSet;
import java.util.Set;

/**
 * Service for validating JWT token entropy and security characteristics.
 * Provides comprehensive security validation for JWT tokens.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Slf4j
public class JwtEntropyValidator {

    private static final int MIN_JWT_ID_LENGTH = 16;
    private static final double MIN_ENTROPY_RATIO = 0.4;
    private static final int MIN_UNIQUE_CHARACTERS = 8;

    /**
     * Validate token entropy and security characteristics
     */
    public TokenEntropyResult validateTokenEntropy(String token) {
        try {
            // Parse token without verification to analyze structure
            String[] tokenParts = token.split("\\.");
            if (tokenParts.length != 3) {
                return TokenEntropyResult.invalid("Invalid JWT structure");
            }

            // Validate header entropy
            String header = tokenParts[0];
            EntropyAnalysis headerEntropy = analyzeEntropy(header);

            // Validate payload entropy
            String payload = tokenParts[1];
            EntropyAnalysis payloadEntropy = analyzeEntropy(payload);

            // Validate signature entropy
            String signature = tokenParts[2];
            EntropyAnalysis signatureEntropy = analyzeEntropy(signature);

            // Overall entropy assessment
            // Require strong entropy for the signature (critical),
            // but do not fail solely on header/payload entropy to avoid false positives
            boolean isValid = signatureEntropy.acceptable();

            return TokenEntropyResult.builder()
                    .valid(isValid)
                    .headerEntropy(headerEntropy)
                    .payloadEntropy(payloadEntropy)
                    .signatureEntropy(signatureEntropy)
                    .overallScore(calculateOverallScore(headerEntropy, payloadEntropy, signatureEntropy))
                    .build();

        } catch (Exception e) {
            log.debug("Error validating token entropy: {}", e.getMessage());
            return TokenEntropyResult.invalid("Token entropy validation failed");
        }
    }

    /**
     * Validate JWT ID entropy and uniqueness
     */
    public boolean validateJwtIdEntropy(String jwtId) {
        if (jwtId == null || jwtId.length() < MIN_JWT_ID_LENGTH) {
            log.debug("JWT ID too short: {}", jwtId != null ? jwtId.length() : 0);
            return false;
        }

        EntropyAnalysis entropy = analyzeEntropy(jwtId);
        return entropy.acceptable();
    }

    /**
     * Validate security claims in token
     */
    public SecurityClaimsValidation validateSecurityClaims(Claims claims) {
        SecurityClaimsValidation.SecurityClaimsValidationBuilder builder = SecurityClaimsValidation.builder();

        // Validate JWT ID
        String jwtId = claims.getId();
        boolean validJwtId = validateJwtIdEntropy(jwtId);
        builder.validJwtId(validJwtId);

        // Validate issuer
        String issuer = claims.getIssuer();
        boolean validIssuer = issuer != null && !issuer.trim().isEmpty();
        builder.validIssuer(validIssuer);

        // Validate audience
        String audience = claims.getAudience();
        boolean validAudience = audience != null && !audience.trim().isEmpty();
        builder.validAudience(validAudience);

        // Validate timestamps
        boolean validTimestamps = claims.getIssuedAt() != null &&
                claims.getExpiration() != null &&
                claims.getNotBefore() != null;
        builder.validTimestamps(validTimestamps);

        // Check for suspicious claims
        boolean suspiciousClaims = detectSuspiciousClaims(claims);
        builder.suspiciousClaims(suspiciousClaims);

        boolean overallValid = validJwtId && validIssuer && validAudience &&
                validTimestamps && !suspiciousClaims;
        builder.valid(overallValid);

        return builder.build();
    }

    /**
     * Generate cryptographically secure random secret
     */
    public String generateSecureSecret(int lengthBytes) {
        if (lengthBytes < 32) {
            throw new IllegalArgumentException("Secret length must be at least 32 bytes");
        }

        SecureRandom secureRandom = new SecureRandom();
        byte[] secretBytes = new byte[lengthBytes];
        secureRandom.nextBytes(secretBytes);

        // Validate generated secret entropy
        String secret = Base64.getEncoder().encodeToString(secretBytes);
        EntropyAnalysis entropy = analyzeEntropy(secret);

        if (!entropy.acceptable()) {
            log.warn("Generated secret has low entropy, regenerating...");
            return generateSecureSecret(lengthBytes); // Retry
        }

        return secret;
    }

    /**
     * Analyze entropy of a string with enhanced cryptographic analysis
     */
    public EntropyAnalysis analyzeEntropy(String input) {
        if (input == null || input.isEmpty()) {
            return EntropyAnalysis.builder()
                    .entropyRatio(0.0)
                    .uniqueCharacters(0)
                    .acceptable(false)
                    .build();
        }

        // Count unique characters
        Set<Character> uniqueChars = new HashSet<>();
        for (char c : input.toCharArray()) {
            uniqueChars.add(c);
        }

        int uniqueCharCount = uniqueChars.size();
        double entropyRatio = (double) uniqueCharCount / input.length();

        // Enhanced entropy calculation using Shannon entropy
        double shannonEntropy = calculateShannonEntropy(input);

        // Combine multiple entropy measures
        boolean acceptable = entropyRatio >= MIN_ENTROPY_RATIO &&
                uniqueCharCount >= MIN_UNIQUE_CHARACTERS &&
                shannonEntropy >= 3.0; // Minimum Shannon entropy threshold

        return EntropyAnalysis.builder()
                .entropyRatio(entropyRatio)
                .uniqueCharacters(uniqueCharCount)
                .acceptable(acceptable)
                .build();
    }

    /**
     * Calculate Shannon entropy for a string
     */
    private double calculateShannonEntropy(String input) {
        if (input == null || input.isEmpty()) {
            return 0.0;
        }

        // Count character frequencies
        java.util.Map<Character, Integer> frequencies = new java.util.HashMap<>();
        for (char c : input.toCharArray()) {
            frequencies.put(c, frequencies.getOrDefault(c, 0) + 1);
        }

        // Calculate Shannon entropy
        double entropy = 0.0;
        int length = input.length();

        for (int frequency : frequencies.values()) {
            if (frequency > 0) {
                double probability = (double) frequency / length;
                entropy -= probability * (Math.log(probability) / Math.log(2));
            }
        }

        return entropy;
    }

    /**
     * Calculate overall entropy score
     */
    private double calculateOverallScore(EntropyAnalysis header, EntropyAnalysis payload, EntropyAnalysis signature) {
        return (header.entropyRatio() + payload.entropyRatio() + signature.entropyRatio()) / 3.0;
    }

    /**
     * Detect suspicious claims in JWT
     */
    private boolean detectSuspiciousClaims(Claims claims) {
        // Check for unusually long claim values (potential injection)
        for (String key : claims.keySet()) {
            Object value = claims.get(key);
            if (value instanceof String stringValue) {
                if (stringValue.length() > 1000) { // Configurable threshold
                    log.warn("Suspicious long claim value for key: {}", key);
                    return true;
                }

                // Check for potential injection patterns
                if (containsSuspiciousPatterns(stringValue)) {
                    log.warn("Suspicious patterns detected in claim: {}", key);
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check for suspicious patterns in claim values
     */
    private boolean containsSuspiciousPatterns(String value) {
        String lowerValue = value.toLowerCase();

        // Check for common injection patterns
        String[] suspiciousPatterns = {
                "<script", "javascript:", "eval(", "document.cookie",
                "union select", "drop table", "insert into", "delete from",
                "../", "..\\", "file://", "http://", "https://"
        };

        for (String pattern : suspiciousPatterns) {
            if (lowerValue.contains(pattern)) {
                return true;
            }
        }

        return false;
    }
}