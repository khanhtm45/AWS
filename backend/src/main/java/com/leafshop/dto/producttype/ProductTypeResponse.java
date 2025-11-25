package com.leafshop.dto.producttype;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProductTypeResponse {
	String typeId;
	String typeName;
	String typeDescription;
	Long createdAt;
	Long updatedAt;
}

