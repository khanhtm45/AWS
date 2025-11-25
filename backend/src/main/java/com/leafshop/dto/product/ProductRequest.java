package com.leafshop.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ProductRequest {

	@NotBlank
	private String productId;

	@NotBlank
	private String name;

	private String description;

	@NotNull
	private Double price;

	private String categoryId;

	private String typeId;

	private Boolean isPreorder;

	private Integer preorderDays;

	private Boolean isActive;

	private List<String> tags;
}

