package com.leafshop.dto.productvariant;

import java.util.List;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProductVariantResponse {
	String productId;
	String variantId;
	List<String> colors; // Màu sắc của biến thể
	String size; // Kích thước của biến thể
	Double variantPrice;
	String sku;
	String barcode;
	Long createdAt;
	Long updatedAt;
}

