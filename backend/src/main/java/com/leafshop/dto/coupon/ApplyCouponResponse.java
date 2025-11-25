package com.leafshop.dto.coupon;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplyCouponResponse {
    private String couponCode;
    private Double discountAmount;
    private Double newTotal;
    private String orderId;
    private String userId;
}
