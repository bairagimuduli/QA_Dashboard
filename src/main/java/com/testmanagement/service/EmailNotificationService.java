package com.testmanagement.service;

import com.testmanagement.config.NotificationProperties;
import com.testmanagement.domain.Feature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final ObjectProvider<JavaMailSender> mailSender;
    private final NotificationProperties notificationProperties;

    public EmailNotificationService(
            ObjectProvider<JavaMailSender> mailSender,
            NotificationProperties notificationProperties) {
        this.mailSender = mailSender;
        this.notificationProperties = notificationProperties;
    }

    public void notifyProductTeamReviewRequested(Feature feature) {
        if (!notificationProperties.isEnabled()) {
            return;
        }
        List<String> to = parseEmails(notificationProperties.getProductTeamEmails());
        if (to.isEmpty()) {
            log.warn("Product team email(s) not configured (PRODUCT_TEAM_EMAILS). Skipping review request for feature id={}",
                    feature.getId());
            return;
        }
        String subject = "[QA Dashboard] Test cases ready for review: " + feature.getTitle();
        String body = """
                Hello product team,

                QA has finished writing test cases for the following feature and requests your review.

                Feature: %s
                Feature ID: %s

                Please open the QA Dashboard, review the test cases, and approve when satisfied.

                """.formatted(feature.getTitle(), feature.getId());
        send(to, subject, body);
    }

    public void notifyAutomationTeamApproved(Feature feature) {
        if (!notificationProperties.isEnabled()) {
            return;
        }
        List<String> to = parseEmails(notificationProperties.getAutomationTeamEmails());
        if (to.isEmpty()) {
            log.warn("Automation team email(s) not configured (AUTOMATION_TEAM_EMAILS). Skipping automation handoff for feature id={}",
                    feature.getId());
            return;
        }
        String subject = "[QA Dashboard] Approved — please automate: " + feature.getTitle();
        String body = """
                Hello automation team,

                The product owner has approved the test cases for the following feature. Please proceed with automation.

                Feature: %s
                Feature ID: %s

                """.formatted(feature.getTitle(), feature.getId());
        send(to, subject, body);
    }

    private void send(List<String> to, String subject, String text) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null) {
            log.info("[SMTP not configured — set SPRING_MAIL_HOST / spring.mail.host] To: {} | Subject: {}", to, subject);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(notificationProperties.getFromAddress());
            message.setTo(to.toArray(new String[0]));
            message.setSubject(subject);
            message.setText(text);
            sender.send(message);
            log.info("Sent mail: subject=\"{}\" to {}", subject, to);
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
        }
    }

    private static List<String> parseEmails(String raw) {
        if (!StringUtils.hasText(raw)) {
            return List.of();
        }
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toList();
    }
}
