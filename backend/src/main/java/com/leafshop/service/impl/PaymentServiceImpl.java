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
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.TreeMap;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentTableRepository paymentRepo;

    @Value("${stripe.api.key:}")
    private String stripeApiKey;

    @Value("${stripe.webhook.secret:}")
    private String stripeWebhookSecret;

    @Value("${vnpay.secret:}")
    private String vnpaySecret;

    @Value("${vnpay.baseUrl:https://pay.vnpay.vn/vpcpay.html}")
    private String vnpayBaseUrl;

    @Value("${momo.secret:}")
    private String momoSecret;

    @Value("${momo.baseUrl:https://test-payment.momo.vn/gw_payment/transactionProcessor}")
    private String momoBaseUrl;

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

        // Create provider-specific payment flows
        String clientSecret = null;
        String providerTxId = null;
        String paymentUrl = null;
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
        } else if ("VNPAY".equalsIgnoreCase(req.getProvider())) {
            // Build VNPAY payment URL (basic implementation)
            try {
                Map<String, String> params = new TreeMap<>();
                params.put("vnp_Version", "2.1.0");
                params.put("vnp_Command", "pay");
                params.put("vnp_TmnCode", ""); // optional: merchant code
                params.put("vnp_Amount", String.valueOf(Math.round(req.getAmount()))); // VND in smallest unit
                params.put("vnp_CurrCode", req.getCurrency() != null ? req.getCurrency() : "VND");
                params.put("vnp_TxnRef", paymentId);
                params.put("vnp_OrderInfo", "Order " + req.getOrderId());
                params.put("vnp_ReturnUrl", req.getReturnUrl() != null ? req.getReturnUrl() : "");
                params.put("vnp_CreateDate", String.valueOf(Instant.now().toEpochMilli()));

                StringBuilder query = new StringBuilder();
                StringBuilder signData = new StringBuilder();
                boolean first = true;
                for (Map.Entry<String, String> en : params.entrySet()) {
                    if (!first) {
                        query.append('&');
                        signData.append('&');
                    }
                    first = false;
                    query.append(URLEncoder.encode(en.getKey(), StandardCharsets.UTF_8)).append('=')
                         .append(URLEncoder.encode(en.getValue(), StandardCharsets.UTF_8));
                    signData.append(en.getKey()).append('=').append(en.getValue());
                }
                String hash = hmacSHA512(signData.toString(), vnpaySecret == null ? "" : vnpaySecret);
                query.append("&vnp_SecureHash=").append(URLEncoder.encode(hash, StandardCharsets.UTF_8));
                paymentUrl = vnpayBaseUrl + "?" + query.toString();
            } catch (Exception ex) {
                // ignore and continue with no paymentUrl
            }
        } else if ("MOMO".equalsIgnoreCase(req.getProvider())) {
            // Build MOMO payment URL (basic implementation)
            try {
                Map<String, String> params = new TreeMap<>();
                params.put("partnerCode", "");
                params.put("accessKey", "");
                params.put("amount", String.valueOf(Math.round(req.getAmount())));
                params.put("orderId", req.getOrderId() != null ? req.getOrderId() : paymentId);
                params.put("orderInfo", "Order " + req.getOrderId());
                params.put("returnUrl", req.getReturnUrl() != null ? req.getReturnUrl() : "");
                params.put("notifyUrl", "");
                params.put("extraData", "");

                StringBuilder query = new StringBuilder();
                StringBuilder raw = new StringBuilder();
                boolean first = true;
                for (Map.Entry<String, String> en : params.entrySet()) {
                    if (!first) query.append('&');
                    first = false;
                    query.append(URLEncoder.encode(en.getKey(), StandardCharsets.UTF_8)).append('=')
                         .append(URLEncoder.encode(en.getValue(), StandardCharsets.UTF_8));
                    if (raw.length() > 0) raw.append('&');
                    raw.append(en.getKey()).append('=').append(en.getValue());
                }
                String signature = hmacSHA256(raw.toString(), momoSecret == null ? "" : momoSecret);
                query.append("&signature=").append(URLEncoder.encode(signature, StandardCharsets.UTF_8));
                paymentUrl = momoBaseUrl + "?" + query.toString();
            } catch (Exception ex) {
                // ignore
            }
        }

        // persist providerTransactionId and clientSecret if available
        if (providerTxId != null) p.setProviderTransactionId(providerTxId);
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
        if (paymentUrl != null) resp.paymentUrl(paymentUrl);

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

        // Provider specific status mapping and optional signature verification
        String provider = webhookRequest.getProvider();
        String providerStatus = payload.getOrDefault("status", payload.getOrDefault("result", ""));
        boolean verified = true;
        // Basic verification using configured secrets if signature present
        String sig = payload.get("signature");
        if (sig != null) {
            try {
                if ("VNPAY".equalsIgnoreCase(provider) && vnpaySecret != null && !vnpaySecret.isEmpty()) {
                    // verify vnp_SecureHash or signature field
                    String data = payload.getOrDefault("data", "");
                    String calc = hmacSHA512(data, vnpaySecret);
                    verified = sig.equals(calc);
                } else if ("MOMO".equalsIgnoreCase(provider) && momoSecret != null && !momoSecret.isEmpty()) {
                    String data = payload.getOrDefault("data", "");
                    String calc = hmacSHA256(data, momoSecret);
                    verified = sig.equals(calc);
                }
            } catch (Exception e) {
                verified = false;
            }
        }

        if (!verified) {
            p.setStatus("FAILED");
        } else {
            if (providerStatus != null && (providerStatus.equalsIgnoreCase("SUCCESS") || providerStatus.equalsIgnoreCase("PAID") || providerStatus.equals("00"))) {
                p.setStatus("PAID");
            } else {
                p.setStatus("FAILED");
            }
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

    // Utility HMAC helpers
    private String hmacSHA256(String data, String secret) throws Exception {
        if (secret == null) secret = "";
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String hmacSHA512(String data, String secret) throws Exception {
        if (secret == null) secret = "";
        Mac sha512_HMAC = Mac.getInstance("HmacSHA512");
        SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        sha512_HMAC.init(secret_key);
        byte[] hash = sha512_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b & 0xff));
        return sb.toString();
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
