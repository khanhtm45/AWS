package com.leafshop.controller;

import com.leafshop.model.dynamodb.ChatTable;
import com.leafshop.service.ChatHistoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat/history")
@CrossOrigin(origins = "*")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    public ChatHistoryController(ChatHistoryService chatHistoryService) {
        this.chatHistoryService = chatHistoryService;
    }

    @PostMapping
    public ResponseEntity<?> saveHistory(@RequestBody Map<String, Object> body) {
        try {
            String userId = (String) body.getOrDefault("userId", "anonymous");
            String chatId = (String) body.getOrDefault("chatId", String.valueOf(System.currentTimeMillis()));
            List<Map<String, Object>> messages = (List<Map<String, Object>>) body.getOrDefault("messages", new ArrayList<>());

            List<ChatTable> items = new ArrayList<>();
            for (Map<String, Object> m : messages) {
                ChatTable ct = ChatTable.builder()
                        .chatId(chatId)
                        .userId(userId)
                        .message((String) m.getOrDefault("text", ""))
                        .timestamp(m.containsKey("timestamp") ? ((Number) m.get("timestamp")).longValue() : System.currentTimeMillis())
                        .type((String) m.getOrDefault("sender", "customer"))
                        .status((String) m.getOrDefault("status", "sent"))
                        .subject((String) body.getOrDefault("subject", "chat"))
                        .resolved(Boolean.FALSE)
                        .build();
                items.add(ct);
            }

            chatHistoryService.saveChatItems(items);
            return ResponseEntity.ok(Map.of("saved", items.size()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getHistory(@RequestParam(required = false) String chatId,
                                        @RequestParam(required = false) String userId) {
        try {
            List<ChatTable> items = chatHistoryService.fetchBy(chatId, userId);
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
