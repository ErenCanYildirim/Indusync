package com.indusync.indusync_backend.shared.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.ActiveProfiles;

import javax.crypto.SecretKey;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test for JWT cryptographic security improvements.
 * Tests all aspects of task 2.4 implementation.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@ExtendWith(MockitoExtension.class)
@SpringBootTest
@ActiveProfiles("test")
class JwtCryptographicSecurityTest {

    private JwtService jwtService;
    private JwtKeyRotationService keyRotationService;
    private JwtEntropyValidator entropyValidator;
    private SecureSecretGenerator secretGenerator;
    private StringRedisTemplate redisTemplate;

    @BeforeEach
    void setUp() {
        entropyValidator = new JwtEntropyValidator();
        secretGenerator = new SecureSecretGenerator(entropyValidator);
        keyRotationService = new JwtKeyRotationService(redisTemplate);

        keyRotationService.initialize();

        jwtService = new JwtService(keyRotationService, entropyValidator, secretGenerator);
    }

    @Test 
    void testSecureSecretGeneration() {
        // Test JWT secret generation
        String secret = secretGenerator.generateJwtSecret(64);

        assertNotNull(secret);
        assertTrue(secret.length() > 80);

        //test entropy validation
        EntropyAnalysis entropy = entropyValidator.analyzeEntropy(secret);
        assertTrue(entropy.acceptable(), "Generated secret should have acceptable entropy");
        assertTrue(entropy.entropyRatio() > 0.4, "Entropy ratio should be above minimum");
    }

    @Test
    void testSecureJwtIdGeneration() {
        // Test JWT ID generation
        String jwtId = secretGenerator.generateSecureJwtId();

        assertNotNull(jwtId);
        assertTrue(jwtId.length() >= 16, "JWT ID should be at least 16 characters");

        // Validate JWT ID entropy
        assertTrue(entropyValidator.validateJwtIdEntropy(jwtId),
                "Generated JWT ID should pass entropy validation");
    }

    @Test 
    void testKeyRotationService() {
        // test key generation and validation
        SecretKey currentKey = keyRotationService.getCurrentSigningKey();
        assertNotNull(currentKey);

        assertTrue(keyRotationService.validateJwtIdEntropy(currentKey),
                        "Generated key should pass entropy validation");

        // test key rotation
        String originalKeyId = keyRotationService.getCurrentKeyId();
        keyRotationService.rotateKey();
        String newKeyId = keyRotationService.getCurrentKeyId();

        assertNotEquals(originalKeyId, newKeyId, "Key ID should change after rotation");


        // Test key strength assessment
        KeyStrengthAssessment assessment = keyRotationService.assessCurrentKeyStrength();
        assertNotNull(assessment);
        assertTrue(assessment.isProductionReady(), "New key should be production ready");
        assertTrue(assessment.entropyScore() > 0.6, "Key should have good entropy score");
    }

    @Test
    void testEnhancedTokenGeneration() {
        // Test token generation with security metadata
        String email = "test@example.com";
        UUID userId = UUID.randomUUID();
        String accountType = "USER";
        UUID companyId = UUID.randomUUID();
        String ipAddress = "192.168.1.1";
        String userAgent = "Mozilla/5.0";

        String token = jwtService.generateTokenWithMetadata(
                email, userId, accountType, companyId, ipAddress, userAgent);

        assertNotNull(token);

        // Validate token structure
        String[] tokenParts = token.split("\\.");
        assertEquals(3, tokenParts.length, "JWT should have 3 parts");

        // Test token validation
        assertTrue(jwtService.validateToken(token), "Generated token should be valid");

        // Test security metadata extraction
        TokenSecurityMetadata metadata = jwtService.getTokenSecurityMetadata(token);
        assertNotNull(metadata);
        assertNotNull(metadata.jwtId(), "Token should have JWT ID");
        assertEquals(ipAddress, metadata.ipAddress(), "IP address should be preserved");
        assertEquals(userAgent, metadata.userAgent(), "User agent should be preserved");
    }

    @Test
    void testEnhancedTokenValidation() {
        // Generate a test token
        String token = jwtService.generateTokenWithMetadata(
                "test@example.com", UUID.randomUUID(), "USER", null, "127.0.0.1", "TestAgent");

        // Test comprehensive security validation
        assertTrue(jwtService.validateTokenSecurity(token),
                "Token should pass comprehensive security validation");

        // Test entropy validation
        TokenEntropyResult entropyResult = entropyValidator.validateTokenEntropy(token);
        assertTrue(entropyResult.valid(), "Token should pass entropy validation");
        assertTrue(entropyResult.overallScore() > 0.3, "Token should have acceptable entropy score");

        // Test security claims validation
        io.jsonwebtoken.Claims claims = extractClaims(token);
        SecurityClaimsValidation claimsValidation = entropyValidator.validateSecurityClaims(claims);
        assertTrue(claimsValidation.valid(), "Security claims should be valid");
        assertTrue(claimsValidation.validJwtId(), "JWT ID should be valid");
        assertTrue(claimsValidation.validIssuer(), "Issuer should be valid");
        assertTrue(claimsValidation.validAudience(), "Audience should be valid");
        assertTrue(claimsValidation.validTimestamps(), "Timestamps should be valid");
        assertFalse(claimsValidation.suspiciousClaims(), "Should not detect suspicious claims");
    }

    @Test
    void testKeySecurityAudit() {
        // Perform security audit
        KeySecurityAuditResult auditResult = keyRotationService.auditKeysSecurity();

        assertNotNull(auditResult);
        assertTrue(auditResult.totalKeys() > 0, "Should have at least one key");
        assertTrue(auditResult.overallSecure(), "Keys should be secure");
        assertEquals(0, auditResult.weakKeys(), "Should have no weak keys");
        assertTrue(auditResult.secureKeys() > 0, "Should have secure keys");
    }

    @Test
    void testBackwardCompatibility() {
        // Generate token with current key
        String token = jwtService.generateToken("test@example.com", UUID.randomUUID(), "USER", null);

        // Rotate key
        keyRotationService.rotateKey();

        // Test backward compatibility validation
        assertTrue(keyRotationService.validateBackwardCompatibility(token),
                "Should maintain backward compatibility during grace period");
    }

    @Test
    void testEmergencyRotation() {
        String originalKeyId = keyRotationService.getCurrentKeyId();

        // Trigger emergency rotation
        keyRotationService.emergencyRotation("Security test");

        String newKeyId = keyRotationService.getCurrentKeyId();
        assertNotEquals(originalKeyId, newKeyId, "Emergency rotation should change key");

        // Verify new key is secure
        KeyStrengthAssessment assessment = keyRotationService.assessCurrentKeyStrength();
        assertTrue(assessment.isProductionReady(), "Emergency rotated key should be production ready");
    }

    @Test
    void testEntropyValidatorEdgeCases() {
        // Test with null input
        EntropyAnalysis nullAnalysis = entropyValidator.analyzeEntropy(null);
        assertFalse(nullAnalysis.acceptable());
        assertEquals(0.0, nullAnalysis.entropyRatio());

        // Test with empty string
        EntropyAnalysis emptyAnalysis = entropyValidator.analyzeEntropy("");
        assertFalse(emptyAnalysis.acceptable());

        // Test with low entropy string
        EntropyAnalysis lowEntropyAnalysis = entropyValidator.analyzeEntropy("aaaaaaaaaa");
        assertFalse(lowEntropyAnalysis.acceptable());

        // Test with high entropy string
        String highEntropyString = secretGenerator.generateSecureJwtId(32);
        EntropyAnalysis highEntropyAnalysis = entropyValidator.analyzeEntropy(highEntropyString);
        assertTrue(highEntropyAnalysis.acceptable());
    }

    @Test
    void testSecureRandomStats() {
        SecureRandomStats stats = secretGenerator.getEntropyStats();

        assertNotNull(stats);
        assertNotNull(stats.algorithm());
        assertNotNull(stats.provider());
        assertTrue(stats.entropyRatio() > 0.5, "Entropy ratio should be reasonable");
        assertTrue(stats.uniqueByteCount() > 100, "Should have good byte diversity");
        assertTrue(stats.meetsSecurityRequirements(), "Should meet security requirements");
    }

    /**
     * Helper method to extract claims from token
     */
    private io.jsonwebtoken.Claims extractClaims(String token) {
        return io.jsonwebtoken.Jwts.parserBuilder()
                .setSigningKey(keyRotationService.getCurrentSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}