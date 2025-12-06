package com.leafshop.service.impl;

/**
 * Payment Service Implementation
 * 
 * VNPay Response Codes:
 * - 00: Success
 * - 24: User cancelled transaction
 * - 99: Unknown error / Transaction failed
 * - Other codes: Various failure reasons
 * 
 * Payment Status Mapping:
 * - PENDING: Payment initiated, awaiting confirmation
 * - PAID: Payment successful
 * - CANCELLED: User cancelled payment
 * - FAILED: Payment failed due to error
 */

import com.leafshop.dto.payment.InitiatePaymentRequest;
import com.leafshop.dto.payment.PaymentResponse;
import com.leafshop.dto.payment.RefundRequest;
import com.leafshop.dto.payment.WebhookRequest;
import com.leafshop.model.dynamodb.PaymentTable;
import com.leafshop.model.dynamodb.OrderTable;
import com.leafshop.repository.PaymentTableRepository;
import com.leafshop.repository.OrderTableRepository;
import com.leafshop.service.PaymentService;
import com.leafshop.service.VNPayService;
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
    private final OrderTableRepository orderRepo;
    private final VNPayService vnPayService;

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
            // Use VNPayService to create payment URL
            try {
                long amountInVND = Math.round(req.getAmount());
                String orderInfo = "Thanh toan don hang " + req.getOrderId();
                String ipAddr = "127.0.0.1"; // Should get from request context
                paymentUrl = vnPayService.createPaymentUrl(amountInVND, orderInfo, req.getOrderId(), ipAddr);
                providerTxId = paymentId; // Store paymentId as reference
                p.setProviderTransactionId(providerTxId);
            } catch (Exception ex) {
                // ignore and continue with no paymentUrl
                ex.printStackTrace();
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
        
        // VNPay specific: vnp_TxnRef contains orderId (may have _timestamp suffix)
        String vnpTxnRef = payload != null ? payload.get("vnp_TxnRef") : null;
        String orderId = vnpTxnRef;
        
        // Extract orderId from vnp_TxnRef (remove _timestamp if present)
        // Format: orderId_timestamp (e.g., 87907458-849d-46e2-96a6-3ef9f4a2dd0c_1765026748703)
        if (orderId != null && orderId.contains("_")) {
            orderId = orderId.substring(0, orderId.lastIndexOf("_"));
            System.out.println("[PaymentService] Extracted orderId from vnp_TxnRef: " + vnpTxnRef + " → " + orderId);
        }
        
        System.out.println("[PaymentService] === WEBHOOK RECEIVED ===");
        System.out.println("[PaymentService] Provider: " + webhookRequest.getProvider());
        System.out.println("[PaymentService] PaymentId: " + paymentId + ", OrderId: " + orderId + ", ProviderTx: " + providerTx);
        System.out.println("[PaymentService] Response Code: " + payload.get("vnp_ResponseCode"));

        Optional<PaymentTable> opt = Optional.empty();
        if (paymentId != null) {
            opt = paymentRepo.findByPaymentId(paymentId);
        }

        if (opt.isEmpty() && providerTx != null) {
            opt = paymentRepo.findByProviderTransactionId(providerTx);
        }
        
        // Try to find by orderId (VNPay uses vnp_TxnRef as orderId)
        if (opt.isEmpty() && orderId != null) {
            System.out.println("[PaymentService] Searching by orderId: " + orderId);
            opt = paymentRepo.findByOrderId(orderId);
            System.out.println("[PaymentService] Search result: " + (opt.isPresent() ? "FOUND" : "NOT FOUND"));
        }

        if (opt.isEmpty()) {
            System.err.println("[PaymentService] ❌ Payment NOT FOUND! paymentId=" + paymentId + ", orderId=" + orderId);
            return PaymentResponse.builder().status("UNKNOWN").build();
        }

        PaymentTable p = opt.get();
        System.out.println("[PaymentService] ✅ Payment FOUND: " + p.getPaymentId() + ", current status: " + p.getStatus());

        // Provider specific status mapping
        String provider = webhookRequest.getProvider();
        String providerStatus = payload.getOrDefault("status", payload.getOrDefault("result", ""));
        boolean verified = true;
        
        // Use provider-specific services for signature verification
        if ("VNPAY".equalsIgnoreCase(provider)) {
            verified = vnPayService.verifyCallback(payload);
            providerStatus = payload.getOrDefault("vnp_ResponseCode", providerStatus);
        }

        if (!verified) {
            p.setStatus("FAILED");
        } else {
            // Map provider status codes to internal status
            if (providerStatus != null) {
                // Success codes
                if (providerStatus.equalsIgnoreCase("SUCCESS") || 
                    providerStatus.equalsIgnoreCase("PAID") || 
                    providerStatus.equals("00") || 
                    providerStatus.equals("0")) {
                    p.setStatus("PAID");
                }
                // Cancelled codes (VNPay: 24 = user cancelled, MoMo: 1006 = user cancelled)
                else if (providerStatus.equals("24") || 
                         providerStatus.equals("1006") ||
                         providerStatus.equals("99")) { // VNPay error code 99
                    p.setStatus("CANCELLED");
                }
                // All other codes = failed
                else {
                    p.setStatus("FAILED");
                }
            } else {
                p.setStatus("FAILED");
            }
        }

        if (providerTx != null) p.setProviderTransactionId(providerTx);
        p.setUpdatedAt(Instant.now().toEpochMilli());
        paymentRepo.save(p);
        
        System.out.println("[PaymentService] ✅ Payment status updated to: " + p.getStatus());

        // Update order status and paymentStatus in OrderTable based on payment result
        if ("PAID".equals(p.getStatus())) {
            System.out.println("[PaymentService] Updating order " + p.getOrderId() + " paymentStatus to PAID");
            updateOrderPaymentStatus(p.getOrderId(), "PAID");
        } else if ("CANCELLED".equals(p.getStatus()) || "FAILED".equals(p.getStatus())) {
            System.out.println("[PaymentService] Updating order " + p.getOrderId() + " status to CANCELLED");
            updateOrderStatus(p.getOrderId(), "CANCELLED");
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

    /**
     * Helper method to update order paymentStatus when payment succeeds
     */
    private void updateOrderPaymentStatus(String orderId, String paymentStatus) {
        if (orderId == null || orderId.isEmpty()) {
            return;
        }
        
        try {
            // Search for order by orderId attribute (regardless of PK structure)
            Optional<OrderTable> orderMetaOpt = orderRepo.findByOrderId(orderId);
            
            if (orderMetaOpt.isPresent()) {
                OrderTable orderMeta = orderMetaOpt.get();
                
                // Only update paymentStatus, keep orderStatus unchanged (should be PENDING)
                orderMeta.setPaymentStatus(paymentStatus);
                orderMeta.setUpdatedAt(Instant.now().toEpochMilli());
                orderRepo.save(orderMeta);
                
                System.out.println("[PaymentService] ✅ Updated order " + orderId + " paymentStatus to " + paymentStatus + " (orderStatus: " + orderMeta.getOrderStatus() + ")");
            } else {
                System.err.println("[PaymentService] ❌ Order not found with orderId: " + orderId);
            }
        } catch (Exception e) {
            System.err.println("[PaymentService] ❌ Error updating order payment status: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Helper method to update order status when payment fails/cancels
     */
    private void updateOrderStatus(String orderId, String newStatus) {
        if (orderId == null || orderId.isEmpty()) {
            return;
        }
        
        try {
            // Search for order by orderId attribute (regardless of PK structure)
            Optional<OrderTable> orderMetaOpt = orderRepo.findByOrderId(orderId);
            
            if (orderMetaOpt.isPresent()) {
                OrderTable orderMeta = orderMetaOpt.get();
                
                // Update both orderStatus and paymentStatus
                orderMeta.setOrderStatus(newStatus);
                
                // Map order status to payment status
                String paymentStatus = newStatus.equals("CANCELLED") ? "FAILED" : newStatus;
                orderMeta.setPaymentStatus(paymentStatus);
                
                orderMeta.setUpdatedAt(Instant.now().toEpochMilli());
                orderRepo.save(orderMeta);
                
                System.out.println("[PaymentService] ✅ Updated order " + orderId + " - orderStatus: " + newStatus + ", paymentStatus: " + paymentStatus);
            } else {
                System.err.println("[PaymentService] ❌ Order not found with orderId: " + orderId);
            }
        } catch (Exception e) {
            System.err.println("[PaymentService] ❌ Error updating order status: " + e.getMessage());
            e.printStackTrace();
        }
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
