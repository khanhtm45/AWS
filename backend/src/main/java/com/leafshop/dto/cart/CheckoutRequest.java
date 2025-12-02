package com.leafshop.dto.cart;

import lombok.Data;
import java.util.Map;

@Data
public class CheckoutRequest {
    private String userId;
    private String sessionId;
    private Map<String, String> shippingAddress;
    private String paymentMethod;
    private String couponCode;
}
