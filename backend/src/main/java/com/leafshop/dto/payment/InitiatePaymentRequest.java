package com.leafshop.dto.payment;

import lombok.Data;

@Data
public class InitiatePaymentRequest {
    private String orderId;
    private Double amount;
    private String currency;
    private String method; // VNPAY, MOMO, CASH
    private String provider; // VNPAY, MOMO, INTERNAL_COD
    private String returnUrl; // optional redirect URL for front-end
}
