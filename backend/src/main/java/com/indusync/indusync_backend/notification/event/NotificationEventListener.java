package com.indusync.indusync_backend.notification.event;

import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.shared.domain.events.UserRequiresEmailVerificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Listens for notification events and delegates to appropriate notification
 * service.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;

    /**
     * Handles email verification events by sending verification emails.
     *
     * @param event The email verification event
     */
    @Async 
    @EventListener 
    public void handleUserRequiresEmailVerification(UserRequiresEmailVerificationEvent event) {
        log.info("Handling email verification event for user: {}", event.email());
        try {
            notificationService.sendVerificationEmail(
                    event.email(),
                    event.firstName(),
                    event.verificationToken());
            log.info("Verification email sent successfully to: {}", event.email());
        } catch (Exception e) {
            log.error("Failed to send verification email to: {}", event.email(), e);
        }
    }

     /**
     * Asynchronously handles notification events by routing them to the appropriate
     * notification service method.
     *
     * @param event The notification event to be processed
     */
    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        log.info("Received notification event: {}", event);

        if (event.getType() != NotificationEvent.NotificationType.EMAIL) {
            log.warn("Notification type {} not yet supported", event.getType());
            return;
        }

        try {
            if (event.getRecipient() != null) {
                notificationService.sendEmail(
                        event.getRecipient(),
                        event.getSubject(),
                        event.getTemplateName(),
                        event.getVariables());
            } else if (event.getRecipients() != null && !event.getRecipients().isEmpty()) {
                notificationService.sendBulkEmails(
                        event.getRecipients(),
                        event.getSubject(),
                        event.getTemplateName(),
                        event.getVariables());
            } else {
                log.error("Notification event has no recipients defined");
            }
        } catch (Exception e) {
            log.error("Error processing notification event: {}", event, e);
        }
    }
}