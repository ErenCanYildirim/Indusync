package com.indusync.indusync_backend.authentication.application.dto;

import lombok.Builder;
import lombok.Data;

/**
 * Command DTO for user login.
 * Contains credentials and context information for authentication.
 */
@Data
@Builder
public class LoginCommand {

    private String email;
    private String password;
    private String ipAddress;
    private String userAgent;
    private String deviceFingerprint;
    private Boolean rememberMe;
}