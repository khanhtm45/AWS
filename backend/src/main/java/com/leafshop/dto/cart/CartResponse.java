package com.leafshop.dto.cart;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CartResponse {
    private String cartId;
    private String userId;
    private String sessionId;
    private List<CartItemResponse> items;
    private Double subtotal;
    private Double shippingAmount;
    private Double discountAmount;
    private Double totalAmount;
}
