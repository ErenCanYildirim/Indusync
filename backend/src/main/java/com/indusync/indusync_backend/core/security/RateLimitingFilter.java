package com.indusync.indusync_backend.core.security;

import com.indusync.indusync_backend.shared.security.RateLimitingService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingFilter implements Filter {

    private final RateLimitingService rateLimitingService;

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String ipAddress = getClientIpAddress(httpRequest);
        String requestPath = httpRequest.getRequestURI();

        // Auth endpoints throttling
        if (isAuthenticationEndpoint(requestPath)) {
            if (rateLimitingService.canAttemptAuthentication(ipAddress)) {
                log.warn("Authentication rate limit exceeded for IP: {}", ipAddress);
                sendRateLimitExceededResponse(httpResponse, "Authentication rate limit exceeded");
                return;
            }
            long remaining = rateLimitingService.getRemainingAttempts(ipAddress);
            httpResponse.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));
            httpResponse.setHeader("X-RateLimit-Reset", "900");
        }

        // Global API rate limiting
        if (rateLimitingService.canMakeRequest(ipAddress)) {
            log.warn("API rate limit exceeded for IP: {}", ipAddress);
            sendRateLimitExceededResponse(httpResponse, "API rate limit exceeded");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isAuthenticationEndpoint(String path) {
        return path.contains("/auth/login") ||
                path.contains("/auth/register") ||
                path.contains("/auth/refresh");
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return requests.getRemoteAddr();
    }

    private void sendRateLimitExceededResponse(HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(429);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"" + message + "\",\"code\":429}");
    }
}