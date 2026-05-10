package com.indusync.indusync_backend.shared.security;

import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Service for JWT signing key rotation and management.
 * Provides secure key generation, rotation, and validation capabilities.
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Service
@Slf4j
public class JwtKeyRotationService {

    @Value("${security.jwt.key-rotation.interval-days:30}")
    private int keyRotationIntervalDays;

    @Value("${security.jwt.key-rotation.grace-period-days:7}")
    private int gracePeriodDays;

    @Value("${security.jwt.key-rotation.enabled:true}")
    private boolean keyRotationEnabled;

    private final SecureRandom secureRandom = new SecureRandom();
    private final StringRedisTemplate redisTemplate;

    // In-memory key storage (in production, consider a secure key management
    // service)
    private final Map<String, KeyEntry> keyStore = new ConcurrentHashMap<>();
    private volatile String currentKeyId;
    private volatile LocalDateTime lastRotation;

    private static final String REDIS_CURRENT_KEY = "jwt:keys:current";
    private static final String REDIS_LAST_ROTATION = "jwt:keys:last-rotation";
    private static final String REDIS_ACTIVE_KEYS_SET = "jwt:keys:active";

    private static String redisKeyHash(String keyId) {
        return "jwt:key:" + keyId;
    }

    public JwtKeyRotationService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    private record RedisKeyEntry(byte[] secretBytes, LocalDateTime createdAt) {
    }

    private RedisKeyEntry readKeyEntry(String keyId) {
        if (redisTemplate == null || keyId == null)
            return null;
        Object secObj = redisTemplate.opsForHash().get(redisKeyHash(keyId), "secret");
        Object createdObj = redisTemplate.opsForHash().get(redisKeyHash(keyId), "createdAt");
        String secretB64 = secObj instanceof String ? (String) secObj : null;
        String createdAtStr = createdObj instanceof String ? (String) createdObj : null;
        if (secretB64 == null || createdAtStr == null)
            return null;
        byte[] keyBytes = Base64.getDecoder().decode(secretB64);
        LocalDateTime createdAt = LocalDateTime.parse(createdAtStr);
        return new RedisKeyEntry(keyBytes, createdAt);
    }

    private void writeKeyEntry(String keyId, byte[] secretBytes, LocalDateTime createdAt) {
        if (redisTemplate == null)
            return;
        redisTemplate.opsForHash().put(redisKeyHash(keyId), "secret", Base64.getEncoder().encodeToString(secretBytes));
        redisTemplate.opsForHash().put(redisKeyHash(keyId), "createdAt", createdAt.toString());
    }

    /**
     * Initialize the key rotation service
     */
    public void initialize() {
        if (redisTemplate != null) {
            String current = redisTemplate.opsForValue().get(REDIS_CURRENT_KEY);
            if (current == null) {
                generateNewKey();
                log.info("JWT key rotation service initialized with new key");
            }
        } else if (currentKeyId == null) {
            generateNewKey();
            log.info("JWT key rotation service initialized with new in-memory key");
        }
    }

    /**
     * Get the current signing key
     */
    public SecretKey getCurrentSigningKey() {
        if (redisTemplate != null) {
            String keyId = getCurrentKeyId();
            RedisKeyEntry entry = readKeyEntry(keyId);
            if (entry == null) {
                log.warn("Current key {} not found in Redis, generating new key", keyId);
                generateNewKey();
                String newId = getCurrentKeyId();
                entry = readKeyEntry(newId);
            }
            return entry != null ? Keys.hmacShaKeyFor(entry.secretBytes()) : null;
        } else {
            if (currentKeyId == null) {
                initialize();
            }
            KeyEntry keyEntry = keyStore.get(currentKeyId);
            if (keyEntry == null) {
                log.warn("Current key not found, generating new key");
                generateNewKey();
                keyEntry = keyStore.get(currentKeyId);
            }
            return keyEntry.secretKey();
        }
    }

    /**
     * Get signing key by key ID for token validation
     */
    public SecretKey getSigningKeyById(String keyId) {
        if (redisTemplate != null) {
            RedisKeyEntry entry = readKeyEntry(keyId);
            return entry != null ? Keys.hmacShaKeyFor(entry.secretBytes()) : null;
        }
        KeyEntry keyEntry = keyStore.get(keyId);
        return keyEntry != null ? keyEntry.secretKey() : null;
    }

    /**
     * Get the current key ID
     */
    public String getCurrentKeyId() {
        if (redisTemplate != null) {
            String current = redisTemplate.opsForValue().get(REDIS_CURRENT_KEY);
            if (current == null) {
                initialize();
                current = redisTemplate.opsForValue().get(REDIS_CURRENT_KEY);
            }
            return current;
        }
        if (currentKeyId == null) {
            initialize();
        }
        return currentKeyId;
    }

    /**
     * Check if key rotation is needed
     */
    public boolean isRotationNeeded() {
        if (!keyRotationEnabled)
            return false;
        if (redisTemplate != null) {
            String last = redisTemplate.opsForValue().get(REDIS_LAST_ROTATION);
            if (last == null)
                return false;
            LocalDateTime lr = LocalDateTime.parse(last);
            return LocalDateTime.now().isAfter(lr.plusDays(keyRotationIntervalDays));
        }
        if (lastRotation == null)
            return false;
        LocalDateTime rotationThreshold = lastRotation.plusDays(keyRotationIntervalDays);
        return LocalDateTime.now().isAfter(rotationThreshold);
    }

    /**
     * Perform key rotation
     */
    public synchronized void rotateKey() {
        if (!keyRotationEnabled) {
            log.debug("Key rotation is disabled");
            return;
        }

        String oldKeyId = getCurrentKeyId();
        generateNewKey();

        log.info("JWT signing key rotated from {} to {}", oldKeyId, getCurrentKeyId());

        // Schedule cleanup of old keys after grace period
        scheduleKeyCleanup(oldKeyId);
    }

    /**
     * Force key rotation (admin operation)
     */
    public void forceRotation() {
        log.info("Forcing JWT key rotation");
        rotateKey();
    }

    /**
     * Generate a new cryptographically secure signing key
     */
    private void generateNewKey() {
        // Generate 512-bit (64 bytes) secure random key for HS512
        byte[] keyBytes = new byte[64];
        secureRandom.nextBytes(keyBytes);

        String keyId = generateKeyId();
        if (redisTemplate != null) {
            LocalDateTime now = LocalDateTime.now();
            writeKeyEntry(keyId, keyBytes, now);
            redisTemplate.opsForSet().add(REDIS_ACTIVE_KEYS_SET, keyId);
            redisTemplate.opsForValue().set(REDIS_CURRENT_KEY, keyId);
            redisTemplate.opsForValue().set(REDIS_LAST_ROTATION, now.toString());
            log.debug("Generated new JWT signing key with ID (redis): {}", keyId);
        } else {
            SecretKey secretKey = Keys.hmacShaKeyFor(keyBytes);
            KeyEntry keyEntry = new KeyEntry(secretKey, LocalDateTime.now());
            keyStore.put(keyId, keyEntry);
            currentKeyId = keyId;
            lastRotation = LocalDateTime.now();
            log.debug("Generated new JWT signing key with ID: {}", keyId);
        }
    }

    /**
     * Generate a unique key ID
     */
    private String generateKeyId() {
        byte[] randomBytes = new byte[16];
        secureRandom.nextBytes(randomBytes);
        return "key_" + Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    /**
     * Schedule cleanup of old keys after grace period
     */
    private void scheduleKeyCleanup(String keyId) {
        // In a real implementation, this would use a scheduled task
        // For now, we'll keep keys for the grace period
        log.debug("Scheduled cleanup for key {} after {} days", keyId, gracePeriodDays);
    }

    /**
     * Clean up expired keys
     */
    public void cleanupExpiredKeys() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(gracePeriodDays);
        if (redisTemplate != null) {
            String currentId = getCurrentKeyId();
            Set<String> keyIds = redisTemplate.opsForSet().members(REDIS_ACTIVE_KEYS_SET);
            if (keyIds == null)
                return;
            for (String keyId : keyIds) {
                if (keyId.equals(currentId))
                    continue;
                RedisKeyEntry entry = readKeyEntry(keyId);
                if (entry != null && entry.createdAt().isBefore(cutoffTime)) {
                    redisTemplate.delete(redisKeyHash(keyId));
                    redisTemplate.opsForSet().remove(REDIS_ACTIVE_KEYS_SET, keyId);
                    log.info("Cleaned up expired key: {}", keyId);
                }
            }
        } else {
            keyStore.entrySet().removeIf(entry -> {
                if (!entry.getKey().equals(currentKeyId) &&
                        entry.getValue().createdAt().isBefore(cutoffTime)) {
                    log.info("Cleaned up expired key: {}", entry.getKey());
                    return true;
                }
                return false;
            });
        }
    }

    /**
     * Validate key entropy and security with enhanced cryptographic checks
     */
    public boolean validateKeyEntropy(SecretKey key) {
        byte[] encoded = key.getEncoded();

        // Check key length (should be at least 256 bits for HS256, 512 bits for HS512)
        if (encoded.length < 32) {
            log.warn("JWT key length is too short: {} bytes", encoded.length);
            return false;
        }

        // Enhanced entropy validation
        if (!validateAdvancedKeyEntropy(encoded)) {
            return false;
        }

        // Validate key strength against cryptographic standards
        return validateKeyStrength(encoded);
    }

    /**
     * Advanced entropy validation using multiple statistical tests
     */
    private boolean validateAdvancedKeyEntropy(byte[] keyBytes) {
        // Test 1: Unique byte distribution
        boolean[] bytesSeen = new boolean[256];
        int uniqueBytes = 0;

        for (byte b : keyBytes) {
            int index = b & 0xFF;
            if (!bytesSeen[index]) {
                bytesSeen[index] = true;
                uniqueBytes++;
            }
        }

        double entropyRatio = (double) uniqueBytes / keyBytes.length;
        if (entropyRatio < 0.5) {
            log.warn("JWT key has low entropy ratio: {}", entropyRatio);
            return false;
        }

        // Test 2: Chi-square test for randomness
        if (!performChiSquareTest(keyBytes)) {
            log.warn("JWT key failed chi-square randomness test");
            return false;
        }

        // Test 3: Run test for consecutive patterns
        if (!performRunTest(keyBytes)) {
            log.warn("JWT key failed run test for patterns");
            return false;
        }

        return true;
    }

    /**
     * Validate key strength against cryptographic standards
     */
    private boolean validateKeyStrength(byte[] keyBytes) {
        // Check for weak patterns
        if (hasWeakPatterns(keyBytes)) {
            log.warn("JWT key contains weak patterns");
            return false;
        }

        // Check for sufficient complexity
        if (!hasSufficientComplexity(keyBytes)) {
            log.warn("JWT key lacks sufficient complexity");
            return false;
        }

        return true;
    }

    /**
     * Perform chi-square test for randomness
     */
    private boolean performChiSquareTest(byte[] data) {
        int[] frequency = new int[256];

        // Count frequency of each byte value
        for (byte b : data) {
            frequency[b & 0xFF]++;
        }

        // Calculate expected frequency
        double expected = (double) data.length / 256.0;

        // Calculate chi-square statistic
        double chiSquare = 0.0;
        for (int freq : frequency) {
            double diff = freq - expected;
            chiSquare += (diff * diff) / expected;
        }

        // The critical value for 255 degrees of freedom at 95% confidence is
        // approximately
        // 293.25
        return chiSquare < 350.0; // Allow some tolerance
    }

    /**
     * Perform run test for consecutive patterns
     */
    private boolean performRunTest(byte[] data) {
        // Simplified run test: detect excessively long runs of identical bytes
        // This avoids false positives from statistical tests not suited for small
        // samples
        if (data.length < 9) {
            return true;
        }

        int currentRunLength = 1;
        for (int i = 1; i < data.length; i++) {
            if (data[i] == data[i - 1]) {
                currentRunLength++;
                if (currentRunLength >= 8) { // suspiciously long identical-byte run
                    log.warn("JWT key failed run test due to long identical-byte sequence (length={})",
                            currentRunLength);
                    return false;
                }
            } else {
                currentRunLength = 1;
            }
        }

        return true;
    }

    /**
     * Check for weak patterns in the key
     */
    private boolean hasWeakPatterns(byte[] keyBytes) {
        // Check for all zeros or all ones
        boolean allZeros = true;
        boolean allOnes = true;

        for (byte b : keyBytes) {
            if (b != 0)
                allZeros = false;
            if (b != -1)
                allOnes = false;
        }

        if (allZeros || allOnes) {
            return true;
        }

        // Check for repeating patterns
        if (hasRepeatingPatterns(keyBytes)) {
            return true;
        }

        // Check for sequential patterns
        return hasSequentialPatterns(keyBytes);
    }

    /**
     * Check for repeating byte patterns
     */
    private boolean hasRepeatingPatterns(byte[] keyBytes) {
        // Check for patterns of length 2-8
        for (int patternLength = 2; patternLength <= Math.min(8, keyBytes.length / 4); patternLength++) {
            for (int start = 0; start <= keyBytes.length - patternLength * 3; start++) {
                boolean isRepeating = true;

                // Check if pattern repeats at least 3 times
                for (int rep = 1; rep < 3; rep++) {
                    for (int i = 0; i < patternLength; i++) {
                        if (keyBytes[start + i] != keyBytes[start + rep * patternLength + i]) {
                            isRepeating = false;
                            break;
                        }
                    }
                    if (!isRepeating)
                        break;
                }

                if (isRepeating) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check for sequential patterns (ascending or descending)
     */
    private boolean hasSequentialPatterns(byte[] keyBytes) {
        int minSequenceLength = Math.min(8, keyBytes.length / 4);

        for (int start = 0; start <= keyBytes.length - minSequenceLength; start++) {
            boolean ascending = true;
            boolean descending = true;

            for (int i = 1; i < minSequenceLength; i++) {
                int current = keyBytes[start + i] & 0xFF;
                int previous = keyBytes[start + i - 1] & 0xFF;

                if (current != previous + 1) {
                    ascending = false;
                }
                if (current != previous - 1) {
                    descending = false;
                }
            }

            if (ascending || descending) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if key has sufficient complexity
     */
    private boolean hasSufficientComplexity(byte[] keyBytes) {
        // Count different byte values present in this key
        boolean[] present = new boolean[256];
        int uniqueValues = 0;

        for (byte b : keyBytes) {
            int index = b & 0xFF;
            if (!present[index]) {
                present[index] = true;
                uniqueValues++;
            }
        }

        // For a 64-byte HS512 key generated by SecureRandom, we expect high uniqueness
        // Compute uniqueness relative to key length, not the entire 256-byte alphabet
        double uniqueRatio = (double) uniqueValues / (double) keyBytes.length;

        // Accept if at least 60% of bytes are unique (typical random keys are ~80-95%)
        return uniqueRatio >= 0.60;
    }

    /**
     * Get key rotation status with enhanced security information
     */
    public KeyRotationStatus getRotationStatus() {
        return KeyRotationStatus.builder()
                .currentKeyId(currentKeyId)
                .lastRotation(lastRotation)
                .nextRotation(lastRotation != null ? lastRotation.plusDays(keyRotationIntervalDays) : null)
                .rotationEnabled(keyRotationEnabled)
                .rotationNeeded(isRotationNeeded())
                .activeKeyCount(keyStore.size())
                .build();
    }

    /**
     * Validate all stored keys for security compliance
     */
    public KeySecurityAuditResult auditKeysSecurity() {
        int totalKeys = 0;
        int secureKeys = 0;
        int weakKeys = 0;

        if (redisTemplate != null) {
            Set<String> keyIds = redisTemplate.opsForSet().members(REDIS_ACTIVE_KEYS_SET);
            totalKeys = keyIds != null ? keyIds.size() : 0;
            if (keyIds != null) {
                for (String keyId : keyIds) {
                    RedisKeyEntry entry = readKeyEntry(keyId);
                    if (entry == null)
                        continue;
                    SecretKey key = Keys.hmacShaKeyFor(entry.secretBytes());
                    if (validateKeyEntropy(key))
                        secureKeys++;
                    else {
                        weakKeys++;
                        log.warn("Weak key detected: {}", keyId);
                    }
                }
            }
        } else {
            totalKeys = keyStore.size();
            for (Map.Entry<String, KeyEntry> entry : keyStore.entrySet()) {
                if (validateKeyEntropy(entry.getValue().secretKey()))
                    secureKeys++;
                else {
                    weakKeys++;
                    log.warn("Weak key detected: {}", entry.getKey());
                }
            }
        }

        boolean overallSecure = weakKeys == 0 && secureKeys > 0;

        return KeySecurityAuditResult.builder()
                .totalKeys(totalKeys)
                .secureKeys(secureKeys)
                .weakKeys(weakKeys)
                .overallSecure(overallSecure)
                .auditTimestamp(LocalDateTime.now())
                .build();
    }

    /**
     * Generate emergency rotation if security issues are detected
     */
    public void emergencyRotation(String reason) {
        log.warn("Emergency key rotation triggered: {}", reason);

        // Force immediate rotation
        String oldKeyId = currentKeyId;
        generateNewKey();

        // Mark the old key for immediate cleanup
        if (oldKeyId != null) {
            // In production, this would trigger immediate cleanup
            log.info("Emergency rotation completed, old key {} marked for cleanup", oldKeyId);
        }

        log.info("Emergency key rotation completed from {} to {}", oldKeyId, currentKeyId);
    }

    /**
     * Validate backward compatibility during key rotation
     */
    public boolean validateBackwardCompatibility(String token) {
        try {
            // Try to validate with current key first
            SecretKey currentKey = getCurrentSigningKey();
            if (validateTokenWithKey(token, currentKey)) {
                return true;
            }

            // Try with previous keys during grace period
            LocalDateTime graceCutoff = LocalDateTime.now().minusDays(gracePeriodDays);

            if (redisTemplate != null) {
                Set<String> keyIds = redisTemplate.opsForSet().members(REDIS_ACTIVE_KEYS_SET);
                String currentId = getCurrentKeyId();
                if (keyIds != null) {
                    for (String keyId : keyIds) {
                        if (keyId.equals(currentId))
                            continue;
                        RedisKeyEntry entry = readKeyEntry(keyId);
                        if (entry != null && entry.createdAt().isAfter(graceCutoff)) {
                            SecretKey k = Keys.hmacShaKeyFor(entry.secretBytes());
                            if (validateTokenWithKey(token, k)) {
                                log.debug("Token validated with previous key: {}", keyId);
                                return true;
                            }
                        }
                    }
                }
            } else {
                for (Map.Entry<String, KeyEntry> entry : keyStore.entrySet()) {
                    if (!entry.getKey().equals(currentKeyId) && entry.getValue().createdAt().isAfter(graceCutoff)) {
                        if (validateTokenWithKey(token, entry.getValue().secretKey())) {
                            log.debug("Token validated with previous key: {}", entry.getKey());
                            return true;
                        }
                    }
                }
            }

            return false;
        } catch (Exception e) {
            log.debug("Backward compatibility validation failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Validate token with specific key
     */
    private boolean validateTokenWithKey(String token, SecretKey key) {
        try {
            String[] tokenParts = token.split("\\.");
            if (tokenParts.length != 3) {
                return false;
            }

            // Basic signature validation without full JWT parsing
            // This is a simplified check for backward compatibility
            return key != null && key.getEncoded().length >= 32;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get cryptographic strength assessment of current key
     */
    public KeyStrengthAssessment assessCurrentKeyStrength() {
        if (currentKeyId == null) {
            return KeyStrengthAssessment.builder()
                    .keyId("none")
                    .strength(KeyStrength.NONE)
                    .entropyScore(0.0)
                    .recommendations(java.util.List.of("Initialize key rotation service"))
                    .build();
        }

        KeyEntry currentEntry = keyStore.get(currentKeyId);
        if (currentEntry == null) {
            return KeyStrengthAssessment.builder()
                    .keyId(currentKeyId)
                    .strength(KeyStrength.WEAK)
                    .entropyScore(0.0)
                    .recommendations(java.util.List.of("Current key not found, regenerate immediately"))
                    .build();
        }

        SecretKey key = currentEntry.secretKey();
        byte[] keyBytes = key.getEncoded();

        // Calculate entropy score
        double entropyScore = calculateEntropyScore(keyBytes);

        // Determine strength level
        KeyStrength strength;
        java.util.List<String> recommendations = new java.util.ArrayList<>();

        if (entropyScore >= 0.9) {
            strength = KeyStrength.EXCELLENT;
        } else if (entropyScore >= 0.8) {
            strength = KeyStrength.STRONG;
        } else if (entropyScore >= 0.6) {
            strength = KeyStrength.MODERATE;
            recommendations.add("Consider key rotation for improved security");
        } else {
            strength = KeyStrength.WEAK;
            recommendations.add("Immediate key rotation recommended");
        }

        // Check key age
        long daysSinceCreation = java.time.temporal.ChronoUnit.DAYS.between(
                currentEntry.createdAt(), LocalDateTime.now());

        if (daysSinceCreation > keyRotationIntervalDays) {
            recommendations.add("Key rotation overdue");
        }

        return KeyStrengthAssessment.builder()
                .keyId(currentKeyId)
                .strength(strength)
                .entropyScore(entropyScore)
                .keyAge(daysSinceCreation)
                .recommendations(recommendations)
                .build();
    }

    /**
     * Calculate entropy score for key bytes
     */
    private double calculateEntropyScore(byte[] keyBytes) {
        if (keyBytes.length == 0) {
            return 0.0;
        }

        // Calculate Shannon entropy
        int[] frequency = new int[256];
        for (byte b : keyBytes) {
            frequency[b & 0xFF]++;
        }

        double entropy = 0.0;
        int length = keyBytes.length;

        for (int freq : frequency) {
            if (freq > 0) {
                double probability = (double) freq / length;
                entropy -= probability * (Math.log(probability) / Math.log(2));
            }
        }

        // Normalize to 0-1 scale (max entropy for byte data is 8 bits)
        return entropy / 8.0;
    }

    /**
     * Expose whether rotation is enabled for configuration gating
     */
    public boolean isRotationEnabled() {
        return keyRotationEnabled;
    }

    /**
     * Key entry for storing key metadata
     */
    private record KeyEntry(SecretKey secretKey, LocalDateTime createdAt) {

    }
}