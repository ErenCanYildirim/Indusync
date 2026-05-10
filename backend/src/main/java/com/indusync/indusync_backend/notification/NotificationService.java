package com.indusync.indusync_backend.notification;

import com.indusync.indusync_backend.notification.event.NotificationEvent;

import java.util.List;
import java.util.Map;

/**
 * Interface for the Notification Service.
 * Provides methods to send notifications via email and events.
 */
public interface NotificationService {

    /**
     * Sends an email with the specified details.
     *
     * @param to the recipient's email address
     * @param subject the subject of the email
     * @param templateName the name of the email template to use
     * @param variables a map of variables to be used in the email template
     */
    void sendEmail(String to, String subject, String templateName, Map<String, Object> variables);

    /**
     * Sends emails to multiple recipients with the specified details.
     *
     * @param recipients the list of recipient email addresses
     * @param subject the subject of the email
     * @param templateName the name of the email template to use
     * @param variables a map of variables to be used in the email template
     */
    void sendBulkEmails(List<String> recipients, String subject, String templateName, Map<String, Object> variables);

    /**
     * Processes a notification event.
     *
     * @param event the notification event to process
     */
    void processNotificationEvent(NotificationEvent event);

    /**
     * Sends a verification email to a user.
     *
     * @param to the recipient's email address
     * @param name the user's name
     * @param token the verification token
     */
    void sendVerificationEmail(String to, String name, String token);
}