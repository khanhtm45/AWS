package com.leafshop.service;

import com.leafshop.dto.chat.ChatResponse;
import com.leafshop.dto.chat.ChatHistoryResponse;
import com.leafshop.dto.chat.SendMessageRequest;
import com.leafshop.model.dynamodb.ChatTable;
import com.leafshop.repository.ChatTableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SupportService {

    private final ChatTableRepository chatRepository;

    // 1. Gửi tin nhắn hỗ trợ (customer gửi)
    public ChatResponse sendMessage(SendMessageRequest request) {
        // Lấy các conversation chưa resolved của user
        List<ChatTable> existingChats = chatRepository.findByUserId(request.getUserId());
        Optional<ChatTable> openChat = existingChats.stream()
                .filter(chat -> !chat.getResolved())
                .findFirst();

        String chatId;
        String subject = request.getSubject() != null ? request.getSubject() : "Support";

        if (openChat.isPresent()) {
            chatId = openChat.get().getChatId(); // reuse chatId cũ
            if (request.getSubject() == null || request.getSubject().isEmpty()) {
                subject = openChat.get().getSubject();
            }
        } else {
            chatId = request.getUserId() + "_" + System.currentTimeMillis(); // tạo chatId mới
        }

        ChatTable chat = ChatTable.builder()
                .chatId(chatId)
                .userId(request.getUserId())
                .staffId(request.getStaffId())
                .message(request.getMessage())
                .subject(subject)
                .type(request.getType() != null ? request.getType() : "CUSTOMER")
                .status("sent")
                .timestamp(System.currentTimeMillis())
                .resolved(false)
                .build();

        ChatTable saved = chatRepository.save(chat);
        return mapToResponse(saved);
    }

    // 2. Lấy lịch sử chat của khách hàng
    public List<ChatHistoryResponse> getChatHistories(String userId) {
        List<ChatTable> chats = chatRepository.findByUserId(userId);

        // Nhóm theo chatId để tạo conversation threads
        Map<String, List<ChatTable>> groupedByChat = chats.stream()
                .collect(Collectors.groupingBy(ChatTable::getChatId));

        return groupedByChat.entrySet().stream()
                .map(entry -> createChatHistory(entry.getKey(), entry.getValue()))
                .sorted(Comparator.comparingLong(ChatHistoryResponse::getLastMessageTime).reversed())
                .collect(Collectors.toList());
    }

    // 3. Lấy chi tiết một cuộc trò chuyện
    public ChatHistoryResponse getChatHistory(String chatId) {
        List<ChatTable> messages = chatRepository.findByChatId(chatId);
        if (messages.isEmpty()) return null;
        return createChatHistory(chatId, messages);
    }

    // 4. Reply vào cuộc trò chuyện (cả staff và customer)
    public ChatResponse replyToChat(String chatId, SendMessageRequest request) {
        // Lấy subject từ cuộc trò chuyện gốc
        List<ChatTable> existingMessages = chatRepository.findByChatId(chatId);
        String subject = "Support";
        if (!existingMessages.isEmpty()) {
            ChatTable firstMsg = existingMessages.get(0);
            subject = firstMsg.getSubject() != null ? firstMsg.getSubject() : "Support";
        }

        // Mặc định type là STAFF nếu không có
        String type = request.getType() != null ? request.getType() : "STAFF";

        ChatTable reply = ChatTable.builder()
                .chatId(chatId)
                .timestamp(System.currentTimeMillis()) // timestamp làm sort key → không overwrite
                .userId(request.getUserId())
                .staffId(request.getStaffId())
                .message(request.getMessage())
                .subject(subject)
                .type(type)
                .status("sent")
                .resolved(false)
                .build();

        ChatTable saved = chatRepository.save(reply);
        return mapToResponse(saved);
    }

    // Helper: tạo conversation từ list ChatTable
    private ChatHistoryResponse createChatHistory(String chatId, List<ChatTable> messages) {
        List<ChatResponse> responses = messages.stream()
                .sorted(Comparator.comparingLong(ChatTable::getTimestamp))
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        ChatTable lastMsg = messages.get(messages.size() - 1);

        return ChatHistoryResponse.builder()
                .chatId(chatId)
                .userId(lastMsg.getUserId())
                .subject(lastMsg.getSubject())
                .messages(responses)
                .status(lastMsg.getStatus())
                .resolved(lastMsg.getResolved())
                .lastMessageTime(lastMsg.getTimestamp())
                .formattedLastMessageTime(ChatHistoryResponse.formatTime(lastMsg.getTimestamp()))
                .lastMessageFrom(lastMsg.getType())
                .build();
    }

    // Map ChatTable -> ChatResponse
    private ChatResponse mapToResponse(ChatTable chat) {
        return ChatResponse.builder()
                .chatId(chat.getChatId())
                .userId(chat.getUserId())
                .staffId(chat.getStaffId())
                .message(chat.getMessage())
                .timestamp(chat.getTimestamp())
                .formattedTime(ChatResponse.formatTime(chat.getTimestamp()))
                .type(chat.getType())
                .status(chat.getStatus())
                .subject(chat.getSubject())
                .resolved(chat.getResolved())
                .build();
    }
}
