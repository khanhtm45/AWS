package com.leafshop.dto.auth;

import lombok.Data;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Data
public class RegisterRequest {
    @NotBlank
    private String firstName;

    private String lastName;

    @NotBlank
    private String phoneNumber;

    @Email
    private String email;

    @NotBlank
    private String username;

    @NotBlank
    private String password;
    
    // Optional role (e.g., STAFF, MANAGER, ADMIN). If not provided, service will default to Customer.
    private String role;
}
