package com.leafshop.dto.auth;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class ResetPasswordRequest {
    @NotBlank
    private String username;

    @NotBlank
    private String otp;

    @NotBlank
    private String newPassword;
}
