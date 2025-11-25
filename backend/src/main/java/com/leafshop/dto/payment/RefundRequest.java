package com.leafshop.dto.payment;

import lombok.Data;

@Data
public class RefundRequest {
    private String reason;
    private Double amount; // optional, if null refund full
}
