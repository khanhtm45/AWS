package com.leafshop.dto.order;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShippingAddress {
    private String fullName;
    private String phoneNumber;
    private String addressLine1;
    private String addressLine2;
    private String ward;         // Phường/Xã
    private String district;     // Quận/Huyện
    private String city;         // Tỉnh/Thành phố
    private String postalCode;
    private String country;
    private String notes;        // Ghi chú thêm cho địa chỉ
}
