package com.leafshop.service;

import com.leafshop.config.SesProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.ses.SesClient;
import software.amazon.awssdk.services.ses.model.Content;
import software.amazon.awssdk.services.ses.model.Body;
import software.amazon.awssdk.services.ses.model.Destination;
import software.amazon.awssdk.services.ses.model.Message;
import software.amazon.awssdk.services.ses.model.SendEmailRequest;
import software.amazon.awssdk.services.ses.model.SesException;

@Service
public class AwsSesEmailService {

    private static final Logger logger = LoggerFactory.getLogger(AwsSesEmailService.class);

    private final SesClient sesClient;
    private final SesProperties sesProperties;

    public AwsSesEmailService(SesClient sesClient, SesProperties sesProperties) {
        this.sesClient = sesClient;
        this.sesProperties = sesProperties;
    }

    public boolean sendOtpEmail(String to, String otp) {
        String subject = "Your OTP Code";
        String bodyText = String.format("Your OTP code is: %s\nThis code is valid for 10 minutes.", otp);
        return sendSimpleEmail(to, subject, bodyText);
    }

    public boolean sendOrderConfirmation(String to, String orderId, String orderSummary) {
        String subject = String.format("Order Confirmation - %s", orderId);
        String bodyText = String.format("Thank you for your order %s\n\n%s", orderId, orderSummary == null ? "" : orderSummary);
        return sendSimpleEmail(to, subject, bodyText);
    }

    private boolean sendSimpleEmail(String to, String subject, String bodyText) {
        try {
            Destination destination = Destination.builder().toAddresses(to).build();

            Content subj = Content.builder().data(subject).charset("UTF-8").build();
            Content text = Content.builder().data(bodyText).charset("UTF-8").build();
            Body body = Body.builder().text(text).build();
            Message message = Message.builder().subject(subj).body(body).build();

            SendEmailRequest request = SendEmailRequest.builder()
                    .destination(destination)
                    .message(message)
                    .source(sesProperties.getFrom())
                    .build();

            sesClient.sendEmail(request);
            logger.info("Sent email to {} via AWS SES", to);
            return true;
        } catch (SesException e) {
            logger.error("Failed to send email via SES: {}", e.awsErrorDetails() != null ? e.awsErrorDetails().errorMessage() : e.getMessage(), e);
            return false;
        } catch (Exception e) {
            logger.error("Unexpected error sending email via SES", e);
            return false;
        }
    }
}
