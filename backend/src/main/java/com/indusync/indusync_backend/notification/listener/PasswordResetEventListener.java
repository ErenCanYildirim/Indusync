package com.indusync.indusync_backend.notification.listener;

import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.shared.domain.events.UserPasswordResetRequestedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;


/**
 * Listener for password reset events.
 * Handles sending password reset emails to users.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordResetEventListener {

     private final NotificationService notificationService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    /**
     * Asynchronously handles password reset events by sending an email with a reset link.
     *
     * @param event The password reset event
     */
    @Async
    @EventListener
    public void handlePasswordResetEvent(UserPasswordResetRequestedEvent event) {
        log.info("Processing password reset request for user ID: {}", event.getUserId());

        Map<String, Object> variables = new HashMap();
        variables.put("name", event.getName());
        variables.put("resetLink", frontendUrl + "/reset-password?token=" + event.getPasswordResetToken());
        variables.put("expirationHours", 2); // Matching the 2-hour expiration in User entity


        notificationService.sendEmail(
            event.getEmail(),
            "Zurücksetzen Ihres Passworts",
            "password-reset",
            variables
        );

        log.info("Password reset email sent to: {}", event.getEmail());
    }
}