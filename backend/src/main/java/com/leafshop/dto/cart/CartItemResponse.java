package com.leafshop.dto.cart;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CartItemResponse {
    private String itemId;
    private String productId;
    private String variantId;
    private Integer quantity;
    private Double unitPrice;
    private Double itemTotal;
}
