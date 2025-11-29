package com.leafshop.controller;

import com.leafshop.service.BedrockHttpService;
import com.leafshop.service.OutfitSuggestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    private final BedrockHttpService bedrockService;
    private final OutfitSuggestionService outfitSuggestionService;

    public ChatController(BedrockHttpService bedrockService, OutfitSuggestionService outfitSuggestionService) {
        this.bedrockService = bedrockService;
        this.outfitSuggestionService = outfitSuggestionService;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody Map<String, String> body) {
        String message = body.getOrDefault("message", "");
        String context = body.getOrDefault("context", "");
        String intent = body.getOrDefault("intent", "");

        if (message.isBlank() && intent.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "message or intent is required"));
        }

        try {
            if ("suggest_outfit".equalsIgnoreCase(intent)) {
                Map<String, Object> suggestions = outfitSuggestionService.getMockSuggestions(body);
                return ResponseEntity.ok(suggestions);
            }

            // default: send to bedrock service (text reply)
            String reply = bedrockService.invokeModel(message, context);
            return ResponseEntity.ok(Map.of("type", "text", "text", reply));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}
