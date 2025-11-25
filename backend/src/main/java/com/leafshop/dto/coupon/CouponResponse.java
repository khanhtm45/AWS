package com.leafshop.dto.coupon;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CouponResponse {
    private String couponCode;
    private String couponName;
    private String description;
    private String discountType;
    private Double discountValue;
    private Double minPurchaseAmount;
    private Double maxDiscountAmount;
    private Integer usageLimit;
    private Integer usageLimitPerUser;
    private Integer usedCount;
    private String validFrom;
    private String validUntil;
    private Boolean isActive;
    private List<String> applicableProducts;
    private List<String> applicableCategories;
    private List<String> excludedProducts;
    private String createdAt;
    private String updatedAt;
}
