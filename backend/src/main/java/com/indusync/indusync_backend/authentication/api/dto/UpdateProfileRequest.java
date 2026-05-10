package com.indusync.indusync_backend.authentication.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data Transfer Object for updating a user's profile information.
 * Used when a logged-in user wants to update their personal details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    /**
     * The user's first name.
     */
    @NotBlank(message = "Vorname darf nicht leer sein")
    @Size(max = 100, message = "Vorname darf maximal 100 Zeichen lang sein")
    private String firstName;

    /**
     * The user's last name.
     */
    @NotBlank(message = "Nachname darf nicht leer sein")
    @Size(max = 100, message = "Nachname darf maximal 100 Zeichen lang sein")
    private String lastName;

    /**
     * The user's phone number (optional).
     */
    @Size(max = 20, message = "Telefonnummer darf maximal 20 Zeichen lang sein")
    private String phone;

    /**
     * The user's website URL (optional).
     */
    @Size(max = 255, message = "Website darf maximal 255 Zeichen lang sein")
    private String website;

    /**
     * Whether the user wants to receive email notifications.
     */
    private Boolean emailNotifications;
}