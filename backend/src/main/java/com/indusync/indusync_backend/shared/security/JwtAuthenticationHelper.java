package com.indusync.indusync_backend.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Optional;
import java.util.UUID;

/**
 * Helper class for JWT authentication operations.
 * Centralizes all JWT token extraction and processing logic.
 * 
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationHelper {
    
    private final JwtService jwtService;
    
    /**
     * Extract JWT token from HTTP request Authorization header.
     */
    public String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
    
    /**
     * Extract JWT token from Spring Security Authentication object.
     */
    public String getTokenFromAuthentication(Authentication authentication) {
        if (authentication != null && authentication.getDetails() instanceof String) {
            return (String) authentication.getDetails();
        }

        try {
            RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes()).getRequest();
            return jwtService.extractTokenFromRequest(request);
        } catch (Exception e) {
            log.debug("Could not extract token from request context: {}", e.getMessage());
        }

        return null;
    }
    
    /**
     * Extract user ID from authentication context.
     */
    public UUID extractUserIdFromAuthentication(Authentication authentication) {
        try {
            String token = getTokenFromAuthentication(authentication);
            if (token != null) {
                return jwtService.extractUserId(token);
            }
            
            log.debug("No JWT token found in authentication context");
            return null;
        } catch (Exception e) {
            log.error("Error extracting user ID from authentication: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Extract current company ID from authentication context.
     */
    public UUID extractCurrentCompanyIdFromAuthentication(Authentication authentication) {
        try {
            String token = getTokenFromAuthentication(authentication);
            if (token != null) {
                return jwtService.extractCurrentCompanyId(token);
            }
            
            log.debug("No JWT token found in authentication context");
            return null;
        } catch (Exception e) {
            log.error("Error extracting current company ID from authentication: {}", e.getMessage());
            return null;
        }
    }
    
    /**
     * Check if authentication context is valid.
     */
    public boolean isValidAuthenticationContext(Authentication authentication) {
        try {
            String token = getTokenFromAuthentication(authentication);
            return token != null && jwtService.validateToken(token);
        } catch (Exception e) {
            log.debug("Invalid authentication context: {}", e.getMessage());
            return false;
        }
    }
    
    /**
     * Get complete authentication context from Spring Security Authentication.
     */
    public Optional<AuthenticationContext> getAuthenticationContext(Authentication authentication) {
        try {
            String token = getTokenFromAuthentication(authentication);
            if (token == null) {
                return Optional.empty();
            }
            
            UUID userId = jwtService.extractUserId(token);
            UUID currentCompanyId = jwtService.extractCurrentCompanyId(token);
            String email = jwtService.extractUsername(token);
            String accountType = jwtService.extractAccountType(token);
            var roles = jwtService.extractRoles(token);
            
            return Optional.of(AuthenticationContext.builder()
                .userId(userId)
                .currentCompanyId(currentCompanyId)
                .email(email)
                .accountType(accountType)
                .roles(roles)
                .token(token)
                .build());
                
        } catch (Exception e) {
            log.error("Error building authentication context: {}", e.getMessage());
            return Optional.empty();
        }
    }
    
    /**
     * Get client IP address from HTTP request.
     */
    public String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
}