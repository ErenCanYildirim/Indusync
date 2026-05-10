package com.indusync.indusync_backend.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration test for JWT security enhancements.
 * Tests the complete integration of all security components.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@SpringBootTest
@ActiveProfiles("test")
class JwtSecurityIntegrationTest {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private JwtKeyRotationService keyRotationService;

    @Autowired
    private JwtEntropyValidator entropyValidator;

    @Autowired
    private SecureSecretGenerator secretGenerator;

    @Autowired
    private JwtBlacklistService jwtBlacklistService;

    @Test
    void testCompleteJwtSecurityWorkflow() {
        // 1. Generate a secure token with metadata
        String email = "integration.test@example.com";
        UUID userId = UUID.randomUUID();
        String ipAddress = "10.0.0.1";
        String userAgent = "IntegrationTestAgent/1.0";

        String accessToken = jwtService.generateTokenWithMetadata(
                email, userId, "USER", null, ipAddress, userAgent);
        String refreshToken = jwtService.generateRefreshTokenWithMetadata(
                email, userId, ipAddress, userAgent);

        assertNotNull(accessToken);
        assertNotNull(refreshToken);

        // 2. Validate tokens pass all security checks
        assertTrue(jwtService.validateTokenSecurity(accessToken));
        assertTrue(jwtService.validateTokenSecurity(refreshToken));

        // 3. Store tokens in blacklist service for tracking
        jwtBlacklistService.storeToken(accessToken, userId, ipAddress, userAgent, null);
        jwtBlacklistService.storeToken(refreshToken, userId, ipAddress, userAgent, null);

        // 4. Verify tokens are not blacklisted initially
        assertFalse(jwtBlacklistService.isTokenBlacklisted(accessToken));
        assertFalse(jwtBlacklistService.isTokenBlacklisted(refreshToken));

        // 5. Test token refresh with rotation
        TokenRotationResult rotationResult = jwtService.secureRefreshTokens(
                refreshToken, ipAddress, userAgent, jwtBlacklistService);

        assertNotNull(rotationResult);
        assertNotNull(rotationResult.accessToken());
        assertNotNull(rotationResult.newRefreshToken());

        // 6. Verify old refresh token is now blocklisted (single-use enforcement)
        assertTrue(jwtBlacklistService.isTokenBlacklisted(refreshToken));

        // 7. Verify new tokens are valid
        assertTrue(jwtService.validateTokenSecurity(rotationResult.accessToken()));
        assertTrue(jwtService.validateTokenSecurity(rotationResult.newRefreshToken()));

        // 8. Test key rotation doesn't break existing tokens
        keyRotationService.rotateKey();

        // New tokens should still validate (backward compatibility)
        assertTrue(jwtService.validateTokenSecurity(rotationResult.accessToken()));

        // 9. Test security audit
        KeySecurityAuditResult auditResult = keyRotationService.auditKeysSecurity();
        assertTrue(auditResult.overallSecure());

        // 10. Test entropy validation
        TokenEntropyResult entropyResult = entropyValidator.validateTokenEntropy(rotationResult.accessToken());
        assertTrue(entropyResult.valid());
    }

    @Test
    void testSecurityConfigurationIntegration() {
        // Test that all security components are properly configured
        assertNotNull(jwtService);
        assertNotNull(keyRotationService);
        assertNotNull(entropyValidator);
        assertNotNull(secretGenerator);
        assertNotNull(jwtBlacklistService);

        // Test key rotation service is initialized
        assertNotNull(keyRotationService.getCurrentKeyId());
        assertNotNull(keyRotationService.getCurrentSigningKey());

        // Test entropy generator is working
        SecureRandomStats stats = secretGenerator.getEntropyStats();
        assertTrue(stats.meetsSecurityRequirements());

        // Test key strength assessment
        KeyStrengthAssessment assessment = keyRotationService.assessCurrentKeyStrength();
        assertTrue(assessment.isProductionReady());
    }

@Test
    void testCryptographicSecurityFeatures() {
        // Test secure secret generation
        String secret = secretGenerator.generateJwtSecret(64);
        EntropyAnalysis secretEntropy = entropyValidator.analyzeEntropy(secret);
        assertTrue(secretEntropy.acceptable());

        // Test secure JWT ID generation
        String jwtId = secretGenerator.generateSecureJwtId();
        assertTrue(entropyValidator.validateJwtIdEntropy(jwtId));

        // Test key entropy validation
        assertTrue(keyRotationService.validateKeyEntropy(keyRotationService.getCurrentSigningKey()));

        // Test token with all security claims
        String token = jwtService.generateTokenWithMetadata(
                "crypto.test@example.com", UUID.randomUUID(), "USER", null, "127.0.0.1", "CryptoTest/1.0");

        // Verify all security claims are present and valid
        TokenSecurityMetadata metadata = jwtService.getTokenSecurityMetadata(token);
        assertNotNull(metadata.jwtId());
        assertNotNull(metadata.issuer());
        assertNotNull(metadata.audience());
        assertNotNull(metadata.issuedAt());
        assertNotNull(metadata.expiresAt());
        assertNotNull(metadata.notBefore());
        assertEquals("127.0.0.1", metadata.ipAddress());
        assertEquals("CryptoTest/1.0", metadata.userAgent());
    }
}