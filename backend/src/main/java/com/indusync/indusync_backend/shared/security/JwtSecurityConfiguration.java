package com.indusync.indusync_backend.shared.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Configuration class for JWT security enhancements.
 * Manages initialization and scheduled tasks for JWT security components.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Configuration
@EnableScheduling
@Slf4j
public class JwtSecurityConfiguration {

    private final JwtKeyRotationService keyRotationService;
    private final SecureSecretGenerator secretGenerator;

    public JwtSecurityConfiguration(JwtKeyRotationService keyRotationService,
            SecureSecretGenerator secretGenerator) {
        this.keyRotationService = keyRotationService;
        this.secretGenerator = secretGenerator;
    }

    /**
     * Initialize JWT security components when application is ready
     */
    @EventListener(ApplicationReadyEvent.class)
    public void initializeJwtSecurity() {
        log.info("Initializing JWT security enhancements...");

        try {
            // Initialize key rotation service only if enabled
            if (keyRotationService.isRotationEnabled()) {
                keyRotationService.initialize();
            } else {
                log.debug("JWT key rotation is disabled; skipping initialization");
            }

            // Validate current key security
            if (keyRotationService.isRotationEnabled()) {
                KeySecurityAuditResult auditResult = keyRotationService.auditKeysSecurity();
                log.info("JWT key security audit: {} secure keys, {} weak keys",
                        auditResult.secureKeys(), auditResult.weakKeys());
                if (!auditResult.overallSecure()) {
                    log.warn("JWT key security audit failed - consider key rotation");
                }
            }

            // Validate entropy generator
            SecureRandomStats entropyStats = secretGenerator.getEntropyStats();
            log.info("Entropy generator status: {} ({})",
                    entropyStats.getEntropyQuality(), entropyStats.algorithm());

            if (!entropyStats.meetsSecurityRequirements()) {
                log.warn("Entropy generator does not meet security requirements");
            }

            log.info("JWT security enhancements initialized successfully");

        } catch (Exception e) {
            log.error("Failed to initialize JWT security enhancements: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled task to check if key rotation is needed
     * Runs every hour
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    public void checkKeyRotation() {
        try {
            if (keyRotationService.isRotationEnabled() && keyRotationService.isRotationNeeded()) {
                log.info("JWT key rotation is needed, performing rotation...");
                keyRotationService.rotateKey();
                log.info("JWT key rotation completed successfully");
            }
        } catch (Exception e) {
            log.error("Failed to perform scheduled key rotation: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled task to clean up expired keys
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    public void cleanupExpiredKeys() {
        try {
            if (keyRotationService.isRotationEnabled()) {
                log.debug("Cleaning up expired JWT keys...");
                keyRotationService.cleanupExpiredKeys();
                log.debug("JWT key cleanup completed");
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired keys: {}", e.getMessage(), e);
        }
    }

    /**
     * Scheduled task to perform security audit
     * Runs daily at 3 AM
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void performSecurityAudit() {
        try {
            log.info("Performing JWT security audit...");

            // Audit key security
            if (keyRotationService.isRotationEnabled()) {
                KeySecurityAuditResult auditResult = keyRotationService.auditKeysSecurity();
                log.info("Security audit results: {} total keys, {} secure, {} weak",
                        auditResult.totalKeys(), auditResult.secureKeys(), auditResult.weakKeys());
            }

            // Check key strength
            if (keyRotationService.isRotationEnabled()) {
                KeyStrengthAssessment strengthAssessment = keyRotationService.assessCurrentKeyStrength();
                log.info("Current key strength: {} ({}% security score)",
                        strengthAssessment.strength(), strengthAssessment.getSecurityScorePercentage());

                // Log recommendations
                if (!strengthAssessment.recommendations().isEmpty()) {
                    log.info("Security recommendations: {}",
                            String.join(", ", strengthAssessment.recommendations()));
                }

                // Check if immediate action is required
                if (strengthAssessment.requiresImmediateAction()) {
                    log.warn("JWT key requires immediate attention - triggering emergency rotation");
                    keyRotationService.emergencyRotation("Security audit detected weak key");
                }
            }

        } catch (Exception e) {
            log.error("Failed to perform security audit: {}", e.getMessage(), e);
        }
    }

    /**
     * Get current security status for monitoring
     */
    public JwtSecurityStatus getSecurityStatus() {
        try {
            KeyRotationStatus rotationStatus = keyRotationService.getRotationStatus();
            KeyStrengthAssessment strengthAssessment = keyRotationService.assessCurrentKeyStrength();
            SecureRandomStats entropyStats = secretGenerator.getEntropyStats();

            return JwtSecurityStatus.builder()
                    .keyRotationStatus(rotationStatus)
                    .keyStrengthAssessment(strengthAssessment)
                    .entropyStats(entropyStats)
                    .overallHealthy(strengthAssessment.isProductionReady() &&
                            entropyStats.meetsSecurityRequirements())
                    .build();

        } catch (Exception e) {
            log.error("Failed to get security status: {}", e.getMessage(), e);
            return JwtSecurityStatus.builder()
                    .overallHealthy(false)
                    .build();
        }
    }
}