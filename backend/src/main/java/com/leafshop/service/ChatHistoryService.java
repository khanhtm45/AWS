package com.leafshop.service;

import com.leafshop.model.dynamodb.ChatTable;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ChatHistoryService {

    @Value("${dynamodb.chat.table:ChatTable}")
    private String chatTableName;

    @Value("${aws.region:us-east-1}")
    private String awsRegion;

    private DynamoDbClient dynamoDbClient;

    @PostConstruct
    public void init() {
        this.dynamoDbClient = DynamoDbClient.builder()
                .region(Region.of(awsRegion))
                .credentialsProvider(DefaultCredentialsProvider.create())
                .build();
    }

    /**
     * Save a single chat item to DynamoDB. Uses the ChatTable.toMap conversion.
     */
    public void saveChatItem(ChatTable item) {
        Map<String, AttributeValue> map = ChatTable.toMap(item);
        PutItemRequest req = PutItemRequest.builder()
                .tableName(chatTableName)
                .item(map)
                .build();
        dynamoDbClient.putItem(req);
    }

    /**
     * Save multiple chat items.
     */
    public void saveChatItems(List<ChatTable> items) {
        for (ChatTable c : items) {
            saveChatItem(c);
        }
    }

    /**
     * Fetch chat items filtered by optional chatId or userId.
     * This implementation uses Scan with a filter to avoid assuming table key schema.
     * For production, replace with Query when table partition/sort keys are known.
     */
    public List<ChatTable> fetchBy(String chatId, String userId) {
        String filter = null;
        Map<String, AttributeValue> exprVals = Map.of();

        if (chatId != null && !chatId.isBlank() && userId != null && !userId.isBlank()) {
            filter = "chatId = :c AND userId = :u";
            exprVals = Map.of(":c", AttributeValue.builder().s(chatId).build(), 
                    ":u", AttributeValue.builder().s(userId).build());
        } else if (chatId != null && !chatId.isBlank()) {
            filter = "chatId = :c";
            exprVals = Map.of(":c", AttributeValue.builder().s(chatId).build());
        } else if (userId != null && !userId.isBlank()) {
            filter = "userId = :u";
            exprVals = Map.of(":u", AttributeValue.builder().s(userId).build());
        }

        ScanRequest.Builder scanBuilder = ScanRequest.builder().tableName(chatTableName);
        if (filter != null) {
            scanBuilder = scanBuilder.filterExpression(filter).expressionAttributeValues(exprVals);
        }

        ScanResponse resp = dynamoDbClient.scan(scanBuilder.build());
        List<ChatTable> out = new ArrayList<>();
        for (Map<String, AttributeValue> item : resp.items()) {
            ChatTable ct = ChatTable.fromMap(item);
            if (ct != null) out.add(ct);
        }
        return out;
    }
}
