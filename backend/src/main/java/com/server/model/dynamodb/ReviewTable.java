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
 * ReviewTable - Quản lý đánh giá sản phẩm
 * PK: PRODUCT#<product_id> | USER#<user_id>
 * SK: REVIEW#<review_id>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class ReviewTable {

    private String pk; // PRODUCT#<product_id> | USER#<user_id>

    private String sk; // REVIEW#<review_id>

    private String itemType; // Review

    private String reviewId;

    private String productId;

    private String userId;

    private String orderId; // Đơn hàng đã mua sản phẩm này

    private Integer rating; // 1-5

    private String title;

    private String comment;

    private List<String> images; // URLs of review images

    private Boolean isVerifiedPurchase; // Đã mua sản phẩm

    private Boolean isApproved; // Đã được duyệt bởi admin

    private Integer helpfulCount; // Số người đánh giá là hữu ích

    private Integer reportedCount; // Số lần báo cáo

    // Common fields
    private Long createdAt;

    private Long updatedAt;

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
