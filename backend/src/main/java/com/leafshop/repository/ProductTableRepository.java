package com.leafshop.repository;

import com.leafshop.model.dynamodb.ProductTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.enhanced.dynamodb.Expression;
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class ProductTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<ProductTable> productTable() {
		return enhancedClient.table("ProductTable", TableSchema.fromBean(ProductTable.class));
	}

	public void save(ProductTable product) {
		productTable().putItem(product);
	}

	// Find product by PK (PRODUCT#<product_id>)
	public List<ProductTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return productTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find product meta by PK and SK = "META"
	public Optional<ProductTable> findProductMetaByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	// Find product by PK (PRODUCT#<product_id>) with SK = "META"
	public Optional<ProductTable> findProductByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).sortValue("META").build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	// Find all variants for a product
	public List<ProductTable> findVariantsByPk(String pk) {
		return productTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue("VARIANT#").build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find all media for a product
	public List<ProductTable> findMediaByPk(String pk) {
		return productTable()
			.query(QueryConditional.sortBeginsWith(
				Key.builder().partitionValue(pk).sortValue("MEDIA#").build()))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find variant by PK and SK = "VARIANT#<variant_id>"
	public Optional<ProductTable> findVariantByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	// Find media by PK and SK = "MEDIA#<media_id>"
	public Optional<ProductTable> findMediaByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	public void deleteByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		productTable().deleteItem(key);
	}

	// Find category by PK (CATEGORY#<category_id>)
	public Optional<ProductTable> findCategoryByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).sortValue("META").build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	// Find type by PK (TYPE#<type_id>)
	public Optional<ProductTable> findTypeByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).sortValue("META").build();
		return Optional.ofNullable(productTable().getItem(key));
	}

	// Find products by category_id (fallback to scan if no GSI)
	public List<ProductTable> findByCategoryId(String categoryId) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":cat", AttributeValue.builder().s(categoryId).build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("categoryId = :cat AND sk = :meta")
			.expressionValues(eav)
			.build();

		return productTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	public List<ProductTable> findAllCategories() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":catPrefix", AttributeValue.builder().s("CATEGORY#").build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(PK, :catPrefix) AND SK = :meta")
			.expressionValues(eav)
			.build();

		return productTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	public List<ProductTable> findAllTypes() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":typePrefix", AttributeValue.builder().s("TYPE#").build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(PK, :typePrefix) AND SK = :meta")
			.expressionValues(eav)
			.build();

		return productTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find active products
	public List<ProductTable> findByIsActiveTrue() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":true", AttributeValue.builder().bool(true).build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("isActive = :true AND sk = :meta")
			.expressionValues(eav)
			.build();

		return productTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find all products
	public List<ProductTable> findAllProducts() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":productPrefix", AttributeValue.builder().s("PRODUCT#").build());
		eav.put(":meta", AttributeValue.builder().s("META").build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(PK, :productPrefix) AND SK = :meta")
			.expressionValues(eav)
			.build();

		return productTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}
}
