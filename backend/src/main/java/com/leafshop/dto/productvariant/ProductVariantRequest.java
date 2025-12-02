package com.leafshop.dto.productvariant;

import java.util.List;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProductVariantRequest {

	@NotBlank
	private String variantId;

	private List<String> colors; // Màu sắc của biến thể

	private String size; // Kích thước của biến thể

	private Double variantPrice; // Giá phụ (nếu khác với giá sản phẩm)

	private String sku;

	private String barcode;
}

