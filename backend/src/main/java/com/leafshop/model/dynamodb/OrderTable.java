package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbSortKey;

import java.util.List;
import java.util.Map;

/**
 * OrderTable - Quản lý đơn hàng, chi tiết đơn, thanh toán, mã giảm giá và giỏ hàng
 * PK: USER#<user_id>#ORDER#<order_id> | ORDER#<order_id> | CART#<user_id> | CART#GUEST#<session_id>
 * SK: META | ITEM#<item_id> | PAYMENT | DISCOUNT
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class OrderTable {

    private String pk; // USER#<user_id>#ORDER#<order_id> | ORDER#<order_id> | CART#<user_id> | CART#GUEST#<session_id>
    private String sk; // META | ITEM#<item_id> | PAYMENT | DISCOUNT
    private String itemType; // Order, OrderItem, Payment, Discount, Cart

    // ORDER META fields
    private String orderId;
    private String userId;
    private String orderStatus; // PENDING, CONFIRMED, PROCESSING, SHIPPED, DELIVERED, CANCELLED
    private Double totalAmount;
    private Double subtotal;
    private Double taxAmount;
    private Double shippingAmount;
    private Double discountAmount;
    private Map<String, String> shippingAddress;
    private Map<String, String> billingAddress;
    private String notes;

    // ORDER ITEM fields
    private String productId;
    private String variantId;
    private String size;
    private String productName;
    private Integer quantity;
    private Double unitPrice;
    private Double itemTotal;

    // PAYMENT fields
    private String paymentMethod; // CASH, CREDIT_CARD, BANK_TRANSFER, VNPAY, MOMO
    private String paymentStatus; // PENDING, PAID, FAILED, REFUNDED
    private Double paymentAmount;
    private String transactionId;
    private Long paymentDate;

    // DISCOUNT fields
    private String couponCode;
    private String discountType; // PERCENTAGE, FIXED_AMOUNT
    private Double discountValue;
    private Double appliedDiscountAmount;

    // CART fields
    private String sessionId; // For guest cart
    private List<Map<String, String>> cartItems;
    private String cartId;

    // ASSIGNMENT
    private String assignedTo;

    // Common fields
    private Long createdAt;
    private Long updatedAt;

    // === DynamoDB Key Getters ===
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
