package com.leafshop.dto.productmedia;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ProductMediaResponse {
	String productId;
	String mediaId;
	String mediaUrl;
	String s3Key;
	String mediaType;
	Integer mediaOrder;
	Boolean isPrimary;
	Long createdAt;
	Long updatedAt;
}

