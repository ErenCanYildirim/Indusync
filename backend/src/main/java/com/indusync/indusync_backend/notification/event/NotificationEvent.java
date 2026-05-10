package com.indusync.indusync_backend.notification.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Event class for notification events.
 * Contains all necessary data to send a notification.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {

      /**
     * Single recipient email address
     */
    private String recipient;

    /**
     * Multiple recipient email addresses for bulk emails
     */
    private List<String> recipients;

    /**
     * Subject of the notification
     */
    private String subject;

    /**
     * Template name to be used for rendering the notification content
     */
    private String templateName;

    /**
     * Variables to be used in the template
     */
    private Map<String, Object> variables;

    /**
     * Type of notification (e.g., EMAIL, SMS, PUSH)
     */
    private NotificationType type;

    /**
     * Priority of the notification
     */
    private NotificationPriority priority;

    /**
     * Enumeration of notification types
     */
    public enum NotificationType {
        EMAIL, SMS, PUSH
    }

    /**
     * Enumeration of notification priorities
     */
    public enum NotificationPriority {
        LOW, NORMAL, HIGH
    }
}