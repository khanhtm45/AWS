package com.leafshop.dto.productvariant;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class ProductVariantRequest {

	@NotBlank
	private String variantId;

	private Map<String, String> variantAttributes; // e.g., {"color": "red", "size": "L"}

	private Double variantPrice; // Giá phụ (nếu khác với giá sản phẩm)

	private String sku;

	private String barcode;
}

