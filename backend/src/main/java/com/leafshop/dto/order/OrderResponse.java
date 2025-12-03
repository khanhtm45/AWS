package com.leafshop.dto.order;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class OrderResponse {
    private String orderId;
    private String orderPk;
    private String userId;
    private String orderStatus;
    private List<OrderItemResponse> items;
    private Double subtotal;
    private Double shippingAmount;
    private Double discountAmount;
    private Double totalAmount;
    private ShippingAddress shippingAddress; // Changed to use ShippingAddress DTO
    private String paymentMethod;
    private String paymentStatus;
    private String assignedTo;
    private Long createdAt;
    private Long updatedAt;
}
