package com.leafshop.dto.order;

import lombok.Data;

@Data
public class ReturnItem {
    private String productId;
    private String variantId;
    private Integer quantity;
    private String reason;
}
