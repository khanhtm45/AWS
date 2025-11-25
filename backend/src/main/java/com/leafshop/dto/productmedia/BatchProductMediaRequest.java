package com.leafshop.dto.productmedia;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BatchProductMediaRequest {

	@NotEmpty(message = "Media list cannot be empty")
	@Valid
	private List<ProductMediaRequest> mediaList;
}

