package com.indusync.indusync_backend.authentication.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {

    @NotBlank(message = "E-Mail ist erforderlich")
    @Email(message = "E-Mail-Format ist ungültig")
    @Size(max = 255, message = "E-Mail darf maximal 255 Zeichen lang sein")
    private String email;

    @NotBlank(message = "Passwort ist erforderlich")
    @Size(max = 255, message = "Passwort darf maximal 255 Zeichen lang sein")
    private String password;

    @Builder.Default
    private Boolean rememberMe = false;

    @Size(max = 256, message = "Device fingerprint darf maximal 256 Zeichen lang sein")
    private String deviceFingerprint;
}