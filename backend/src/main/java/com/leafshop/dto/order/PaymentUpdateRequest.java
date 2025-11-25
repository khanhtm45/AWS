package com.leafshop.dto.order;

import lombok.Data;

@Data
public class PaymentUpdateRequest {
    private String paymentStatus;
    private String transactionId;
    private Double paymentAmount;
}
