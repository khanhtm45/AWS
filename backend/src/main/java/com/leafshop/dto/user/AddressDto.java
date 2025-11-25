package com.leafshop.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddressDto {
    // address (single-line or full address string)
    private String address;
    private String city;
    private String province;
    private String postalCode;
    private String country;
    private Boolean isDefault;

    // additional fields used by frontend
    private String id;
    private String firstName;
    private String lastName;
    private String phone;
}
