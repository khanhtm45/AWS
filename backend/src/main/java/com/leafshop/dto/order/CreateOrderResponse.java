package com.leafshop.dto.order;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CreateOrderResponse {
    private String orderId;
    private String orderPk;
    private Double totalAmount;
    private String orderStatus;
}
