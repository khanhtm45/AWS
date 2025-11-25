package com.leafshop.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger logger = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;

    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(text);
            mailSender.send(msg);
        } catch (MailException e) {
            // Log and swallow exception so OTP/token flow isn't broken by mail issues
            logger.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        } catch (Exception e) {
            logger.error("Unexpected error sending email to {}: {}", to, e.getMessage(), e);
        }
    }
}
