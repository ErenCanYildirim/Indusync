package com.indusync.indusync_backend.authentication.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for changing a user's password.
 * Used when a logged-in user wants to update their password.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    /**
     * The user's current password.
     */
    @NotBlank(message = "Aktuelles Passwort darf nicht leer sein")
    private String currentPassword;

    /**
     * The new password.
     */
    @NotBlank(message = "Neues Passwort darf nicht leer sein")
    @Size(min = 8, message = "Passwort muss mindestens 8 Zeichen lang sein")
    private String newPassword;

    /**
     * Confirmation of the new password.
     */
    @NotBlank(message = "Passwort-Bestätigung darf nicht leer sein")
    private String confirmPassword;
}