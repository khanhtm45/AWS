package com.leafshop.dto.review;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class ReviewRequest {

	@NotBlank
	private String productId;

	@NotBlank
	private String userId;

	private String orderId; // Optional - để đánh dấu là verified purchase

	@NotNull
	@Min(1)
	@Max(5)
	private Integer rating;

	private String title;

	private String comment;

	private List<String> images; // URLs of review images
}

