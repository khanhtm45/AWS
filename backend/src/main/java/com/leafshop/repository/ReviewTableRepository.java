package com.leafshop.repository;

import com.leafshop.model.dynamodb.ReviewTable;
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
public class ReviewTableRepository {

	private final DynamoDbEnhancedClient enhancedClient;

	private DynamoDbTable<ReviewTable> reviewTable() {
		return enhancedClient.table("ReviewTable", TableSchema.fromBean(ReviewTable.class));
	}

	public void save(ReviewTable review) {
		reviewTable().putItem(review);
	}

	// Find reviews by PK (PRODUCT#<product_id> or USER#<user_id>)
	public List<ReviewTable> findByPk(String pk) {
		Key key = Key.builder().partitionValue(pk).build();
		return reviewTable()
			.query(QueryConditional.keyEqualTo(key))
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find review by PK and SK (REVIEW#<review_id>)
	public Optional<ReviewTable> findByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		return Optional.ofNullable(reviewTable().getItem(key));
	}

	// Find all reviews for a product
	public List<ReviewTable> findProductReviewsByPk(String productPk) {
		return findByPk(productPk);
	}

	// Find all reviews by a user
	public List<ReviewTable> findUserReviewsByPk(String userPk) {
		return findByPk(userPk);
	}

	// Find approved reviews for a product
	public List<ReviewTable> findApprovedReviewsByPk(String productPk) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":pk", AttributeValue.builder().s(productPk).build());
		eav.put(":true", AttributeValue.builder().bool(true).build());
		Expression filterExpression = Expression.builder()
			.expression("pk = :pk AND isApproved = :true")
			.expressionValues(eav)
			.build();

		return reviewTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find reviews by rating
	public List<ReviewTable> findByRating(Integer rating) {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":rating", AttributeValue.builder().n(String.valueOf(rating)).build());
		Expression filterExpression = Expression.builder()
			.expression("rating = :rating")
			.expressionValues(eav)
			.build();

		return reviewTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	// Find all reviews (scan all items with PK starting with PRODUCT#)
	public List<ReviewTable> findAllReviews() {
		Map<String, AttributeValue> eav = new HashMap<>();
		eav.put(":productPrefix", AttributeValue.builder().s("PRODUCT#").build());
		Expression filterExpression = Expression.builder()
			.expression("begins_with(pk, :productPrefix)")
			.expressionValues(eav)
			.build();

		return reviewTable()
			.scan(ScanEnhancedRequest.builder().filterExpression(filterExpression).build())
			.items()
			.stream()
			.collect(Collectors.toList());
	}

	public void deleteByPkAndSk(String pk, String sk) {
		Key key = Key.builder().partitionValue(pk).sortValue(sk).build();
		reviewTable().deleteItem(key);
	}
}
