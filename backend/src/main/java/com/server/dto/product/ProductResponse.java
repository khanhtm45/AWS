package com.server.dto.product;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ProductResponse {
	String productId;
	String name;
	String description;
	Double price;
	String categoryId;
	String typeId;
	Boolean isPreorder;
	Integer preorderDays;
	Boolean isActive;
	List<String> tags;
	Long createdAt;
	Long updatedAt;
}

