package com.leafshop.controller;

import com.leafshop.dto.payment.InitiatePaymentRequest;
import com.leafshop.dto.payment.PaymentResponse;
import com.leafshop.dto.payment.RefundRequest;
import com.leafshop.dto.payment.WebhookRequest;
import com.leafshop.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<PaymentResponse> initiate(@RequestBody InitiatePaymentRequest req) {
        return ResponseEntity.ok(paymentService.initiatePayment(req));
    }

    @PostMapping("/webhook")
    public ResponseEntity<PaymentResponse> webhook(@RequestBody WebhookRequest req) {
        // Providers will POST callbacks here. Signature verification should be done inside service.
        return ResponseEntity.ok(paymentService.handleWebhook(req));
    }

    @PostMapping("/webhook/stripe")
    public ResponseEntity<String> stripeWebhook(HttpServletRequest request) throws java.io.IOException {
        String payload = new String(request.getInputStream().readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        String sigHeader = request.getHeader("Stripe-Signature");
        PaymentResponse resp = paymentService.handleStripeWebhook(payload, sigHeader);
        if ("INVALID_SIGNATURE".equals(resp.getStatus())) {
            return ResponseEntity.status(400).body("invalid signature");
        }
        return ResponseEntity.ok("received");
    }

    @PostMapping("/{paymentId}/refund")
    public ResponseEntity<PaymentResponse> refund(@PathVariable String paymentId, @RequestBody RefundRequest req) {
        return ResponseEntity.ok(paymentService.refundPayment(paymentId, req));
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentResponse> get(@PathVariable String paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    // Convenience: create COD payment
    @PostMapping("/cod")
    public ResponseEntity<PaymentResponse> cod(@RequestParam String orderId,
                                               @RequestParam Double amount,
                                               @RequestParam(required = false, defaultValue = "VND") String currency) {
        return ResponseEntity.ok(paymentService.processCOD(orderId, amount, currency));
    }

    // VNPay return URL handler
    @GetMapping("/vnpay/return")
    public ResponseEntity<String> vnpayReturn(@RequestParam Map<String, String> params) {
        // This is called when user returns from VNPay
        // Update payment status before redirecting to frontend
        
        // Create webhook request to update payment status
        WebhookRequest webhookReq = new WebhookRequest();
        webhookReq.setProvider("VNPAY");
        webhookReq.setPayload(params);
        
        // Process the payment callback
        PaymentResponse resp = paymentService.handleWebhook(webhookReq);
        
        String responseCode = params.get("vnp_ResponseCode");
        String txnRef = params.get("vnp_TxnRef");
        
        if ("00".equals(responseCode)) {
            return ResponseEntity.ok("Payment successful. Transaction: " + txnRef + ", Status: " + resp.getStatus());
        } else {
            return ResponseEntity.ok("Payment failed. Code: " + responseCode + ", Status: " + resp.getStatus());
        }
    }

    // VNPay IPN (Instant Payment Notification) handler
    @PostMapping("/vnpay/callback")
    public ResponseEntity<Map<String, Object>> vnpayCallback(@RequestParam Map<String, String> params) {
        // This is called by VNPay server to notify payment status
        WebhookRequest webhookReq = new WebhookRequest();
        webhookReq.setProvider("VNPAY");
        webhookReq.setPayload(params);
        
        PaymentResponse resp = paymentService.handleWebhook(webhookReq);
        
        Map<String, Object> response = new HashMap<>();
        response.put("RspCode", "00");
        response.put("Message", "Confirm Success");
        return ResponseEntity.ok(response);
    }
}
