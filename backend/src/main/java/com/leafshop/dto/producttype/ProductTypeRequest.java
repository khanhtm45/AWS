package com.leafshop.dto.producttype;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductTypeRequest {

	@NotBlank
	private String typeId;

	@NotBlank
	private String typeName;

	private String typeDescription;
}

