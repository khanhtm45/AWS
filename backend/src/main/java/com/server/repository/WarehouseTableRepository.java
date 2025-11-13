package com.server.repository;

import com.server.model.dynamodb.WarehouseTable;
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
public class WarehouseTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<WarehouseTable> warehouseTable() {
		return enhancedClient.table("WarehouseTable", TableSchema.fromBean(WarehouseTable.class));
	}

	public void save(WarehouseTable warehouse) {
		warehouseTable().putItem(warehouse);
	}

	// Find warehouse by PK (WAREHOUSE#<warehouse_id>)
	public List<WarehouseTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return warehouseTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find warehouse meta by PK and SK = "META"
	public Optional<WarehouseTable> findWarehouseMetaByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(warehouseTable().getItem(key));
	}

	// Find all inventory items for a warehouse (SK begins with PRODUCT#)
	public List<WarehouseTable> findInventoryByPk(String pk) {
		return warehouseTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue("PRODUCT#").build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find inventory for a specific product
	public Optional<WarehouseTable> findProductInventoryByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(warehouseTable().getItem(key));
	}

	// Find inventory for a specific variant
	public Optional<WarehouseTable> findVariantInventoryByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(warehouseTable().getItem(key));
	}

	// Find all warehouses (scan META items)
	public List<WarehouseTable> findAll() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("sk = :meta")
			.expressionValues(eav)
			.build();

		return warehouseTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find active warehouses
	public List<WarehouseTable> findByIsActiveTrue() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":true", AttributeValue.builder().bool(true).build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("isActive = :true AND sk = :meta")
			.expressionValues(eav)
			.build();

		return warehouseTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}
}

