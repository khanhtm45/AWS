package com.server.dto.productmedia;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductMediaRequest {

	@NotBlank
	private String mediaId;

	@NotBlank
	private String mediaUrl;

	@NotBlank
	private String mediaType; // IMAGE, VIDEO

	private Integer mediaOrder;

	private Boolean isPrimary;
}

