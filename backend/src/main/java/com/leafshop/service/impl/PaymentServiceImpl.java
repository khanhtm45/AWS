package com.leafshop.service.impl;

import com.leafshop.dto.payment.InitiatePaymentRequest;
import com.leafshop.dto.payment.PaymentResponse;
import com.leafshop.dto.payment.RefundRequest;
import com.leafshop.dto.payment.WebhookRequest;
import com.leafshop.model.dynamodb.PaymentTable;
import com.leafshop.repository.PaymentTableRepository;
import com.leafshop.service.PaymentService;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTableRepository paymentRepo;

    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @PostConstruct
    public void init() {
        if (stripeApiKey != null && !stripeApiKey.isEmpty()) {
            Stripe.apiKey = stripeApiKey;
        }
    }

    @Override
    public PaymentResponse initiatePayment(InitiatePaymentRequest req) {
        String paymentId = UUID.randomUUID().toString();
        long now = Instant.now().toEpochMilli();

        PaymentTable p = PaymentTable.builder()
            .pk("PAYMENT#" + paymentId)
            .sk("META")
            .paymentId(paymentId)
            .orderId(req.getOrderId())
            .amount(req.getAmount())
            .currency(req.getCurrency())
            .method(req.getMethod())
            .provider(req.getProvider())
            .status("PENDING")
            .createdAt(now)
            .updatedAt(now)
            .build();

        // Create Stripe PaymentIntent if provider == STRIPE
        String clientSecret = null;
        String providerTxId = null;
        if ("STRIPE".equalsIgnoreCase(req.getProvider())) {
            try {
                long amountInCents = Math.round(req.getAmount() * 100);
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(req.getCurrency().toLowerCase())
                    .addPaymentMethodType("card")
                    .putMetadata("orderId", req.getOrderId())
                    .putMetadata("paymentId", paymentId)
                    .build();

                PaymentIntent intent = PaymentIntent.create(params);
                clientSecret = intent.getClientSecret();
                providerTxId = intent.getId();
                p.setProviderTransactionId(providerTxId);
            } catch (StripeException e) {
                // On failure, mark failed and save
                p.setStatus("FAILED");
                p.setUpdatedAt(Instant.now().toEpochMilli());
                paymentRepo.save(p);
                return PaymentResponse.builder()
                    .paymentId(paymentId)
                    .orderId(req.getOrderId())
                    .amount(req.getAmount())
                    .currency(req.getCurrency())
                    .method(req.getMethod())
                    .provider(req.getProvider())
                    .status("FAILED")
                    .build();
            }
        }

        paymentRepo.save(p);

        PaymentResponse.PaymentResponseBuilder resp = PaymentResponse.builder()
            .paymentId(paymentId)
            .orderId(req.getOrderId())
            .amount(req.getAmount())
            .currency(req.getCurrency())
            .method(req.getMethod())
            .provider(req.getProvider())
            .status(p.getStatus());

        if (clientSecret != null) resp.clientSecret(clientSecret);
        if (providerTxId != null) resp.paymentUrl(providerTxId);

        return resp.build();
    }

    @Override
    public PaymentResponse getPaymentById(String paymentId) {
        Optional<PaymentTable> opt = paymentRepo.findByPaymentId(paymentId);
        if (opt.isEmpty()) return null;
        PaymentTable p = opt.get();
        return PaymentResponse.builder()
            .paymentId(p.getPaymentId())
            .orderId(p.getOrderId())
            .amount(p.getAmount())
            .currency(p.getCurrency())
            .method(p.getMethod())
            .provider(p.getProvider())
            .status(p.getStatus())
            .build();
    }

    @Override
    public PaymentResponse handleWebhook(WebhookRequest webhookRequest) {
        Map<String, String> payload = webhookRequest.getPayload();
        String paymentId = payload != null ? payload.get("paymentId") : null;
        String providerTx = payload != null ? payload.get("providerTransactionId") : null;

        Optional<PaymentTable> opt = Optional.empty();
        if (paymentId != null) {
            opt = paymentRepo.findByPaymentId(paymentId);
        }

        if (opt.isEmpty() && providerTx != null) {
            opt = paymentRepo.findByProviderTransactionId(providerTx);
        }

        if (opt.isEmpty()) {
            return PaymentResponse.builder().status("UNKNOWN").build();
        }

        PaymentTable p = opt.get();

        String providerStatus = payload.getOrDefault("status", payload.getOrDefault("result", ""));
        if (providerStatus != null && (providerStatus.equalsIgnoreCase("SUCCESS") || providerStatus.equalsIgnoreCase("PAID") || providerStatus.equals("00"))) {
            p.setStatus("PAID");
        } else {
            p.setStatus("FAILED");
        }

        if (providerTx != null) p.setProviderTransactionId(providerTx);
        p.setUpdatedAt(Instant.now().toEpochMilli());
        paymentRepo.save(p);

        return PaymentResponse.builder()
            .paymentId(p.getPaymentId())
            .orderId(p.getOrderId())
            .amount(p.getAmount())
            .currency(p.getCurrency())
            .method(p.getMethod())
            .provider(p.getProvider())
            .status(p.getStatus())
            .build();
    }

    @Override
    public PaymentResponse handleStripeWebhook(String payload, String sigHeader) {
        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
        } catch (SignatureVerificationException e) {
            return PaymentResponse.builder().status("INVALID_SIGNATURE").build();
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (intent != null) {
                String paymentId = intent.getMetadata().get("paymentId");
                Optional<PaymentTable> opt = paymentRepo.findByPaymentId(paymentId);
                if (opt.isPresent()) {
                    PaymentTable p = opt.get();
                    p.setStatus("PAID");
                    p.setProviderTransactionId(intent.getId());
                    p.setUpdatedAt(Instant.now().toEpochMilli());
                    paymentRepo.save(p);
                    return PaymentResponse.builder()
                        .paymentId(p.getPaymentId())
                        .orderId(p.getOrderId())
                        .amount(p.getAmount())
                        .currency(p.getCurrency())
                        .method(p.getMethod())
                        .provider(p.getProvider())
                        .status(p.getStatus())
                        .build();
                }
            }
        } else if ("payment_intent.payment_failed".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer().getObject().orElse(null);
            if (intent != null) {
                String paymentId = intent.getMetadata().get("paymentId");
                Optional<PaymentTable> opt = paymentRepo.findByPaymentId(paymentId);
                if (opt.isPresent()) {
                    PaymentTable p = opt.get();
                    p.setStatus("FAILED");
                    p.setProviderTransactionId(intent.getId());
                    p.setUpdatedAt(Instant.now().toEpochMilli());
                    paymentRepo.save(p);
                    return PaymentResponse.builder()
                        .paymentId(p.getPaymentId())
                        .orderId(p.getOrderId())
                        .amount(p.getAmount())
                        .currency(p.getCurrency())
                        .method(p.getMethod())
                        .provider(p.getProvider())
                        .status(p.getStatus())
                        .build();
                }
            }
        }

        return PaymentResponse.builder().status("IGNORED").build();
    }

    @Override
    public PaymentResponse refundPayment(String paymentId, RefundRequest req) {
        Optional<PaymentTable> opt = paymentRepo.findByPaymentId(paymentId);
        if (opt.isEmpty()) return null;
        PaymentTable p = opt.get();

        if ("STRIPE".equalsIgnoreCase(p.getProvider()) && p.getProviderTransactionId() != null) {
            try {
                long amount = req.getAmount() == null ? Math.round(p.getAmount() * 100) : Math.round(req.getAmount() * 100);
                RefundCreateParams rparams = RefundCreateParams.builder()
                    .setPaymentIntent(p.getProviderTransactionId())
                    .setAmount(amount)
                    .build();
                Refund refund = Refund.create(rparams);
                p.setStatus("REFUNDED");
                p.setUpdatedAt(Instant.now().toEpochMilli());
                if (p.getMetadata() != null) p.getMetadata().put("refundId", refund.getId());
                paymentRepo.save(p);
            } catch (StripeException e) {
                // Failed refund
                p.setStatus("REFUND_FAILED");
                p.setUpdatedAt(Instant.now().toEpochMilli());
                paymentRepo.save(p);
            }
        } else {
            // Non-stripe or no provider tx id: mark refunded locally
            p.setStatus("REFUNDED");
            p.setUpdatedAt(Instant.now().toEpochMilli());
            paymentRepo.save(p);
        }

        return PaymentResponse.builder()
            .paymentId(p.getPaymentId())
            .orderId(p.getOrderId())
            .amount(p.getAmount())
            .currency(p.getCurrency())
            .method(p.getMethod())
            .provider(p.getProvider())
            .status(p.getStatus())
            .build();
    }

    @Override
    public PaymentResponse processCOD(String orderId, Double amount, String currency) {
        InitiatePaymentRequest req = new InitiatePaymentRequest();
        req.setOrderId(orderId);
        req.setAmount(amount);
        req.setCurrency(currency);
        req.setMethod("CASH");
        req.setProvider("INTERNAL_COD");
        return initiatePayment(req);
    }
}
