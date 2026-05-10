package com.indusync.indusync_backend.notification.impl;

import com.indusync.indusync_backend.notification.NotificationService;
import com.indusync.indusync_backend.notification.event.NotificationEvent;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.AddressException;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class EmailService implements NotificationService {
    private final JavaMailSender javaMailSender;
    private final TemplateEngine templateEngine;

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.frontend.url}")
    private String frontendUrl;

    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$");

    @Override
    @Async
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        if (!isValidEmail(to)) {
            log.error("Invalid email address: {}", to);
            return;
        }

        try {
            MimeMessage mimeMessage = createMimeMessage(to, subject, templateName, variables);
            log.info("Sending email to : {}", to);
            javaMailSender.send(mimeMessage);
        } catch (MessagingException e) {
            log.error("Failed to send email to : {}", to, e);
        }
    }

    @Override
    @Async
    public void sendBulkEmails(List<String> recipients, String subject, String templateName, Map<String, Object> variables) {
        for (String recipient : recipients) {
            sendEmail(recipient, subject, templateName, variables);
        }
    }

    @Override
    @Async
    public void processNotificationEvent(NotificationEvent event) {
        try {
            if (event.getType() != NotificationEvent.NotificationType.EMAIL) {
                log.warn("Notification type {} not supported by EmailService", event.getType());
                return;
            }

            if (event.getRecipient() != null) {
                sendEmail(
                    event.getRecipient(),
                    event.getSubject(),
                    event.getTemplateName(),
                    event.getVariables()
                );
            } else if (event.getRecipients() != null && !event.getRecipients().isEmpty()) {
                sendBulkEmails(
                    event.getRecipients(),
                    event.getSubject(),
                    event.getTemplateName(),
                    event.getVariables()
                );
            } else {
                log.error("Notification event has no recipients defined");
            }
        } catch (Exception e) {
            log.error("Error processing notification event: {}", event, e);
        }
    }

    private MimeMessage createMimeMessage(String to, String subject, String templateName, Map<String, Object> variables) throws MessagingException {
        MimeMessage mimeMessage = javaMailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true);

        Context context = new Context();
        context.setVariables(variables);
        String htmlContent = templateEngine.process(templateName, context);

        helper.setFrom("info@indusync.eu");
        helper.setTo(to);
        helper.setSubject("Indusync - " + subject);
        helper.setText(htmlContent, true);

        return mimeMessage;
    }

    /**
     * Validates if an email address is in a valid format.
     *
     * @param email the email address to validate
     * @return true if the email is valid, false otherwise
     */
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }

        // First use regex for basic validation
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }

        // Then use Jakarta Mail's stricter validation
        try {
            InternetAddress internetAddress = new InternetAddress(email);
            internetAddress.validate();
            return true;
        } catch (AddressException e) {
            return false;
        }
    }

    @Async
    public void sendVerificationEmail(String to, String name, String token) {
        String subject = "Bitte bestätigen Sie Ihre E-Mail-Adresse";
        String templateName = "email-verification";

        String verificationUrl = frontendUrl + "/verify-email?token=" + token;

        Map<String, Object> variables = Map.of(
                "name", name,
                "verificationUrl", verificationUrl
        );
        log.info("Verification URL: {}", verificationUrl);
        log.info("Sending verification email to: {}", to);

        sendEmail(to, subject, templateName, variables);
        log.info("Verification email sent successfully to: {}", to);
    }
}