package com.leafshop.dto.order;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class OrderItemResponse {
    private String itemId;
    private String productId;
    private String variantId;
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private Double itemTotal;
}
