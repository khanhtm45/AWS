package com.leafshop.dto.coupon;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CouponUsageResponse {
    private String orderId;
    private String userId;
    private Double appliedDiscountAmount;
    private Double orderTotal;
    private String createdAt;
}
