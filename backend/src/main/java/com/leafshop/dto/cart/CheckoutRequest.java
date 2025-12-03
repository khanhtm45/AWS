package com.leafshop.dto.cart;

import com.leafshop.dto.order.ShippingAddress;
import lombok.Data;
import java.util.Map;

@Data
public class CheckoutRequest {
    private String userId;
    private String sessionId;
    private ShippingAddress shippingAddress; // Changed to use ShippingAddress DTO
    private String paymentMethod;
    private String couponCode;
}
