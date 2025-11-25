package com.leafshop.dto.payment;

import lombok.Data;

import java.util.Map;

@Data
public class WebhookRequest {
    private String provider; // VNPAY, MOMO
    private Map<String, String> payload; // provider-specific payload
    private String signature; // optional signature header
}
