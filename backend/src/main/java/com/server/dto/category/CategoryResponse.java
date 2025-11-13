package com.server.dto.category;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class CategoryResponse {
	String categoryId;
	String categoryName;
	String parentCategoryId;
	Integer categoryLevel;
	String categoryImage;
	Boolean isActive;
	Long createdAt;
	Long updatedAt;
}


