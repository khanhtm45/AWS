package com.leafshop.dto.order;

import lombok.Data;
import java.util.Map;

@Data
public class CreateOrderRequest {
    private String userId;
    private String sessionId;
    private Map<String, String> shippingAddress;
    private String paymentMethod;
    private String couponCode;
}
