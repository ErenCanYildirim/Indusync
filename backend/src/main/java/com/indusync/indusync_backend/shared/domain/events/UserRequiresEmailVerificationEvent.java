package com.indusync.indusync_backend.shared.domain.events;

import java.util.UUID;

/**
 * Domain event fired when a user needs to verify their email address.
 *
 * @param userId        the user's ID
 * @param email         the user's email address
 * @param firstName     the user's first name
 * @param verificationToken the email verification token
 */
public record UserRequiresEmailVerificationEvent(
        UUID userId,
        String email,
        String firstName,
        String verificationToken
) {
} 