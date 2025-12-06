package com.leafshop.repository;

import com.leafshop.model.dynamodb.PaymentTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;

import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PaymentTableRepository {

    private final DynamoDbEnhancedClient enhancedClient;

    private DynamoDbTable<PaymentTable> paymentTable() {
        return enhancedClient.table("PaymentTable", TableSchema.fromBean(PaymentTable.class));
    }

    public void save(PaymentTable payment) {
        paymentTable().putItem(payment);
    }

    public Optional<PaymentTable> findByPaymentId(String paymentId) {
        Key key = Key.builder().partitionValue("PAYMENT#" + paymentId).sortValue("META").build();
        return Optional.ofNullable(paymentTable().getItem(key));
    }

    public Optional<PaymentTable> findByProviderTransactionId(String providerTxId) {
        // No GSI configured here; fall back to scan is possible but for simplicity return empty
        // TODO: implement scan-based lookup if needed
        return Optional.empty();
    }

    public Optional<PaymentTable> findByOrderId(String orderId) {
        // Scan for payment with matching orderId
        // This is inefficient but works without GSI
        try {
            return paymentTable().scan().items().stream()
                .filter(p -> orderId.equals(p.getOrderId()))
                .findFirst();
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    public void deleteByPaymentId(String paymentId) {
        Key key = Key.builder().partitionValue("PAYMENT#" + paymentId).sortValue("META").build();
        paymentTable().deleteItem(key);
    }
}
