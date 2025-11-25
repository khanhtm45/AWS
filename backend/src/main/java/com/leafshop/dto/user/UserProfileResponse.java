package com.leafshop.dto.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private String email;
    private String firstName;
    private String lastName;
    private List<AddressDto> addresses;
}
