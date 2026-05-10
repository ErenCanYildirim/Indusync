package com.indusync.indusync_backend.authentication.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for password reset requests.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    /**
     * The password reset token received via email.
     */
    @NotBlank(message = "Token darf nicht leer sein")
    private String token;

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