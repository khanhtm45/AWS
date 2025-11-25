package com.leafshop.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SendMessageRequest {
    @NotBlank(message = "userId is required")
    private String userId;          // Customer ID
    private String staffId;         // Staff ID (optional, for staff reply)
    @NotBlank(message = "message is required")
    private String message;         // Message content
    private String subject;         // Chat subject/topic
    private String type;            // "customer" hoặc "staff" (default: "customer")
}
