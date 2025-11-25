package com.leafshop.dto.chat;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatHistoryResponse {
    private String chatId;
    private String userId;
    private String subject;
    private List<ChatResponse> messages;
    private String status;
    private Boolean resolved;
    private Long lastMessageTime;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    private String formattedLastMessageTime;
    
    private String lastMessageFrom; // "customer" or "staff"
    
    // Method to format timestamp
    public static String formatTime(Long timestamp) {
        if (timestamp == null) return null;
        return Instant.ofEpochMilli(timestamp)
                .atZone(ZoneId.of("Asia/Ho_Chi_Minh"))
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
