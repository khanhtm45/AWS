package com.leafshop.dto.user;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String nationalId;
    private java.util.List<com.leafshop.dto.user.AddressUpdateRequest> addresses;
}
