package com.server.dto.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CategoryRequest {

	@NotBlank
	private String categoryId;

	@NotBlank
	private String categoryName;

	private String parentCategoryId;

	@NotNull
	private Integer categoryLevel;

	private String categoryImage;

	private Boolean isActive;
}


