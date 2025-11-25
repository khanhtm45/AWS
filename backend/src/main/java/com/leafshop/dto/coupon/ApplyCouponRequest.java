package com.leafshop.dto.coupon;

import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
public class ApplyCouponRequest {
    @NotBlank
    private String couponCode;

    @NotBlank
    private String orderId;

    private String userId;

    @NotNull
    private Double orderTotal;

    private List<String> productIds;
}
