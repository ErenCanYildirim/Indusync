package com.indusync.indusync_backend.shared.security;

import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Status information for JWT key rotation.
 * Contains details about current key rotation state and schedule.
 *
 * @param currentKeyId    Current active key ID
 * @param lastRotation    Timestamp of last key rotation
 * @param nextRotation    Scheduled timestamp for next key rotation
 * @param rotationEnabled Whether key rotation is enabled
 * @param rotationNeeded  Whether key rotation is currently needed
 * @param activeKeyCount  Number of active keys in the key store
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Builder
public record KeyRotationStatus(String currentKeyId, LocalDateTime lastRotation, LocalDateTime nextRotation,
                                boolean rotationEnabled, boolean rotationNeeded, int activeKeyCount) {

}