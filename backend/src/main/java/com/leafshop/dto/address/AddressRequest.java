package com.leafshop.dto.address;

import lombok.Data;

import jakarta.validation.constraints.NotBlank;

@Data
public class AddressRequest {
    @NotBlank
    private String addressLine1;
    private String addressLine2;
    @NotBlank
    private String city;
    private String province;
    private String postalCode;
    @NotBlank
    private String country;
    private Boolean isDefault = false;
}
