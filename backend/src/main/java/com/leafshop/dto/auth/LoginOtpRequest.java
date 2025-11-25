package com.leafshop.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginOtpRequest {
    @NotBlank
    @Email
    private String email;
}
