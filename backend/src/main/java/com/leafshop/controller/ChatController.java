package com.leafshop.controller;

import com.leafshop.service.ChatService;
import com.leafshop.service.OutfitSuggestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = "/api/chat", produces = "application/json; charset=UTF-8")
public class ChatController {

    private final ChatService chatService;
    private final OutfitSuggestionService outfitSuggestionService;

    public ChatController(ChatService chatService, OutfitSuggestionService outfitSuggestionService) {
        this.chatService = chatService;
        this.outfitSuggestionService = outfitSuggestionService;
    }

    @PostMapping(consumes = "application/json; charset=UTF-8", produces = "application/json; charset=UTF-8")
    public ResponseEntity<?> chat(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody Map<String, String> body) {

        String message = body.getOrDefault("message", "");
        String conversationHistory = body.getOrDefault("history", "");
        String intent = body.getOrDefault("intent", "");

        if (message.isBlank() && intent.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message or intent is required"));
        }

        try {
            if ("suggest_outfit".equalsIgnoreCase(intent)) {
                Map<String, Object> suggestions = outfitSuggestionService.getMockSuggestions(body);
                return ResponseEntity.ok(suggestions);
            }

            // Get userId if user is authenticated
            String userId = user != null ? user.getUsername() : null;

            // Use new ChatService with Claude 3
            String reply = chatService.chat(message, userId, conversationHistory);
            return ResponseEntity.ok(Map.of("type", "text", "text", reply));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!"));
        }
    }
}
