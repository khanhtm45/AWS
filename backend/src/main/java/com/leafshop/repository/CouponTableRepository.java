package com.leafshop.repository;

import com.leafshop.model.dynamodb.CouponTable;
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
public class CouponTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<CouponTable> couponTable() {
		return enhancedClient.table("CouponTable", TableSchema.fromBean(CouponTable.class));
	}

	public void save(CouponTable coupon) {
		couponTable().putItem(coupon);
	}

	// Find coupon by PK (COUPON#<coupon_code>)
	public List<CouponTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return couponTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find coupon meta by PK and SK = "META"
	public Optional<CouponTable> findCouponMetaByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(couponTable().getItem(key));
	}

	// Find all usage records for a coupon (SK begins with USAGE#)
	public List<CouponTable> findCouponUsageByPk(String pk) {
		return couponTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue("USAGE#").build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find usage record by PK and SK = "USAGE#<order_id>"
	public Optional<CouponTable> findUsageByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(couponTable().getItem(key));
	}

	// Find active coupons
	public List<CouponTable> findByIsActiveTrue() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":true", AttributeValue.builder().bool(true).build());
		Expression filterExpression = Expression.builder()
			.expression("isActive = :true")
			.expressionValues(eav)
			.build();

		return couponTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find all coupons (scan META items)
	public List<CouponTable> findAll() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("sk = :meta")
			.expressionValues(eav)
			.build();

		return couponTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	public void deleteByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		couponTable().deleteItem(key);
	}

	// Find coupon by code (scan by attribute to avoid assuming PK convention)
	public Optional<CouponTable> findByCouponCode(String couponCode) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":code", AttributeValue.builder().s(couponCode).build());
		Expression filterExpression = Expression.builder()
			.expression("couponCode = :code")
			.expressionValues(eav)
			.build();

		return couponTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.findFirst();
	}
}
