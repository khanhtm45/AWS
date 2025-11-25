package com.leafshop.dto.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomerUpdateRequest {
    // For public (OTP) updates, provide email + otp
    private String email;
    private String otp; // optional when authenticated

    // Only these fields will be applied by the API
    private String firstName;
    private String lastName;
}
