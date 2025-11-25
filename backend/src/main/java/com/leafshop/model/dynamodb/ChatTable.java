package com.leafshop.model.dynamodb;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.util.LinkedHashMap;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatTable {
    private String chatId;          // PK: Conversation ID
    private String userId;          // SK: User ID (customer)
    private String staffId;         // Staff ID (if assigned)
    private String message;         // Message content
    private Long timestamp;         // When message was sent
    private String type;            // "customer" or "staff"
    private String status;          // "sent", "read", "replied"
    private String subject;         // Chat subject/topic
    private Boolean resolved;       // Is chat resolved

    public static ChatTable fromMap(Map<String, AttributeValue> item) {
        if (item == null || item.isEmpty()) {
            return null;
        }

        return ChatTable.builder()
                .chatId(item.containsKey("chatId") ? item.get("chatId").s() : null)
                .userId(item.containsKey("userId") ? item.get("userId").s() : null)
                .staffId(item.containsKey("staffId") ? item.get("staffId").s() : null)
                .message(item.containsKey("message") ? item.get("message").s() : null)
                .timestamp(item.containsKey("timestamp") ? Long.parseLong(item.get("timestamp").n()) : null)
                .type(item.containsKey("type") ? item.get("type").s() : null)
                .status(item.containsKey("status") ? item.get("status").s() : null)
                .subject(item.containsKey("subject") ? item.get("subject").s() : null)
                .resolved(item.containsKey("resolved") ? item.get("resolved").bool() : false)
                .build();
    }

    public static Map<String, AttributeValue> toMap(ChatTable chat) {
        Map<String, AttributeValue> item = new LinkedHashMap<>();
        item.put("chatId", AttributeValue.builder().s(chat.getChatId()).build());
        item.put("userId", AttributeValue.builder().s(chat.getUserId()).build());
        if (chat.getStaffId() != null) {
            item.put("staffId", AttributeValue.builder().s(chat.getStaffId()).build());
        }
        item.put("message", AttributeValue.builder().s(chat.getMessage()).build());
        item.put("timestamp", AttributeValue.builder().n(String.valueOf(chat.getTimestamp())).build());
        item.put("type", AttributeValue.builder().s(chat.getType()).build());
        item.put("status", AttributeValue.builder().s(chat.getStatus()).build());
        item.put("subject", AttributeValue.builder().s(chat.getSubject()).build());
        item.put("resolved", AttributeValue.builder().bool(chat.getResolved()).build());
        return item;
    }
}
