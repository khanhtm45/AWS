package com.server.service;

import com.server.model.dynamodb.UserTable;
import com.server.util.DynamoDBKeyUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.enhanced.dynamodb.model.QueryConditional;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service class sử dụng AWS SDK v2 Enhanced Client để làm việc với DynamoDB
 */
@Service
@RequiredArgsConstructor
public class DynamoDBService {

    private final DynamoDbEnhancedClient enhancedClient;

    // UserTable operations
    public void saveUser(UserTable user) {
        try {
            DynamoDbTable<UserTable> userTable = enhancedClient.table(
                "UserTable",
                TableSchema.fromBean(UserTable.class)
            );
            userTable.putItem(user);
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error saving user: " + e.getMessage(), e);
        }
    }

    public UserTable getUser(String userId, String sk) {
        try {
            DynamoDbTable<UserTable> userTable = enhancedClient.table(
                "UserTable",
                TableSchema.fromBean(UserTable.class)
            );
            Key key = Key.builder()
                .partitionValue(DynamoDBKeyUtil.userPk(userId))
                .sortValue(sk)
                .build();
            return userTable.getItem(key);
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error getting user: " + e.getMessage(), e);
        }
    }

    public List<UserTable> getUserItems(String userId) {
        try {
            DynamoDbTable<UserTable> userTable = enhancedClient.table(
                "UserTable",
                TableSchema.fromBean(UserTable.class)
            );
            Key key = Key.builder()
                .partitionValue(DynamoDBKeyUtil.userPk(userId))
                .build();
            
            return userTable.query(QueryConditional.keyEqualTo(key))
                .items()
                .stream()
                .collect(Collectors.toList());
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error querying user items: " + e.getMessage(), e);
        }
    }

    public void deleteUser(String userId, String sk) {
        try {
            DynamoDbTable<UserTable> userTable = enhancedClient.table(
                "UserTable",
                TableSchema.fromBean(UserTable.class)
            );
            Key key = Key.builder()
                .partitionValue(DynamoDBKeyUtil.userPk(userId))
                .sortValue(sk)
                .build();
            userTable.deleteItem(key);
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error deleting user: " + e.getMessage(), e);
        }
    }

    // Generic method để làm việc với bất kỳ table nào
    public <T> void saveItem(String tableName, T item, Class<T> itemClass) {
        try {
            DynamoDbTable<T> table = enhancedClient.table(
                tableName,
                TableSchema.fromBean(itemClass)
            );
            table.putItem(item);
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error saving item: " + e.getMessage(), e);
        }
    }

    public <T> T getItem(String tableName, String pk, String sk, Class<T> itemClass) {
        try {
            DynamoDbTable<T> table = enhancedClient.table(
                tableName,
                TableSchema.fromBean(itemClass)
            );
            Key key = Key.builder()
                .partitionValue(pk)
                .sortValue(sk)
                .build();
            return table.getItem(key);
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error getting item: " + e.getMessage(), e);
        }
    }

    public <T> List<T> queryItems(String tableName, String pk, Class<T> itemClass) {
        try {
            DynamoDbTable<T> table = enhancedClient.table(
                tableName,
                TableSchema.fromBean(itemClass)
            );
            Key key = Key.builder()
                .partitionValue(pk)
                .build();
            
            return table.query(QueryConditional.keyEqualTo(key))
                .items()
                .stream()
                .collect(Collectors.toList());
        } catch (DynamoDbException e) {
            throw new RuntimeException("Error querying items: " + e.getMessage(), e);
        }
    }
}

