package com.leafshop.dto.cart;

import lombok.Data;

@Data
public class CartItemRequest {
    private String userId;
    private String sessionId;
    private String productId;
    private String variantId;
    private Integer quantity;
}
