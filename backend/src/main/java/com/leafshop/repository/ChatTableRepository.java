package com.leafshop.repository;

import com.leafshop.model.dynamodb.ChatTable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;

import java.util.*;

@Repository
@RequiredArgsConstructor
public class ChatTableRepository {

    private final DynamoDbClient dynamoDbClient;
    private static final String TABLE_NAME = "ChatTable";

    // Save a chat message (customer or staff)
    public ChatTable save(ChatTable chat) {
        if (chat.getTimestamp() == null) {
            chat.setTimestamp(System.currentTimeMillis());
        }

        dynamoDbClient.putItem(PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(ChatTable.toMap(chat))
                .build());
        return chat;
    }

    // Get all messages in a conversation
    public List<ChatTable> findByChatId(String chatId) {
        QueryRequest queryRequest = QueryRequest.builder()
                .tableName(TABLE_NAME)
                .keyConditionExpression("chatId = :chatId")
                .expressionAttributeValues(Map.of(
                        ":chatId", AttributeValue.builder().s(chatId).build()
                ))
                .scanIndexForward(true) // tăng dần timestamp
                .build();

        QueryResponse response = dynamoDbClient.query(queryRequest);
        List<ChatTable> chats = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            chats.add(ChatTable.fromMap(item));
        }
        return chats;
    }

    // Get all conversations for a user (scan)
    public List<ChatTable> findByUserId(String userId) {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("userId = :userId")
                .expressionAttributeValues(Map.of(
                        ":userId", AttributeValue.builder().s(userId).build()
                ))
                .build();

        ScanResponse response = dynamoDbClient.scan(scanRequest);
        List<ChatTable> chats = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            chats.add(ChatTable.fromMap(item));
        }
        return chats;
    }

    // Get a specific message by chatId + timestamp
    public ChatTable findById(String chatId, Long timestamp) {
        GetItemRequest getItemRequest = GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of(
                        "chatId", AttributeValue.builder().s(chatId).build(),
                        "timestamp", AttributeValue.builder().n(String.valueOf(timestamp)).build()
                ))
                .build();

        GetItemResponse response = dynamoDbClient.getItem(getItemRequest);
        return response.hasItem() ? ChatTable.fromMap(response.item()) : null;
    }

    // Find unresolved chats
    public List<ChatTable> findUnresolvedChats() {
        ScanRequest scanRequest = ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("resolved = :resolved")
                .expressionAttributeValues(Map.of(
                        ":resolved", AttributeValue.builder().bool(false).build()
                ))
                .build();

        ScanResponse response = dynamoDbClient.scan(scanRequest);
        List<ChatTable> chats = new ArrayList<>();
        for (Map<String, AttributeValue> item : response.items()) {
            chats.add(ChatTable.fromMap(item));
        }
        return chats;
    }

    // Update chat status for a specific message
    public void updateStatus(String chatId, Long timestamp, String status) {
        dynamoDbClient.updateItem(UpdateItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of(
                        "chatId", AttributeValue.builder().s(chatId).build(),
                        "timestamp", AttributeValue.builder().n(String.valueOf(timestamp)).build()
                ))
                .updateExpression("SET #status = :status")
                .expressionAttributeNames(Map.of("#status", "status"))
                .expressionAttributeValues(Map.of(
                        ":status", AttributeValue.builder().s(status).build()
                ))
                .build());
    }

    // Delete a specific message
    public void deleteById(String chatId, Long timestamp) {
        dynamoDbClient.deleteItem(DeleteItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of(
                        "chatId", AttributeValue.builder().s(chatId).build(),
                        "timestamp", AttributeValue.builder().n(String.valueOf(timestamp)).build()
                ))
                .build());
    }
}
