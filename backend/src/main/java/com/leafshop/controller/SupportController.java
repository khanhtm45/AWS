package com.leafshop.controller;

import com.leafshop.dto.chat.ChatResponse;
import com.leafshop.dto.chat.ChatHistoryResponse;
import com.leafshop.dto.chat.SendMessageRequest;
import com.leafshop.service.SupportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
@RequiredArgsConstructor
@Tag(name = "Support API", description = "Chat và hỗ trợ khách hàng")
public class SupportController {

    private static final Logger logger = LoggerFactory.getLogger(SupportController.class);
    private final SupportService supportService;

    // 1. Gửi tin nhắn hỗ trợ
    @PostMapping("/messages")
    @Operation(summary = "Gửi tin nhắn hỗ trợ mới", description = "Khách hàng hoặc nhân viên gửi tin nhắn hỗ trợ")
    public ResponseEntity<ChatResponse> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        logger.info("Sending message: userId={}, subject={}", request.getUserId(), request.getSubject());
        ChatResponse response = supportService.sendMessage(request);
        logger.info("Message sent: chatId={}", response.getChatId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // 2. Lấy lịch sử chat của khách hàng
    @GetMapping("/chats")
    @Operation(summary = "Lấy lịch sử chat", description = "Lấy tất cả cuộc trò chuyện của một khách hàng")
    public ResponseEntity<List<ChatHistoryResponse>> getUserChats(@RequestParam String userId) {
        logger.info("Getting chat histories for userId={}", userId);
        List<ChatHistoryResponse> chats = supportService.getChatHistories(userId);
        logger.info("Found {} chat histories", chats.size());
        return ResponseEntity.ok(chats);
    }

    // 3. Lấy chi tiết một cuộc trò chuyện
    @GetMapping("/chats/{chatId}")
    @Operation(summary = "Lấy chi tiết cuộc trò chuyện", description = "Lấy tất cả tin nhắn trong một cuộc trò chuyện cụ thể")
    public ResponseEntity<ChatHistoryResponse> getChatHistory(@PathVariable String chatId) {
        logger.info("Getting chat history for chatId={}", chatId);
        ChatHistoryResponse response = supportService.getChatHistory(chatId);
        if (response == null) {
            logger.warn("Chat not found: chatId={}", chatId);
            return ResponseEntity.notFound().build();
        }
        logger.info("Chat found with {} messages", response.getMessages().size());
        return ResponseEntity.ok(response);
    }

    // 4. Reply vào cuộc trò chuyện
    @PostMapping("/chats/{chatId}/reply")
    @Operation(summary = "Reply tin nhắn", description = "Khách hàng hoặc nhân viên reply vào một cuộc trò chuyện")
    public ResponseEntity<ChatResponse> replyToChat(@PathVariable String chatId,
                                                    @Valid @RequestBody SendMessageRequest request) {
        logger.info("Reply to chat: chatId={}, userId={}, staffId={}", chatId, request.getUserId(), request.getStaffId());
        ChatResponse response = supportService.replyToChat(chatId, request);
        logger.info("Reply created successfully: {}", response.getChatId());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}

