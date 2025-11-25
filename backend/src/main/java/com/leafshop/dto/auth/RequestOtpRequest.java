package com.leafshop.dto.auth;

import jakarta.validation.constraints.Email;
import lombok.Data;

@Data
public class RequestOtpRequest {
    // Provide either `email` or `accountId` (user id without USER# prefix or full PK)
    @Email
    private String email;

    private String accountId;
}
