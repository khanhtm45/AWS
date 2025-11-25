package com.leafshop.dto.user;

import lombok.Data;

@Data
public class AddressUpdateRequest {
    private String id; // client-generated id or null
    private Boolean isDefault;
    private String country;
    private String firstName;
    private String lastName;
    private String address; // maps to addressLine1
    private String city;
    private String postalCode;
    private String phone;
}
