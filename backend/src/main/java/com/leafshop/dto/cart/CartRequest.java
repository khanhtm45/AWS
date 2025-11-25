package com.leafshop.dto.cart;

import lombok.Data;

@Data
public class CartRequest {
    private String userId;
    private String sessionId;
}
