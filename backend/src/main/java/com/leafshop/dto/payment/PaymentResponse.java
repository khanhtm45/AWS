package com.leafshop.dto.payment;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PaymentResponse {
    private String paymentId;
    private String orderId;
    private Double amount;
    private String currency;
    private String method;
    private String provider;
    private String status;
    private String paymentUrl; // redirect url to provider (if applicable)
    private String clientSecret; // Stripe PaymentIntent client secret (if applicable)
}
