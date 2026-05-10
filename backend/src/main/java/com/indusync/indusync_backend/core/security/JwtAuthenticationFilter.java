package com.indusync.indusync_backend.core.security;

import com.indusync.indusync_backend.shared.security.JwtService;
import com.indusync.indusync_backend.shared.security.JwtBlacklistService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT Authentication Filter that validates JWT tokens on each request.
 * <p>
 * This filter extracts JWT tokens from the Authorization header, validates
 * them,
 * and sets the Spring Security context if the token is valid. It runs once per
 * request and is applied to all secured endpoints.
 * </p>
 *
 * @author IndusSync Backend Team
 * @since 1.0.0
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final JwtBlacklistService jwtBlacklistService;

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain filterChain 
    ) throws ServletException, IOException {

        // skip auth for public endpoints
        final String requestPath = request.getRequestURI();
        if (isPublicEndpoint(requestPath)) {
            filterChain.doFilter(request, response);
            return;
        }

        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Check if Authorization header is present and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("No valid Authorization header found for path: {}", requestPath);
            filterChain.doFilter(request, response);
            return;
        }

        // Extract JWT token
        jwt = authHeader.substring(7);

        try {
            // Extract username from JWT
            userEmail = jwtService.extractUsername(jwt);
            log.debug("Extracted username from JWT: {}", userEmail);

            // If user email is present and no authentication is set
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

                try {
                    // Load user details
                    UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                    log.debug("Loaded user details for: {}", userEmail);

                    if (userDetails == null) {
                        log.warn("UserDetails is null for user: {}", userEmail);
                        filterChain.doFilter(request, response);
                        return;
                    }

                    // Validate token and check blacklist
                    if (jwtService.isTokenValid(jwt, userDetails)) {

                        // Check if token is blacklisted
                        if (jwtBlacklistService.isTokenBlacklisted(jwt)) {
                            log.warn("Blacklisted JWT token used by user: {} on path: {}", userEmail, requestPath);
                            filterChain.doFilter(request, response);
                            return;
                        }

                        // Record token usage for analytics
                        jwtBlacklistService.recordTokenUsage(jwt);

                        // Create authentication token
                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities());

                        // Set authentication details with JWT token for later use
                        authToken.setDetails(jwt);

                        // Set authentication in security context
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        log.debug("Successfully authenticated user: {} for path: {}", userEmail, requestPath);
                    } else {
                        log.warn("Invalid JWT token for user: {} on path: {}", userEmail, requestPath);
                    }
                } catch (Exception userLoadException) {
                    log.warn("Failed to load user details for: {} - {}", userEmail, userLoadException.getMessage());
                }
            } else if (userEmail == null) {
                log.debug("No username found in JWT token for path: {}", requestPath);
            }

        } catch (Exception e) {
            log.warn("JWT authentication failed: {} for path: {}", e.getMessage(), requestPath);
            // Don't set authentication - let the request proceed without auth
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Check if the endpoint is public and doesn't require authentication.
     *
     * @param requestPath the request path
     * @return true if the endpoint is public
     */
    private boolean isPublicEndpoint(String requestPath) {
        return requestPath.startsWith("api/v1/auth/") ||
                requestPath.startsWith("api/v1/public/") ||
                requestPath.startsWith("/swagger-ui/") ||
                requestPath.startsWith("/v3/api-docs/") ||
                requestPath.startsWith("/actuator/health") ||
                requestPath.equals("/") ||
                requestPath.equals("/favicon.ico") ||
                requestPath.startsWith("/static/") ||
                requestPath.startsWith("/css/") ||
                requestPath.startsWith("/js/") ||
                requestPath.startsWith("/images/");
    }
}