package com.leafshop.dto.coupon;

import lombok.Builder;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

@Data
@Builder
public class CouponRequest {
    @NotBlank
    private String couponCode;

    private String couponName;
    private String description;

    @NotBlank
    private String discountType; // PERCENTAGE or FIXED_AMOUNT

    @NotNull
    private Double discountValue;

    private Double minPurchaseAmount;
    private Double maxDiscountAmount;
    private Integer usageLimit;
    private Integer usageLimitPerUser;
    // Dates in format dd/MM/yyyy (accepts double slashes and normalizes)
    private String validFrom;
    private String validUntil;
    private Boolean isActive;

    private List<String> applicableProducts;
    private List<String> applicableCategories;
    private List<String> excludedProducts;
}
