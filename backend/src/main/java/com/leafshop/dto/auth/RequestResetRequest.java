package com.leafshop.dto.auth;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class RequestResetRequest {
    // Accept username or email
    @NotBlank
    private String usernameOrEmail;
}
