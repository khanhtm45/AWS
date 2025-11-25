package com.leafshop.dto.address;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class AddressRequest {
    @NotBlank
    private String address;
    @NotBlank
    private String city;
    private String province;
    private String postalCode;
    @NotBlank
    private String country;
    private Boolean isDefault = false;
    // Contact fields to align with UserTable
    private String firstName;
    private String lastName;
    private String phone;
}
