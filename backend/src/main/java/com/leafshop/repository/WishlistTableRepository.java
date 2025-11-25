package com.leafshop.repository;

import com.leafshop.model.dynamodb.WishlistTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.*;

@Repository
@RequiredArgsConstructor
public class WishlistTableRepository {

    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "WishlistTable";

    // Add product to wishlist
    public WishlistTable save(WishlistTable wishlist) {
        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(WishlistTable.toMap(wishlist))
                .build());
        return wishlist;
    }

    // Get all wishlist items for a user
    public List<WishlistTable> findByUserId(String userId) {
        QueryRequest queryRequest = QueryRequest.builder()
                .tableName(TABLE_NAME)
                .indexName("userId-index")
                .keyConditionExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                        ":userId", AttributeValue.builder().s(userId).build()
                ))
                .build();

        try {
            QueryResponse response = dynamoDbClient.query(queryRequest);
            List<WishlistTable> items = new ArrayList<>();
            for (Map<String, AttributeValue> item : response.items()) {
                items.add(WishlistTable.fromMap(item));
            }
            return items;
        } catch (Exception e) {
            // Fallback to scan if index doesn't exist
            ScanRequest scanRequest = ScanRequest.builder()
                    .tableName(TABLE_NAME)
                    .filterExpression("userId = :userId")
                    .expressionAttributeValues(Map.of(
                            ":userId", AttributeValue.builder().s(userId).build()
                    ))
                    .build();

            ScanResponse response = dynamoDbClient.scan(scanRequest);
            List<WishlistTable> items = new ArrayList<>();
            for (Map<String, AttributeValue> item : response.items()) {
                items.add(WishlistTable.fromMap(item));
            }
            return items;
        }
    }

    // Get a specific wishlist item
    public WishlistTable findById(String wishlistId, String userId) {
        GetItemRequest getItemRequest = GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of(
                        "wishlistId", AttributeValue.builder().s(wishlistId).build(),
                        "userId", AttributeValue.builder().s(userId).build()
                ))
                .build();

        GetItemResponse response = dynamoDbClient.getItem(getItemRequest);
        return response.hasItem() ? WishlistTable.fromMap(response.item()) : null;
    }

    // Check if product is in wishlist
    public boolean existsByUserIdAndProductId(String userId, String productId) {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("userId = :userId AND productId = :productId")
                .expressionAttributeValues(Map.of(
                        ":userId", AttributeValue.builder().s(userId).build(),
                        ":productId", AttributeValue.builder().s(productId).build()
                ))
                .build();

        ScanResponse response = dynamoDbClient.scan(scanRequest);
        return !response.items().isEmpty();
    }

    // Remove from wishlist
    public void deleteById(String wishlistId, String userId) {
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of(
                        "wishlistId", AttributeValue.builder().s(wishlistId).build(),
                        "userId", AttributeValue.builder().s(userId).build()
                ))
                .build());
    }

    // Remove all wishlist items for a user (for cleanup)
    public void deleteByUserId(String userId) {
        List<WishlistTable> items = findByUserId(userId);
        for (WishlistTable item : items) {
            deleteById(item.getWishlistId(), userId);
        }
    }
}
