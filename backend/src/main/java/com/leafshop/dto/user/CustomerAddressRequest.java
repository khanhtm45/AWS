package com.leafshop.dto.user;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CustomerAddressRequest {
    private String email; // for public flow with otp
    private String otp;   // optional for public flow

    // ADDRESS fields
    private String address;
    private String addressLastName;
    private String addressFirstName;
    private String addressPhone;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private Boolean isDefault;
}
