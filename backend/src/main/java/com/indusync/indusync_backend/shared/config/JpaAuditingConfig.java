package com.indusync.indusync_backend.shared.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.UUID;

/**
 * Configuration for JPA Auditing functionality.
 * <p>
 * This configuration:
 * - Enables JPA auditing for automatic timestamp and user tracking
 * - Provides custom AuditorAware implementation to populate createdBy/updatedBy fields
 * - Handles both authenticated and system operations
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaAuditingConfig {

    /**
     * Custom AuditorAware implementation that provides the current user's UUID
     * for auditing purposes.
     *
     * @return AuditorAware instance that resolves current user UUID
     */
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return new SpringSecurityAuditorAware();
    }

    /**
     * Implementation of AuditorAware that extracts the current user's UUID
     * from the Spring Security context.
     */
    public static class SpringSecurityAuditorAware implements AuditorAware<UUID> {

        /**
         * System user UUID for operations performed by the system itself.
         * This is used when no authenticated user is available.
         */
        private static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000000");

        /**
         * Gets the current auditor (user UUID) from the security context.
         * <p>
         * This method:
         * 1. Attempts to get the current authentication from SecurityContext
         * 2. Extracts user information from the authentication
         * 3. Returns SYSTEM_USER_ID for non-authenticated operations
         * </p>
         *
         * @return Optional containing the current user's UUID or SYSTEM_USER_ID
         */
        @Override
        public Optional<UUID> getCurrentAuditor() {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            
            if (authentication == null || 
                !authentication.isAuthenticated() || 
                "anonymousUser".equals(authentication.getPrincipal())) {
                // Return system user for non-authenticated operations
                return Optional.of(SYSTEM_USER_ID);
            }

            // Extract user UUID from authentication
            // This will be enhanced when we implement the User entity and JWT handling
            try {
                String principal = authentication.getName();
                if (principal != null && !principal.equals("anonymousUser")) {
                    // For now, we'll extract UUID from custom authentication details
                    // This will be enhanced in later phases when JWT is implemented
                    if (authentication.getDetails() instanceof UUID) {
                        return Optional.of((UUID) authentication.getDetails());
                    }
                    
                    // Try to parse principal as UUID (for direct UUID authentication)
                    try {
                        return Optional.of(UUID.fromString(principal));
                    } catch (IllegalArgumentException e) {
                        // Principal is not a UUID, return system user for now
                        return Optional.of(SYSTEM_USER_ID);
                    }
                }
            } catch (Exception e) {
                // Log the exception in a real application
                // For now, return system user as fallback
                return Optional.of(SYSTEM_USER_ID);
            }

            return Optional.of(SYSTEM_USER_ID);
        }
    }
} 