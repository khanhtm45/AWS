package com.leafshop.dto.warehouse;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class WarehouseResponse {
	String warehouseId;
	String warehouseName;
	String address;
	String city;
	String province;
	String postalCode;
	String country;
	String phoneNumber;
	String managerId;
	Boolean isActive;
	Long createdAt;
	Long updatedAt;
}

