package com.leafshop.dto.order;

import lombok.Data;
import java.util.Map;

@Data
public class CreateOrderRequest {
    private String userId;
    private String cartId;
    private String orderStatus; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    private double totalAmount;
    private Double shippingAmount;
    private ShippingAddress shippingAddress; // Changed to use ShippingAddress DTO
    private String paymentMethod;
    private String couponCode;
}
