package com.leafshop.dto.warehouse;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WarehouseRequest {

	@NotBlank
	private String warehouseId;

	@NotBlank
	private String warehouseName;

	private String address;

	private String city;

	private String province;

	private String postalCode;

	private String country;

	private String phoneNumber;

	private String managerId;

	private Boolean isActive;
}

