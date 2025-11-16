package com.server.dto.customer;

import com.server.dto.productmedia.ProductMediaResponse;
import com.server.dto.productvariant.ProductVariantResponse;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class CustomerProductResponse {
	String productId;
	String name;
	String description;
	Double price;
	String categoryId;
	String typeId;
	Boolean isPreorder;
	Integer preorderDays;
	Boolean isActive;
	List<String> tags;
	List<ProductVariantResponse> variants;
	List<ProductMediaResponse> media;
	Long createdAt;
	Long updatedAt;
}

