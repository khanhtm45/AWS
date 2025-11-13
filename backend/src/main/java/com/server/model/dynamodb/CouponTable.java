package com.server.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List;

/**
 * CouponTable - Quản lý mã giảm giá và ghi nhận việc áp dụng vào đơn hàng
 * PK: COUPON#<coupon_code>
 * SK: META | USAGE#<order_id>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class CouponTable {

    private String pk; // COUPON#<coupon_code>
    private String sk; // META | USAGE#<order_id>

    private String itemType; // Coupon, CouponUsage

    // COUPON META fields
    private String couponCode;
    private String couponName;
    private String description;
    private String discountType; // PERCENTAGE, FIXED_AMOUNT
    private Double discountValue; // % hoặc số tiền
    private Double minPurchaseAmount;
    private Double maxDiscountAmount;
    private Integer usageLimit;
    private Integer usageLimitPerUser;
    private Integer usedCount;
    private Long validFrom;
    private Long validUntil;
    private Boolean isActive;
    private List<String> applicableProducts;
    private List<String> applicableCategories;
    private List<String> excludedProducts;

    // USAGE fields
    private String orderId;
    private String userId;
    private Double appliedDiscountAmount;
    private Double orderTotal;

    // Common fields
    private Long createdAt;
    private Long updatedAt;

    // 🔹 Enhanced Client yêu cầu annotation nằm trên getter
    @DynamoDbAttribute("PK")
    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbAttribute("SK")
    @DynamoDbSortKey
    public String getSk() {
        return sk;
    }
}
