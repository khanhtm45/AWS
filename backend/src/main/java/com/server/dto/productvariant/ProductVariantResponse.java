package com.server.dto.productvariant;

import lombok.Builder;
import lombok.Value;

import java.util.Map;

@Value
@Builder
public class ProductVariantResponse {
	String productId;
	String variantId;
	Map<String, String> variantAttributes;
	Double variantPrice;
	String sku;
	String barcode;
	Long createdAt;
	Long updatedAt;
}

