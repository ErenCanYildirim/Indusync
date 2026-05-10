package com.indusync.indusync_backend.core.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Added this annotation to enable @PreAuthorize
public class SecurityConfig {

    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);
    private final JwtAuthenticationFilter jwtAuthFilter;
    private final JwtAuthenticationEntryPoint jwtAuthEntryPoint;
    private final RateLimitingFilter rateLimitingFilter;

    @Value("${spring.web.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${spring.web.cors.allowed-methods}")
    private String allowedMethods;

    @Value("${spring.web.cors.allowed-headers}")
    private String allowedHeaders;

    @Value("${spring.web.cors.allow-credentials}")
    private boolean allowCredentials;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, JwtAuthenticationEntryPoint jwtAuthEntryPoint,
            RateLimitingFilter rateLimitingFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.jwtAuthEntryPoint = jwtAuthEntryPoint;
        this.rateLimitingFilter = rateLimitingFilter;
    }

    @Bean 
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        logger.info("Configuring SecurityFilterChain...")

        return http 
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(CorsConfigurationSource()))
            .headers(headers -> headers 
                .httpStrictTransportSecurity(hstsConfig -> hstsConfig 
                    .maxAgeInSeconds(31536000) // 1 year
                    .includeSubDomains(true)
                    .preload(true)
                )
                //prevent clickjacking
                .frameOptions(frameOptions -> frameOptions.deny())
                //prevent MIME sniffing
                .contentTypeOptions(Customizer.withDefaults())
                //add. security headers via custom header writer
                .addHeaderWriter((request, response) -> {
                    // content security policy
                    response.setHeader("Content-Security-Policy",
                                    "default-src 'self'; " +
                                            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                                            "style-src 'self' 'unsafe-inline'; " +
                                            "img-src 'self' data: https:; " +
                                            "font-src 'self'; " +
                                            "connect-src 'self'; " +
                                            "frame-ancestors 'none'");

                    // Referrer Policy
                    response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

                    // Additional security headers
                    response.setHeader("X-Permitted-Cross-Domain-Policies", "none");
                    response.setHeader("X-Download-Options", "noopen");
                    response.setHeader("X-DNS-Prefetch-Control", "off");
                    response.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
                }))
        .authorizeHttpRequests(auth -> {
            logger.info("Configuring authorizeHTTP requests");
            auth 
                //public endpoints
                .requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .requestMatchers("/v1/auth/**").permitAll()
                .requestMatchers("/v1/public/**").permitAll()
                .requestMatchers("/api/v3/api-docs/**", "/api-docs/**").permitAll()
                .requestMatchers("/actuator/**").permitAll();

            logger.info("Public endpoints configured...");

            auth.anyRequest().authenticated();
            logger.info("Protected endpoints configured");
        })
        .exceptionHandling(ex -> {
            ex.authenticationEntryPoint(jwtAuthEntryPoint);
            logger.info("Exception handling configured");
        })
        .sessionManagement(session -> {
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS);
            logger.info("Session management configured");
        })
        // Ensure RateLimitingFilter is placed before
        // UsernamePasswordAuthenticationFilter
        // and register JwtAuthenticationFilter also before it; call order preserves
        // relative order
        .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .build();
    }

    @Bean 
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Parse allowed origins from application.yml
        String[] origins = allowedOrigins.split(",");
        configuration.setAllowedOrigins(Arrays.asList(origins));

        // Parse allowed methods from application.yml
        String[] methods = allowedMethods.split(",");
        configuration.setAllowedMethods(Arrays.asList(methods));

        // Parse allowed headers from application.yml
        String[] headers = allowedHeaders.split(",");
        configuration.setAllowedHeaders(Arrays.asList(headers));

        configuration.setAllowCredentials(allowCredentials);

        logger.info("CORS configuration - Allowed origins: {}", Arrays.toString(origins));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}