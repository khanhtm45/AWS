package com.server.repository;

import com.server.model.dynamodb.OrderTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class OrderTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<OrderTable> orderTable() {
		return enhancedClient.table("OrderTable", TableSchema.fromBean(OrderTable.class));
	}

	public void save(OrderTable order) {
		orderTable().putItem(order);
	}

	// Find order by PK (USER#<user_id>#ORDER#<order_id> or ORDER#<order_id>)
	public List<OrderTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return orderTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find order meta by PK and SK = "META"
	public Optional<OrderTable> findOrderMetaByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(orderTable().getItem(key));
	}

	// Find all items for an order (SK begins with ITEM#)
	public List<OrderTable> findOrderItemsByPk(String pk) {
		return orderTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue("ITEM#").build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find payment info by PK and SK = "PAYMENT"
	public Optional<OrderTable> findPaymentByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(orderTable().getItem(key));
	}

	// Find discount info by PK and SK = "DISCOUNT"
	public Optional<OrderTable> findDiscountByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(orderTable().getItem(key));
	}

	// Find all orders for a user (PK starts with USER#<user_id>#ORDER#) - scan filter
	public List<OrderTable> findByPkStartingWith(String pkPrefix) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":prefix", AttributeValue.builder().s(pkPrefix).build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(pk, :prefix)")
			.expressionValues(eav)
			.build();

		return orderTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find cart by PK (CART#<user_id> or CART#GUEST#<session_id>)
	public Optional<OrderTable> findCartByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).sortValue("META").build();
		return Optional.ofNullable(orderTable().getItem(key));
	}

	// Find orders by status (requires GSI) - fallback to scan by attribute
	public List<OrderTable> findByOrderStatus(String orderStatus) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":status", AttributeValue.builder().s(orderStatus).build());
		Expression filterExpression = Expression.builder()
			.expression("orderStatus = :status")
			.expressionValues(eav)
			.build();

		return orderTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}
}
