package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

import java.util.Map;

/**
 * PaymentTable - Lưu thông tin thanh toán tách biệt cho webhook/hoàn tiền
 * PK: PAYMENT#<payment_id>
 * SK: META
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@DynamoDbBean
public class PaymentTable {

    private String pk; // PAYMENT#<payment_id>
    private String sk; // META

    private String paymentId;
    private String orderId;
    private Double amount;
    private String currency;
    private String method; // CASH, VNPAY, MOMO, CARD
    private String provider; // VNPAY, MOMO, INTERNAL_COD
    private String status; // PENDING, PAID, FAILED, REFUNDED
    private String providerTransactionId; // Transaction id returned by provider
    private Map<String, String> metadata; // arbitrary key/value

    private Long createdAt;
    private Long updatedAt;

    @DynamoDbAttribute("PK")
    @DynamoDbPartitionKey
    public String getPk() {
        return pk;
    }

    @DynamoDbAttribute("SK")
    public String getSk() {
        return sk;
    }
}
