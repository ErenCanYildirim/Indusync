package com.indusync.indusync_backend.shared.domain.events;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Domain event triggered when a user requests a password reset.
 * This event is used to send password reset emails with a reset link.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserPasswordResetRequestedEvent {
    private UUID userId;
    private String email;
    private String name;
    private String passwordResetToken;

    /**
     * Creates a password reset event with required information.
     *
     * @param userId          the user's unique identifier
     * @param email           the user's email address
     * @param name            the user's name (for personalization)
     * @param resetToken      the password reset token
     * @return a new password reset event
     */
    public static UserPasswordResetRequestedEvent of(UUID userId, String email, String name, String resetToken) {
        return new UserPasswordResetRequestedEvent(userId, email, name, resetToken);
    }
}