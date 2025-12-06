package com.leafshop.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailService.class);

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@leafshop.vn}")
    private String fromEmail;

    @Value("${spring.mail.host:}")
    private String mailHost;

    /**
     * Send email with PDF attachment
     */
    public boolean sendEmailWithAttachment(String to, String subject, String htmlBody, byte[] attachment, String filename) {
        try {
            logger.info("Sending email via SMTP host: {} from: {}", mailHost, fromEmail);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            if (attachment != null && attachment.length > 0) {
                helper.addAttachment(filename, new ByteArrayResource(attachment));
            }

            mailSender.send(message);
            logger.info("Email with attachment sent successfully to: {}", to);
            return true;

        } catch (MessagingException e) {
            logger.error("Failed to send email with attachment to {}: {}", to, e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error sending email to {}", to, e);
            return false;
        }
    }

    /**
     * Send simple HTML email
     */
    public boolean sendHtmlEmail(String to, String subject, String htmlBody) {
        return sendEmailWithAttachment(to, subject, htmlBody, null, null);
    }
}
