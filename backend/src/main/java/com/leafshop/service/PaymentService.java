package com.leafshop.service;

import com.leafshop.dto.payment.InitiatePaymentRequest;
import com.leafshop.dto.payment.PaymentResponse;
import com.leafshop.dto.payment.RefundRequest;
import com.leafshop.dto.payment.WebhookRequest;

public interface PaymentService {
    PaymentResponse initiatePayment(InitiatePaymentRequest req);

    PaymentResponse getPaymentById(String paymentId);

    PaymentResponse handleWebhook(WebhookRequest webhookRequest);

    PaymentResponse handleStripeWebhook(String payload, String sigHeader);

    PaymentResponse refundPayment(String paymentId, RefundRequest req);

    PaymentResponse processCOD(String orderId, Double amount, String currency);
}
